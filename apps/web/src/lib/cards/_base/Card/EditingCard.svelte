<script lang="ts">
	import { CardDefinitionsByType } from '../..';
	import type { ContentComponentProps } from '../../types';

	let { item = $bindable() }: ContentComponentProps = $props();
</script>

{#if CardDefinitionsByType[item.cardType]}
	{@const cardDef = CardDefinitionsByType[item.cardType]}
	<svelte:boundary>
		{#if cardDef.editingContentComponent}
			<cardDef.editingContentComponent bind:item isEditing />
		{:else}
			<cardDef.contentComponent bind:item isEditing />
		{/if}
		{#snippet failed(error)}
			<div class="text-base-600 dark:text-base-400 m-4 text-xs">
				Failed to render <code>{item.cardType}</code>: {(error as Error)?.message ?? String(error)}
			</div>
		{/snippet}
	</svelte:boundary>
{:else}
	<div class="m-4">Unsupported card type: {item.cardType}</div>
{/if}
