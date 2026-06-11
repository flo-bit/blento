<script lang="ts">
	import { browser } from '$app/environment';

	let {
		accentColor = 'pink',
		baseColor = 'stone'
	}: {
		accentColor?: string;
		baseColor?: string;
	} = $props();

	const allAccentColors = [
		'red',
		'orange',
		'amber',
		'yellow',
		'lime',
		'green',
		'emerald',
		'teal',
		'cyan',
		'sky',
		'blue',
		'indigo',
		'violet',
		'purple',
		'fuchsia',
		'pink',
		'rose'
	];
	const allBaseColors = ['gray', 'stone', 'zinc', 'neutral', 'slate'];

	const safeJson = (v: string) => JSON.stringify(v).replace(/</g, '\\u003c');

	// SSR: inline script for initial page load (no FOUC)
	let script = $derived(
		`<script>(function(){document.documentElement.classList.add(${safeJson(accentColor)},${safeJson(baseColor)});})();<` +
			'/script>'
	);

	// Client: reactive effect for client-side navigations
	$effect(() => {
		if (!browser) return;
		const el = document.documentElement;
		el.classList.remove(...allAccentColors, ...allBaseColors);
		el.classList.add(accentColor, baseColor);
	});
</script>

<svelte:head>
	{@html script}
</svelte:head>
