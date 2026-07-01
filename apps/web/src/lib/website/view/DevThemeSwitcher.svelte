<script lang="ts">
	// Dev-only preset switcher: press 1–9 to flip the page through theme presets (accent/base colors
	// + --blento-* tokens) without saving anything. Reload restores the page's real theme. Rendered
	// only in dev (guarded by the caller). Handy for eyeballing the token system across themes.
	import { onMount } from 'svelte';

	type Preset = {
		name: string;
		accent: string;
		base: string;
		/** --blento-<key> token overrides. */
		tokens: Record<string, string>;
	};

	const presets: Preset[] = [
		{ name: 'Default', accent: 'pink', base: 'stone', tokens: { 'radius-card': '1.5rem' } },
		{
			name: 'Ocean',
			accent: 'sky',
			base: 'slate',
			tokens: { 'radius-card': '0.5rem', 'shadow-card': '0 8px 30px -8px rgb(2 20 40 / 0.25)' }
		},
		{
			name: 'Sunset',
			accent: 'orange',
			base: 'neutral',
			tokens: {
				'radius-card': '2rem',
				'shadow-card': '0 10px 40px -12px rgb(120 40 0 / 0.3)',
				'font-body': "Georgia, 'Times New Roman', serif"
			}
		},
		{
			name: 'Forest',
			accent: 'emerald',
			base: 'stone',
			tokens: { 'radius-card': '1rem', 'shadow-card': '0 4px 16px -6px rgb(0 40 20 / 0.25)' }
		},
		{
			name: 'Grape',
			accent: 'violet',
			base: 'zinc',
			tokens: {
				'radius-card': '0.25rem',
				'shadow-card': '0 2px 0 2px rgb(80 40 120 / 0.2)',
				'font-body': "ui-monospace, 'SF Mono', 'Cascadia Code', monospace"
			}
		},
		{
			name: 'Rose',
			accent: 'rose',
			base: 'gray',
			tokens: { 'radius-card': '9999px', 'shadow-card': '0 12px 32px -10px rgb(120 20 60 / 0.3)' }
		}
	];

	const allAccent = [
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
	const allBase = ['gray', 'stone', 'zinc', 'neutral', 'slate'];
	const tokenKeys = ['radius-card', 'shadow-card', 'font-body'];

	let current = $state(-1);

	function apply(i: number) {
		const p = presets[i];
		if (!p) return;
		const el = document.documentElement;
		el.classList.remove(...allAccent, ...allBase);
		el.classList.add(p.accent, p.base);
		for (const k of tokenKeys) el.style.removeProperty(`--blento-${k}`);
		for (const [k, v] of Object.entries(p.tokens)) el.style.setProperty(`--blento-${k}`, v);
		current = i;
	}

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			const t = e.target as HTMLElement | null;
			if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
			const n = Number.parseInt(e.key, 10);
			if (n >= 1 && n <= presets.length) {
				e.preventDefault();
				apply(n - 1);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div
	class="fixed bottom-4 left-4 z-[9999] rounded-lg bg-black/80 px-3 py-1.5 font-mono text-xs text-white shadow-lg backdrop-blur"
>
	{#if current >= 0}
		<span class="font-semibold">{current + 1}. {presets[current].name}</span>
		<span class="ml-1 opacity-50">·</span>
	{/if}
	<span class="opacity-60">theme 1–{presets.length}</span>
</div>
