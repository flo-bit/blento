// Authoritative DNS verification
// Queries authoritative nameservers directly instead of relying on cached resolvers.
// See: https://jacob.gold/posts/stop-telling-users-their-dns-is-wrong/

const TYPE_A = 1;
const TYPE_NS = 2;
const TYPE_CNAME = 5;

interface DnsRecord {
	type: number;
	data: string;
}

// --- Wire format encoding ---

function encodeName(name: string): Uint8Array {
	const n = name.endsWith('.') ? name.slice(0, -1) : name;
	const parts = n.split('.');
	const bytes: number[] = [];
	for (const part of parts) {
		bytes.push(part.length);
		for (let i = 0; i < part.length; i++) {
			bytes.push(part.charCodeAt(i));
		}
	}
	bytes.push(0);
	return new Uint8Array(bytes);
}

function buildQuery(name: string, type: number): Uint8Array {
	const qname = encodeName(name);
	const msg = new Uint8Array(12 + qname.length + 4);
	const id = (Math.random() * 0xffff) | 0;
	msg[0] = id >> 8;
	msg[1] = id & 0xff;
	msg[2] = 0x01; // RD=1
	msg[5] = 0x01; // QDCOUNT=1
	msg.set(qname, 12);
	const off = 12 + qname.length;
	msg[off] = type >> 8;
	msg[off + 1] = type & 0xff;
	msg[off + 3] = 0x01; // CLASS IN
	return msg;
}

// --- Wire format decoding ---

function decodeName(data: Uint8Array, offset: number): [string, number] {
	const labels: string[] = [];
	let pos = offset;
	let jumped = false;
	let savedPos = 0;
	for (let safety = 0; safety < 128 && pos < data.length; safety++) {
		const len = data[pos];
		if (len === 0) {
			pos++;
			break;
		}
		if ((len & 0xc0) === 0xc0) {
			if (!jumped) savedPos = pos + 2;
			pos = ((len & 0x3f) << 8) | data[pos + 1];
			jumped = true;
			continue;
		}
		pos++;
		let label = '';
		for (let i = 0; i < len && pos + i < data.length; i++) {
			label += String.fromCharCode(data[pos + i]);
		}
		labels.push(label);
		pos += len;
	}
	return [labels.join('.'), jumped ? savedPos : pos];
}

function parseResponse(data: Uint8Array): DnsRecord[] {
	if (data.length < 12) return [];
	const qdcount = (data[4] << 8) | data[5];
	const ancount = (data[6] << 8) | data[7];
	let offset = 12;

	// Skip questions
	for (let i = 0; i < qdcount && offset < data.length; i++) {
		const [, off] = decodeName(data, offset);
		offset = off + 4;
	}

	const records: DnsRecord[] = [];
	for (let i = 0; i < ancount && offset + 10 < data.length; i++) {
		const [, nameEnd] = decodeName(data, offset);
		offset = nameEnd;
		const type = (data[offset] << 8) | data[offset + 1];
		const rdlength = (data[offset + 8] << 8) | data[offset + 9];
		offset += 10;
		if (offset + rdlength > data.length) break;

		let value = '';
		if (type === TYPE_A && rdlength === 4) {
			value = `${data[offset]}.${data[offset + 1]}.${data[offset + 2]}.${data[offset + 3]}`;
		} else if (type === TYPE_CNAME || type === TYPE_NS) {
			[value] = decodeName(data, offset);
		}
		if (value) records.push({ type, data: value });
		offset += rdlength;
	}
	return records;
}

// --- DNS-over-HTTPS (for finding NS records and as fallback) ---

interface DohAnswer {
	type: number;
	data: string;
}

async function dohQuery(name: string, type: string): Promise<DohAnswer[]> {
	const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
	const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
	const json: { Answer?: DohAnswer[] } = await res.json();
	return json.Answer ?? [];
}

// --- Find authoritative nameservers (walking up the domain tree) ---

async function findNameservers(domain: string): Promise<string[]> {
	let current = domain;
	while (current.includes('.')) {
		const answers = await dohQuery(current, 'NS');
		const ns = answers.filter((a) => a.type === TYPE_NS).map((a) => a.data.replace(/\.$/, ''));
		if (ns.length > 0) return ns;
		current = current.substring(current.indexOf('.') + 1);
	}
	return [];
}

// --- Resolve hostname to IPs via DoH ---

async function resolveToIps(hostname: string): Promise<string[]> {
	const answers = await dohQuery(hostname, 'A');
	return answers.filter((a) => a.type === TYPE_A).map((a) => a.data);
}

// --- Query nameserver directly via TCP (cloudflare:sockets) ---

