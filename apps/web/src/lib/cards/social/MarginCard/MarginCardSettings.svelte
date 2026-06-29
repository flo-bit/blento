<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { SettingsSection, SettingsToggle } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();
</script>

<SettingsSection title="Show">
	<SettingsToggle
		checked={item.cardData.showBookmarks !== false}
		onCheckedChange={(value) => (item.cardData.showBookmarks = value)}
		label="Bookmarks"
	/>
	<SettingsToggle
		checked={item.cardData.showAnnotations !== false}
		onCheckedChange={(value) => (item.cardData.showAnnotations = value)}
		label="Annotations"
	/>
	<SettingsToggle
		checked={item.cardData.showHighlights !== false}
		onCheckedChange={(value) => (item.cardData.showHighlights = value)}
		label="Highlights"
	/>
</SettingsSection>
