<script lang="ts">
	import { AppBskyActorDefs } from '@atcute/bluesky';
	import { searchActorsTypeahead } from '$lib/atproto';
	import { Avatar } from '@foxui/core';

	let results: AppBskyActorDefs.ProfileViewBasic[] = $state([]);
	let highlightedIndex = $state(-1);
	let dropdownVisible = $derived(results.length > 0);
	let wrapperEl: HTMLDivElement | undefined = $state();

	const listboxId = 'handle-input-listbox';

	async function search(q: string) {
		if (!q || q.length < 2) {
			results = [];
			return;
		}
		results = (await searchActorsTypeahead(q, 5)).actors;
		highlightedIndex = -1;
	}

	function selectActor(actor: AppBskyActorDefs.ProfileViewBasic) {
		value = actor.handle;
		onselected?.(actor);
		results = [];
		highlightedIndex = -1;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!dropdownVisible) {
			if (e.key === 'Enter') {
				(e.currentTarget as HTMLInputElement).form?.requestSubmit();
			}
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedIndex = highlightedIndex <= 0 ? results.length - 1 : highlightedIndex - 1;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedIndex = highlightedIndex >= results.length - 1 ? 0 : highlightedIndex + 1;
		} else if (e.key === 'Enter') {
			if (highlightedIndex >= 0 && highlightedIndex < results.length) {
				e.preventDefault();
				selectActor(results[highlightedIndex]);
			} else {
				(e.currentTarget as HTMLInputElement).form?.requestSubmit();
			}
		} else if (e.key === 'Escape') {
			results = [];
			highlightedIndex = -1;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (wrapperEl && !wrapperEl.contains(e.target as Node)) {
			results = [];
			highlightedIndex = -1;
		}
	}

	$effect(() => {
		if (dropdownVisible) {
			document.addEventListener('click', handleClickOutside, true);
			return () => document.removeEventListener('click', handleClickOutside, true);
		}
	});

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

<div class="relative w-full" bind:this={wrapperEl}>
	<input
		bind:this={ref}
		type="text"
		{value}
		oninput={(e) => {
			value = e.currentTarget.value;
			search(e.currentTarget.value);
		}}
		onkeydown={handleKeydown}
		class="focus-within:outline-accent-600 dark:focus-within:outline-accent-500 dark:placeholder:text-base-400 w-full touch-none rounded-full border-0 bg-white ring-0 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 dark:bg-white/5 dark:outline-white/10"
		placeholder="handle"
		id=""
		aria-label="enter your handle"
		role="combobox"
		aria-expanded={dropdownVisible}
		aria-controls={listboxId}
		aria-autocomplete="list"
		autocomplete="off"
	/>

	{#if dropdownVisible}
		<div
			id={listboxId}
			class="border-base-300 bg-base-50 dark:bg-base-900 dark:border-base-800 absolute bottom-full left-0 z-100 mb-2.5 max-h-[30dvh] w-full overflow-auto rounded-2xl border shadow-lg"
			role="listbox"
		>
			<div class="w-full p-1">
				{#each results as actor, i (actor.did)}
					<button
						type="button"
						class="my-0.5 flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 px-2 {i ===
						highlightedIndex
							? 'bg-accent-100 dark:bg-accent-600/30'
							: ''}"
						role="option"
						aria-selected={i === highlightedIndex}
						onmouseenter={() => (highlightedIndex = i)}
						onclick={() => selectActor(actor)}
					>
						<Avatar
							src={actor.avatar?.replace('avatar', 'avatar_thumbnail')}
							alt=""
							class="size-6 rounded-full"
						/>
						{actor.handle}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
