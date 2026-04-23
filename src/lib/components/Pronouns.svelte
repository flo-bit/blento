<script lang="ts">
	import type { WebsiteData, PronounSet } from '$lib/types';
	import { Badge, Button, Input, Switch, Label } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';

	let {
		data = $bindable(),
		editing = false
	}: {
		data: WebsiteData;
		editing?: boolean;
	} = $props();

	let modalOpen = $state(false);
	let editSets: PronounSet[] = $state([]);
	let editDisplayMode: 'all' | 'firstOnly' = $state('all');

	function openModal() {
		if (data.pronounsRecord?.value?.sets?.length) {
			editSets = JSON.parse(JSON.stringify(data.pronounsRecord.value.sets));
			editDisplayMode = data.pronounsRecord.value.displayMode === 'firstOnly' ? 'firstOnly' : 'all';
		} else {
			editSets = [{ forms: [''] }];
			editDisplayMode = 'all';
		}
		modalOpen = true;
	}

	function save() {
		const validSets = editSets.filter((set) => set.forms.some((form) => form.length > 0));
		if (validSets.length > 0) {
			data.pronounsRecord = {
				value: {
					sets: validSets,
					displayMode: editDisplayMode
				}
			};
		} else {
			data.pronounsRecord = undefined;
		}
		data = { ...data };
		modalOpen = false;
	}

	function addSet() {
		editSets = [...editSets, { forms: [''] }];
	}

	function removeSet(index: number) {
		editSets = editSets.filter((_, i) => i !== index);
	}

	function updateSetInput(index: number, value: string) {
		editSets[index] = { forms: value.split('/').map((s) => s.trim()) };
	}

	let allSets = $derived(data.pronounsRecord?.value?.sets ?? []);
	let sets = $derived(
		data.pronounsRecord?.value?.displayMode === 'firstOnly' ? allSets.slice(0, 1) : allSets
	);
</script>

{#if sets.length}
	<div class="flex flex-wrap items-center gap-1">
		{#each sets as set, i (i)}
			<Badge>{set.forms.join('/')}</Badge>
		{/each}
		{#if editing}
			<button
				type="button"
				class="text-base-400 hover:text-base-600 dark:text-base-500 dark:hover:text-base-300 cursor-pointer p-1 transition-colors"
				onclick={openModal}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-3.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
					/>
				</svg>
				<span class="sr-only">Edit pronouns</span>
			</button>
		{/if}
	</div>
{:else if editing}
	<Button size="sm" variant="secondary" onclick={openModal} class="w-fit">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="size-3"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
			/>
		</svg>
		add pronouns
	</Button>
{/if}

{#if editing}
	<Modal open={modalOpen} onOpenChange={(v) => (modalOpen = v)} closeButton>
		<div class="flex flex-col gap-4">
			<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Edit pronouns</h3>

			<div class="flex flex-col gap-2">
				{#each editSets as set, i (i)}
					<div class="flex items-center gap-2">
						<Input
							value={set.forms.join('/')}
							oninput={(e) => updateSetInput(i, e.currentTarget.value)}
							placeholder="e.g. she/her"
							variant="secondary"
							sizeVariant="sm"
							class="grow"
						/>
						{#if editSets.length > 1}
							<Button size="iconSm" variant="ghost" onclick={() => removeSet(i)}>&times;</Button>
						{/if}
					</div>
				{/each}
			</div>

			{#if editSets.length < 10}
				<Button
					size="sm"
					variant="secondary"
					onclick={addSet}
					disabled={!editSets.at(-1)?.forms.some((f) => f.length > 0)}
					class="w-fit"
				>
					+ add more pronouns
				</Button>
			{/if}

			{#if editSets.length > 1}
				<div class="flex items-center gap-1.5">
					<Switch
						id="pronouns-display-mode"
						checked={editDisplayMode === 'firstOnly'}
						onCheckedChange={(checked) => {
							editDisplayMode = checked ? 'firstOnly' : 'all';
						}}
					/>
					<Label for="pronouns-display-mode">show first only</Label>
				</div>
			{/if}

			<div class="flex justify-end gap-2">
				<Button variant="secondary" onclick={() => (modalOpen = false)}>Cancel</Button>
				<Button onclick={save}>Save</Button>
			</div>
		</div>
	</Modal>
{/if}
