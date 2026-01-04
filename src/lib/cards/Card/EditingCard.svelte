<script lang="ts">
	import type { BaseEditingCardProps } from '../BaseCard/BaseEditingCard.svelte';
	import { CardDefinitionsByType } from '..';
	import BaseCard from '../BaseCard/BaseCard.svelte';

	let { item = $bindable(), ref = $bindable(), ...rest }: BaseEditingCardProps = $props();
</script>

{#if CardDefinitionsByType[item.cardType]}
	{@const cardDef = CardDefinitionsByType[item.cardType]}
	<cardDef.editingCardComponent bind:item bind:ref {...rest} />
{:else}
	<BaseCard {item} {...rest}>
		<div>Unsupported card type: {item.cardType}</div>
	</BaseCard>
{/if}
