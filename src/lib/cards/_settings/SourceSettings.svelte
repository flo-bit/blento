<script lang="ts">
	import { untrack } from 'svelte';
	import type { SettingsComponentProps } from '../types';
	import { Input, toast } from '@foxui/core';
	import { CardDefinitionsByType } from '..';
	import SettingsSection from './SettingsSection.svelte';
	import SettingsField from './SettingsField.svelte';

	let { item = $bindable() }: SettingsComponentProps = $props();

	const cardDef = $derived(CardDefinitionsByType[item.cardType]);
	const cfg = $derived(cardDef?.source ?? {});

	let urlInput = $state(
		untrack(
			() =>
				CardDefinitionsByType[item.cardType]?.source?.currentUrl?.(item) ?? item.cardData.href ?? ''
		)
	);

	function apply() {
		const url = urlInput.trim();
		if (!url) return;

		const def = CardDefinitionsByType[item.cardType];
		// Parse handlers tend to reset the card size — keep the user's current size.
		const size = { w: item.w, h: item.h, mobileW: item.mobileW, mobileH: item.mobileH };

		const ok = def?.source?.apply
			? def.source.apply(url, item)
			: Boolean(def?.onUrlHandler?.(url, item));

		item.w = size.w;
		item.h = size.h;
		item.mobileW = size.mobileW;
		item.mobileH = size.mobileH;

		if (!ok) {
			toast.error(def?.source?.errorMessage ?? "Couldn't recognize that link");
		}
	}
</script>

<SettingsSection title="Source">
	<SettingsField label={cfg.label ?? 'URL'}>
		<Input
			type="url"
			spellcheck={false}
			bind:value={urlInput}
			placeholder={cfg.placeholder ?? 'Paste a link'}
			onblur={apply}
			onkeydown={(event) => {
				if (event.code === 'Enter') {
					event.preventDefault();
					apply();
				}
			}}
		/>
	</SettingsField>
</SettingsSection>
