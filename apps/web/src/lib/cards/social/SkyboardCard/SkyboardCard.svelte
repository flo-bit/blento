<script lang="ts">
	import { onMount } from 'svelte';
	import { getAdditionalUserData } from '$lib/website/data/context';
	import type { ContentComponentProps } from '../../types';
	import type { SkyboardBoardData, SkyboardLabel, SkyboardLoadedData } from './types';
	import { fetchSkyboardBoard } from './api.remote';

	let { item }: ContentComponentProps = $props();

	const did = $derived(item.cardData.did as string | undefined);
	const rkey = $derived(item.cardData.rkey as string | undefined);
	const key = $derived(did && rkey ? `${did}/${rkey}` : undefined);
	const href = $derived(
		(item.cardData.href as string | undefined) ??
			(did && rkey ? `https://skyboard.dev/board/${did}/${rkey}` : 'https://skyboard.dev')
	);

	const additional = getAdditionalUserData();

	// svelte-ignore state_referenced_locally
	let board = $state<SkyboardBoardData | undefined>(
		key ? (additional[item.cardType] as SkyboardLoadedData)?.[key] : undefined
	);
	let loading = $state(false);

	onMount(async () => {
		if (board || !did || !rkey || !key) return;
		loading = true;
		try {
			const data = await fetchSkyboardBoard({ did, rkey });
			if (data) {
				board = data;
				additional[item.cardType] ??= {};
				(additional[item.cardType] as SkyboardLoadedData)[key] = data;
			}
		} catch (error) {
			console.error('Failed to fetch skyboard board:', error);
		} finally {
			loading = false;
		}
	});

	const labelsById = $derived(
		new Map<string, SkyboardLabel>((board?.board.labels ?? []).map((l) => [l.id, l]))
	);

	// Label colors come from arbitrary third-party board data. Only trust 6-digit
	// hex so we can safely append an alpha suffix and avoid CSS injection.
	function labelColor(color: string | undefined): string {
		return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#888888';
	}

	const columns = $derived(
		[...(board?.board.columns ?? [])]
			.sort((a, b) => a.order - b.order)
			.map((col) => ({
				...col,
				tasks: (board?.tasks ?? [])
					.filter((t) => t.effectiveColumnId === col.id && !t.effectiveParentTaskUri)
					// effectivePosition is a fractional-indexing key: compare by code point,
					// not locale collation, to match skyboard's own ordering.
					.sort((a, b) =>
						a.effectivePosition < b.effectivePosition
							? -1
							: a.effectivePosition > b.effectivePosition
								? 1
								: 0
					)
			}))
	);
</script>

<div class="@container flex h-full w-full flex-col overflow-hidden">
	<!-- Header -->
	<div class="flex shrink-0 items-center justify-between gap-2 px-3 pt-3 pb-2">
		<div class="flex min-w-0 items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-accent-500 accent:text-white size-4 shrink-0"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<path d="M9 3v18M15 3v18" />
			</svg>
			<span
				class="text-base-900 dark:text-base-100 accent:text-white min-w-0 truncate text-sm font-semibold"
			>
				{board?.board.name ?? 'Skyboard'}
			</span>
		</div>
		<a
			{href}
			target="_blank"
			rel="noopener noreferrer"
			class="text-base-500 hover:text-accent-500 dark:text-base-400 accent:text-white/70 accent:hover:text-white flex shrink-0 items-center gap-1 text-xs font-medium transition-colors"
		>
			Edit
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-3"
			>
				<path d="M7 17 17 7M7 7h10v10" />
			</svg>
		</a>
	</div>

	<!-- Body -->
	{#if board}
		<div class="flex min-h-0 flex-1 gap-2 overflow-x-auto px-3 pb-3">
			{#each columns as col (col.id)}
				<div class="flex w-44 shrink-0 flex-col">
					<div class="mb-1.5 flex items-center gap-1.5 px-0.5">
						<span
							class="text-base-700 dark:text-base-300 accent:text-white truncate text-xs font-semibold tracking-wide uppercase"
						>
							{col.name}
						</span>
						<span class="text-base-400 dark:text-base-500 accent:text-white/50 text-xs">
							{col.tasks.length}
						</span>
					</div>
					<div class="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
						{#each col.tasks as task (task.uri)}
							<div class="bg-base-100 dark:bg-base-800 accent:bg-white/10 rounded-lg p-2 text-left">
								<p
									class="text-base-900 dark:text-base-100 accent:text-white text-xs leading-snug font-medium"
								>
									{task.effectiveTitle}
								</p>
								{#if task.effectiveDescription}
									<p
										class="text-base-500 dark:text-base-400 accent:text-white/60 mt-1 line-clamp-2 text-[11px] leading-snug"
									>
										{task.effectiveDescription}
									</p>
								{/if}
								{#if task.effectiveLabelIds.length > 0}
									<div class="mt-1.5 flex flex-wrap gap-1">
										{#each task.effectiveLabelIds as labelId (labelId)}
											{@const label = labelsById.get(labelId)}
											{#if label}
												{@const color = labelColor(label.color)}
												<span
													class="rounded px-1.5 py-0.5 text-[10px] font-medium"
													style="background: {color}20; color: {color};"
												>
													{label.name}
												</span>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<div
								class="text-base-300 dark:text-base-600 accent:text-white/30 px-0.5 py-1 text-xs"
							>
								&mdash;
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="text-base-400 dark:text-base-500 accent:text-white/60 flex flex-1 items-center justify-center px-3 pb-3 text-center text-sm"
		>
			{#if loading}
				Loading board…
			{:else if did && rkey}
				Couldn't load this board.
			{:else}
				No board selected.
			{/if}
		</div>
	{/if}
</div>
