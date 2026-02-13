<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Checkbox, Label } from '@foxui/core';

	let { item }: SettingsComponentProps = $props();
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center space-x-2">
		<Checkbox
			bind:checked={
				() => item.cardData.showBookmarks !== false, (val) => (item.cardData.showBookmarks = val)
			}
			id="show-bookmarks"
			aria-labelledby="show-bookmarks-label"
			variant="secondary"
		/>
		<Label
			id="show-bookmarks-label"
			for="show-bookmarks"
			class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Bookmarks
		</Label>
	</div>

	<div class="flex items-center space-x-2">
		<Checkbox
			bind:checked={
				() => item.cardData.showAnnotations !== false,
				(val) => (item.cardData.showAnnotations = val)
			}
			id="show-annotations"
			aria-labelledby="show-annotations-label"
			variant="secondary"
		/>
		<Label
			id="show-annotations-label"
			for="show-annotations"
			class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Annotations
		</Label>
	</div>

	<div class="flex items-center space-x-2">
		<Checkbox
			bind:checked={
				() => item.cardData.showHighlights !== false, (val) => (item.cardData.showHighlights = val)
			}
			id="show-highlights"
			aria-labelledby="show-highlights-label"
			variant="secondary"
		/>
		<Label
			id="show-highlights-label"
			for="show-highlights"
			class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Highlights
		</Label>
	</div>
</div>
