<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import { cn } from '@foxui/core';
	import { getDidContext } from '$lib/website/context';
	import { SvelteMap } from 'svelte/reactivity';

	let { item = $bindable() }: ContentComponentProps = $props();

	const did = getDidContext();

	type Sound = {
		name: string;
		url?: string;
		blob?: {
			$type: 'blob';
			ref: { $link: string };
			mimeType: string;
		};
		pendingBlob?: Blob;
		objectUrl?: string;
	};

	let sounds = $derived<Sound[]>(item.cardData?.sounds ?? []);

	let playingIndex = $state<number | null>(null);
	let preloadedAudio = new SvelteMap<number, HTMLAudioElement>();

	function getSoundUrl(sound: Sound): string {
		if (sound.objectUrl) return sound.objectUrl;
		if (sound.url) return sound.url;
		if (sound.blob && did) {
			return `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${sound.blob.ref.$link}`;
		}
		return '';
	}

	function preloadSounds() {
		preloadedAudio.clear();
		sounds.forEach((sound, index) => {
			const url = getSoundUrl(sound);
			if (url) {
				const audio = new Audio(url);
				audio.preload = 'auto';
				audio.onended = () => {
					if (playingIndex === index) {
						playingIndex = null;
					}
				};
				preloadedAudio.set(index, audio);
			}
		});
	}

	$effect(() => {
		preloadSounds();
	});

	function playSound(index: number) {
		// Stop currently playing sound
		if (playingIndex !== null) {
			const currentAudio = preloadedAudio.get(playingIndex);
			if (currentAudio) {
				currentAudio.pause();
				currentAudio.currentTime = 0;
			}
		}

		// Toggle off if same sound
		if (playingIndex === index) {
			playingIndex = null;
			return;
		}

		// Play the new sound
		const audio = preloadedAudio.get(index);
		if (audio) {
			audio.currentTime = 0;
			playingIndex = index;
			audio.play();
		}
	}

	function deleteSound(index: number) {
		const sound = sounds[index];
		if (sound.objectUrl) {
			URL.revokeObjectURL(sound.objectUrl);
		}
		item.cardData.sounds = sounds.filter((_, i) => i !== index);
	}

	const gridCols = $derived(() => {
		const count = sounds.length;
		if (count <= 2) return 'grid-cols-1';
		if (count <= 6) return 'grid-cols-2';
		if (count <= 12) return 'grid-cols-3';
		return 'grid-cols-4';
	});

	let editingIndex = $state<number | null>(null);
	let editingName = $state('');

	function startEditing(index: number, event: Event) {
		event.stopPropagation();
		editingIndex = index;
		editingName = sounds[index].name;
	}

	function saveEdit() {
		if (editingIndex !== null && editingName.trim()) {
			item.cardData.sounds = sounds.map((s, i) =>
				i === editingIndex ? { ...s, name: editingName.trim() } : s
			);
		}
		editingIndex = null;
		editingName = '';
	}

	function cancelEdit() {
		editingIndex = null;
		editingName = '';
	}

	function handleEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEdit();
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	let fileInput: HTMLInputElement;

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const objectUrl = URL.createObjectURL(file);
		const name = file.name.replace(/\.[^/.]+$/, '');

		item.cardData.sounds = [
			...sounds,
			{
				name,
				pendingBlob: file,
				objectUrl
			}
		];

		input.value = '';
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="absolute inset-0 z-10 flex flex-col gap-2 overflow-hidden p-3">
	<input
		bind:this={fileInput}
		type="file"
		accept="audio/*"
		onchange={handleFileSelect}
		class="hidden"
	/>

	{#if sounds.length === 0}
		<button
			onclick={triggerFileInput}
			class={cn(
				'pointer-events-auto flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all',
				'border-base-300 hover:border-base-400 dark:border-base-600 dark:hover:border-base-500',
				'accent:border-base-900/30 accent:hover:border-base-900/50',
				'text-base-500 hover:text-base-600 dark:text-base-400 dark:hover:text-base-300',
				'accent:text-base-800/60 accent:hover:text-base-800'
			)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-base font-medium">Add a sound</span>
		</button>
	{:else}
		<div class={cn('pointer-events-auto grid h-full w-full gap-3', gridCols())}>
			{#each sounds as sound, i (sound.name + i)}
				<div class="group relative">
					{#if editingIndex === i}
						<div
							class={cn(
								'flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2',
								'bg-base-200 dark:bg-base-700',
								'accent:bg-base-900/20'
							)}
						>
							<input
								type="text"
								bind:value={editingName}
								onkeydown={handleEditKeydown}
								onblur={saveEdit}
								use:focusOnMount
								class="border-base-300 dark:border-base-600 dark:bg-base-800 w-full rounded border bg-white px-2 py-1 text-center text-sm"
							/>
						</div>
					{:else}
						<button
							onclick={() => playSound(i)}
							ondblclick={(e) => startEditing(i, e)}
							class={cn(
								'@container/btn flex h-full w-full items-center justify-center rounded-2xl px-2 py-3 font-medium transition-all',
								'bg-base-200 hover:bg-base-300 dark:bg-base-700 dark:hover:bg-base-600',
								'accent:bg-base-900/20 accent:hover:bg-base-900/30',
								'text-base-800 dark:text-base-200 accent:text-base-900',
								playingIndex === i && 'ring-accent-500 ring-2 ring-offset-1'
							)}
						>
							<span
								class="line-clamp-2 text-center break-words text-base @[80px]/btn:text-lg @[100px]/btn:text-xl @[120px]/btn:text-2xl @[150px]/btn:text-3xl @[180px]/btn:text-4xl @[220px]/btn:text-5xl @[280px]/btn:text-6xl @[350px]/btn:text-7xl @[450px]/btn:text-8xl"
								>{sound.name}</span
							>
						</button>
					{/if}
					<button
						onclick={() => deleteSound(i)}
						aria-label="Delete sound"
						class="bg-accent-500 hover:bg-accent-600 accent:bg-base-500 accent:hover:bg-base-600 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<button
						onclick={(e) => startEditing(i, e)}
						aria-label="Edit sound name"
						class="bg-accent-500 hover:bg-accent-600 accent:bg-base-500 accent:hover:bg-base-600 absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
							/>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
