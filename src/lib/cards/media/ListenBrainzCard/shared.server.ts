import * as v from 'valibot';

/**
 * MusicBrainz username schema.
 * They are very broad in what they allow so this is unfortunately very loose
 */
export const usernameSchema = v.pipe(v.string(), v.trim(), v.minLength(1));

/**
 * Fetch from the ListenBrainz API. Returning the requested data, or null
 * if an error occurs.
 *
 * @param endpoint - The base endpoint to fetch from (e.g. `/1/user/${username}/now-playing`).
 * @param params - Optional query parameters to append to the URL.
 */
export async function listenBrainzFetch<R>(
	endpoint: string,
	params?: Record<string, string | number>
): Promise<R | Error> {
	try {
		const url = new URL(endpoint, 'https://api.listenbrainz.org');

		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value.toString());
			}
		}

		const response = await fetch(url, {
			headers: {
				Accept: 'application/json',
				'User-Agent': 'Blento +https://github.com/flo-bit/blento'
			}
		});

		if (!response.ok) {
			throw new Error(`response not ok: ${response.status}`);
		}

		const data = await response.json();
		return data as R;
	} catch (e) {
		const error = new Error(
			`failed to fetch from ListenBrainz at "${endpoint}": ${e instanceof Error ? e.message : e}`,
			{ cause: e }
		);

		console.error(error);
		return error;
	}
}
