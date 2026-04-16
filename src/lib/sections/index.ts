import type { SectionDefinition } from './types';
import { GridSectionDefinition } from './GridSection';

export const AllSectionDefinitions = [GridSectionDefinition] as const;

export const SectionDefinitionsByType = AllSectionDefinitions.reduce(
	(acc, def) => {
		acc[def.type] = def;
		return acc;
	},
	{} as Record<string, SectionDefinition>
);
