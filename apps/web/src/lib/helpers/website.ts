import type { WebsiteData } from '../types';

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
