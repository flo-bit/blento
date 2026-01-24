<script lang="ts">
	import { CardDefinitionsByType } from '..';
	import type { ContentComponentProps } from '../types';

	let { item = $bindable() }: ContentComponentProps = $props();
</script>

{#if CardDefinitionsByType[item.cardType]}
	{@const cardDef = CardDefinitionsByType[item.cardType]}
	{#if cardDef.editingContentComponent}
		<cardDef.editingContentComponent bind:item isEditing />
	{:else}
		<cardDef.contentComponent bind:item isEditing />
	{/if}
{:else}
	<div class="m-4">Unsupported card type: {item.cardType}</div>
{/if}
