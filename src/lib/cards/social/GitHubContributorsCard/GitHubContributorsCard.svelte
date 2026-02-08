<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContentComponentProps } from '../../types';
	import { getAdditionalUserData, getCanEdit } from '$lib/website/context';
	import type { GitHubContributor, GitHubContributorsLoadedData } from '.';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { fetchGitHubContributors } from './api.remote';

	let { item }: ContentComponentProps = $props();

	const canEdit = getCanEdit();
	const additionalData = getAdditionalUserData();

	let owner: string = $derived(item.cardData.owner ?? '');
	let repo: string = $derived(item.cardData.repo ?? '');
	let repoKey: string = $derived(owner && repo ? `${owner}/${repo}` : '');
	let layout: 'grid' | 'cinema' = $derived(item.cardData.layout ?? 'grid');
	let shape: 'square' | 'circle' = $derived(item.cardData.shape ?? 'square');

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
			const data = await fetchGitHubContributors({ owner, repo });
			if (data) clientContributors = data;
		} catch (error) {
			console.error('Failed to fetch GitHub contributors:', error);
		}
	}

	let gridItems = $derived(
		namedContributors.map((c) => ({
			imageUrl: c.avatarUrl,
			link: `https://github.com/${c.username}`,
			label: c.username
		}))
	);
</script>

{#if !owner || !repo}
	{#if canEdit()}
		<div class="flex h-full w-full items-center justify-center">
			<span class="text-base-400 dark:text-base-500 accent:text-accent-300 text-sm">
				Enter a repository
			</span>
		</div>
	{/if}
{:else}
	<ImageGrid items={gridItems} {layout} {shape} tooltip />
{/if}
