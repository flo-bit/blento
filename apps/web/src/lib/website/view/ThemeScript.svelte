<script lang="ts">
	import { browser } from '$app/environment';

	let {
		accentColor = 'pink',
		baseColor = 'stone',
		tokens = {}
	}: {
		accentColor?: string;
		baseColor?: string;
		/** Page-level design tokens, applied as `--blento-<key>` CSS vars on <html>. e.g.
		 * { 'radius-card': '2rem' }. Empty = every token uses its default (identical to today). */
		tokens?: Record<string, string>;
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

	// SSR: inline script for initial page load (no FOUC) — set color classes + token vars before paint.
	// setProperty contains each value, so a token value can't break out of its declaration.
	let script = $derived.by(() => {
		const setProps = Object.entries(tokens)
			.map(([k, v]) => `e.style.setProperty(${safeJson('--blento-' + k)},${safeJson(v)});`)
			.join('');
		return (
			`<script>(function(){var e=document.documentElement;e.classList.add(${safeJson(accentColor)},${safeJson(baseColor)});${setProps}})();<` +
			'/script>'
		);
	});

	// Client: reactive effect for client-side navigations
	$effect(() => {
		if (!browser) return;
		const el = document.documentElement;
		el.classList.remove(...allAccentColors, ...allBaseColors);
		el.classList.add(accentColor, baseColor);
		for (const [k, v] of Object.entries(tokens)) el.style.setProperty(`--blento-${k}`, v);
	});
</script>

<svelte:head>
	{@html script}
</svelte:head>
