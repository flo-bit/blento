<script lang="ts">
	import type { ContentComponentProps } from '../../types';
	import {
		getAdditionalUserData,
		getDidContext,
		getHandleContext
	} from '$lib/website/data/context';
	import { CardDefinitionsByType } from '../..';
	import { onMount } from 'svelte';
	import type { RpgActorData } from '.';

	let { item, isEditing }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	// svelte-ignore state_referenced_locally
	let actor = $state(data[item.cardType] as RpgActorData);
	// svelte-ignore state_referenced_locally
	let loaded = $state(actor !== undefined);

	onMount(async () => {
		if (actor === undefined) {
			actor = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			})) as RpgActorData;
			data[item.cardType] = actor;
		}
		loaded = true;
	});

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	const WALK_IN = 2200;
	const IDLE = 1800;
	const WALK_OUT = 2200;
	const PAUSE = 800;
	const TOTAL = WALK_IN + IDLE + WALK_OUT + PAUSE;
	const FRAME_MS = 180;

	let elapsed = $state(0);
	let raf: number | undefined;

	$effect(() => {
		if (!actor) return;
		const start = performance.now();
		const tick = (now: number) => {
			elapsed = now - start;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			if (raf !== undefined) cancelAnimationFrame(raf);
		};
	});

	const cycleT = $derived(elapsed % TOTAL);
	const cycleIndex = $derived(Math.floor(elapsed / TOTAL));
	const phase = $derived.by(() => {
		if (cycleT < WALK_IN) return 'walkIn';
		if (cycleT < WALK_IN + IDLE) return 'idle';
		if (cycleT < WALK_IN + IDLE + WALK_OUT) return 'walkOut';
		return 'pause';
	});

	// Pseudo-random direction per cycle so consecutive loops can flip sides.
	const goingRight = $derived(((cycleIndex * 2654435761) >>> 0) & 1 ? true : false);

	// Integer pixel scale so pixel art stays crisp.
	const spriteScale = $derived(
		actor ? Math.max(1, Math.floor((containerHeight * 0.78) / actor.sprite.frameHeight)) : 1
	);
	const spriteW = $derived(actor ? actor.sprite.frameWidth * spriteScale : 0);
	const spriteH = $derived(actor ? actor.sprite.frameHeight * spriteScale : 0);

	// 0 = sprite right edge at container left edge; 1 = sprite left edge at container right edge.
	const travel = $derived(containerWidth + spriteW);
	const x = $derived.by(() => {
		if (!actor) return 0;
		switch (phase) {
			case 'walkIn': {
				const t = (cycleT / WALK_IN) * 0.5;
				return goingRight ? t : 1 - t;
			}
			case 'idle':
				return 0.5;
			case 'walkOut': {
				const t = ((cycleT - WALK_IN - IDLE) / WALK_OUT) * 0.5;
				return goingRight ? 0.5 + t : 0.5 - t;
			}
			default:
				return goingRight ? 1 : 0;
		}
	});
	const translateX = $derived(x * travel - spriteW);

	// Standard 4×3 RPG layout: row 0 down, row 1 left, row 2 right, row 3 up.
	const DOWN_ROW = 0;
	const LEFT_ROW = 1;
	const RIGHT_ROW = 2;
	// 3-frame walk cycle: stand → step → stand → step.
	const WALK_FRAMES = [1, 0, 1, 2];

	const isStill = $derived(phase === 'idle' || phase === 'pause');
	const row = $derived(isStill ? DOWN_ROW : goingRight ? RIGHT_ROW : LEFT_ROW);
	const col = $derived.by(() => {
		if (isStill) return 1;
		const i = Math.floor(cycleT / FRAME_MS) % WALK_FRAMES.length;
		return WALK_FRAMES[i];
	});

	const sheetW = $derived(actor ? actor.sprite.columns * spriteW : 0);
	const sheetH = $derived(actor ? actor.sprite.rows * spriteH : 0);
	const bgX = $derived(-col * spriteW);
	const bgY = $derived(-row * spriteH);
</script>

<div
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
	class="relative h-full w-full overflow-hidden"
>
	{#if loaded && actor}
		<div
			class="absolute bottom-0"
			style:transform="translateX({translateX}px)"
			style:width="{spriteW}px"
			style:height="{spriteH}px"
			style:background-image="url({actor.url})"
			style:background-size="{sheetW}px {sheetH}px"
			style:background-position="{bgX}px {bgY}px"
			style:image-rendering="pixelated"
			aria-hidden="true"
		></div>
	{:else if loaded && !actor && isEditing}
		<div class="flex h-full w-full items-center justify-center p-3">
			<a
				href="https://rpg.actor"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg border border-current/15 bg-current/5 px-3 py-2 text-center text-sm font-medium text-current/80 transition hover:bg-current/10 hover:text-current"
			>
				Create your character on rpg.actor
			</a>
		</div>
	{:else if loaded && !actor}
		<div
			class="flex h-full w-full items-center justify-center p-3 text-center text-sm text-current/60"
		>
			This person hasn't created a character yet
		</div>
	{/if}
</div>
