import type { WebsiteData } from '../types';

/**
 * Flatten the page's `style` tokens into `--blento-<key>` CSS-var pairs for ThemeScript. Colors stay
 * on the @foxui accent/base class mechanism; radius/space/font flow through the token vars (e.g.
 * `style.radius.card` -> `radius-card` -> `--blento-radius-card`). Empty when no page tokens are set.
 */
export function getStyleTokens(data: WebsiteData): Record<string, string> {
	const style = data.publication?.style;
	if (!style) return {};
	const out: Record<string, string> = {};
	for (const group of ['radius', 'space', 'font'] as const) {
		const g = style[group];
		if (!g) continue;
		for (const [k, v] of Object.entries(g)) out[`${group}-${k}`] = String(v);
	}
	return out;
}

export function getName(data: WebsiteData): string {
	return data.publication?.name || data.profile.displayName || data.handle;
}

export function getDescription(data: WebsiteData): string {
	return data.publication?.description ?? data.profile.description ?? '';
}

export function getHideProfileSection(data: WebsiteData): boolean {
	if (data?.publication?.preferences?.hideProfileSection !== undefined)
		return data?.publication?.preferences?.hideProfileSection;

	if (data?.publication?.preferences?.hideProfile !== undefined)
		return data?.publication?.preferences?.hideProfile;

	return data.page !== 'blento.self';
}

export function getProfilePosition(data: WebsiteData): 'side' | 'top' {
	return data?.publication?.preferences?.profilePosition ?? 'side';
}
