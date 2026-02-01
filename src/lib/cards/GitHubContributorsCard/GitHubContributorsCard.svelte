<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContentComponentProps } from '../types';
	import { getAdditionalUserData, getCanEdit, getIsMobile } from '$lib/website/context';
	import type { GitHubContributor, GitHubContributorsLoadedData } from '.';

	let { item }: ContentComponentProps = $props();

	const isMobile = getIsMobile();
	const canEdit = getCanEdit();
	const additionalData = getAdditionalUserData();

	let owner: string = $derived(item.cardData.owner ?? '');
	let repo: string = $derived(item.cardData.repo ?? '');
	let repoKey: string = $derived(owner && repo ? `${owner}/${repo}` : '');

	let serverContributors: GitHubContributor[] = $derived.by(() => {
		if (!repoKey) return [];
		const data = additionalData[item.cardType] as GitHubContributorsLoadedData | undefined;
		return data?.[repoKey] ?? [];
	});

	let clientContributors: GitHubContributor[] = $state([]);

	let allContributors: GitHubContributor[] = $derived(
		serverContributors.length > 0 ? serverContributors : clientContributors
	);

	let namedContributors: GitHubContributor[] = $derived(
		allContributors.filter((c) => !c.anonymous)
	);

	onMount(() => {
		if (serverContributors.length === 0 && repoKey) {
			loadContributors();
		}
	});

	async function loadContributors() {
		if (!owner || !repo) return;
		try {
			const response = await fetch(
				`/api/github/contributors?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
			);
			if (response.ok) {
				const data = await response.json();
				clientContributors = data;
			}
		} catch (error) {
			console.error('Failed to fetch GitHub contributors:', error);
		}
	}

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	let totalItems = $derived(namedContributors.length);

	const GAP = 6;
	const MIN_SIZE = 16;
	const MAX_SIZE = 80;

	function hexCapacity(size: number, availW: number, availH: number): number {
		const colsWide = Math.floor((availW + GAP) / (size + GAP));
		if (colsWide < 1) return 0;
		const colsNarrow = Math.max(1, colsWide - 1);
		const maxRows = Math.floor((availH + GAP) / (size + GAP));
		let capacity = 0;
		for (let r = 0; r < maxRows; r++) {
			capacity += r % 2 === 0 ? colsWide : colsNarrow;
		}
		return capacity;
	}

	let computedSize = $derived.by(() => {
		if (!containerWidth || !containerHeight || totalItems === 0) return 40;

		let lo = MIN_SIZE;
		let hi = MAX_SIZE;

		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			const availW = containerWidth - mid;
			const availH = containerHeight - mid;
			if (availW <= 0 || availH <= 0) {
				hi = mid - 1;
				continue;
			}
			if (hexCapacity(mid, availW, availH) >= totalItems) {
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		return Math.max(MIN_SIZE, hi);
	});

	let padding = $derived(computedSize / 2);

	let rows = $derived.by(() => {
		const availW = containerWidth - computedSize;
		if (availW <= 0) return [] as GitHubContributor[][];
		const colsWide = Math.floor((availW + GAP) / (computedSize + GAP));
		const colsNarrow = Math.max(1, colsWide - 1);

		const result: GitHubContributor[][] = [];
		let idx = 0;
		let rowNum = 0;
		while (idx < namedContributors.length) {
			const cols = rowNum % 2 === 0 ? colsWide : colsNarrow;
			result.push(namedContributors.slice(idx, idx + cols));
			idx += cols;
			rowNum++;
		}
		return result;
	});

	let textSize = $derived(
		computedSize < 24 ? 'text-[10px]' : computedSize < 40 ? 'text-xs' : 'text-sm'
	);
</script>

<div
	class="flex h-full w-full items-center justify-center overflow-hidden px-2"
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
>
	{#if !owner || !repo}
		{#if canEdit()}
			<span class="text-base-400 dark:text-base-500 accent:text-accent-300 text-sm">
				Enter a repository
			</span>
		{/if}
	{:else if totalItems > 0}
		<div style="padding: {padding}px;">
			<div class="flex flex-col items-center" style="gap: {GAP}px;">
				{#each rows as row, rowIdx (rowIdx)}
					<div class="flex justify-center" style="gap: {GAP}px;">
						{#each row as contributor (contributor.username)}
							<a
								href="https://github.com/{contributor.username}"
								target="_blank"
								rel="noopener noreferrer"
								class="accent:ring-accent-500 block rounded-full ring-2 ring-white transition-transform hover:scale-110 dark:ring-neutral-900"
							>
								{#if contributor.avatarUrl}
									<img
										src={contributor.avatarUrl}
										alt={contributor.username}
										class="rounded-full object-cover"
										style="width: {computedSize}px; height: {computedSize}px;"
									/>
								{:else}
									<div
										class="bg-base-200 dark:bg-base-700 accent:bg-accent-400 flex items-center justify-center rounded-full"
										style="width: {computedSize}px; height: {computedSize}px;"
									>
										<span
											class="text-base-500 dark:text-base-400 accent:text-accent-100 {textSize} font-medium"
										>
											{contributor.username.charAt(0).toUpperCase()}
										</span>
									</div>
								{/if}
							</a>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
