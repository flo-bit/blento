<script lang="ts">
	import { getDidContext } from '$lib/website/context';
	import type { ContentComponentProps } from '../types';
	import { getImage } from '$lib/helper';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();

	const did = getDidContext();
</script>

{#key getImage(item.cardData, did, 'image')}
	<img
		class={[
			'absolute inset-0 h-full w-full object-cover opacity-100 transition-transform duration-300 ease-in-out',
			item.cardData.href ? 'group-hover/card:scale-101' : ''
		]}
		src={getImage(item.cardData, did, 'image')}
		alt=""
	/>
{/key}
{#if item.cardData.href && !isEditing}
	<a
		href={item.cardData.href}
		class="absolute inset-0 z-50 h-full w-full"
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
