import { uploadBlob } from '$lib/atproto/methods';
import type { CardDefinition } from '../../types';
import CreateSecretImageCardModal from './CreateSecretImageCardModal.svelte';
import SecretImageCard from './SecretImageCard.svelte';

export const SecretImageCardDefinition = {
	type: 'secretImage',
	contentComponent: SecretImageCard,

	creationModalComponent: CreateSecretImageCardModal,

	createNew: (card) => {
		card.cardType = 'secretImage';
		card.cardData = {
			encryptedImage: '',
			preview: ''
		};
	},

	upload: async (item) => {
		const img = item.cardData.encryptedImage;
		if (!img) return item;

		// Already uploaded
		if (typeof img === 'object' && img.$type === 'blob') return item;

		// Local blob from creation modal
		if (img?.blob) {
			if (img.objectUrl) {
				URL.revokeObjectURL(img.objectUrl);
			}
			item.cardData.encryptedImage = await uploadBlob({ blob: img.blob });
		}

		return item;
	},

	name: 'Secret Image',

	keywords: ['secret', 'encrypted', 'password', 'hidden', 'private', 'locked'],
	groups: ['Core'],

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
