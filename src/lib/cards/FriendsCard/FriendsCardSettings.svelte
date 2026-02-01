<script lang="ts">
	import type { Item } from '$lib/types';
	import type { SettingsComponentProps } from '../types';
	import type { AppBskyActorDefs } from '@atcute/bluesky';
	import HandleInput from '$lib/atproto/UI/HandleInput.svelte';

	let { item = $bindable<Item>() }: SettingsComponentProps = $props();

	let handleValue = $state('');
	let inputRef: HTMLInputElement | null = $state(null);

	function addFriend(actor: AppBskyActorDefs.ProfileViewBasic) {
		if (!item.cardData.friends) item.cardData.friends = [];
		if (item.cardData.friends.includes(actor.did)) return;
		item.cardData.friends = [...item.cardData.friends, actor.did];
		requestAnimationFrame(() => {
			handleValue = '';
			if (inputRef) inputRef.value = '';
		});
	}
</script>

<HandleInput bind:value={handleValue} onselected={addFriend} bind:ref={inputRef} />
