import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import { DidNotFoundError } from '@atcute/identity-resolver';
import { SingleFlight } from './single-flight';
import type { CacheService } from './cache';
import { env as publicEnv } from '$env/dynamic/public';
import { resolveHandle } from '../atproto';
import { isHandle } from '@atcute/lexicons/syntax';
import { isDidBlocked } from './moderation';

const handles = new Map<string, { did: Did | undefined; expires: number }>();
const handleFlight = new SingleFlight();

async function resolveCachedHandle(handle: Handle): Promise<Did | undefined> {
	const key = handle.toLowerCase();
	const cached = handles.get(key);
	if (cached && cached.expires > Date.now()) return cached.did;
	return handleFlight.run(key, async () => {
		let did: Did | undefined;
		try {
			did = await resolveHandle({ handle });
		} catch (err) {
			// Do not turn transient upstream failures into cached "not found" results.
			if (!(err instanceof DidNotFoundError)) throw err;
		}
		if (handles.size >= 512) handles.delete(handles.keys().next().value!);
		handles.set(key, { did, expires: Date.now() + (did ? 300_000 : 60_000) });
		return did;
	});
}

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
			actor = (publicEnv.PUBLIC_HANDLE || 'blento.app') as ActorIdentifier;
		}
	} else if (customDomain && paramActor && blockBoth) {
		actor = undefined;
	}

	const did = isHandle(actor) ? await resolveCachedHandle(actor) : actor;

	return isDidBlocked(did) ? undefined : did;
}
