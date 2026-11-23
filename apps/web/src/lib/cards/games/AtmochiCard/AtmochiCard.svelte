<script lang="ts" module>
	import type { TileErrorEvent, TileMothership } from '@dasl/tile-loader';

	// one mothership for all tiles on the page (browser only, so loaded lazily)
	let mothership: Promise<TileMothership> | undefined;

	function getMothership() {
		mothership ??= (async () => {
			const [{ TileMothership }, { ATTileLoader }] = await Promise.all([
				import('@dasl/tile-loader'),
				import('@dasl/tile-loader/at')
			]);
			const tl = new TileMothership();
			tl.init();
			tl.addLoader(new ATTileLoader());
			return tl;
		})().catch((e) => {
			mothership = undefined;
			throw e;
		});
		return mothership;
	}
</script>

<script lang="ts">
	import type { ContentComponentProps } from '../../types';
	import {
		getAdditionalUserData,
		getDidContext,
		getHandleContext
	} from '$lib/website/data/context';
	import { CardDefinitionsByType } from '../..';
	import { onMount } from 'svelte';
	import type { AtmochiData } from '.';

	let { item, isEditing }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	// svelte-ignore state_referenced_locally
	let pet = $state(data[item.cardType] as AtmochiData);
	// svelte-ignore state_referenced_locally
	let loaded = $state(pet !== undefined);
	let failed = $state(false);

	let container: HTMLDivElement | undefined = $state();

	onMount(async () => {
		if (pet === undefined) {
			pet = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			})) as AtmochiData;
			data[item.cardType] = pet;
		}
		loaded = true;
	});

	$effect(() => {
		if (!pet || !container) return;
		const { uri, name } = pet;
		const parent = container;
		let cancelled = false;
		let close: (() => void) | undefined;

		(async () => {
			const [tl, { tileLinks, linkPrompt }] = await Promise.all([
				getMothership(),
				import('@dasl/tile-loader/link')
			]);
			const tile = await tl.loadTile(uri);
			if (cancelled) return;
			if (!tile) {
				failed = true;
				return;
			}

			// a slow tile still loads after a timeout, anything else is fatal
			tile.addEventListener('error', (e) => {
				if ((e as TileErrorEvent).reason !== 'timeout') failed = true;
			});

			const frame = tile.renderContent();
			frame.style.height = '100%';
			frame.title = name;
			parent.append(frame);
			const links = tileLinks(tile, { frame, open: linkPrompt(document.body) });

			close = () => {
				links.stop();
				void tile.close();
			};
		})().catch(() => {
			if (!cancelled) failed = true;
		});

		return () => {
			cancelled = true;
			close?.();
		};
	});
</script>

{#if pet && !failed}
	<div bind:this={container} class={['absolute inset-0', isEditing && 'pointer-events-none']}></div>
{:else if loaded && !pet && isEditing}
	<div class="flex h-full w-full items-center justify-center p-3">
		<a
			href="https://atmochi.pet"
			target="_blank"
			rel="noopener noreferrer"
			class="rounded-lg border border-current/15 bg-current/5 px-3 py-2 text-center text-sm font-medium text-current/80 transition hover:bg-current/10 hover:text-current"
		>
			Publish your pet's Web Tile on atmochi.pet
		</a>
	</div>
{:else if loaded}
	<div
		class="flex h-full w-full items-center justify-center p-3 text-center text-sm text-current/60"
	>
		{failed ? "Couldn't load this Atmochi" : "This person hasn't shared an Atmochi yet"}
	</div>
{/if}

<style>
	/* the loader's link prompt; tailwind's reset removes the dialog's centering */
	:global(.tile-link-dialog) {
		margin: auto;
	}
</style>
