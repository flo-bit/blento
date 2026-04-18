import type { SectionDefinition } from './types';
import { GridSectionDefinition } from './GridSection';
import { HeroSectionDefinition } from './HeroSection';
import { TextSectionDefinition } from './TextSection';
import { RowSectionDefinition } from './RowSection';
import { GallerySectionDefinition } from './GallerySection';

export const AllSectionDefinitions = [
	GridSectionDefinition,
	HeroSectionDefinition,
	TextSectionDefinition,
	RowSectionDefinition,
	GallerySectionDefinition
] as const;

export const SectionDefinitionsByType = AllSectionDefinitions.reduce(
	(acc, def) => {
		acc[def.type] = def;
		return acc;
	},
	{} as Record<string, SectionDefinition>
);
