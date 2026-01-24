<script lang="ts">
	import { CardDefinitionsByType } from '..';
	import { type BaseCardProps } from '../BaseCard/BaseCard.svelte';

	let { item, ref = $bindable(null), ...rest }: BaseCardProps = $props();
</script>

{#if CardDefinitionsByType[item.cardType]}
	{@const cardDef = CardDefinitionsByType[item.cardType]}
	<cardDef.contentComponent isEditing={false} {item} {...rest} />
{:else}
	<div class="m-4">Unsupported card type: {item.cardType}</div>
{/if}
