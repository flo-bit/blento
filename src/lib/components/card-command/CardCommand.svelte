<script lang="ts">
	import { AllCardDefinitions } from '$lib/cards';
	import type { CardDefinition } from '$lib/cards/types';
	import { Command, Dialog } from 'bits-ui';
	import { isTyping } from '$lib/helper';

	const CardDefGroups = [
		'Core',
		...Array.from(
			new Set(
				AllCardDefinitions.map((cardDef) => cardDef.groups)
					.flat()
					.filter((g) => g)
			)
		)
			.sort()
			.filter((g) => g !== 'Core')
	];

	let {
		open = $bindable(false),
		onselect,
		onlink
	}: {
		open: boolean;
		onselect: (cardDef: CardDefinition) => void;
		onlink?: (url: string, cardDef: CardDefinition) => void;
	} = $props();

	let searchValue = $state('');

	let normalizedUrl = $derived.by(() => {
		if (!searchValue || searchValue.length < 8) return '';
		try {
			const val = searchValue.trim();
			const urlStr = val.startsWith('http') ? val : `https://${val}`;
			const url = new URL(urlStr);
			if (!url.hostname.includes('.')) return '';
			return urlStr;
		} catch {
			return '';
		}
	});

	let urlMatchingCards = $derived.by(() => {
		if (!normalizedUrl) return [];
		return AllCardDefinitions.filter((d) => d.onUrlHandler)
			.filter((d) => {
				try {
					const testItem = { cardData: {} };
					return d.onUrlHandler!(normalizedUrl, testItem as any);
				} catch {
					return false;
				}
			})
			.toSorted((a, b) => (b.urlHandlerPriority ?? 0) - (a.urlHandlerPriority ?? 0));
	});

	function selectUrl(cardDef: CardDefinition) {
		const url = normalizedUrl;
		open = false;
		searchValue = '';
		onlink?.(url, cardDef);
	}

	function commandFilter(value: string, search: string, keywords?: string[]): number {
		if (value.startsWith('url:')) return 1;
		const s = search.toLowerCase();
		for (const t of [value, ...(keywords ?? [])]) {
			if (t.toLowerCase().includes(s)) return 1;
		}
		return 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
		if (e.key === '+' && !isTyping()) {
			e.preventDefault();
			open = true;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
		/>
		<Dialog.Content
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-36 left-[50%] z-50 w-full max-w-[94%] translate-x-[-50%] outline-hidden sm:max-w-lg md:w-full"
		>
			<Dialog.Title class="sr-only">Command Menu</Dialog.Title>
			<Dialog.Description class="sr-only">
				This is the command menu. Use the arrow keys to navigate and press ⌘K to open the search
				bar.
			</Dialog.Description>
			<Command.Root
				filter={commandFilter}
				class="border-base-200 dark:border-base-800 mx-auto flex h-full w-full max-w-[90vw] flex-col overflow-hidden rounded-2xl border bg-white dark:bg-black"
			>
				<Command.Input
					class="focus-override placeholder:text-base-900/50 dark:placeholder:text-base-50/50 border-base-200 dark:border-base-800 bg-base-100 mx-1 mt-1 inline-flex truncate rounded-2xl rounded-tl-2xl px-4 text-sm transition-colors focus:ring-0 focus:outline-hidden dark:bg-black"
					placeholder="Search for a card or paste a link..."
					oninput={(e) => {
						searchValue = e.currentTarget.value;
					}}
				/>

				<Command.List
					class="focus:outline-accent-500/50 max-h-[50vh] overflow-x-hidden overflow-y-auto rounded-br-2xl rounded-bl-2xl bg-white px-2 pb-2 focus:border-0 dark:bg-black"
				>
					<Command.Viewport>
						<Command.Empty
							class="text-base-900 dark:text-base-100 flex w-full items-center justify-center pt-8 pb-6 text-sm"
						>
							No results found.
						</Command.Empty>

						{#if urlMatchingCards.length > 0}
							<Command.Group>
								<Command.GroupHeading
									class="text-base-600 dark:text-base-400 px-3 pt-3 pb-2 text-xs"
								>
									Add from link
								</Command.GroupHeading>
								<Command.GroupItems>
									{#each urlMatchingCards as cardDef (cardDef.type)}
										<Command.Item
											value="url:{cardDef.type}"
											onSelect={() => {
												selectUrl(cardDef);
											}}
											class="rounded-button data-selected:bg-accent-500/10 flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-hidden select-none"
										>
											{#if cardDef.icon}
												<div class="text-base-700 dark:text-base-300">
													{@html cardDef.icon}
												</div>
											{/if}
											{cardDef.name}
										</Command.Item>
									{/each}
								</Command.GroupItems>
							</Command.Group>
							<Command.Separator class="bg-base-900/5 dark:bg-base-50/5 my-1 h-px w-full" />
						{/if}

						{#each CardDefGroups as group, index (group)}
							{#if group && AllCardDefinitions.some((cardDef) => cardDef.groups?.includes(group))}
								<Command.Group>
									<Command.GroupHeading
										class="text-base-600 dark:text-base-400 px-3 pt-4 pb-2 text-xs"
									>
										{group}
									</Command.GroupHeading>
									<Command.GroupItems>
										{#each AllCardDefinitions.filter( (cardDef) => cardDef.groups?.includes(group) ) as cardDef (cardDef.type)}
											<Command.Item
												onSelect={() => {
													open = false;
													searchValue = '';
													onselect(cardDef);
												}}
												class="rounded-button data-selected:bg-accent-500/10 flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-hidden select-none"
												keywords={[group, cardDef.type, ...(cardDef.keywords || [])]}
											>
												{#if cardDef.icon}
													<div class="text-base-700 dark:text-base-300">
														{@html cardDef.icon}
													</div>
												{/if}
												{cardDef.name}
											</Command.Item>
										{/each}
									</Command.GroupItems>
								</Command.Group>
								{#if index < CardDefGroups.length - 1}
									<Command.Separator class="bg-base-900/5 dark:bg-base-50/5 my-1 h-px w-full" />
								{/if}
							{/if}
						{/each}
					</Command.Viewport>
				</Command.List>
			</Command.Root>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
