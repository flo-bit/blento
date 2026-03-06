<script lang="ts">
	import { onMount } from 'svelte';
	import { siGithub } from 'simple-icons';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import type { GithubProfileLoadedData } from '.';
	import GithubContributionsGraph from './GithubContributionsGraph.svelte';
	import { Button } from '@foxui/core';
	import { browser } from '$app/environment';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';
	import { fetchGitHubContributions } from './api.remote';

	let { item, isEditing }: ContentComponentProps = $props();

	const githubUrl = $derived(`https://github.com/${item.cardData.user}`);

	const data = getAdditionalUserData();

	// svelte-ignore state_referenced_locally
	let contributionsData = $state(
		(data[item.cardType] as GithubProfileLoadedData)?.[item.cardData.user]
	);

	onMount(async () => {
		if (!contributionsData && item.cardData?.user) {
			try {
				contributionsData = await fetchGitHubContributions(item.cardData.user);
				if (contributionsData) {
					data[item.cardType] ??= {};
					(data[item.cardType] as GithubProfileLoadedData)[item.cardData.user] = contributionsData;
				}
			} catch (error) {
				console.error('Failed to fetch GitHub contributions:', error);
			}
		}
	});
</script>

<div class="github-profile-card h-full overflow-hidden p-4">
	<div class="flex h-full flex-col justify-between">
		<!-- Header -->
		<div class="flex justify-between">
			<div class="flex items-center gap-3">
				<div class="fill-base-950 size-6 shrink-0 dark:fill-white [&_svg]:size-full">
					{@html siGithub.svg}
				</div>
				<a
					href="https://github.com/{item.cardData.user}"
					target="_blank"
					rel="noopener noreferrer"
					class=" flex truncate text-2xl font-bold transition-colors"
				>
					{item.cardData.user}
				</a>
			</div>

			<div class="github-follow z-50">
				<Button
					href="https://github.com/{item.cardData.user}"
					target="_blank"
					rel="noopener noreferrer">Follow</Button
				>
			</div>
		</div>

		{#if contributionsData && browser}
			<div class="flex opacity-100 transition-opacity duration-300 starting:opacity-0">
				<div class="github-graph github-graph-compact">
					<GithubContributionsGraph data={contributionsData} isBig={false} />
				</div>
				<div class="github-graph github-graph-expanded">
					<GithubContributionsGraph data={contributionsData} isBig={true} />
				</div>
			</div>
		{/if}
	</div>
</div>

{#if (item.cardData.href || item.cardData.user) && !isEditing}
	<a
		href={item.cardData.href || githubUrl}
		class="absolute inset-0 h-full w-full"
		target="_blank"
		rel="noopener noreferrer"
		use:qrOverlay={{
			context: {
				title: item.cardData.user,
				icon: siGithub.svg,
				iconColor: siGithub.hex
			}
		}}
	>
		<span class="sr-only">Show on github</span>
	</a>
{/if}

<style>
	.github-follow,
	.github-graph-expanded {
		display: none;
	}

	.github-graph-compact {
		display: flex;
		width: 100%;
	}

	@container card (width >= 18rem) {
		.github-follow {
			display: inline-flex;
		}
	}

	@container card (height >= 12rem) {
		.github-graph-compact {
			display: none;
		}

		.github-graph-expanded {
			display: flex;
			width: 100%;
		}
	}
</style>
