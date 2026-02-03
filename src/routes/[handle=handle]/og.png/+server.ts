import { getCDNImageBlobUrl } from '$lib/atproto/methods.js';
import type { UserCache } from '$lib/types';
import { loadData } from '$lib/website/load';
import type { Handle } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';
import { ImageResponse } from '@ethercorps/sveltekit-og';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export async function GET({ params, platform }) {
	const cache = platform?.env?.USER_DATA_CACHE as unknown;

	const data = await loadData(params.handle as Handle, cache as UserCache);

	let image: string | undefined = data.profile.avatar;

	if (data.publication.icon) {
		image =
			getCDNImageBlobUrl({ did: data.did, blob: data.publication.icon }) ?? data.profile.avatar;
	}

	const name = data.publication?.name ?? data.profile.displayName ?? data.profile.handle;

	const htmlString = `
<div class="flex flex-col p-8 w-full h-full bg-neutral-900">
    <div class="flex items-center mb-8 mt-16">
      <img src="${escapeHtml(image ?? '')}" width="128" height="128" class="rounded-full" />

	    <h1 class="text-neutral-50 text-7xl ml-4">${escapeHtml(name)}</h1>
    </div>

	<p class="mt-8 text-4xl text-neutral-300">Check out my blento</p>

    <svg class="absolute w-130 h-130 top-50 right-0" viewBox="0 0 900 900" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="100" y="100" width="160" height="340" rx="23" fill="#EF4444"/>
        <rect x="640" y="280" width="160" height="340" rx="23" fill="#22C55E"/>
        <rect x="280" y="100" width="340" height="340" rx="23" fill="#F59E0B"/>
        <rect x="100" y="460" width="340" height="160" rx="23" fill="#0EA5E9"/>
        <rect x="640" y="100" width="160" height="160" rx="23" fill="#EAB308"/>
        <rect x="100" y="640" width="160" height="160" rx="23" fill="#6366F1"/>
        <rect x="460" y="460" width="160" height="160" rx="23" fill="#14B8A6"/>
        <rect x="280" y="640" width="520" height="160" rx="23" fill="#A855F7"/>
    </svg>
</div>
`;

	return new ImageResponse(htmlString, {
		width: 1200,
		height: 630
	});
}
