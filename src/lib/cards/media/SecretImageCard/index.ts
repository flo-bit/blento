import { uploadBlob } from '$lib/atproto/methods';
import type { CardDefinition } from '../../types';
import { createPixelatedPreview, encryptBlob } from './crypto';
import EditingSecretImageCard from './EditingSecretImageCard.svelte';
import SecretImageCard from './SecretImageCard.svelte';
import SecretImageCardSettings from './SecretImageCardSettings.svelte';

export const SecretImageCardDefinition = {
	type: 'secretImage',
	contentComponent: SecretImageCard,
	editingContentComponent: EditingSecretImageCard,
	settingsComponent: SecretImageCardSettings,

	createNew: (card) => {
		card.cardType = 'secretImage';
		card.cardData = {
			encryptedImage: '',
			preview: '',
			password: '',
			rawImage: null
		};
	},

	upload: async (item) => {
		if (item.cardData.rawImage?.blob && !item.cardData.password) {
			throw new Error('Password is required for secret image');
		}

		// If there's a new raw image + password, encrypt and upload
		if (item.cardData.rawImage?.blob && item.cardData.password) {
			const rawBlob = item.cardData.rawImage.blob as Blob;
			const password = item.cardData.password as string;

			// Generate pixelated preview
			item.cardData.preview = await createPixelatedPreview(rawBlob);

			// Encrypt the image
			const encrypted = await encryptBlob(rawBlob, password);

			// Upload encrypted blob
			item.cardData.encryptedImage = await uploadBlob({ blob: encrypted });

			// Clean up local state
			if (item.cardData.rawImage.objectUrl) {
				URL.revokeObjectURL(item.cardData.rawImage.objectUrl);
			}
			delete item.cardData.rawImage;
			delete item.cardData.password;

			return item;
		}

		// Already uploaded encrypted blob - nothing to do
		if (
			typeof item.cardData.encryptedImage === 'object' &&
			item.cardData.encryptedImage?.$type === 'blob'
		) {
			// Clean up editing-only fields before save
			delete item.cardData.rawImage;
			delete item.cardData.password;
			return item;
		}

		return item;
	},

	name: 'Secret Image',

	keywords: ['secret', 'encrypted', 'password', 'hidden', 'private', 'locked'],
	groups: ['Media'],

	icon: `<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="2"
		stroke="currentColor"
		class="size-4"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
		/>
	</svg>`
} as CardDefinition & { type: 'secretImage' };
