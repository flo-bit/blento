export async function load({ platform, request }) {
	const customDomain = request.headers.get('X-Custom-Domain')?.toLocaleLowerCase();

	return { customDomain };
}
