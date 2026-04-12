import { json } from '@sveltejs/kit';
import { createOAuthClient } from '$lib/atproto/server/oauth';

export async function GET({ request, platform }) {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();
	const oauth = createOAuthClient(platform?.env, customDomain || undefined);

	return json(oauth.metadata);
}
