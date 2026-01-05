import { metadata } from '$lib/oauth';
import { json } from '@sveltejs/kit';

export async function GET() {
	return json(metadata);
}
