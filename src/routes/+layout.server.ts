export async function load({ request }) {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLowerCase();

	console.log('domain:', customDomain);

	return { customDomain };
}
