import { uploadBlob } from '$lib/atproto';
import type { CardDefinition } from '../types';
import SoundboardCard from './SoundboardCard.svelte';
import EditingSoundboardCard from './EditingSoundboardCard.svelte';
import SoundboardCardSettings from './SoundboardCardSettings.svelte';

export const SoundboardCardDefinition = {
	type: 'soundboard',
	contentComponent: SoundboardCard,
	editingContentComponent: EditingSoundboardCard,
	settingsComponent: SoundboardCardSettings,
	sidebarButtonText: 'Soundboard',
	name: 'Soundboard',
	allowSetColor: true,

	createNew: (card) => {
		card.cardType = 'soundboard';
		card.w = 4;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 6;
		card.cardData = {
			sounds: []
		};
	},

	upload: async (item) => {
		const sounds = item.cardData?.sounds ?? [];
		const uploadedSounds = [];

		for (const sound of sounds) {
			if (sound.pendingBlob) {
				const blob = sound.pendingBlob;
				const uploadedBlob = await uploadBlob({ blob });

				if (uploadedBlob) {
					uploadedSounds.push({
						name: sound.name,
						blob: uploadedBlob
					});
				}

				if (sound.objectUrl) {
					URL.revokeObjectURL(sound.objectUrl);
				}
			} else {
				const { objectUrl, pendingBlob, ...rest } = sound;
				uploadedSounds.push(rest);
			}
		}

		item.cardData.sounds = uploadedSounds;
		return item;
	},

	minW: 2,
	minH: 2
} as CardDefinition & { type: 'soundboard' };
