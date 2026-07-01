<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { Input } from '@foxui/core';
	import { SettingsSection, SettingsField } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	function normalizeUrl() {
		let href = item.cardData.href?.trim() || '';
		if (
			href &&
			!/^https?:\/\//i.test(href) &&
			!href.startsWith('#') &&
			!href.startsWith('mailto:')
		) {
			href = 'https://' + href;
		}
		item.cardData.href = href;
	}
</script>

<div class="flex flex-col gap-6">
	<SettingsSection title="Content">
		<SettingsField label="Button text">
			<Input bind:value={item.cardData.text} placeholder="Click me" />
		</SettingsField>
	</SettingsSection>

	<SettingsSection title="Link">
		<SettingsField label="URL">
			<Input
				type="url"
				spellcheck={false}
				bind:value={item.cardData.href}
				placeholder="example.com"
				onblur={normalizeUrl}
				onkeydown={(event) => {
					if (event.code === 'Enter') {
						event.preventDefault();
						normalizeUrl();
					}
				}}
			/>
		</SettingsField>
	</SettingsSection>
</div>
