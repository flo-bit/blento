import { isActorIdentifier } from '@atcute/lexicons/syntax';
import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string) => {
	return isActorIdentifier(param);
}) satisfies ParamMatcher;
