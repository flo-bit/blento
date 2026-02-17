import type { Item } from '$lib/types';
import { ATProtoCollectionsCardDefinition } from './social/ATProtoCollectionsCard';
import { BigSocialCardDefinition } from './social/BigSocialCard';
import { BlueskyMediaCardDefinition } from './media/BlueskyMediaCard';
import { BlueskyPostCardDefinition } from './social/BlueskyPostCard';
import { BlueskyFeedCardDefinition } from './social/BlueskyFeedCard';
import { LatestBlueskyPostCardDefinition } from './social/LatestBlueskyPostCard';
import { DinoGameCardDefinition } from './games/DinoGameCard';
import { EmbedCardDefinition } from './media/EmbedCard';
import { TetrisCardDefinition } from './games/TetrisCard';
import { ImageCardDefinition } from './core/ImageCard';
import { LinkCardDefinition } from './core/LinkCard';
import { LivestreamCardDefitition, LivestreamEmbedCardDefitition } from './media/LivestreamCard';
import { MapCardDefinition } from './core/MapCard';
import { SectionCardDefinition } from './core/SectionCard';
import { UpdatedBlentosCardDefitition } from './special/UpdatedBlentos';
import { TextCardDefinition } from './core/TextCard';
import type { CardDefinition } from './types';
import { YoutubeCardDefinition } from './media/YoutubeVideoCard';
import { BlueskyProfileCardDefinition } from './social/BlueskyProfileCard';
import { GithubProfileCardDefitition } from './social/GitHubProfileCard';
import { FluidTextCardDefinition } from './visual/FluidTextCard';
import { GifCardDefinition } from './media/GIFCard';
import { PopfeedReviewsCardDefinition } from './media/PopfeedReviews';
import { TealFMPlaysCardDefinition } from './media/TealFMPlaysCard';
import { PhotoGalleryCardDefinition } from './media/PhotoGalleryCard';
import { StandardSiteDocumentListCardDefinition } from './content/StandardSiteDocumentListCard';
import { StatusphereCardDefinition } from './media/StatusphereCard';
import { EventCardDefinition } from './social/EventCard';
import { VCardCardDefinition } from './social/VCardCard';
import { DrawCardDefinition } from './visual/DrawCard';
import { TimerCardDefinition } from './utilities/TimerCard';
import { ClockCardDefinition } from './utilities/ClockCard';
import { CountdownCardDefinition } from './utilities/CountdownCard';
import { SpotifyCardDefinition } from './media/SpotifyCard';
import { AppleMusicCardDefinition } from './media/AppleMusicCard';
import { ButtonCardDefinition } from './utilities/ButtonCard';
import { GuestbookCardDefinition } from './social/GuestbookCard';
import { FriendsCardDefinition } from './social/FriendsCard';
import { GitHubContributorsCardDefinition } from './social/GitHubContributorsCard';
import { ProductHuntCardDefinition } from './social/ProductHuntCard';
import { KickstarterCardDefinition } from './social/KickstarterCard';
import { NpmxLikesCardDefinition } from './social/NpmxLikesCard';
import { NpmxLikesLeaderboardCardDefinition } from './social/NpmxLikesLeaderboardCard';
import { LastFMRecentTracksCardDefinition } from './media/LastFMCard/LastFMRecentTracksCard';
import { LastFMTopTracksCardDefinition } from './media/LastFMCard/LastFMTopTracksCard';
import { LastFMTopAlbumsCardDefinition } from './media/LastFMCard/LastFMTopAlbumsCard';
import { LastFMProfileCardDefinition } from './media/LastFMCard/LastFMProfileCard';
import { PlyrFMCardDefinition, PlyrFMCollectionCardDefinition } from './media/PlyrFMCard';
import { MarginCardDefinition } from './social/MarginCard';
import { SembleCollectionCardDefinition } from './social/SembleCollectionCard';
import { GermDMCardDefinition } from './social/GermDMCard';
// import { Model3DCardDefinition } from './visual/Model3DCard';

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
	ProductHuntCardDefinition,
	KickstarterCardDefinition,
	NpmxLikesCardDefinition,
	NpmxLikesLeaderboardCardDefinition,
	LastFMRecentTracksCardDefinition,
	LastFMTopTracksCardDefinition,
	LastFMTopAlbumsCardDefinition,
	LastFMProfileCardDefinition,
	PlyrFMCardDefinition,
	PlyrFMCollectionCardDefinition,
	MarginCardDefinition,
	SembleCollectionCardDefinition,
	GermDMCardDefinition
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
