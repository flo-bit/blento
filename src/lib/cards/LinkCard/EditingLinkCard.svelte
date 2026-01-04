<script lang="ts">
	import { getIsMobile } from '$lib/helper';
	import BaseEditingCard, { type BaseEditingCardProps } from '../BaseCard/BaseEditingCard.svelte';
	import { innerWidth } from 'svelte/reactivity/window';

	let { item = $bindable(), ...rest }: BaseEditingCardProps = $props();

	let isFetchingMetadata = $state(false);

	let isMobile = getIsMobile();

	$effect(() => {
		const fetchMetadata = async () => {
			if (!item.cardData.href) return;
			if (isFetchingMetadata) return;

			isFetchingMetadata = true;

			item.cardData.domain = new URL(item.cardData.href).hostname;

			try {
				const response = await fetch('/api/links?link=' + encodeURIComponent(item.cardData.href));
				if (response.ok) {
					const data = await response.json();
					item.cardData.description = data.description || '';
					item.cardData.title = data.title || '';
					item.cardData.image = data.images?.[0] || '';
					item.cardData.favicon = data.favicons?.[0] || '';
				}
			} catch (error) {
				console.error('Error fetching metadata:', error);
			} finally {
				isFetchingMetadata = false;
			}
		};

		fetchMetadata();
	});
</script>

<BaseEditingCard {item} {...rest}>
	<div class="flex h-full flex-col justify-between p-4">
		<div>
			<img class="mb-2 size-8 rounded-lg object-cover" src={item.cardData.favicon} alt="" />
			<div class="text-base-900 dark:text-base-50 text-lg font-semibold">{item.cardData.title}</div>
			<!-- <div class="text-base-800 dark:text-base-100 mt-2 text-xs">{item.cardData.description}</div> -->
			<div class="text-accent-600 dark:text-accent-400 mt-2 text-xs font-light">
				{item.cardData.domain}
			</div>
		</div>

		{#if ((isMobile() && item.mobileH >= 4) || (!isMobile() && item.h >= 2)) && item.cardData.image}
			<img class=" mb-2 max-h-32 w-full rounded-xl object-cover" src={item.cardData.image} alt="" />
		{/if}
		<!-- {#key item.cardData.image}
		<img
			class={[
				'absolute inset-0 h-full w-full object-cover opacity-100 transition-transform duration-300 ease-in-out',
				item.cardData.href ? 'group-hover:scale-105' : ''
			]}
			src={item.cardData.image}
			alt=""
		/>
	{/key} -->
		{#if item.cardData.href}
			<a
				href={item.cardData.href}
				class="absolute inset-0 h-full w-full"
				target="_blank"
				rel="noopener noreferrer"
			>
				<span class="sr-only">
					{item.cardData.hrefText ?? 'Learn more'}
				</span>
			</a>
		{/if}
	</div>
</BaseEditingCard>
