<script lang="ts">
	import { marked, type Renderer } from 'marked';
	import { sanitize } from '$lib/sanitize';
	import { parseContentSegments, getEmbedDefinition } from '$lib/embeds';

	let {
		content,
		renderer
	}: {
		content: string;
		renderer: Renderer;
	} = $props();

	let segments = $derived(parseContentSegments(content));
</script>

{#each segments as segment, i (segment.kind === 'embed' ? `embed-${i}` : `md-${i}`)}
	{#if segment.kind === 'markdown'}
		{@html sanitize(marked.parse(segment.text, { renderer }) as string, {
			ADD_ATTR: ['target']
		})}
	{:else if segment.kind === 'embed'}
		{@const definition = getEmbedDefinition(segment.type)}
		{#if definition}
			<div class="not-prose my-6">
				<definition.component url={segment.url} data={segment.data} />
			</div>
		{/if}
	{/if}
{/each}
