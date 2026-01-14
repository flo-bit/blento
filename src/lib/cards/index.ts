import type { Item } from '$lib/types';
import { ATProtoCollectionsCardDefinition } from './ATProtoCollectionsCard';
import { BigSocialCardDefinition } from './BigSocialCard';
import { BlueskyMediaCardDefinition } from './BlueskyMediaCard';
import { BlueskyPostCardDefinition } from './BlueskyPostCard';
import { EmbedCardDefinition } from './EmbedCard';
import { ImageCardDefinition } from './ImageCard';
import { LinkCardDefinition } from './LinkCard';
import { LivestreamCardDefitition, LivestreamEmbedCardDefitition } from './LivestreamCard';
import { MapCardDefinition } from './MapCard';
import { SectionCardDefinition } from './SectionCard';
import { UpdatedBlentosCardDefitition } from './SpecialCards/UpdatedBlentos';
import { TextCardDefinition } from './TextCard';
import type { CardDefinition } from './types';
import { YoutubeCardDefinition } from './YoutubeVideo';

export const AllCardDefinitions = [
	ImageCardDefinition,
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
	BlueskyMediaCardDefinition
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
