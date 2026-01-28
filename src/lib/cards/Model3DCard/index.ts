import { uploadBlob } from '$lib/atproto';
import type { CardDefinition } from '../types';
import CreateModel3DCardModal from './CreateModel3DCardModal.svelte';
import Model3DCard from './Model3DCard.svelte';

export const Model3DCardDefinition = {
	type: 'model3d',
	contentComponent: Model3DCard,
	creationModalComponent: CreateModel3DCardModal,
	sidebarButtonText: '3D Model',

	createNew: (card) => {
		card.w = 4;
		card.h = 4;
		card.mobileW = 4;
		card.mobileH = 4;
		card.cardData = {
			modelType: 'gltf' // 'gltf' | 'stl'
		};
	},

	upload: async (item) => {
		// Handle file upload
		if (item.cardData.modelFile?.blob) {
			let blob: Blob = item.cardData.modelFile.blob;
			const modelType = item.cardData.modelFile.type || 'glb';

			// Ensure blob has a MIME type (STL/FBX files often have empty type)
			if (!blob.type) {
				const mimeTypes: Record<string, string> = {
					stl: 'model/stl',
					glb: 'model/gltf-binary',
					gltf: 'model/gltf+json',
					fbx: 'application/octet-stream'
				};
				const mimeType = mimeTypes[modelType] || 'application/octet-stream';
				blob = new Blob([blob], { type: mimeType });
			}

			// Upload the blob to the PDS
			const uploadedBlob = await uploadBlob({ blob });

			if (uploadedBlob) {
				item.cardData.modelBlob = uploadedBlob;
				item.cardData.modelType = modelType;
			}

			// Clean up the temporary file data
			if (item.cardData.modelFile.objectUrl) {
				URL.revokeObjectURL(item.cardData.modelFile.objectUrl);
			}
			delete item.cardData.modelFile;
		}

		return item;
	},

	minW: 2,
	minH: 2,

	name: '3D Model Card'
} as CardDefinition & { type: 'model3d' };
