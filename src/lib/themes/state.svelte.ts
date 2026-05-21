import { browser } from '$app/environment';

const STORAGE_KEY = 'blento:theme-test';

function read(): string {
	if (!browser) return '';
	try {
		return localStorage.getItem(STORAGE_KEY) ?? '';
	} catch {
		return '';
	}
}

export const themeState = $state({ id: read() });

export function setTheme(id: string) {
	themeState.id = id;
	if (!browser) return;
	try {
		if (id) localStorage.setItem(STORAGE_KEY, id);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}
