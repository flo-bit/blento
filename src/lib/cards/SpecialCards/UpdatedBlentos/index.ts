import type { CardDefinition } from '../../types';
import UpdatedBlentosCard from './UpdatedBlentosCard.svelte';
import type { Did } from '@atcute/lexicons';
import { getBlentoOrBskyProfile } from '$lib/atproto/methods';

type ProfileWithBlentoFlag = Awaited<ReturnType<typeof getBlentoOrBskyProfile>>;

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
			const existingUsersArray: ProfileWithBlentoFlag[] = existingUsers
				? JSON.parse(existingUsers)
				: [];

			const uniqueDids = new Set<Did>(recentRecords.map((v: { did: string }) => v.did as Did));

			const profiles: Promise<ProfileWithBlentoFlag | undefined>[] = [];

			for (const did of Array.from(uniqueDids)) {
				profiles.push(getBlentoOrBskyProfile({ did }));
			}

			for (let i = existingUsersArray.length - 1; i >= 0; i--) {
				// if handle is handle.invalid, remove from existing users and add to profiles to refresh
				if (
					(existingUsersArray[i].handle === 'handle.invalid' ||
						(!existingUsersArray[i].avatar && !existingUsersArray[i].hasBlento)) &&
					!uniqueDids.has(existingUsersArray[i].did)
				) {
					const removed = existingUsersArray.splice(i, 1)[0];
					profiles.push(getBlentoOrBskyProfile({ did: removed.did }));
					// if in unique dids, remove from older existing users and keep the newer one
					// so updated profiles go first
				} else if (uniqueDids.has(existingUsersArray[i].did)) {
					existingUsersArray.splice(i, 1);
				}
			}

			let result = [...(await Promise.all(profiles)), ...existingUsersArray];

			result = result.filter((v) => v && v.handle !== 'handle.invalid');

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
