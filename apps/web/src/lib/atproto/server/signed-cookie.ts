import { createHmac, timingSafeEqual } from 'node:crypto';

import type { Cookies } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const SEPARATOR = '.';

function getSecret(): string {
	const secret = env.COOKIE_SECRET;
	if (secret) return secret;
	if (dev) return 'dev-cookie-secret-not-for-production';
	throw new Error('COOKIE_SECRET is not set');
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
	const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
	const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function hmacSha256(data: string): Uint8Array {
	return createHmac('sha256', getSecret()).update(data).digest();
}

export function getSignedCookie(cookies: Cookies, name: string): string | null {
	const signed = cookies.get(name);
	if (!signed) return null;

	const idx = signed.lastIndexOf(SEPARATOR);
	if (idx === -1) return null;

	const value = signed.slice(0, idx);
	const sig = signed.slice(idx + 1);

	let expected: Uint8Array;
	let got: Uint8Array;
	try {
		expected = hmacSha256(value);
		got = fromBase64Url(sig);
	} catch {
		return null;
	}

	if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;

	return value;
}

export function setSignedCookie(
	cookies: Cookies,
	name: string,
	value: string,
	options: Parameters<Cookies['set']>[2]
): void {
	const sig = toBase64Url(hmacSha256(value));
	const signed = `${value}${SEPARATOR}${sig}`;
	cookies.set(name, signed, options);
}
