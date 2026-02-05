import type { CardDefinition } from '../../types';
import UpdatedBlentosCard from './UpdatedBlentosCard.svelte';
import type { Did } from '@atcute/lexicons';
import { getBlentoOrBskyProfile } from '$lib/atproto/methods';

type ProfileWithBlentoFlag = Awaited<ReturnType<typeof getBlentoOrBskyProfile>>;

export const UpdatedBlentosCardDefitition = {
	type: 'updatedBlentos',
	contentComponent: UpdatedBlentosCard,
	keywords: ['feed', 'updates', 'recent', 'activity'],
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

			result = result.filter(
				(v) => v && v.handle !== 'handle.invalid' && !v.handle.endsWith('.pds.rip')
			);

			if (cache) {
				await cache?.put('updatedBlentos', JSON.stringify(result));
			}
			return JSON.parse(JSON.stringify(result.slice(0, 20)));
		} catch (error) {
			console.error('error fetching updated blentos', error);
			return [];
		}
	}
	// name: 'Updated Blentos',
	// groups: ['Social'],
	// icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6c-1.602 0-3.155.474-4.434 1.357L18 16.791A8.959 8.959 0 0 0 21 12h-4.5Z" /></svg>`
} as CardDefinition & { type: 'updatedBlentos' };
