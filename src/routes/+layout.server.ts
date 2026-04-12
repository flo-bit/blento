export async function load({ request, locals, platform }) {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();

	return {
		customDomain,
		authDid: locals.did
	};
}
