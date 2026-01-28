<script lang="ts">
	import { AppBskyActorDefs } from '@atcute/bluesky';
	import { Combobox } from 'bits-ui';
	import { searchActorsTypeahead } from '$lib/atproto';
	import { Avatar } from '@foxui/core';

	let results: AppBskyActorDefs.ProfileViewBasic[] = $state([]);

	async function search(q: string) {
		if (!q || q.length < 2) {
			results = [];
			return;
		}
		results = (await searchActorsTypeahead(q, 5)).actors;
	}
	let open = $state(false);

	let {
		value = $bindable(),
		onselected,
		ref = $bindable()
	}: {
		value: string;
		onselected: (actor: AppBskyActorDefs.ProfileViewBasic) => void;
		ref?: HTMLInputElement | null;
	} = $props();
</script>

<Combobox.Root
	type="single"
	onOpenChangeComplete={(o) => {
		if (!o) results = [];
	}}
	bind:value={
		() => {
			return value;
		},
		(val) => {
			const profile = results.find((v) => v.handle === val);
			if (profile) onselected?.(profile);

			value = val;
		}
	}
	bind:open={
		() => {
			return open && results.length > 0;
		},
		(val) => {
			open = val;
		}
	}
>
	<Combobox.Input
		bind:ref
		oninput={(e) => {
			value = e.currentTarget.value;
			search(e.currentTarget.value);
		}}
		class="focus-within:outline-accent-600 dark:focus-within:outline-accent-500 dark:placeholder:text-base-400 w-full touch-none rounded-full border-0 bg-white ring-0 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 dark:bg-white/5 dark:outline-white/10"
		placeholder="handle"
		id=""
		aria-label="enter your handle"
	/>
	<Combobox.Content
		class="border-base-300 bg-base-50 dark:bg-base-900 dark:border-base-800 z-100 max-h-[30dvh] w-full rounded-2xl border shadow-lg"
		sideOffset={10}
		align="start"
		side="top"
	>
		<Combobox.Viewport class="w-full p-1">
			{#each results as actor (actor.did)}
				<Combobox.Item
					class="rounded-button data-highlighted:bg-accent-100 dark:data-highlighted:bg-accent-600/30 my-0.5 flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 px-2"
					value={actor.handle}
					label={actor.handle}
				>
					<Avatar
						src={actor.avatar?.replace('avatar', 'avatar_thumbnail')}
						alt=""
						class="size-6 rounded-full"
					/>
					{actor.handle}
				</Combobox.Item>
			{/each}
		</Combobox.Viewport>
	</Combobox.Content>
</Combobox.Root>
