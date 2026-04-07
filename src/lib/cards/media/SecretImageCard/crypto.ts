/**
 * AES-GCM encryption/decryption using Web Crypto API with SHA-256 derived keys.
 */

async function deriveKey(password: string): Promise<CryptoKey> {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
	return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt a Blob with a password. Returns a Blob containing iv + ciphertext.
 */
export async function encryptBlob(blob: Blob, password: string): Promise<Blob> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKey(password);

	const plaintext = await blob.arrayBuffer();
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

	// Pack: iv (12) + ciphertext
	const result = new Uint8Array(12 + ciphertext.byteLength);
	result.set(iv, 0);
	result.set(new Uint8Array(ciphertext), 12);

	return new Blob([result], { type: 'application/octet-stream' });
}

/**
 * Decrypt a Blob that was encrypted with encryptBlob. Returns the original Blob.
 * Throws on wrong password.
 */
export async function decryptBlob(encryptedBlob: Blob, password: string): Promise<Blob> {
	const data = new Uint8Array(await encryptedBlob.arrayBuffer());

	const iv = data.slice(0, 12);
	const ciphertext = data.slice(12);

	const key = await deriveKey(password);
	const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

	return new Blob([plaintext]);
}

/**
 * Create a tiny pixelated preview of an image (16x16 pixels stored as a base64 data URL).
 */
export function createPixelatedPreview(file: Blob, size: number = 16): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) return reject(new Error('Failed to read file'));
			img.src = e.target.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);

		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			if (!ctx) return reject(new Error('Failed to get canvas context'));

			ctx.imageSmoothingEnabled = true;
			ctx.drawImage(img, 0, 0, size, size);

			resolve(canvas.toDataURL('image/webp', 0.5));
		};
		img.onerror = reject;
	});
}
