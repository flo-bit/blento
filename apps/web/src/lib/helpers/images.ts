import { getCDNImageBlobUrl, uploadBlob } from '$lib/atproto';

export function compressImage(file: File | Blob, maxSize: number = 900 * 1024): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				return reject(new Error('Failed to read file.'));
			}
			img.src = e.target.result as string;
		};

		reader.onerror = (err) => reject(err);
		reader.readAsDataURL(file);

		img.onload = () => {
			const maxDimension = 2048;

			// If image is already small enough, return original
			if (file.size <= maxSize) {
				console.log('skipping compression+resizing, already small enough');
				return resolve(file);
			}

			let width = img.width;
			let height = img.height;

			if (width > maxDimension || height > maxDimension) {
				if (width > height) {
					height = Math.round((maxDimension / width) * height);
					width = maxDimension;
				} else {
					width = Math.round((maxDimension / height) * width);
					height = maxDimension;
				}
			}

			// Create a canvas to draw the image
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return reject(new Error('Failed to get canvas context.'));
			ctx.drawImage(img, 0, 0, width, height);

			// Use WebP for both compression and transparency support
			let quality = 0.9;

			function attemptCompression() {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							return reject(new Error('Compression failed.'));
						}
						if (blob.size <= maxSize || quality < 0.3) {
							resolve(blob);
						} else {
							quality -= 0.1;
							attemptCompression();
						}
					},
					'image/webp',
					quality
				);
			}

			attemptCompression();
		};

		img.onerror = (err) => reject(err);
	});
}

export async function checkAndUploadImage(
	objectWithImage: Record<string, any>,
	key: string = 'image'
) {
	if (!objectWithImage[key]) return;

	// Already uploaded as blob
	if (typeof objectWithImage[key] === 'object' && objectWithImage[key].$type === 'blob') {
		return;
	}

	if (typeof objectWithImage[key] === 'string') {
		// Download image from URL via proxy (to avoid CORS) and upload as blob
		try {
			const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(objectWithImage[key])}`;
			const response = await fetch(proxyUrl);
			if (!response.ok) {
				console.error('Failed to fetch image:', objectWithImage[key]);
				return;
			}
			const blob = await response.blob();
			const compressedBlob = await compressImage(blob);
			objectWithImage[key] = await uploadBlob({ blob: compressedBlob });
		} catch (error) {
			console.error('Failed to download and upload image:', error);
		}
		return;
	}

	if (objectWithImage[key]?.blob) {
		const compressedBlob = await compressImage(objectWithImage[key].blob);
		objectWithImage[key] = await uploadBlob({ blob: compressedBlob });
	}
}

export function getImage(
	objectWithImage: Record<string, any> | undefined,
	did: string,
	key: string = 'image'
) {
	if (!objectWithImage?.[key]) return;

	if (objectWithImage[key].objectUrl) return objectWithImage[key].objectUrl;

	if (typeof objectWithImage[key] === 'object' && objectWithImage[key].$type === 'blob') {
		return getCDNImageBlobUrl({ did, blob: objectWithImage[key] });
	}
	return objectWithImage[key];
}
