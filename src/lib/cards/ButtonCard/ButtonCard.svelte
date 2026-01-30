<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { cn } from '@foxui/core';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();
</script>

{#snippet content()}
	<span
		class={cn(
			'text-base-950 dark:text-base-50 line-clamp-1 inline-flex items-center justify-center px-4 text-2xl font-semibold',
			item.color === 'transparent'
				? 'bg-accent-400 dark:bg-accent-500 hover:bg-accent-400 dark:text-base-950 rounded-2xl px-5 py-2.5 text-xl transition-colors duration-100'
				: ''
		)}
	>
		{item.cardData.text || 'Click me'}
	</span>
{/snippet}

{#if item.cardData.href === '#login'}
	<button
		onclick={() => {
			if (user.isLoggedIn && user.profile) {
				goto('/' + getHandleOrDid(user.profile) + '/edit', {});
			} else {
				loginModalState.show();
			}
		}}
		class={[
			'flex h-full w-full cursor-pointer flex-col items-center justify-center transition-colors duration-100',
			item.color === 'transparent' ? 'hover:bg-transparent' : 'hover:bg-accent-100/20'
		]}
	>
		{@render content()}
	</button>
{:else}
	<a
		href={item.cardData.href || '#'}
		target="_blank"
		rel="noopener noreferrer"
		class={[
			'flex h-full w-full flex-col items-center justify-center transition-colors duration-100',
			item.color === 'transparent' ? 'hover:bg-transparent' : 'hover:bg-accent-100/20'
		]}
	>
		{@render content()}
	</a>
{/if}
