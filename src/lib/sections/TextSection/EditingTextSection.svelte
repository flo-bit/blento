<script lang="ts">
	import { cn } from '@foxui/core';
	import MarkdownTextEditor from '$lib/components/MarkdownTextEditor.svelte';
	import type { EditingSectionContentProps } from '../types';
	import { textAlignClasses, textSizeClasses } from './shared';
	import SectionChrome from '../SectionChrome.svelte';

	let { section, isActive, onlayoutchange, onactivate, onrefchange }: EditingSectionContentProps =
		$props();

	let d = $derived(section.sectionData);
	let containerRef: HTMLDivElement | undefined = $state();
	let hovered = $state(false);

	$effect(() => {
		onrefchange(containerRef);
		return () => onrefchange(undefined);
	});

	$effect(() => {
		const el = containerRef;
		if (!el) return;
		const enter = () => (hovered = true);
		const leave = () => (hovered = false);
		const down = () => onactivate();
		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('pointerdown', down);
		return () => {
			el.removeEventListener('pointerenter', enter);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('pointerdown', down);
		};
	});

	function update(key: string, value: any) {
		section.sectionData = { ...d, [key]: value };
		onlayoutchange();
	}

	const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`;
</script>

<div
	bind:this={containerRef}
	class="@container/grid pointer-events-auto relative col-span-3 px-4 py-10"
>
	<SectionChrome {isActive} {hovered} name={section.name || 'Text'} {icon} />

	<div
		class={cn(
			'prose dark:prose-invert prose-neutral prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 mx-auto max-w-3xl',
			textAlignClasses?.[d.textAlign as string] ?? 'text-left',
			textSizeClasses[(d.textSize ?? 1) as number]
		)}
	>
		<MarkdownTextEditor
			contentDict={d}
			key="text"
			placeholder="Write some text..."
			onupdate={(text) => update('text', text)}
		/>
	</div>
</div>
