<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { user } from '$lib/atproto';
	import { atProtoLoginModalState } from '$lib/atproto/LoginModal.svelte';
	import {
		embedApplyWrites,
		embedCreateRecord,
		embedDeleteRecord,
		embedPutRecord,
		embedUploadBlob
	} from './embed.remote';

	type Props = {
		origin: string;
		path: string;
		allowedCollectionPrefixes: string[];
		height?: number;
		minHeight?: number;
		maxHeight?: number;
		fill?: boolean;
		title?: string;
		class?: string;
		onnotify?: (name: string, payload: unknown) => void;
	};

	let {
		origin,
		path,
		allowedCollectionPrefixes,
		height = 400,
		minHeight = 80,
		maxHeight = 20000,
		fill = false,
		title = 'Embedded content',
		class: className = '',
		onnotify
	}: Props = $props();

	const PROTOCOL_VERSION = 0;

	type Session = {
		did: string;
		handle?: string;
		displayName?: string;
		avatar?: string;
	} | null;

	let iframeEl: HTMLIFrameElement | null = $state(null);
	let resizedHeight: number | null = $state(null);
	let displayHeight = $derived(resizedHeight ?? height);
	let heightStyle = $derived(fill ? '100%' : `${displayHeight}px`);
	let handshakeDone = $state(false);

	const session: Session = $derived.by<Session>(() => {
		if (!user.did) return null;
		return {
			did: user.did,
			handle: user.profile?.handle,
			displayName: user.profile?.displayName ?? undefined,
			avatar: user.profile?.avatar ?? undefined
		};
	});

	function isAllowedCollectionLocal(collection: string): boolean {
		return allowedCollectionPrefixes.some((p) => {
			if (p === '*') return true;
			if (p.endsWith('.')) return collection.startsWith(p);
			return collection === p;
		});
	}

	function computeIframeSrc(): string {
		const prefs = page.data?.publication?.preferences;
		const baseColor = prefs?.baseColor ?? 'stone';
		const accentColor = prefs?.accentColor ?? 'pink';

		let dark = false;
		if (browser) {
			const root = document.documentElement;
			if (root.classList.contains('dark')) dark = true;
			else if (root.classList.contains('light')) dark = false;
			else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		const url = new URL(path, origin);
		url.searchParams.set('base', baseColor);
		url.searchParams.set('accent', accentColor);
		url.searchParams.set('dark', dark ? '1' : '0');
		if (user.did) url.searchParams.set('did', user.did);
		return url.toString();
	}

	function postToIframe(message: unknown) {
		if (!iframeEl?.contentWindow) return;
		if (browser && import.meta.env.DEV) {
			const m = message as { type?: unknown; id?: unknown; ok?: unknown };
			console.debug('[AtmoEmbed] →', m.type ?? `response#${m.id} ok=${m.ok}`, message);
		}
		iframeEl.contentWindow.postMessage(message, origin);
	}

	function mapError(err: unknown): { code: string; message: string } {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('no_session')) return { code: 'no_session', message: msg };
		if (msg.includes('origin_not_allowed') || msg.includes('collection_not_allowed')) {
			return { code: 'invalid_request', message: msg };
		}
		if (msg.includes('pds_error')) return { code: 'pds_error', message: msg };
		return { code: 'unknown', message: msg };
	}

	type RequestPayload = Record<string, unknown> | undefined;

	async function handleRequest(id: string, type: string, payload: RequestPayload) {
		try {
			const p = (payload ?? {}) as Record<string, unknown>;

			if (type === 'createRecord' || type === 'putRecord' || type === 'deleteRecord') {
				const collection = p.collection as string | undefined;
				if (typeof collection !== 'string') throw new Error('invalid_request');
				if (!isAllowedCollectionLocal(collection)) throw new Error('collection_not_allowed');
			} else if (type === 'applyWrites') {
				const writes = (p.writes ?? []) as Array<{ collection?: string }>;
				for (const w of writes) {
					if (typeof w.collection !== 'string') throw new Error('invalid_request');
					if (!isAllowedCollectionLocal(w.collection)) throw new Error('collection_not_allowed');
				}
			}

			let result: unknown;
			switch (type) {
				case 'createRecord':
					result = await embedCreateRecord({
						origin,
						collection: p.collection as string,
						rkey: p.rkey as string | undefined,
						record: (p.record ?? {}) as Record<string, unknown>
					});
					break;
				case 'putRecord':
					result = await embedPutRecord({
						origin,
						collection: p.collection as string,
						rkey: p.rkey as string,
						record: (p.record ?? {}) as Record<string, unknown>
					});
					break;
				case 'deleteRecord':
					result = await embedDeleteRecord({
						origin,
						collection: p.collection as string,
						rkey: p.rkey as string
					});
					break;
				case 'applyWrites':
					result = await embedApplyWrites({
						origin,
						writes: (p.writes ?? []) as Parameters<typeof embedApplyWrites>[0]['writes'],
						validate: p.validate as boolean | undefined
					});
					break;
				case 'uploadBlob':
					result = await embedUploadBlob({
						origin,
						bytes: (p.bytes ?? []) as number[],
						mimeType: (p.mimeType ?? 'application/octet-stream') as string
					});
					break;
				default:
					throw new Error('unsupported');
			}

			postToIframe({ v: PROTOCOL_VERSION, id, ok: true, result });
		} catch (err) {
			const mapped = mapError(err);
			postToIframe({ v: PROTOCOL_VERSION, id, ok: false, error: mapped });
		}
	}

	function handleMessage(ev: MessageEvent) {
		if (browser && import.meta.env.DEV) {
			console.debug('[AtmoEmbed] raw message', {
				origin: ev.origin,
				sourceMatches: !!iframeEl && ev.source === iframeEl.contentWindow,
				data: ev.data
			});
		}
		if (!iframeEl) return;
		if (ev.source !== iframeEl.contentWindow) return;
		if (ev.origin !== origin) {
			console.warn('[AtmoEmbed] dropped message: origin mismatch', {
				expected: origin,
				received: ev.origin
			});
			return;
		}

		const data = ev.data;
		if (!data || typeof data !== 'object') return;
		if (data.v !== PROTOCOL_VERSION) {
			console.warn('[AtmoEmbed] dropped message: version mismatch', {
				expected: PROTOCOL_VERSION,
				received: (data as { v?: unknown }).v,
				type: (data as { type?: unknown }).type
			});
			return;
		}

		if (browser && import.meta.env.DEV) {
			console.debug('[AtmoEmbed] ←', data.type ?? '(response)', data);
		}

		if (data.type === 'hello') {
			handshakeDone = true;
			postToIframe({ v: PROTOCOL_VERSION, type: 'ready', session });
			return;
		}

		if (data.type === 'blento:resize' && typeof data.heightPx === 'number') {
			resizedHeight = Math.max(minHeight, Math.min(maxHeight, data.heightPx));
			return;
		}

		if (data.type === 'blento:navigate' && typeof data.url === 'string') {
			try {
				const target = new URL(data.url, window.location.href);
				if (target.origin === window.location.origin) {
					window.location.href = target.toString();
				}
			} catch {
				/* ignore malformed URLs */
			}
			return;
		}

		if (data.type === 'blento:promptLogin') {
			atProtoLoginModalState.show();
			return;
		}

		if (data.type === 'blento:notify' && typeof data.name === 'string') {
			onnotify?.(data.name, data.payload);
			return;
		}

		if (typeof data.id === 'string' && typeof data.type === 'string') {
			handleRequest(data.id, data.type, data.payload);
		}
	}

	$effect(() => {
		if (!handshakeDone) return;
		const current = session;
		untrack(() => {
			postToIframe({ v: PROTOCOL_VERSION, type: 'session', session: current });
		});
	});

	onMount(() => {
		if (iframeEl && !iframeEl.src) {
			iframeEl.src = computeIframeSrc();
		}
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	});
</script>

<iframe
	bind:this={iframeEl}
	{title}
	class={className}
	style:height={heightStyle}
	style:width="100%"
	style:border="0"
	style:display="block"
></iframe>
