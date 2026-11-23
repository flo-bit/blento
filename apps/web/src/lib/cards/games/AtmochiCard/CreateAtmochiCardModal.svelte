<script lang="ts">
	import { Button, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import {
		getAdditionalUserData,
		getDidContext,
		getHandleContext
	} from '$lib/website/data/context';
	import { onMount } from 'svelte';
	import { CardDefinitionsByType } from '../..';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	let missing = $state(false);

	// only ask when there is no published tile yet
	onMount(() => {
		let alive = true;
		(async () => {
			const pet = await CardDefinitionsByType[item.cardType]?.loadData?.([item], { did, handle });
			if (!alive) return;
			data[item.cardType] = pet;
			if (pet) oncreate();
			else missing = true;
		})();
		return () => {
			alive = false;
		};
	});
</script>

<Modal
	bind:open={
		() => missing,
		(v) => {
			if (!v) oncancel();
		}
	}
	closeButton={false}
>
	<Subheading>Publish your Atmochi's Web Tile first</Subheading>
	<p class="text-base-600 dark:text-base-300 text-sm">
		This card shows the Web Tile your pet publishes from atmochi.pet, and you don't have one yet.
	</p>
	<ol class="text-base-600 dark:text-base-300 list-decimal space-y-1 pl-4 text-sm">
		<li>Sign in at atmochi.pet and open "Share your room".</li>
		<li>Under "Share as a Web Tile", click "Publish my tile".</li>
		<li>Approve the extra permission, then add this card again.</li>
	</ol>

	<div class="mt-4 flex flex-wrap justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button onclick={oncreate} variant="secondary">Add anyway</Button>
		<Button href="https://atmochi.pet" target="_blank" rel="noopener noreferrer">
			Open atmochi.pet
		</Button>
	</div>
</Modal>
