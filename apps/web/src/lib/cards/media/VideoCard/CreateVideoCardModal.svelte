<script lang="ts">
	import { Alert, Button, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { uploadVideoToBsky, type UploadProgress } from './upload';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	// Bluesky's video service caps uploads; keep a friendly client-side guard.
	const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

	let errorMessage = $state('');
	let fileInput = $state<HTMLInputElement | undefined>(undefined);
	let fileName = $state('');
	let previewUrl = $state<string | undefined>(undefined);
	let progress = $state<UploadProgress | undefined>(undefined);

	let isUploading = $derived(
		progress?.phase === 'authorizing' ||
			progress?.phase === 'uploading' ||
			progress?.phase === 'processing'
	);
	let isReady = $derived(Boolean(item.cardData.video));

	/** Read intrinsic dimensions so we can store an (integer) aspect ratio. */
	function getAspectRatio(url: string): Promise<{ width: number; height: number } | undefined> {
		return new Promise((resolve) => {
			const video = document.createElement('video');
			video.preload = 'metadata';
			video.onloadedmetadata = () =>
				resolve({ width: video.videoWidth, height: video.videoHeight });
			video.onerror = () => resolve(undefined);
			video.src = url;
		});
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('video/')) {
			errorMessage = 'Please select a video file (mp4, mov, webm, …)';
			return;
		}
		if (file.size > MAX_SIZE) {
			errorMessage = 'Video is too large (max 100 MB)';
			return;
		}

		errorMessage = '';
		fileName = file.name;
		previewUrl = URL.createObjectURL(file);
		const aspectRatio = await getAspectRatio(previewUrl);

		try {
			const uploaded = await uploadVideoToBsky(file, (p) => (progress = p));
			item.cardData.video = uploaded.blob;
			if (aspectRatio) item.cardData.aspectRatio = aspectRatio;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Video upload failed';
			progress = undefined;
		}
	}

	function clearFile() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = undefined;
		fileName = '';
		progress = undefined;
		item.cardData.video = undefined;
		item.cardData.aspectRatio = undefined;
	}

	function progressLabel(p: UploadProgress): string {
		switch (p.phase) {
			case 'authorizing':
				return 'Preparing…';
			case 'uploading':
				return `Uploading… ${p.percent}%`;
			case 'processing':
				return p.percent != null ? `Processing… ${p.percent}%` : 'Processing…';
			case 'done':
				return 'Done';
		}
	}

	function progressPercent(p: UploadProgress): number {
		if (p.phase === 'uploading') return p.percent;
		if (p.phase === 'processing') return p.percent ?? 100;
		if (p.phase === 'done') return 100;
		return 0;
	}

	function handleCancel() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		oncancel();
	}

	function handleCreate() {
		if (!isReady) {
			errorMessage = 'Please upload a video first';
			return;
		}
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		oncreate();
	}
</script>

<Modal open={true} closeButton={false}>
	<Subheading>Add a Video</Subheading>

	<div>
		<p class="text-base-600 dark:text-base-400 mb-2 text-sm">
			Upload a video — it's hosted on Bluesky's video service and streamed from your account.
		</p>

		{#if previewUrl}
			<div class="bg-base-100 dark:bg-base-800 overflow-hidden rounded-lg border">
				<video
					src={previewUrl}
					muted
					loop
					autoplay
					playsinline
					class="aspect-video w-full object-cover"
				></video>
				<div class="flex items-center justify-between gap-2 p-3">
					<span class="truncate text-sm">{fileName}</span>
					{#if isReady}
						<Button size="sm" variant="ghost" onclick={clearFile}>Remove</Button>
					{/if}
				</div>

				{#if progress && isUploading}
					<div class="px-3 pb-3">
						<div class="text-base-600 dark:text-base-400 mb-1 text-xs">
							{progressLabel(progress)}
						</div>
						<div class="bg-base-200 dark:bg-base-700 h-1.5 w-full overflow-hidden rounded-full">
							<div
								class="bg-accent-500 h-full rounded-full transition-all duration-200"
								style="width: {progressPercent(progress)}%"
							></div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<input
				bind:this={fileInput}
				type="file"
				accept="video/*"
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
				Choose Video
			</Button>
		{/if}
	</div>

	{#if errorMessage}
		<Alert type="error" title="Error"><span>{errorMessage}</span></Alert>
	{/if}

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={handleCancel} variant="ghost">Cancel</Button>
		<Button onclick={handleCreate} disabled={!isReady || isUploading}>Create</Button>
	</div>
</Modal>
