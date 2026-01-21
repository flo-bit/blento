<script lang="ts">
	import type { Item } from '$lib/types';
	import type { SettingsComponentProps } from '../types';
	import { Input, Label } from '@foxui/core';

	let { item = $bindable<Item>() }: SettingsComponentProps = $props();

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !file.type.startsWith('image/gif')) return;

		const objectUrl = URL.createObjectURL(file);
		item.cardData.objectUrl = objectUrl;
		item.cardData.blob = file;
		item.cardData.url = '';
	}
</script>

<div class="flex flex-col gap-3">
	<div>
		<Label class="mb-1 text-xs">GIF URL</Label>
		<Input
			bind:value={item.cardData.url}
			placeholder="https://media.giphy.com/..."
			class="w-full"
		/>
	</div>

	<div>
		<Label class="mb-1 text-xs">Or upload a GIF</Label>
		<input
			type="file"
			accept="image/gif"
			onchange={handleFileSelect}
			class="w-full rounded border border-base-300 bg-base-100 px-2 py-1 text-sm dark:border-base-700 dark:bg-base-800"
		/>
	</div>

	<div>
		<Label class="mb-1 text-xs">Alt text</Label>
		<Input bind:value={item.cardData.alt} placeholder="Description" class="w-full" />
	</div>
</div>
