import { getCDNImageBlobUrl, uploadBlob } from './methods';

export function compressImage(
	file: File | Blob,
	maxSize: number = 900 * 1024,
	maxDimension: number = 2048
): Promise<{
	blob: Blob;
	aspectRatio: {
		width: number;
		height: number;
	};
}> {
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
			let width = img.width;
			let height = img.height;

			// If image is already small enough, return original
			if (file.size <= maxSize) {
				console.log('skipping compression+resizing, already small enough');
				return resolve({
					blob: file,
					aspectRatio: {
						width,
						height
					}
				});
			}

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
							resolve({
								blob,
								aspectRatio: {
									width,
									height
								}
							});
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
	recordWithImage: Record<string, any>,
	key: string = 'image',
	// e.g. /api/image-proxy?url=
	imageProxy?: string
) {
	if (!recordWithImage[key]) return;

	// Already uploaded as blob
	if (typeof recordWithImage[key] === 'object' && recordWithImage[key].$type === 'blob') {
		return;
	}

	if (typeof recordWithImage[key] === 'string' && imageProxy) {
		const proxyUrl = imageProxy + encodeURIComponent(recordWithImage[key]);
		const response = await fetch(proxyUrl);
		if (!response.ok) {
			throw Error('failed to get image from image proxy');
		}

		const blob = await response.blob();
		const compressedBlob = await compressImage(blob);

		recordWithImage[key] = await uploadBlob({ blob: compressedBlob.blob });

		return;
	}

	if (recordWithImage[key]?.blob) {
		if (recordWithImage[key].objectUrl) {
			URL.revokeObjectURL(recordWithImage[key].objectUrl);
		}
		const compressedBlob = await compressImage(recordWithImage[key].blob);
		recordWithImage[key] = await uploadBlob({ blob: compressedBlob.blob });
	}
}

export function getImageFromRecord(
	recordWithImage: Record<string, any> | undefined,
	did: string,
	key: string = 'image'
): string | undefined {
	if (!recordWithImage?.[key]) return;

	if (typeof recordWithImage[key] === 'object' && recordWithImage[key].$type === 'blob') {
		return getCDNImageBlobUrl({ did, blob: recordWithImage[key] });
	}

	if (recordWithImage[key].objectUrl) return recordWithImage[key].objectUrl;

	if (recordWithImage[key].blob) {
		recordWithImage[key].objectUrl = URL.createObjectURL(recordWithImage[key].blob);
		return recordWithImage[key].objectUrl;
	}

	return recordWithImage[key];
}
