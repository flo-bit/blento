import { getDetailedProfile } from '$lib/atproto';
import type { CardDefinition } from '../../types';
import UpdatedBlentosCard from './UpdatedBlentosCard.svelte';
import type { Did } from '@atcute/lexicons';
import type { AppBskyActorDefs } from '@atcute/bluesky';

export const UpdatedBlentosCardDefitition = {
	type: 'updatedBlentos',
	contentComponent: UpdatedBlentosCard,
	loadData: async (items, { cache }) => {
		try {
			const response = await fetch(
				'https://ufos-api.microcosm.blue/records?collection=app.blento.card'
			);
			const recentRecords = await response.json();
			const existingUsers = await cache?.get('updatedBlentos');
			const existingUsersArray: AppBskyActorDefs.ProfileViewDetailed[] = existingUsers
				? JSON.parse(existingUsers)
				: [];

			const existingUsersSet = new Set(existingUsersArray.map((v) => v.did));

			const uniqueDids = new Set<Did>();
			for (const record of recentRecords as { did: string }[]) {
				if (!existingUsersSet.has(record.did as Did)) uniqueDids.add(record.did as Did);
			}

			const profiles: Promise<AppBskyActorDefs.ProfileViewDetailed | undefined>[] = [];

			for (const did of Array.from(uniqueDids)) {
				const profile = getDetailedProfile({ did });
				profiles.push(profile);
				if (profiles.length > 30) break;
			}

			for (let i = existingUsersArray.length - 1; i >= 0; i--) {
				// if handle is handle.invalid, remove from existing users and add to profiles to refresh
				if (existingUsersArray[i].handle === 'handle.invalid') {
					const removed = existingUsersArray.splice(i, 1)[0];
					profiles.push(getDetailedProfile({ did: removed.did }));
				}
			}

			const result = [...(await Promise.all(profiles)), ...existingUsersArray].filter(
				(v) => v && v.handle !== 'handle.invalid'
			);

			if (cache) {
				await cache?.put('updatedBlentos', JSON.stringify(result));
			}
			return JSON.parse(JSON.stringify(result));
		} catch (error) {
			console.error('error fetching updated blentos', error);
			return [];
		}
	}
} as CardDefinition & { type: 'updatedBlentos' };
