<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input, toast } from '@foxui/core';
	import { matcher } from '.';
	import { SettingsSection, SettingsField, SettingsToggle } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let urlInput = $state(item.cardData.href ?? '');

	function applyUrl() {
		const trimmed = urlInput.trim();
		if (!trimmed) return;
		const id = matcher(trimmed);
		if (!id) {
			toast.error('Invalid YouTube URL');
			return;
		}
		item.cardData.youtubeId = id;
		item.cardData.href = trimmed;
		item.cardData.poster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
	}
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Video">
		<SettingsField label="YouTube URL">
			<Input
				type="url"
				spellcheck={false}
				bind:value={urlInput}
				placeholder="youtube.com/watch?v=…"
				onblur={applyUrl}
				onkeydown={(event) => {
					if (event.code === 'Enter') {
						event.preventDefault();
						applyUrl();
					}
				}}
			/>
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Playback">
		<SettingsToggle
			checked={!item.cardData.showInline}
			onCheckedChange={(value) => (item.cardData.showInline = !value)}
			label="Open fullscreen"
			description="Play in a fullscreen overlay instead of inside the card."
		/>
	</SettingsSection>
</div>
