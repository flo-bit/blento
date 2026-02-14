import type { ActorIdentifier, Did } from '@atcute/lexicons';
import type { CacheService } from './cache';
import { env as publicEnv } from '$env/dynamic/public';
import { resolveHandle } from './atproto';
import { isHandle } from '@atcute/lexicons/syntax';

export async function getActor({
	request,
	paramActor,
	platform,
	blockBoth = true
}: {
	request: Request;
	paramActor?: ActorIdentifier;
	platform: Readonly<App.Platform> | undefined;
	blockBoth?: boolean;
}): Promise<Did | undefined> {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();
	let actor = paramActor;

	if (!actor) {
		const kv = platform?.env?.CUSTOM_DOMAINS;

		if (kv && customDomain) {
			try {
				const did = await kv.get(customDomain);

				if (did) actor = did as ActorIdentifier;
			} catch (error) {
				console.error('failed to get custom domain kv', error);
			}
		} else {
			actor = publicEnv.PUBLIC_HANDLE as ActorIdentifier;
		}
	} else if (customDomain && paramActor && blockBoth) {
		actor = undefined;
	}

	return isHandle(actor) ? await resolveHandle({ handle: actor }) : actor;
}
