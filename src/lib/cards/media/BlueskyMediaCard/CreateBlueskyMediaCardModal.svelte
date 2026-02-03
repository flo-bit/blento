<script lang="ts">
	import { Button, Input, Label, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../../types';
	import { onMount } from 'svelte';
	import { getDidContext } from '$lib/website/context';
	import { getAuthorFeed } from '$lib/atproto/methods';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let did = getDidContext();

	let mediaList: { fullsize: string; isVideo?: boolean; playlist?: string; thumbnail?: string }[] =
		$state([]);

	let isLoading = $state(true);

	onMount(async () => {
		const authorFeed = await getAuthorFeed({ did });

		for (let post of authorFeed?.feed ?? []) {
			let images =
				post.post.embed?.$type === 'app.bsky.embed.images#view' ? post.post.embed : undefined;

			for (let image of images?.images ?? []) {
				mediaList.push(image);
			}

			if (
				post.post.embed?.$type === 'app.bsky.embed.video#view' &&
				post.post.embed.thumbnail &&
				post.post.embed.playlist
			) {
				mediaList.push({
					...post.post.embed,
					isVideo: true,
					fullsize: ''
				});
			}
		}

		isLoading = false;
	});

	let selected = $state();
</script>

<Modal
	bind:open={
		() => true,
		(change) => {
			if (!change) oncancel();
		}
	}
	closeButton={false}
	class="flex max-h-screen flex-col"
>
	<Subheading>Select an image or video</Subheading>

	<div
		class="bg-base-100 dark:bg-base-950 grid h-[50dvh] grid-cols-2 gap-4 overflow-y-scroll rounded-2xl p-4 lg:grid-cols-3"
	>
		{#each mediaList as media (media.thumbnail || media.playlist)}
			<button
				onclick={() => {
					selected = media;
					if (media.isVideo) {
						item.cardData = {
							video: media
						};
					} else item.cardData.image = media;
				}}
				class="relative cursor-pointer"
			>
				<img
					src={media.fullsize || media.thumbnail}
					alt=""
					class={[
						'h-32 w-full rounded-xl object-cover',
						selected === media
							? 'outline-accent-500 opacity-100 outline-2 -outline-offset-2'
							: 'opacity-80'
					]}
				/>
				{#if media.isVideo}
					<div class="absolute inset-0 inline-flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="text-accent-500 size-6"
						>
							<path
								d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z"
							/>
						</svg>
					</div>
				{/if}
			</button>
		{/each}
		{#if isLoading}
			<span class="col-span-full p-4 text-lg italic">Loading your media...</span>
		{:else if mediaList.length === 0}
			<span class="col-span-full p-4 text-lg italic"
				>No media found, upload an image or video to bluesky to see it here.</span
			>
		{/if}
	</div>

	<Label class="mt-4">Link (optional):</Label>
	<Input bind:value={item.cardData.href} />

	<div class="mt-4 flex justify-end gap-2">
		<Button
			onclick={() => {
				oncancel();
			}}
			variant="ghost">Cancel</Button
		>
		<Button
			disabled={!selected}
			onclick={async () => {
				oncreate();
			}}>Create</Button
		>
	</div>
</Modal>
