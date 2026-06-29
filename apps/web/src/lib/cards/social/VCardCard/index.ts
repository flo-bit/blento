import { user } from '$lib/atproto/auth.svelte';
import type { CardDefinition } from '../../types';
import VCardCard from './VCardCard.svelte';
import VCardCardSettings from './VCardCardSettings.svelte';

// vCard spec: https://wikipedia.org/wiki/VCard

export type VCardFields = {
	firstName: string;
	lastName: string;
	org: string;
	title: string;
	email: string;
	bday: string; // YYYY-MM-DD for input, stored as YYYYMMDD
	website: string;
	address: string;
	note: string;
};

export const emptyVCardFields: VCardFields = {
	firstName: '',
	lastName: '',
	org: '',
	title: '',
	email: '',
	bday: '',
	website: '',
	address: '',
	note: ''
};

// Convert YYYY-MM-DD to YYYYMMDD for vCard
export function formatBdayToVCard(date: string): string {
	return date.replace(/-/g, '');
}

// Convert YYYYMMDD to YYYY-MM-DD for input
export function formatBdayFromVCard(bday: string): string {
	if (bday.length === 8) {
		return `${bday.slice(0, 4)}-${bday.slice(4, 6)}-${bday.slice(6, 8)}`;
	}
	return bday;
}

// Generate vCard v4 string from fields
export function generateVCard(f: VCardFields): string {
	const lines = ['BEGIN:VCARD', 'VERSION:4.0'];
	const fn = `${f.firstName} ${f.lastName}`.trim();
	if (fn) lines.push(`FN:${fn}`);
	if (f.lastName || f.firstName) lines.push(`N:${f.lastName};${f.firstName};;;`);
	if (f.org) lines.push(`ORG:${f.org}`);
	if (f.title) lines.push(`TITLE:${f.title}`);
	if (f.email) lines.push(`EMAIL:${f.email}`);
	if (f.bday) lines.push(`BDAY:${formatBdayToVCard(f.bday)}`);
	if (f.website) lines.push(`URL:${f.website}`);
	if (f.address) lines.push(`ADR:;;${f.address};;;;`);
	if (f.note) lines.push(`NOTE:${f.note}`);
	lines.push('END:VCARD');
	return lines.join('\n');
}

// Parse vCard string to fields (supports v3 & v4)
export function parseVCard(vcard: string): VCardFields {
	const get = (key: string) => {
		const m = vcard.match(new RegExp(`^${key}[;:](.*)$`, 'im'));
		return m?.[1]?.trim() || '';
	};

	const n = get('N').split(';');
	let lastName = n[0] || '';
	let firstName = n[1] || '';

	if (!lastName && !firstName) {
		const fn = get('FN').split(' ');
		firstName = fn[0] || '';
		lastName = fn.slice(1).join(' ') || '';
	}

	const adr = get('ADR').split(';');

	return {
		firstName,
		lastName,
		org: get('ORG').split(';')[0],
		title: get('TITLE'),
		email: get('EMAIL'),
		bday: formatBdayFromVCard(get('BDAY')),
		website: get('URL'),
		address: adr[2] || '',
		note: get('NOTE')
	};
}

// Parse FN (formatted name) or N from vCard
export function parseVCardName(vcard: string): string {
	const f = parseVCard(vcard);
	return `${f.firstName} ${f.lastName}`.trim();
}

// Parse ORG from vCard
export function parseVCardOrg(vcard: string): string {
	return parseVCard(vcard).org;
}

export const VCardCardDefinition = {
	type: 'vcard',
	contentComponent: VCardCard,
	settingsComponent: VCardCardSettings,

	createNew: (card) => {
		card.w = 2;
		card.h = 2;
		card.mobileW = 4;
		card.mobileH = 4;
		const displayName = user.profile?.displayName || user.profile?.handle || '';
		card.cardData.vcard = generateVCard({
			...emptyVCardFields,
			lastName: displayName
		});
		card.cardData.displayName = displayName;
	},

	allowSetColor: true,
	name: 'vCard Card',
	keywords: ['contact', 'phone', 'email', 'address', 'business card'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>`
} as CardDefinition & { type: 'vcard' };
