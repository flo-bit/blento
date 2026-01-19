import type { Item } from '$lib/types';
import { ATProtoCollectionsCardDefinition } from './ATProtoCollectionsCard';
import { BigSocialCardDefinition } from './BigSocialCard';
import { BlueskyMediaCardDefinition } from './BlueskyMediaCard';
import { BlueskyPostCardDefinition } from './BlueskyPostCard';
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
import { VideoCardDefinition } from './VideoCard';
import { YoutubeCardDefinition } from './YoutubeVideoCard';
import { BlueskyProfileCardDefinition } from './BlueskyProfileCard';
import { GithubProfileCardDefitition } from './GitHubProfileCard';
import { FluidTextCardDefinition } from './FluidTextCard';
import { PopfeedReviewsCardDefinition } from './PopfeedReviews';
import { TealFMPlaysCardDefinition } from './TealFMPlaysCard';

export const AllCardDefinitions = [
	ImageCardDefinition,
	VideoCardDefinition,
	TextCardDefinition,
	LinkCardDefinition,
	BigSocialCardDefinition,
	UpdatedBlentosCardDefitition,
	YoutubeCardDefinition,
	BlueskyPostCardDefinition,
	LivestreamCardDefitition,
	LivestreamEmbedCardDefitition,
	EmbedCardDefinition,
	MapCardDefinition,
	ATProtoCollectionsCardDefinition,
	SectionCardDefinition,
	BlueskyMediaCardDefinition,
	DinoGameCardDefinition,
	BlueskyProfileCardDefinition,
	GithubProfileCardDefitition,
	TetrisCardDefinition,
	FluidTextCardDefinition,
	PopfeedReviewsCardDefinition,
	TealFMPlaysCardDefinition
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
