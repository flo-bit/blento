<script lang="ts">
	// @ts-nocheck
	import DatePickerField from './DatePicker.svelte';
	import TimePicker from './TimePicker.svelte';
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';

	let {
		value = $bindable(''),
		required = false,
		minValue = ''
	}: {
		value: string;
		required?: boolean;
		minValue?: string;
	} = $props();

	let datePart = $state('');
	let timePart = $state('00:00');
	let timeEl: HTMLDivElement | undefined = $state(undefined);

	const locale = browser ? navigator.language || 'en' : 'en';
	let minDatePart = $derived(minValue ? minValue.split('T')[0] || '' : '');

	// Sync external value -> date/time parts
	$effect(() => {
		const v = value;
		untrack(() => {
			if (v) {
				const [d, t] = v.split('T');
				if (d && d !== datePart) datePart = d;
				if (t && t !== timePart) timePart = t;
			}
		});
	});

	// Sync date/time parts -> external value
	$effect(() => {
		const d = datePart;
		const t = timePart;
		untrack(() => {
			if (d) {
				const newVal = `${d}T${t || '00:00'}`;
				if (newVal !== value) value = newVal;
			}
		});
	});

	function focusTime() {
		// Small delay to let the popover finish closing
		setTimeout(() => {
			if (timeEl) {
				const segment = timeEl.querySelector('[data-segment]');
				if (segment instanceof HTMLElement) {
					segment.focus();
				}
			}
		}, 50);
	}
</script>

<div class="flex items-center gap-1.5">
	<DatePickerField
		bind:value={datePart}
		{required}
		minValue={minDatePart}
		{locale}
		onSelect={focusTime}
	/>
	<div bind:this={timeEl}>
		<TimePicker bind:value={timePart} {locale} />
	</div>
</div>
