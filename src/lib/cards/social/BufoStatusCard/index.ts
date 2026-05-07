import type { CardDefinition } from '../../types';
import { listRecords } from '$lib/atproto';
import BufoStatusCard from './BufoStatusCard.svelte';

interface StatusRecord {
	emoji: string;
	text?: string;
	expires?: string;
	createdAt: string;
}

export type BufoStatusData = {
	emoji: string;
	text?: string;
	rkey: string;
} | null;

export const BufoStatusCardDefinition = {
	type: 'bufoStatus',
	contentComponent: BufoStatusCard,

	createNew: (item) => {
		item.w = 2;
		item.h = 2;
		item.mobileW = 4;
		item.mobileH = 2;
	},

	loadData: async (_items, { did }) => {
		const records = await listRecords({
			did,
			collection: 'io.zzstoatzz.status.record',
			limit: 10
		});

		const now = Date.now();
		const active = records
			.map((r) => {
				const parts = r.uri.split('/');
				const rkey = parts[parts.length - 1] ?? '';
				const value = r.value as unknown as StatusRecord;
				return { ...value, rkey };
			})
			.filter((r) => r.emoji && r.rkey && (!r.expires || new Date(r.expires).getTime() > now))
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return active[0] ?? null;
	},
	cacheLoadData: { ttl: 300 },

	minW: 2,
	minH: 1,

	name: 'Bufo Status',
	keywords: ['bufo', 'status', 'emoji', 'mood', 'zzstoatzz'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>`
} as CardDefinition & { type: 'bufoStatus' };
