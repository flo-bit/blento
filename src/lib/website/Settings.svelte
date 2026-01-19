<script lang="ts">
	import { getDescription, getHideProfileSection, getName } from '$lib/helper';
	import type { WebsiteData } from '$lib/types';
	import { Button, Checkbox, Heading, Input, Label, Modal, Textarea } from '@foxui/core';

	export type Settings = {
		title: string;
	};

	let { open = $bindable(), data = $bindable() }: { open: boolean; data: WebsiteData } = $props();

	let name = $state(getName(data));

	$effect(() => {
		if (!open && name && name !== getName(data)) {
			data.publication ??= {};
			data.publication.name = name;

			data = { ...data };
		}
	});
</script>

<Modal bind:open class="dark:bg-base-900">
	<Heading>Settings</Heading>
	<Label>Name</Label>
	<Input bind:value={name} />
	<Label class="mt-4">Description</Label>
	<Textarea
		rows={5}
		bind:value={
			() => {
				return getDescription(data);
			},
			(value) => {
				data.publication ??= {};
				data.publication.description = value;

				data = { ...data };
			}
		}
	/>

	<div class="flex items-center space-x-2">
		<Checkbox
			bind:checked={
				() => {
					return getHideProfileSection(data);
				},
				(value) => {
					data.publication ??= {};
					data.publication.preferences ??= {};
					data.publication.preferences.hideProfileSection = value;

					data = { ...data };
				}
			}
			id="hide-profile"
			aria-labelledby="hide-profile-label"
			variant="secondary"
		/>
		<Label
			id="hide-profile-label"
			for="hide-profile"
			class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Hide Profile
		</Label>
	</div>

	<div class="flex w-full justify-end space-x-2">
		<Button onclick={() => (open = false)}>Close</Button>
	</div>
</Modal>
