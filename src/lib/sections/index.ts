import type { SectionDefinition } from './types';
import { GridSectionDefinition } from './GridSection';
import { HeroSectionDefinition } from './HeroSection';

export const AllSectionDefinitions = [GridSectionDefinition, HeroSectionDefinition] as const;

export const SectionDefinitionsByType = AllSectionDefinitions.reduce(
	(acc, def) => {
		acc[def.type] = def;
		return acc;
	},
	{} as Record<string, SectionDefinition>
);
