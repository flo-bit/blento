import { getVideoUploadToken } from '$lib/atproto/server/video.remote';

export const VIDEO_SERVICE = 'https://video.bsky.app';

/** Blob reference returned by the video service once processing completes. */
export type VideoBlob = {
	$type: 'blob';
	ref: { $link: string };
	mimeType: string;
	size: number;
};

export type UploadedVideo = {
	blob: VideoBlob;
	did: string;
	cid: string;
};

export type UploadProgress =
	| { phase: 'authorizing' }
	| { phase: 'uploading'; percent: number }
	| { phase: 'processing'; percent?: number }
	| { phase: 'done' };

export type OnProgress = (progress: UploadProgress) => void;

/** HLS playlist URL for a video stored in `did`'s PDS with blob cid `cid`. */
export function videoPlaylistUrl(did: string, cid: string): string {
	return `${VIDEO_SERVICE}/watch/${did}/${cid}/playlist.m3u8`;
}

/** Poster/thumbnail URL for a video. */
export function videoThumbnailUrl(did: string, cid: string): string {
	return `${VIDEO_SERVICE}/watch/${did}/${cid}/thumbnail.jpg`;
}

/**
 * Recursively locate a blob ref (`{ ref: { $link } }`) anywhere in a response —
 * the video service places it under `blob` on success and may nest it differently
 * in an `already_exists` response, so we search rather than assume a fixed path.
 */
function findBlob(value: unknown): VideoBlob | undefined {
	if (!value || typeof value !== 'object') return undefined;
	const obj = value as Record<string, unknown>;
	const link = (obj.ref as { $link?: unknown } | undefined)?.$link;
	if (typeof link === 'string' && link) return obj as VideoBlob;
	for (const v of Object.values(obj)) {
		const found = findBlob(v);
		if (found) return found;
	}
	return undefined;
}

/** Read a video file's intrinsic (integer) dimensions for storing an aspect ratio. */
export function getVideoAspectRatio(
	file: File
): Promise<{ width: number; height: number } | undefined> {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const video = document.createElement('video');
		video.preload = 'metadata';
		video.onloadedmetadata = () => {
			URL.revokeObjectURL(url);
			resolve({ width: video.videoWidth, height: video.videoHeight });
		};
		video.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(undefined);
		};
		video.src = url;
	});
}

/**
 * Upload the raw bytes via XHR so we can report upload progress. Resolves with the
 * parsed body and status regardless of HTTP status — the caller decides how to
 * interpret it (e.g. a duplicate "already processed" response still carries a
 * usable jobId/blob).
 */
function postVideo(
	url: string,
	file: File,
	token: string,
	onUploadProgress: (percent: number) => void
): Promise<{ status: number; data: Record<string, unknown> | null }> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onUploadProgress(Math.round((e.loaded / e.total) * 100));
		};

		xhr.onload = () => {
			let data: Record<string, unknown> | null = null;
			try {
				data = JSON.parse(xhr.responseText);
			} catch {
				data = null;
			}
			resolve({ status: xhr.status, data });
		};

		xhr.onerror = () => reject(new Error('Network error during upload'));
		xhr.send(file);
	});
}

/**
 * Upload a video to the Bluesky video service and wait for it to finish
 * transcoding. The service stores the resulting blob in the user's PDS; we get
 * back the blob reference to embed in the card record.
 */
export async function uploadVideoToBsky(
	file: File,
	onProgress?: OnProgress
): Promise<UploadedVideo> {
	onProgress?.({ phase: 'authorizing' });
	const { token, did } = await getVideoUploadToken();

	const url = new URL(`${VIDEO_SERVICE}/xrpc/app.bsky.video.uploadVideo`);
	url.searchParams.set('did', did);
	// The service rejects duplicate (did, name) pairs, so make the name unique.
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'video.mp4';
	url.searchParams.set('name', `${Date.now()}-${safeName}`);

	onProgress?.({ phase: 'uploading', percent: 0 });
	const upload = await postVideo(url.toString(), file, token, (percent) =>
		onProgress?.({ phase: 'uploading', percent })
	);
	console.debug('[video] uploadVideo response', upload.status, upload.data);
	let job: Record<string, unknown> = upload.data ?? {};

	// Follow the tutorial: poll until a blob appears, rather than gating on state.
	// When the same video was already processed before, the service answers with an
	// `already_exists` "error" that still carries the existing BlobRef — so we hunt
	// for a blob anywhere in the response and only treat the job as failed when there
	// genuinely isn't one.
	let blob = findBlob(upload.data);
	const jobId = (job.jobId ?? (job.jobStatus as Record<string, unknown>)?.jobId) as
		| string
		| undefined;

	if (!blob && !jobId) {
		console.warn('[video] no blob or jobId in upload response', upload.status, upload.data);
		throw new Error(
			(job.message as string) || (job.error as string) || `Video upload failed (${upload.status})`
		);
	}

	onProgress?.({ phase: 'processing' });
	let attempts = 0;
	while (!blob) {
		if (attempts++ > 120) throw new Error('Video processing timed out');
		await new Promise((r) => setTimeout(r, 1500));
		const res = await fetch(`${VIDEO_SERVICE}/xrpc/app.bsky.video.getJobStatus?jobId=${jobId}`);
		const statusData = (await res.json()) as Record<string, unknown>;
		console.debug('[video] getJobStatus response', res.status, statusData);
		job = (statusData.jobStatus as Record<string, unknown>) ?? statusData;
		blob = findBlob(statusData);

		const errCode = (job.error ?? statusData.error) as string | undefined;
		if (!blob && job.state === 'JOB_STATE_FAILED' && errCode !== 'already_exists') {
			throw new Error((job.message as string) || errCode || 'Video processing failed');
		}
		onProgress?.({ phase: 'processing', percent: job.progress as number | undefined });
	}

	onProgress?.({ phase: 'done' });
	return { blob, did, cid: blob.ref.$link };
}
