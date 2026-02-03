<script lang="ts">
	import { Button, Input, Modal, Subheading } from '@foxui/core';
	import { env } from '$env/dynamic/public';
	import PoweredByGiphy from './PoweredByGiphy.gif';

	type GiphyGif = {
		id: string;
		title: string;
		images: {
			fixed_height: { url: string; mp4: string; width: string; height: string };
			original: { mp4: string };
		};
	};

	let {
		open = $bindable(false),
		onselect,
		oncancel
	}: {
		open: boolean;
		onselect: (gif: GiphyGif) => void;
		oncancel: () => void;
	} = $props();

	let searchQuery = $state('');
	let searchResults = $state<GiphyGif[]>([]);
	let trendingResults = $state<GiphyGif[]>([]);
	let isLoading = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Split results into 4 columns for masonry layout
	let columns = $derived(() => {
		const results = searchQuery.trim() ? searchResults : trendingResults;
		const cols: [GiphyGif[], GiphyGif[], GiphyGif[], GiphyGif[]] = [[], [], [], []];
		results.forEach((gif, i) => {
			cols[i % 4].push(gif);
		});
		return cols;
	});

	let displayResults = $derived(searchQuery.trim() ? searchResults : trendingResults);

	async function fetchTrending() {
		if (trendingResults.length > 0) return;

		isLoading = true;
		try {
			const url = new URL('https://api.giphy.com/v1/gifs/trending');
			url.searchParams.set('api_key', env.PUBLIC_GIPHY_API_TOKEN);
			url.searchParams.set('limit', '24');
			url.searchParams.set('rating', 'g');

			const response = await fetch(url.toString());
			if (response.ok) {
				const data = await response.json();
				trendingResults = data.data || [];
			}
		} catch (error) {
			console.error('Failed to fetch trending:', error);
		} finally {
			isLoading = false;
		}
	}

	async function searchGiphy(query: string) {
		if (!query.trim()) {
			searchResults = [];
			return;
		}

		isLoading = true;
		try {
			const url = new URL('https://api.giphy.com/v1/gifs/search');
			url.searchParams.set('api_key', env.PUBLIC_GIPHY_API_TOKEN);
			url.searchParams.set('q', query);
			url.searchParams.set('limit', '24');
			url.searchParams.set('rating', 'g');
			url.searchParams.set('lang', 'en');

			const response = await fetch(url.toString());
			if (response.ok) {
				const data = await response.json();
				searchResults = data.data || [];
			}
		} catch (error) {
			console.error('Failed to search Giphy:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleSearchInput() {
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchGiphy(searchQuery);
		}, 300);
	}

	function selectGif(gif: GiphyGif) {
		onselect(gif);
		resetState();
	}

	function handleCancel() {
		oncancel();
		resetState();
	}

	function resetState() {
		searchQuery = '';
		searchResults = [];
	}

	$effect(() => {
		if (open) {
			fetchTrending();
		}
	});
</script>

<Modal
	bind:open
	onOpenChange={(isOpen) => !isOpen && handleCancel()}
	closeButton={true}
	class="flex h-[80dvh] max-w-4xl flex-col"
>
	<Subheading>{searchQuery.trim() ? 'Search GIPHY' : 'Trending GIFs'}</Subheading>

	<Input
		bind:value={searchQuery}
		oninput={handleSearchInput}
		placeholder="Search for GIFs..."
		class="w-full"
	/>

	<div class="mt-4 flex-1 overflow-y-auto">
		{#if isLoading && displayResults.length === 0}
			<div class="flex h-75 items-center justify-center">
				<p class="text-base-500">Loading...</p>
			</div>
		{:else if displayResults.length > 0}
			<div class="flex items-start gap-3">
				{#each columns() as column, i (i)}
					<div class="flex w-1/4 flex-col gap-3">
						{#each column as gif (gif.id)}
							<button
								onclick={() => selectGif(gif)}
								aria-label={gif.title}
								class="focus:ring-accent-500 block shrink-0 overflow-hidden rounded-xl transition-transform hover:scale-[1.02] focus:ring-2 focus:outline-none"
							>
								<video
									src={gif.images.fixed_height.mp4}
									autoplay
									loop
									muted
									playsinline
									class="bg-base-200 dark:bg-base-800 block w-full"
									style="aspect-ratio: {gif.images.fixed_height.width} / {gif.images.fixed_height
										.height}"
								></video>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{:else if searchQuery}
			<div class="flex h-75 items-center justify-center">
				<p class="text-base-500">No results found</p>
			</div>
		{/if}
	</div>

	<div class="mt-4 flex items-center justify-between">
		<img src={PoweredByGiphy} alt="Powered by GIPHY" class="h-7 rounded-md" />
		<Button onclick={handleCancel} variant="ghost">Cancel</Button>
	</div>
</Modal>
