/**
 * AES-GCM encryption/decryption using Web Crypto API with password-derived keys.
 */

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypt a Blob with a password. Returns a Blob containing salt + iv + ciphertext.
 */
export async function encryptBlob(blob: Blob, password: string): Promise<Blob> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKey(password, salt);

	const plaintext = await blob.arrayBuffer();
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

	// Pack: salt (16) + iv (12) + ciphertext
	const result = new Uint8Array(16 + 12 + ciphertext.byteLength);
	result.set(salt, 0);
	result.set(iv, 16);
	result.set(new Uint8Array(ciphertext), 28);

	return new Blob([result], { type: 'application/octet-stream' });
}

/**
 * Decrypt a Blob that was encrypted with encryptBlob. Returns the original Blob.
 * Throws on wrong password.
 */
export async function decryptBlob(encryptedBlob: Blob, password: string): Promise<Blob> {
	const data = new Uint8Array(await encryptedBlob.arrayBuffer());

	const salt = data.slice(0, 16);
	const iv = data.slice(16, 28);
	const ciphertext = data.slice(28);

	const key = await deriveKey(password, salt);
	const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

	return new Blob([plaintext]);
}

/**
 * Create a tiny pixelated preview of an image (16x16 pixels stored as a base64 data URL).
 */
export function createPixelatedPreview(
	file: Blob,
	size: number = 16
): Promise<string> {
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
