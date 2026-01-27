import type { UserCache } from '$lib/types';
import { loadData } from '$lib/website/load';
import { getName } from '$lib/helper';
import type { Handle } from '@atcute/lexicons';
import { ImageResponse } from '@ethercorps/sveltekit-og';
import OGImage from './OGImage.svelte';

export async function GET({ params, platform }) {
	const cache = platform?.env?.USER_DATA_CACHE as unknown;

	const data = await loadData(params.handle as Handle, cache as UserCache);

	return new ImageResponse(
		OGImage,
		{
			width: 1200,
			height: 630
		},
		{
			name: getName(data),
			avatar: data.profile.avatar,
			items: data.cards
		}
	);
}
