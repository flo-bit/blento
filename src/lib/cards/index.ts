import type { Item } from '$lib/types';
import { ATProtoCollectionsCardDefinition } from './ATProtoCollectionsCard';
import { BigSocialCardDefinition } from './BigSocialCard';
import { BlueskyMediaCardDefinition } from './BlueskyMediaCard';
import { BlueskyPostCardDefinition } from './BlueskyPostCard';
import { BlueskyFeedCardDefinition } from './BlueskyFeedCard';
import { LatestBlueskyPostCardDefinition } from './LatestBlueskyPostCard';
import { DinoGameCardDefinition } from './GameCards/DinoGameCard';
import { EmbedCardDefinition } from './EmbedCard';
import { TetrisCardDefinition } from './GameCards/TetrisCard';
import { ImageCardDefinition } from './ImageCard';
import { LinkCardDefinition } from './LinkCard';
import { LivestreamCardDefitition, LivestreamEmbedCardDefitition } from './LivestreamCard';
import { MapCardDefinition } from './MapCard';
import { SectionCardDefinition } from './SectionCard';
import { UpdatedBlentosCardDefitition } from './SpecialCards/UpdatedBlentos';
import { TextCardDefinition } from './TextCard';
import type { CardDefinition } from './types';
import { YoutubeCardDefinition } from './YoutubeVideoCard';
import { BlueskyProfileCardDefinition } from './BlueskyProfileCard';
import { GithubProfileCardDefitition } from './GitHubProfileCard';
import { FluidTextCardDefinition } from './FluidTextCard';
import { GifCardDefinition } from './GIFCard';
import { PopfeedReviewsCardDefinition } from './PopfeedReviews';
import { TealFMPlaysCardDefinition } from './TealFMPlaysCard';
import { PhotoGalleryCardDefinition } from './PhotoGalleryCard';
import { StandardSiteDocumentListCardDefinition } from './StandardSiteDocumentListCard';
import { StatusphereCardDefinition } from './StatusphereCard';
import { EventCardDefinition } from './EventCard';
import { VCardCardDefinition } from './VCardCard';
import { DrawCardDefinition } from './DrawCard';
import { TimerCardDefinition } from './TimerCard';
import { ClockCardDefinition } from './ClockCard';
import { CountdownCardDefinition } from './CountdownCard';
import { SpotifyCardDefinition } from './SpotifyCard';
import { AppleMusicCardDefinition } from './AppleMusicCard';
import { ButtonCardDefinition } from './ButtonCard';
import { GuestbookCardDefinition } from './GuestbookCard';
import { FriendsCardDefinition } from './FriendsCard';
import { GitHubContributorsCardDefinition } from './GitHubContributorsCard';
import { ProductHuntCardDefinition } from './ProductHuntCard';
// import { Model3DCardDefinition } from './Model3DCard';

export const AllCardDefinitions = [
	GuestbookCardDefinition,
	ButtonCardDefinition,
	ImageCardDefinition,
	TextCardDefinition,
	LinkCardDefinition,
	BigSocialCardDefinition,
	UpdatedBlentosCardDefitition,
	YoutubeCardDefinition,
	BlueskyPostCardDefinition,
	LatestBlueskyPostCardDefinition,
	BlueskyFeedCardDefinition,
	LivestreamCardDefitition,
	LivestreamEmbedCardDefitition,
	// EmbedCardDefinition,
	MapCardDefinition,
	ATProtoCollectionsCardDefinition,
	SectionCardDefinition,
	BlueskyMediaCardDefinition,
	DinoGameCardDefinition,
	BlueskyProfileCardDefinition,
	GithubProfileCardDefitition,
	TetrisCardDefinition,
	FluidTextCardDefinition,
	GifCardDefinition,
	PopfeedReviewsCardDefinition,
	TealFMPlaysCardDefinition,
	PhotoGalleryCardDefinition,
	StandardSiteDocumentListCardDefinition,
	StatusphereCardDefinition,
	EventCardDefinition,
	VCardCardDefinition,
	DrawCardDefinition,
	TimerCardDefinition,
	ClockCardDefinition,
	CountdownCardDefinition,
	SpotifyCardDefinition,
	AppleMusicCardDefinition,
	// Model3DCardDefinition
	FriendsCardDefinition,
	GitHubContributorsCardDefinition,
	ProductHuntCardDefinition
] as const;

export const CardDefinitionsByType = AllCardDefinitions.reduce(
	(acc, item) => {
		acc[item.type] = item;
		return acc;
	},
	{} as Record<string, CardDefinition>
);

export function getColor(item: Item): string {
	if (item.color) return item.color;

	const cardDefColor = CardDefinitionsByType[item.cardType]?.defaultColor;

	return cardDefColor || 'base';
}
