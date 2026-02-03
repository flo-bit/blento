import { resolveHandle } from '$lib/atproto';
import type { Handle } from '@atcute/lexicons';

// Matches URLs like https://bsky.app/profile/jyc.dev/post/3mdfjepjpls24
const blueskyPostUrlPattern =
	/^https?:\/\/(?:www\.)?bsky\.app\/profile\/([^/]+)\/post\/([A-Za-z0-9]+)\/?$/;

/**
 * Extract handle and rkey from a Bluesky post URL
 * @param url URL to parse
 * @returns Object with handle and rkey, or undefined if not a valid Bluesky post URL
 */
export function parseBlueskyPostUrl(url: string): { handle: string; rkey: string } | undefined {
	const match = url.match(blueskyPostUrlPattern);
	if (!match) return undefined;
	return { handle: match[1], rkey: match[2] };
}

// Resolve handle to DID if URI contains a handle (not starting with did:)
export async function resolveUri(atUri: string): Promise<string> {
	const match = atUri.match(/^at:\/\/([^/]+)\/(.+)$/);
	if (!match) return atUri;

	const [, authority, rest] = match;

	// If already a DID, return as-is
	if (authority.startsWith('did:')) return atUri;

	// Resolve handle to DID
	try {
		const did = await resolveHandle({ handle: authority as Handle });
		if (!did) return atUri;
		return `at://${did}/${rest}`;
	} catch {
		return atUri;
	}
}
