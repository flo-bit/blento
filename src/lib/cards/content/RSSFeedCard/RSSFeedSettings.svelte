<script lang="ts">
  import type { SettingsComponentProps } from '../../types';
  import { Input } from '@foxui/core';
  import SettingsSection from '../../_settings/SettingsSection.svelte';
  import SettingsField from '../../_settings/SettingsField.svelte';

  let { item = $bindable() }: SettingsComponentProps = $props();

  // Ensure defaults
  item.cardData = item.cardData ?? {};
  item.cardData.title ??= '';
  item.cardData.itemCount ??= 5;
  item.cardData.showDescription ??= true;
</script>

<div class="flex flex-col gap-6">
  <SettingsSection title="Display">
    <SettingsField label="Title" description="Optional title shown above the feed.">
      <Input bind:value={item.cardData.title} placeholder="My blog" />
    </SettingsField>

    <SettingsField label="Items to show" description="Number of feed items to display.">
      <Input type="number" bind:value={item.cardData.itemCount} min="1" max="50" />
    </SettingsField>

    <SettingsField label="Show descriptions">
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" bind:checked={item.cardData.showDescription} />
        <span class="text-sm">Include item descriptions</span>
      </label>
    </SettingsField>
  </SettingsSection>
</div>
