<script lang="ts">
	import { Button, Input, Modal, Subheading, Label } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let text = $state(item.cardData?.text || '');

	function handleCreate() {
		if (!text.trim()) return;
		item.cardData.text = text.trim();
		oncreate();
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Enter text for fluid effect</Subheading>
	<div class="mt-2">
		<Label class="mb-1 text-xs">Text</Label>
		<Input
			bind:value={text}
			placeholder="Enter your text..."
			autofocus
			onkeydown={(e) => {
				if (e.key === 'Enter') handleCreate();
			}}
		/>
	</div>

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button onclick={handleCreate} disabled={!text.trim()}>Create</Button>
	</div>
</Modal>
