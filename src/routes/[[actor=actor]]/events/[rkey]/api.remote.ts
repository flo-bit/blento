import { query } from '$app/server';

export const fetchEventBacklinks = query('unchecked', async (eventUri: string) => {
	const allRecords: Record<string, unknown>[] = [];
	let cursor: string | undefined;

	do {
		const params: Record<string, unknown> = {
			subject: eventUri,
			source: 'community.lexicon.calendar.rsvp:subject.uri'
		};
		if (cursor) params.cursor = cursor;

		const res = await fetch(
			'https://slingshot.microcosm.blue/xrpc/com.bad-example.proxy.hydrateQueryResponse',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					atproto_proxy: 'did:web:constellation.microcosm.blue#constellation',
					hydration_sources: [
						{
							path: 'records[]',
							shape: 'at-uri-parts'
						}
					],
					params,
					xrpc: 'blue.microcosm.links.getBacklinks'
				})
			}
		);

		if (!res.ok) break;

		const data = await res.json();
		const output = data.output;
		if (!output) break;

		if (output.records && Array.isArray(output.records)) {
			allRecords.push(...output.records);
		}

		cursor = output.cursor || undefined;
	} while (cursor);

	return allRecords;
});
