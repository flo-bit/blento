import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string) => {
	return param.includes('.') || param.startsWith('did:');
}) satisfies ParamMatcher;
