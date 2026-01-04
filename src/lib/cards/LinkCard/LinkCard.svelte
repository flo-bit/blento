<script lang="ts">
	import { getIsMobile } from '$lib/helper';
	import BaseCard, { type BaseCardProps } from '../BaseCard/BaseCard.svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	let { item, ...rest }: BaseCardProps = $props();

	let isMobile = getIsMobile();
</script>

<BaseCard {item} {...rest}>
	<div class="flex h-full flex-col justify-between p-4">
		<div>
			{#if item.cardData.favicon}
				<img class="mb-2 size-8 rounded-lg object-cover" src={item.cardData.favicon} alt="" />
			{/if}
			<div class="text-base-900 dark:text-base-50 text-lg font-semibold">{item.cardData.title}</div>
			<!-- <div class="text-base-800 dark:text-base-100 mt-2 text-xs">{item.cardData.description}</div> -->
			<div class="text-accent-600 dark:text-accent-400 mt-2 text-xs font-light">
				{item.cardData.domain}
			</div>
		</div>

		{#if ((isMobile() && item.mobileH >= 4) || (!isMobile() && item.h >= 2)) && item.cardData.image}
			<img class=" mb-2 max-h-32 w-full rounded-xl object-cover" src={item.cardData.image} alt="" />
		{/if}
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

				<div
					class="bg-base-800/30 border-base-900/30 absolute top-2 right-2 rounded-full border p-1 text-white opacity-50 backdrop-blur-lg group-focus-within:opacity-100 group-hover:opacity-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2.5"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
						/>
					</svg>
				</div>
			</a>
		{/if}
	</div>
</BaseCard>
