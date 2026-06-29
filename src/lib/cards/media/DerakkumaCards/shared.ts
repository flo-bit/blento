import { getRecord, listRecords, parseUri } from '$lib/atproto';
import { getCDNImageBlobUrl } from '$lib/atproto/methods';
import type { Did } from '@atcute/lexicons';

export const DERAKKUMA_PROFILE = 'com.derakkuma.profile';
export const DERAKKUMA_PLAY = 'com.derakkuma.play';
export const DERAKKUMA_BEST = 'com.derakkuma.best';
export const DERAKKUMA_CIRCLE = 'com.derakkuma.circle';

type BlobRef = {
	$type?: 'blob';
	ref?: { $link?: string } | string;
	cid?: string;
};

type StrongRef = {
	uri?: string;
	cid?: string;
};

export type RepoRecord<T = Record<string, unknown>> = {
	uri: string;
	cid?: string;
	value: T;
};

export type DerakkumaProfileValue = {
	playerName?: string;
	title?: string;
	rating?: number;
	stars?: number;
	friendCode?: string;
	profileImage?: BlobRef;
	ratingPlateImage?: BlobRef;
	trophyPlateImage?: BlobRef;
	partnerImage?: BlobRef;
	courseImage?: BlobRef;
	classImage?: BlobRef;
};

export type DerakkumaScoreValue = {
	chart?: StrongRef | Record<string, unknown>;
	songName?: string;
	chartSongName?: string;
	chartSongId?: string;
	chartDifficulty?: string;
	chartLevel?: string;
	chartType?: string;
	achievement?: string | number;
	scoreRank?: string;
	fcStatus?: string;
	syncStatus?: string;
	dxScore?: DerakkumaDxScoreValue;
	dxStar?: number;
	playedAt?: string;
	lastPlayed?: string;
	createdAt?: string;
	updatedAt?: string;
	playCount?: number;
};

export type DerakkumaCircleValue = {
	name?: string;
	comment?: string;
	rank?: number;
	totalPoints?: number;
	circleCode?: string;
	ownerName?: string;
	month?: string;
	daysUntilReset?: number;
	nextRewardPoints?: number;
	characterImage?: BlobRef;
	backgroundImage?: BlobRef;
	updatedAt?: string;
	createdAt?: string;
};

type DerakkumaSongValue = {
	songId?: string;
	title?: string;
	artist?: string;
	category?: string;
	bpm?: number;
	imageName?: string;
	coverArt?: BlobRef;
	charts?: string[];
};

type DerakkumaChartValue = {
	song?: StrongRef | Record<string, unknown>;
	songId?: string;
	songName?: string;
	type?: string;
	difficulty?: string;
	level?: string;
	levelValue?: string;
	internalLevel?: string | null;
	internalLevelValue?: string | null;
};

type DerakkumaDxScoreValue = {
	achieved?: number;
	total?: number;
};

export type EnrichedDerakkumaScore = RepoRecord<DerakkumaScoreValue> & {
	chart?: RepoRecord<DerakkumaChartValue>;
	song?: RepoRecord<DerakkumaSongValue>;
	coverArtUrl?: string;
};

export function blobUrl(did: Did | string, blob?: BlobRef): string | undefined {
	if (!blob) return;
	const ref = typeof blob.ref === 'string' ? blob.ref : blob.ref?.$link;
	const normalized = ref
		? ({ $type: 'blob', ref: { $link: ref } } as const)
		: blob.cid
			? ({ $type: 'blob', ref: { $link: blob.cid } } as const)
			: undefined;
	if (!normalized) return;
	return getCDNImageBlobUrl({ did, blob: normalized });
}

function valueObject(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function strongRefUri(ref: unknown): string | undefined {
	return valueObject(ref)?.uri as string | undefined;
}

async function resolveRef(
	ref: unknown,
	cache: Map<string, Promise<RepoRecord | undefined>>
): Promise<RepoRecord | undefined> {
	const uri = strongRefUri(ref);
	if (!uri) return;
	const cached = cache.get(uri);
	if (cached) return cached;

	const promise = (async () => {
		const parsed = parseUri(uri);
		if (!parsed?.collection || !parsed.rkey) return;
		try {
			const record = await getRecord({
				did: parsed.repo as Did,
				collection: parsed.collection,
				rkey: parsed.rkey
			});
			return { uri, cid: record.cid, value: record.value as Record<string, unknown> };
		} catch {
			return;
		}
	})();

	cache.set(uri, promise);
	return promise;
}

export async function loadDerakkumaProfile(
	did: Did
): Promise<RepoRecord<DerakkumaProfileValue> | undefined> {
	const records = (await listRecords({
		did,
		collection: DERAKKUMA_PROFILE,
		limit: 1
	})) as RepoRecord<DerakkumaProfileValue>[];
	return records[0];
}

export async function loadDerakkumaCircle(
	did: Did
): Promise<RepoRecord<DerakkumaCircleValue> | undefined> {
	const records = (await listRecords({
		did,
		collection: DERAKKUMA_CIRCLE,
		limit: 1
	})) as RepoRecord<DerakkumaCircleValue>[];
	return records[0];
}

export async function loadDerakkumaScores(
	did: Did,
	collection: typeof DERAKKUMA_PLAY | typeof DERAKKUMA_BEST,
	limit = 20
): Promise<EnrichedDerakkumaScore[]> {
	const records = (await listRecords({
		did,
		collection,
		limit
	})) as RepoRecord<DerakkumaScoreValue>[];
	const cache = new Map<string, Promise<RepoRecord | undefined>>();

	return Promise.all(
		records.map(async (record) => {
			const chart = (await resolveRef(record.value.chart, cache)) as
				| RepoRecord<DerakkumaChartValue>
				| undefined;
			const song = (await resolveRef(chart?.value.song, cache)) as
				| RepoRecord<DerakkumaSongValue>
				| undefined;
			const songRepo = song?.uri ? parseUri(song.uri)?.repo : undefined;
			return {
				...record,
				chart,
				song,
				coverArtUrl: songRepo ? blobUrl(songRepo, song?.value.coverArt) : undefined
			};
		})
	);
}

export function scoreTitle(score: EnrichedDerakkumaScore): string {
	return (
		score.song?.value.title ??
		score.chart?.value.songName ??
		score.chart?.value.songId ??
		score.value.songName ??
		score.value.chartSongName ??
		score.value.chartSongId ??
		strongRefUri(score.value.chart) ??
		'Unknown song'
	);
}

export function scoreSubtitle(score: EnrichedDerakkumaScore): string {
	return [
		score.chart?.value.difficulty ?? score.value.chartDifficulty,
		score.chart?.value.level ?? score.value.chartLevel,
		score.value.achievement
	]
		.filter(Boolean)
		.join(' · ');
}

function dxScoreString(score?: DerakkumaDxScoreValue): string | undefined {
	if (!score || (!score.achieved && !score.total)) return;
	return `DX ${score.achieved ?? 0}/${score.total ?? 0}`;
}

export function scoreMeta(score: EnrichedDerakkumaScore): string {
	return [
		score.song?.value.artist,
		score.value.scoreRank?.toUpperCase(),
		score.value.fcStatus?.toUpperCase(),
		score.value.syncStatus?.toUpperCase(),
		dxScoreString(score.value.dxScore),
		score.value.dxStar ? `DX ✦${score.value.dxStar}` : undefined
	]
		.filter(Boolean)
		.join(' · ');
}
