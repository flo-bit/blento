import { metadata } from '$lib/atproto';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();

	if (customDomain) {
		const changedMetadata = metadata;
		changedMetadata.redirect_uris = changedMetadata.redirect_uris.map((s) =>
			s.replace('blento.app', customDomain)
		);
		changedMetadata.client_id = changedMetadata.client_id.replace('blento.app', customDomain);
		return json(changedMetadata);
	}

	return json(metadata);
}
