import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	const kv = platform?.env?.CUSTOM_DOMAINS;
	if (!kv) return json({ error: 'KV not available' }, { status: 500 });

	const list = await kv.list();
	const entries: Record<string, string> = {};

	for (const key of list.keys) {
		const value = await kv.get(key.name);
		entries[key.name] = value ?? '';
	}

	return json(entries);
}
