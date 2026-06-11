<script lang="ts">
	import { untrack } from 'svelte';
	import { Input } from '@foxui/core';
	import SettingsToggle from './SettingsToggle.svelte';
	import SettingsField from './SettingsField.svelte';

	let {
		dict = $bindable(),
		hrefKey = 'href',
		labelKey,
		toggleLabel = 'Link this card to a URL',
		toggleDescription,
		urlPlaceholder = 'example.com',
		labelPlaceholder = 'Link label'
	}: {
		dict: Record<string, any>;
		hrefKey?: string;
		labelKey?: string;
		toggleLabel?: string;
		toggleDescription?: string;
		urlPlaceholder?: string;
		labelPlaceholder?: string;
	} = $props();

	let enabled = $state(untrack(() => Boolean(dict[hrefKey])));

	function onToggle(value: boolean) {
		enabled = value;
		if (!value) {
			dict[hrefKey] = '';
			if (labelKey) dict[labelKey] = '';
		}
	}

	function normalizeUrl() {
		let href = (dict[hrefKey] ?? '').trim();
		if (
			href &&
			!/^https?:\/\//i.test(href) &&
			!href.startsWith('#') &&
			!href.startsWith('mailto:')
		) {
			href = 'https://' + href;
		}
		dict[hrefKey] = href;
	}
</script>

<div class="flex flex-col gap-3">
	<SettingsToggle
		checked={enabled}
		label={toggleLabel}
		description={toggleDescription}
		onCheckedChange={onToggle}
	/>

	{#if enabled}
		<div class="flex flex-col gap-2 pl-6">
			<SettingsField label="URL">
				<Input
					type="url"
					spellcheck={false}
					bind:value={dict[hrefKey]}
					placeholder={urlPlaceholder}
					onblur={normalizeUrl}
				/>
			</SettingsField>

			{#if labelKey}
				<SettingsField label="Link label">
					<Input bind:value={dict[labelKey]} placeholder={labelPlaceholder} />
				</SettingsField>
			{/if}
		</div>
	{/if}
</div>
