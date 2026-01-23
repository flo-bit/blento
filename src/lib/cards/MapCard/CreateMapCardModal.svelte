<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isFetchingLocation = $state(false);

	let errorMessage = $state('');

	let search = $state('');

	async function fetchLocation() {
		errorMessage = '';
		isFetchingLocation = true;

		try {
			const response = await fetch('/api/geocoding?q=' + encodeURIComponent(search));
			if (response.ok) {
				const data = await response.json();

				if (!data.lat || !data.lon) throw new Error('lat or lon not found');

				item.cardData.lat = data.lat;
				item.cardData.lon = data.lon;
			} else {
				throw new Error('response not ok');
			}
		} catch {
			errorMessage = "Couldn't find that location!";
			return false;
		} finally {
			isFetchingLocation = false;
		}
		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter a city and country</Subheading>
	<Input bind:value={search} />

	{#if errorMessage}
		<Alert type="error" title="Failed to create map card"><span>{errorMessage}</span></Alert>
	{/if}

	<p class="text-xs">
		Geocoding by <a
			href="https://nominatim.openstreetmap.org/"
			class="text-accent-800 dark:text-accent-300"
			target="_blank">Nominatim</a
		>
		/ ©
		<a
			href="https://www.openstreetmap.org/copyright"
			class="text-accent-800 dark:text-accent-300"
			target="_blank">OpenStreetMap contributors</a
		>
	</p>

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			disabled={isFetchingLocation}
			onclick={async () => {
				if (await fetchLocation()) oncreate();
			}}>{isFetchingLocation ? 'Creating...' : 'Create'}</Button
		>
	</div>
</Modal>
