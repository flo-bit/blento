<script lang="ts">
	import { margin, mobileMargin } from '$lib';
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { innerWidth } from 'svelte/reactivity/window';

	export type BaseCardProps = {
		item: Item;
		controls?: Snippet<[]>;
		isEditing?: boolean;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item,
		children,
		ref = $bindable(null),
		isEditing = false,
		controls,
		...rest
	}: BaseCardProps = $props();
</script>

<div
	id={item.id}
	data-flip-id={item.id}
	bind:this={ref}
	draggable={isEditing}
	class={[
		'card border-base-200 bg-base-50 group dark:border-base-800 dark:bg-base-900 focus-within:outline-accent-500 absolute z-0 rounded-2xl border outline-offset-2 focus-within:outline-2 @5xl/wrapper:hidden'
	]}
	style={`translate: calc(${(item.mobileX / 4) * 100}cqw + ${mobileMargin}px) calc(${(item.mobileY / 4) * 100}cqw + ${mobileMargin}px); 
                width: calc(${(item.mobileW / 4) * 100}cqw - ${mobileMargin * 2}px);
                height: calc(${(item.mobileH / 4) * 100}cqw - ${mobileMargin * 2}px);`}
	{...rest}
>
	<div class="relative h-full w-full overflow-hidden rounded-[15px]">
		{@render children?.()}
	</div>
	{@render controls?.()}
</div>

<div
	id={item.id}
	data-flip-id={item.id}
	bind:this={ref}
	draggable={isEditing}
	class={[
		'card border-base-200 bg-base-50 group dark:border-base-800 dark:bg-base-900 focus-within:outline-accent-500 absolute z-0 hidden rounded-2xl border outline-offset-2 focus-within:outline-2 @5xl/wrapper:block'
	]}
	style={`translate: calc(${(item.x / 4) * 100}cqw + ${margin}px) calc(${(item.y / 4) * 100}cqw + ${margin}px); 
                width: calc(${(item.w / 4) * 100}cqw - ${margin * 2}px);
                height: calc(${(item.h / 4) * 100}cqw - ${margin * 2}px);`}
	{...rest}
>
	<div class="relative h-full w-full overflow-hidden rounded-[15px]">
		{@render children?.()}
	</div>
	{@render controls?.()}
</div>
