<script lang="ts">
	import { Alert, Button, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const extension = file.name.toLowerCase().split('.').pop();
		if (!['gltf', 'glb', 'stl', 'fbx'].includes(extension || '')) {
			errorMessage = 'Please select a .gltf, .glb, .stl, or .fbx file';
			return;
		}

		errorMessage = '';
		item.cardData.modelFile = {
			blob: file,
			objectUrl: URL.createObjectURL(file),
			name: file.name,
			type: extension
		};
	}

	function clearFile() {
		if (item.cardData.modelFile?.objectUrl) {
			URL.revokeObjectURL(item.cardData.modelFile.objectUrl);
		}
		item.cardData.modelFile = undefined;
	}

	function canCreate() {
		if (!item.cardData.modelFile) {
			errorMessage = 'Please upload a file';
			return false;
		}
		return true;
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Add a 3D Model</Subheading>

	<div>
		<p class="text-base-600 dark:text-base-400 mb-2 text-sm">
			Upload a 3D model file (.glb, .stl, .fbx, or .gltf)
		</p>
		{#if item.cardData.modelFile}
			<div
				class="bg-base-100 dark:bg-base-800 flex items-center justify-between rounded-lg border p-3"
			>
				<span class="text-sm">{item.cardData.modelFile.name}</span>
				<Button size="sm" variant="ghost" onclick={clearFile}>Remove</Button>
			</div>
		{:else}
			<input
				bind:this={fileInput}
				type="file"
				accept=".gltf,.glb,.stl,.fbx"
				onchange={handleFileSelect}
				class="hidden"
			/>
			<Button variant="secondary" onclick={() => fileInput?.click()} class="w-full">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="mr-2 size-5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
					/>
				</svg>
				Choose File
			</Button>
		{/if}
	</div>

	{#if errorMessage}
		<Alert type="error" title="Error"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			onclick={() => {
				if (canCreate()) oncreate();
			}}
		>
			Create
		</Button>
	</div>
</Modal>
