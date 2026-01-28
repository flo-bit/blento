<script lang="ts">
	import { Paragraph } from '@foxui/core';
	import { ColorSelect } from '@foxui/colors';

	let accentColors = [
		{ class: 'text-red-500', label: 'red' },
		{ class: 'text-orange-500', label: 'orange' },
		{ class: 'text-amber-500', label: 'amber' },
		{ class: 'text-yellow-500', label: 'yellow' },
		{ class: 'text-lime-500', label: 'lime' },
		{ class: 'text-green-500', label: 'green' },
		{ class: 'text-emerald-500', label: 'emerald' },
		{ class: 'text-teal-500', label: 'teal' },
		{ class: 'text-cyan-500', label: 'cyan' },
		{ class: 'text-sky-500', label: 'sky' },
		{ class: 'text-blue-500', label: 'blue' },
		{ class: 'text-indigo-500', label: 'indigo' },
		{ class: 'text-violet-500', label: 'violet' },
		{ class: 'text-purple-500', label: 'purple' },
		{ class: 'text-fuchsia-500', label: 'fuchsia' },
		{ class: 'text-pink-500', label: 'pink' },
		{ class: 'text-rose-500', label: 'rose' }
	];

	let baseColors = [
		{ class: 'text-gray-500', label: 'gray' },
		{ class: 'text-stone-500', label: 'stone' },
		{ class: 'text-zinc-500', label: 'zinc' },
		{ class: 'text-neutral-500', label: 'neutral' },
		{ class: 'text-slate-500', label: 'slate' }
	];

	let {
		accentColor = $bindable('pink'),
		baseColor = $bindable('stone'),
		selectAccentColor = true,
		selectBaseColor = true,
		onchanged
	}: {
		accentColor?: string;
		baseColor?: string;
		selectAccentColor?: boolean;
		selectBaseColor?: boolean;
		onchanged?: (accentColor: string, baseColor: string) => void;
	} = $props();

	let selectedAccentColor = $derived(
		accentColors.find((c) => c.label === accentColor) ?? accentColors[15]
	);

	let selectedBaseColor = $derived(baseColors.find((c) => c.label === baseColor) ?? baseColors[1]);
</script>

{#if selectAccentColor}
	<Paragraph class="mb-2">Accent Color</Paragraph>
	<ColorSelect
		selected={selectedAccentColor}
		colors={accentColors}
		onselected={(color, previous) => {
			if (typeof previous === 'string' || typeof color === 'string') {
				return;
			}

			document.documentElement.classList.remove(previous.label.toLowerCase());
			document.documentElement.classList.add(color.label.toLowerCase());

			accentColor = color.label;

			window.dispatchEvent(
				new CustomEvent('theme-changed', { detail: { accentColor: color.label } })
			);

			onchanged?.(accentColor, baseColor);
		}}
		class="w-64"
	/>
{/if}

{#if selectBaseColor}
	<Paragraph class="mt-4 mb-2">Base Color</Paragraph>
	<ColorSelect
		selected={selectedBaseColor}
		colors={baseColors}
		onselected={(color, previous) => {
			if (typeof previous === 'string' || typeof color === 'string') {
				return;
			}

			document.documentElement.classList.remove(previous.label.toLowerCase());
			document.documentElement.classList.add(color.label.toLowerCase());

			baseColor = color.label;

			window.dispatchEvent(
				new CustomEvent('theme-changed', { detail: { baseColor: color.label } })
			);

			onchanged?.(accentColor, baseColor);
		}}
	/>
{/if}