async function queryViaTcp(serverIp: string, name: string, type: number): Promise<DnsRecord[]> {
	// @ts-expect-error: cloudflare:sockets is only available in Workers runtime
	const { connect } = await import('cloudflare:sockets');

	const query = buildQuery(name, type);
	const tcpMsg = new Uint8Array(query.length + 2);
	tcpMsg[0] = (query.length >> 8) & 0xff;
	tcpMsg[1] = query.length & 0xff;
	tcpMsg.set(query, 2);

	const socket = connect({ hostname: serverIp, port: 53 });
	const writer = socket.writable.getWriter();
	await writer.write(tcpMsg);
	writer.releaseLock();

	const reader = socket.readable.getReader();
	let buffer = new Uint8Array(0);
	let responseLen = -1;

	const timeout = setTimeout(() => socket.close(), 5000);
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			const chunk = new Uint8Array(value as ArrayBuffer);
			const newBuf = new Uint8Array(buffer.length + chunk.length);
			newBuf.set(buffer);
			newBuf.set(chunk, buffer.length);
			buffer = newBuf;

			if (responseLen === -1 && buffer.length >= 2) {
				responseLen = (buffer[0] << 8) | buffer[1];
			}
			if (responseLen >= 0 && buffer.length >= responseLen + 2) break;
		}
	} finally {
		clearTimeout(timeout);
		reader.releaseLock();
		socket.close();
	}

	if (buffer.length < 2) return [];
	return parseResponse(buffer.slice(2, 2 + responseLen));
}

// --- Query with TCP, fall back to DoH for local dev ---

async function queryAuthoritative(
	serverIp: string,
	name: string,
	type: number
): Promise<DnsRecord[]> {
	try {
		return await queryViaTcp(serverIp, name, type);
	} catch {
		// cloudflare:sockets not available (local dev) — fall back to DoH
		const typeStr = type === TYPE_A ? 'A' : type === TYPE_CNAME ? 'CNAME' : 'NS';
		return (await dohQuery(name, typeStr)).map((a) => ({ type: a.type, data: a.data }));
	}
}

// --- Main verification ---

export interface DnsVerifyResult {
	ok: boolean;
	error?: string;
	hint?: string;
}

function normalize(s: string): string {
	return s.replace(/\.$/, '').toLowerCase();
}

export async function verifyDomainDns(
	domain: string,
	expectedTarget: string
): Promise<DnsVerifyResult> {
	// Find authoritative nameservers
	const nameservers = await findNameservers(domain);
	if (nameservers.length === 0) {
		return { ok: false, error: `Could not find nameservers for "${domain}".` };
	}

	// Try each nameserver until one responds
	for (const ns of nameservers) {
		const ips = await resolveToIps(ns);
		if (ips.length === 0) continue;

		const nsIp = ips[0];

		// Check CNAME records
		const cnameRecords = await queryAuthoritative(nsIp, domain, TYPE_CNAME);
		const cnames = cnameRecords.filter((r) => r.type === TYPE_CNAME);

		if (cnames.length > 0) {
			if (cnames.length > 1) {
				return {
					ok: false,
					error: `Multiple CNAME records found for "${domain}": ${cnames.map((r) => r.data).join(', ')}. Remove duplicate records so only one remains.`
				};
			}
			const got = normalize(cnames[0].data);
			const want = normalize(expectedTarget);
			if (got !== want) {
				return {
					ok: false,
					error: `CNAME for "${domain}" points to "${got}" instead of "${want}".`,
					hint: `If you're using Cloudflare, make sure the proxy (orange cloud) is turned off for this record.`
				};
			}
			return { ok: true };
		}

		// No CNAME — check A records (root/apex domains with CNAME flattening or A records)
		const aRecords = await queryAuthoritative(nsIp, domain, TYPE_A);
		const aValues = aRecords.filter((r) => r.type === TYPE_A);

		if (aValues.length > 0) {
			// Resolve the expected target to get its IPs for comparison
			const expectedIps = await resolveToIps(expectedTarget);
			if (expectedIps.length === 0) {
				return {
					ok: false,
					error: `Could not resolve "${expectedTarget}" to verify A records.`
				};
			}
			const expectedSet = new Set(expectedIps);
			const unexpected = aValues.filter((r) => !expectedSet.has(r.data));
			if (unexpected.length > 0) {
				return {
					ok: false,
					error: `A record(s) for "${domain}" include unexpected IPs: ${unexpected.map((r) => r.data).join(', ')}. Expected only IPs matching "${expectedTarget}" (${expectedIps.join(', ')}).`,
					hint: `If you're using Cloudflare, make sure the proxy (orange cloud) is turned off for this record.`
				};
			}
			return { ok: true };
		}

		// Neither CNAME nor A found
		return {
			ok: false,
			error: `No CNAME or A record found for "${domain}". Please add a CNAME record pointing to "${expectedTarget}".`
		};
	}

	return {
		ok: false,
		error: `Could not reach any nameserver for "${domain}".`
	};
}
