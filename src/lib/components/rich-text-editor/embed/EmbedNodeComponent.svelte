<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import { NodeViewWrapper } from 'svelte-tiptap';
	import { getEmbedDefinition } from '$lib/embeds';

	let props: NodeViewProps = $props();

	let url = $derived(props.node.attrs.url as string);
	let embedType = $derived(props.node.attrs.embedType as string);
	let embedData = $derived.by(() => {
		try {
			return JSON.parse(props.node.attrs.embedData || '{}');
		} catch {
			return {};
		}
	});

	let definition = $derived(getEmbedDefinition(embedType));
</script>

<NodeViewWrapper data-type="embed" class="my-4">
	{#if definition}
		<div class="not-prose group relative">
			<definition.component {url} data={embedData} />
			{#if props.editor.isEditable}
				<div class="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						onclick={() => props.deleteNode()}
						class="rounded-lg bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
						title="Remove embed"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="size-4"
						>
							<path
								fill-rule="evenodd"
								d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="bg-base-100 dark:bg-base-800 text-base-500 rounded-xl p-4 text-sm">
			Unsupported embed: <a href={url} target="_blank" rel="noopener noreferrer" class="underline"
				>{url}</a
			>
		</div>
	{/if}
</NodeViewWrapper>
