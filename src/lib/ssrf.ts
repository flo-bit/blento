const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIpv4(host: string): boolean {
	const m = host.match(IPV4);
	if (!m) return false;
	const [a, b] = m.slice(1).map(Number);
	if (a === 10 || a === 127 || a === 0) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	if (a >= 224) return true;
	return false;
}

function isBlockedHost(host: string): boolean {
	const h = host.toLowerCase();
	if (h === 'localhost' || h.endsWith('.localhost')) return true;
	if (h.endsWith('.local') || h.endsWith('.internal')) return true;
	if (h.includes(':')) return true;
	if (isPrivateIpv4(h)) return true;
	return false;
}

export function parseSafeUrl(raw: string): URL {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		throw new Error('Invalid URL');
	}
	if (u.protocol !== 'https:' && u.protocol !== 'http:') {
		throw new Error('Only http(s) URLs are allowed');
	}
	if (isBlockedHost(u.hostname)) {
		throw new Error('Host is not allowed');
	}
	return u;
}
