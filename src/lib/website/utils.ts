import { client } from '$lib/oauth';

export function parseUri(uri: string) {
	const [did, collection, rkey] = uri.split('/').slice(2);
	return { did, collection, rkey } as {
		collection: `${string}.${string}.${string}`;
		rkey: string;
		did: string;
	};
}

export async function uploadBlob(blob: Blob) {
	if (!client.profile) throw new Error('No profile');

	// atcute version
	const blobResponse = await client.rpc?.request({
		type: 'post',
		nsid: 'com.atproto.repo.uploadBlob',
		params: {
			repo: client.profile.did
		},
		data: blob
	});

	return blobResponse?.data.blob as {
		$type: 'blob';
		ref: {
			$link: string;
		};
		mimeType: string;
		size: number;
	};
}

export function getImageBlobUrl({ did, link }: { did: string; link: string }) {
	return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${link}@jpeg`;
}
