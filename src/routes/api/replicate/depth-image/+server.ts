import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import Replicate from 'replicate';

export async function GET({ url }) {
	const image = url.searchParams.get('image');
	if (!image) {
		return json({ error: 'No image provided' }, { status: 400 });
	}
	const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

	const input = {
		image: image
	};
	const output = (await replicate.run(
		'chenxwh/depth-anything-v2:b239ea33cff32bb7abb5db39ffe9a09c14cbc2894331d1ef66fe096eed88ebd4',
		{ input }
	)) as { grey_depth: ReadableStream };

	// Convert the ReadableStream to a base64 data URL
	const response = new Response(output.grey_depth);
	const arrayBuffer = await response.arrayBuffer();
	const base64 = Buffer.from(arrayBuffer).toString('base64');
	const dataUrl = `data:image/png;base64,${base64}`;

	return json({ url: dataUrl });
}
