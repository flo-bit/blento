// Subset of skyboard's appview `BoardResponse` that this readonly card renders.
// Source of truth: skyboard/appview/src/api/get-board.ts

export interface SkyboardColumn {
	id: string;
	name: string;
	order: number;
}

export interface SkyboardLabel {
	id: string;
	name: string;
	color: string; // CSS color string (usually hex)
	description?: string;
}

export interface SkyboardTask {
	uri: string;
	did: string;
	rkey: string;
	effectiveTitle: string;
	effectiveDescription?: string;
	effectiveColumnId: string;
	effectiveParentTaskUri?: string;
	effectivePosition: string;
	effectiveLabelIds: string[];
	createdAt: string;
}

export interface SkyboardBoard {
	uri: string;
	did: string;
	rkey: string;
	name: string;
	description: string | null;
	columns: SkyboardColumn[];
	labels: SkyboardLabel[];
	open: boolean;
	createdAt: string;
}

export interface SkyboardBoardData {
	board: SkyboardBoard;
	tasks: SkyboardTask[];
}

// Loaded data is keyed by `${did}/${rkey}`.
export type SkyboardLoadedData = Record<string, SkyboardBoardData | undefined>;
