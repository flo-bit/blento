<script lang="ts">
	import { marked } from 'marked';
	import { sanitize } from '$lib/sanitize';
	import type { ContentComponentProps } from '../../types';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '../TextCard';
	import { cn } from '@foxui/core';
	import { getColor } from '../../index';

	let { item }: ContentComponentProps = $props();

	let flipped = $state(false);

	const colors: Record<string, string> = {
		base: 'bg-base-200/50 dark:bg-base-950/50',
		accent: 'bg-accent-400 dark:bg-accent-500 accent',
		transparent: 'bg-base-200/50 dark:bg-base-950/50'
	};

	let color = $derived(getColor(item));

	let colorClasses = $derived.by(() => {
		const bgClasses = colors[color] ?? colors.accent;
		const colorName =
			color !== 'accent' && color !== 'base' && color !== 'transparent' ? color : '';
		const lightClass = color !== 'base' && color !== 'transparent' ? 'light' : '';
		return cn(bgClasses, colorName, lightClass);
	});

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title ?? ''}">${text}</a>`;

	const proseClasses =
		'prose dark:prose-invert prose-neutral prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:first:mt-0 prose-headings:last:mb-0 inline-flex h-full min-h-full w-full max-w-none overflow-x-hidden overflow-y-scroll rounded-md px-6 py-4 text-lg';
</script>

<div
	class="h-full w-full cursor-pointer perspective-[1000px]"
	role="button"
	tabindex="0"
	onclick={() => (flipped = !flipped)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			flipped = !flipped;
		}
	}}
>
	<div
		class={cn(
			'relative h-full w-full [transition:transform_0.6s] transform-3d',
			flipped && 'transform-[rotateY(180deg)]'
		)}
	>
		<!-- Front -->
		<div
			class={cn(
				'text-base-900 dark:text-base-50 absolute inset-0 rounded-[23px] backface-hidden',
				colorClasses
			)}
		>
			<div
				class={cn(
					proseClasses,
					textAlignClasses?.[item.cardData.textAlign as string],
					verticalAlignClasses[item.cardData.verticalAlign as string],
					textSizeClasses[(item.cardData.textSize ?? 0) as number]
				)}
			>
				<span
					>{@html sanitize(marked.parse(item.cardData.frontText ?? '', { renderer }) as string, {
						ADD_ATTR: ['target']
					})}</span
				>
			</div>
		</div>

		<!-- Back -->
		<div
			class={cn(
				'text-base-900 dark:text-base-50 absolute inset-0 transform-[rotateY(180deg)] rounded-[23px] backface-hidden',
				colorClasses
			)}
		>
			<div
				class={cn(
					proseClasses,
					textAlignClasses?.[item.cardData.textAlign as string],
					verticalAlignClasses[item.cardData.verticalAlign as string],
					textSizeClasses[(item.cardData.textSize ?? 0) as number]
				)}
			>
				<span
					>{@html sanitize(marked.parse(item.cardData.backText ?? '', { renderer }) as string, {
						ADD_ATTR: ['target']
					})}</span
				>
			</div>
		</div>
	</div>
</div>
