<script lang="ts">
	import { CardDefinitionsByType } from '../..';
	import { type BaseCardProps } from '../BaseCard/BaseCard.svelte';

	let { item, ref = $bindable(null), ...rest }: BaseCardProps = $props();
</script>

{#if CardDefinitionsByType[item.cardType]}
	{@const cardDef = CardDefinitionsByType[item.cardType]}
	<svelte:boundary>
		<cardDef.contentComponent isEditing={false} {item} {...rest} />
		{#snippet failed(error)}
			<div class="text-base-600 dark:text-base-400 m-4 text-xs">
				Failed to render <code>{item.cardType}</code>: {(error as Error)?.message ?? String(error)}
			</div>
		{/snippet}
	</svelte:boundary>
{:else}
	<div class="m-4">Unsupported card type: {item.cardType}</div>
{/if}
