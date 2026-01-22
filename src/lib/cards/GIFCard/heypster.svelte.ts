import { env } from '$env/dynamic/public';
import HeypsterGifSDK from 'heypster-gif/index.js';

const heypster = $state({});

function initHeypster() {
	heypster.sdk = new HeypsterGifSDK(env.PUBLIC_HEYPSTER_API_TOKEN, false, 'en', 'top', 'v3', {
		provider: 'giphy',
		key: env.PUBLIC_GIPHY_API_TOKEN
	});
}

export function toggleHeypster() {
	if (!heypster.sdk) initHeypster();

	if (!heypster.sdk.popupElement) {
		heypster.sdk = heypster.sdk.initialize();
	}

	heypster.sdk.togglePopup();
}
