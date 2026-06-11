<script lang="ts">
	import { Checkbox, Label } from '@foxui/core';

	let {
		checked = $bindable(false),
		label,
		description,
		onCheckedChange
	}: {
		checked?: boolean;
		label: string;
		description?: string;
		onCheckedChange?: (checked: boolean) => void;
	} = $props();

	const id = $props.id();
</script>

<div class="flex items-start gap-2.5">
	<Checkbox
		bind:checked={
			() => checked,
			(value) => {
				checked = value;
				onCheckedChange?.(value);
			}
		}
		{id}
		variant="secondary"
		class="mt-0.5 shrink-0"
	/>
	<div class="flex flex-col gap-0.5">
		<Label for={id} class="cursor-pointer text-sm leading-tight font-medium">
			{label}
		</Label>
		{#if description}
			<p class="text-base-500 dark:text-base-400 text-xs">{description}</p>
		{/if}
	</div>
</div>
