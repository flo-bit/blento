<script lang="ts">
	import { user } from '$lib/atproto/auth.svelte';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { uploadBlob, createTID } from '$lib/atproto/methods';
	import { compressImage } from '$lib/atproto/image-helper';
	import { Button } from '@foxui/core';
	import { goto } from '$app/navigation';

	let title = $state('');
	let description = $state('');
	let content = $state('');
	let coverFile: File | null = $state(null);
	let coverPreview: string | null = $state(null);
	let submitting = $state(false);
	let error: string | null = $state(null);

	let fileInput: HTMLInputElement | undefined = $state();

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		coverFile = file;
		if (coverPreview) URL.revokeObjectURL(coverPreview);
		coverPreview = URL.createObjectURL(file);
	}

	function removeCover() {
		coverFile = null;
		if (coverPreview) {
			URL.revokeObjectURL(coverPreview);
			coverPreview = null;
		}
		if (fileInput) fileInput.value = '';
	}

	async function handleSubmit() {
		error = null;

		if (!title.trim()) {
			error = 'Title is required.';
			return;
		}
		if (!user.client || !user.did) {
			error = 'You must be logged in.';
			return;
		}

		submitting = true;

		try {
			let coverImage: unknown | undefined;

			if (coverFile) {
				const compressed = await compressImage(coverFile);
				const blobRef = await uploadBlob({ blob: compressed.blob });
				if (blobRef) {
					coverImage = blobRef;
				}
			}

			const rkey = createTID();

			const record: Record<string, unknown> = {
				$type: 'site.standard.document',
				title: title.trim(),
				content: { $type: 'app.blento.markdown', value: content },
				site: `at://${user.did}/site.standard.publication/blento.self`,
				path: `/blog/${rkey}`,
				publishedAt: new Date().toISOString()
			};

			if (description.trim()) {
				record.description = description.trim();
			}
			if (coverImage) {
				record.coverImage = coverImage;
			}

			const response = await user.client.post('com.atproto.repo.createRecord', {
				input: {
					collection: 'site.standard.document',
					repo: user.did,
					rkey,
					record
				}
			});

			if (response.ok) {
				const handle =
					user.profile?.handle && user.profile.handle !== 'handle.invalid'
						? user.profile.handle
						: user.did;
				goto(`/${handle}/blog/${rkey}`);
			} else {
				error = 'Failed to create post. Please try again.';
			}
		} catch (e) {
			console.error('Failed to create post:', e);
			error = 'Failed to create post. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Create Blog Post</title>
</svelte:head>

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12">
	<div class="mx-auto max-w-2xl">
		<h1 class="text-base-900 dark:text-base-50 mb-8 text-3xl font-bold">Create Blog Post</h1>

		{#if user.isInitializing}
			<div class="flex items-center gap-3">
				<div class="bg-base-300 dark:bg-base-700 size-5 animate-pulse rounded-full"></div>
				<div class="bg-base-300 dark:bg-base-700 h-4 w-48 animate-pulse rounded"></div>
			</div>
		{:else if !user.isLoggedIn}
			<div
				class="border-base-200 dark:border-base-800 bg-base-100 dark:bg-base-900/50 rounded-2xl border p-8 text-center"
			>
				<p class="text-base-600 dark:text-base-400 mb-4">Log in to create a blog post.</p>
				<Button onclick={() => loginModalState.show()}>Log in</Button>
			</div>
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-6"
			>
				<!-- Cover image -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="cover"
					>
						Cover image
					</label>
					<input
						bind:this={fileInput}
						type="file"
						id="cover"
						accept="image/*"
						onchange={onFileChange}
						class="hidden"
					/>
					{#if coverPreview}
						<div class="relative inline-block">
							<img
								src={coverPreview}
								alt="Cover preview"
								class="border-base-200 dark:border-base-700 h-40 w-40 rounded-xl border object-cover"
							/>
							<button
								type="button"
								onclick={removeCover}
								aria-label="Remove cover image"
								class="bg-base-900/70 absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full text-white hover:bg-red-600"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									class="size-3.5"
								>
									<path
										d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
									/>
								</svg>
							</button>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => fileInput?.click()}
							class="border-base-300 dark:border-base-700 hover:border-base-400 dark:hover:border-base-600 text-base-500 dark:text-base-400 flex h-40 w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="mb-1 size-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
								/>
							</svg>
							<span class="text-xs">Upload image</span>
						</button>
					{/if}
				</div>

				<!-- Title -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="title"
					>
						Title <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						required
						placeholder="Post title"
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<!-- Description -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="description"
					>
						Description
					</label>
					<textarea
						id="description"
						bind:value={description}
						rows={2}
						placeholder="A short summary of the post"
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
				</div>

				<!-- Content -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="content"
					>
						Content
					</label>
					<textarea
						id="content"
						bind:value={content}
						rows={12}
						placeholder="Write your post content in markdown..."
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 w-full rounded-lg border px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
				</div>

				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}

				<Button type="submit" disabled={submitting} class="w-full">
					{submitting ? 'Publishing...' : 'Publish Post'}
				</Button>
			</form>
		{/if}
	</div>
</div>
