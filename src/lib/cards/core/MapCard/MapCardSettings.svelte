<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Button, Input, toast } from '@foxui/core';
	import { getZoomLevel } from '.';
	import { SettingsSection, SettingsField, SettingsToggle } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let search = $state(item.cardData.name ?? '');
	let isFetching = $state(false);

	async function updateLocation() {
		if (!search.trim()) return;
		isFetching = true;
		try {
			const response = await fetch('/api/geocoding?q=' + encodeURIComponent(search));
			if (!response.ok) throw new Error();
			const data = await response.json();
			if (!data.lat || !data.lon) throw new Error();

			item.cardData.lat = data.lat;
			item.cardData.lon = data.lon;
			item.cardData.name = data.display_name?.split(',')[0] || search;
			item.cardData.type = data.class || 'city';
			item.cardData.zoom = Math.max(getZoomLevel(data.class), getZoomLevel(data.type));
			toast.success('Location updated');
		} catch {
			toast.error("Couldn't find that location!");
		} finally {
			isFetching = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<SettingsSection
		title="Location"
		description={item.cardData.name ? `Currently showing ${item.cardData.name}` : undefined}
	>
		<SettingsField label="Search address or city">
			<Input
				bind:value={search}
				class="w-full"
				placeholder="Paris, France"
				onkeydown={(event) => {
					if (event.code === 'Enter') {
						event.preventDefault();
						updateLocation();
					}
				}}
			/>
		</SettingsField>
		<Button
			size="sm"
			class="self-start"
			disabled={isFetching || !search.trim()}
			onclick={updateLocation}
		>
			{isFetching ? 'Updating…' : 'Update'}
		</Button>
	</SettingsSection>

	<SettingsSection title="Options">
		<SettingsToggle
			checked={Boolean(item.cardData.linkToGoogleMaps)}
			onCheckedChange={(value) => (item.cardData.linkToGoogleMaps = value)}
			label="Link to Google Maps"
			description="Open the location in Google Maps when the card is clicked."
		/>
	</SettingsSection>
</div>
