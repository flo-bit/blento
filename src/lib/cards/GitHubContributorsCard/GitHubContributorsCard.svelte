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
				clientContributors = [
					...data,
					...data.map((v) => {
						return { ...v, username: v.username + '1' };
					})
				];
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

	let computedSize = $derived.by(() => {
		if (!containerWidth || !containerHeight || totalItems === 0) return 40;

		let lo = MIN_SIZE;
		let hi = MAX_SIZE;

		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			// Reserve ~1 avatar of padding on each side
			const availW = containerWidth - mid * 2;
			const availH = containerHeight - mid * 2;
			if (availW <= 0 || availH <= 0) {
				hi = mid - 1;
				continue;
			}
			const cols = Math.floor((availW + GAP) / (mid + GAP));
			const rows = Math.floor((availH + GAP) / (mid + GAP));
			if (cols > 0 && rows > 0 && cols * rows >= totalItems) {
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		return Math.max(MIN_SIZE, hi);
	});

	let padding = $derived(computedSize / 2);

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
			<div class="flex flex-wrap items-center justify-center" style="gap: {GAP}px;">
				{#each namedContributors as contributor (contributor.username)}
					<div class="relative">
						<a
							href="https://github.com/{contributor.username}"
							target="_blank"
							rel="noopener noreferrer"
							class="accent:ring-accent-500 relative block rounded-full ring-2 ring-white transition-transform hover:scale-110 dark:ring-neutral-900"
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
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
