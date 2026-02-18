<script lang="ts">
	import { user } from '$lib/atproto/auth.svelte';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { uploadBlob, createTID } from '$lib/atproto/methods';
	import { compressImage } from '$lib/atproto/image-helper';
	import { Button } from '@foxui/core';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { RichTextEditor } from '$lib/components/rich-text-editor';
	import { putImage, getImage, clearImages } from '$lib/components/image-store';
	import type { Editor, Content } from '@tiptap/core';

	const DRAFT_KEY = 'blog-draft';

	let title = $state('');
	let description = $state('');
	let coverFile: File | null = $state(null);
	let coverPreview: string | null = $state(null);
	let submitting = $state(false);
	let error: string | null = $state(null);
	let hasDraft = $state(false);
	let editorInstance: Editor | null = $state(null);
	let editorContent: Content = $state({});
	let draftRestored = $state(false);

	let fileInput: HTMLInputElement | undefined = $state();

	// blob URL <-> IndexedDB key mappings
	const blobToKeyMap = new SvelteMap<string, string>();
	const keyToBlobMap = new SvelteMap<string, string>();

	// ── Image tracking ──

	function findImageSrcs(node: unknown): string[] {
		const srcs: string[] = [];
		function walk(n: Record<string, unknown>) {
			if (!n) return;
			if (n.type === 'image' && typeof (n.attrs as Record<string, unknown>)?.src === 'string') {
				srcs.push((n.attrs as Record<string, string>).src);
			}
			if (Array.isArray(n.content)) (n.content as Record<string, unknown>[]).forEach(walk);
		}
		walk(node as Record<string, unknown>);
		return srcs;
	}

	async function trackNewImages(content: Content) {
		const srcs = findImageSrcs(content);
		for (const src of srcs) {
			if (src.startsWith('blob:') && !blobToKeyMap.has(src)) {
				try {
					const response = await fetch(src);
					const blob = await response.blob();
					const key = crypto.randomUUID();
					await putImage(key, blob, 'image');
					blobToKeyMap.set(src, key);
					keyToBlobMap.set(key, src);
				} catch (e) {
					console.error('Failed to store image in IndexedDB:', e);
				}
			}
		}
	}

	// ── Draft management ──

	function serializeContent(content: Content): Content {
		const json = JSON.parse(JSON.stringify(content));
		function walk(node: Record<string, unknown>) {
			if (!node) return;
			const attrs = node.attrs as Record<string, string> | undefined;
			if (node.type === 'image' && attrs?.src && blobToKeyMap.has(attrs.src)) {
				attrs.src = `idb://${blobToKeyMap.get(attrs.src)}`;
			}
			if (Array.isArray(node.content)) (node.content as Record<string, unknown>[]).forEach(walk);
		}
		walk(json as Record<string, unknown>);
		return json;
	}

	let saveTimeout: ReturnType<typeof setTimeout> | undefined;

	function scheduleSaveDraft() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveDraft, 500);
	}

	function saveDraft() {
		const draft: Record<string, unknown> = {
			title,
			description,
			content: serializeContent(editorContent),
			updatedAt: Date.now()
		};
		if (coverPreview && blobToKeyMap.has(coverPreview)) {
			draft.coverImageKey = blobToKeyMap.get(coverPreview);
		}
		localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
		hasDraft = true;
	}

	async function restoreDraft() {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return;

		try {
			const draft = JSON.parse(raw);
			title = draft.title || '';
			description = draft.description || '';

			const content = draft.content;
			if (content) {
				// Collect all idb:// keys needed
				const idbKeys: string[] = [];
				function collectKeys(node: Record<string, unknown>) {
					if (!node) return;
					const attrs = node.attrs as Record<string, string> | undefined;
					if (node.type === 'image' && attrs?.src?.startsWith('idb://')) {
						idbKeys.push(attrs.src.replace('idb://', ''));
					}
					if (Array.isArray(node.content))
						(node.content as Record<string, unknown>[]).forEach(collectKeys);
				}
				collectKeys(content);
				if (draft.coverImageKey) idbKeys.push(draft.coverImageKey);

				// Load images from IndexedDB and create blob URLs
				for (const key of idbKeys) {
					const img = await getImage(key);
					if (img) {
						const blobUrl = URL.createObjectURL(img.blob);
						blobToKeyMap.set(blobUrl, key);
						keyToBlobMap.set(key, blobUrl);
					}
				}

				// Replace idb:// references with new blob URLs
				function replaceRefs(node: Record<string, unknown>) {
					if (!node) return;
					const attrs = node.attrs as Record<string, string> | undefined;
					if (node.type === 'image' && attrs?.src?.startsWith('idb://')) {
						const key = attrs.src.replace('idb://', '');
						const blobUrl = keyToBlobMap.get(key);
						if (blobUrl) attrs.src = blobUrl;
					}
					if (Array.isArray(node.content))
						(node.content as Record<string, unknown>[]).forEach(replaceRefs);
				}
				replaceRefs(content);
				editorContent = content;
			}

			// Restore cover image
			if (draft.coverImageKey) {
				const blobUrl = keyToBlobMap.get(draft.coverImageKey);
				if (blobUrl) {
					coverPreview = blobUrl;
					const img = await getImage(draft.coverImageKey);
					if (img) {
						coverFile = new File([img.blob], img.name, { type: img.blob.type });
					}
				}
			}

			hasDraft = true;
		} catch (e) {
			console.error('Failed to restore draft:', e);
		}
	}

	function clearDraft() {
		localStorage.removeItem(DRAFT_KEY);
		clearImages();
		hasDraft = false;
	}

	function discardDraft() {
		clearDraft();
		title = '';
		description = '';
		coverFile = null;
		if (coverPreview) URL.revokeObjectURL(coverPreview);
		coverPreview = null;
		editorContent = {};
		editorInstance?.commands.clearContent();
	}

	// ── Cover image ──

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		coverFile = file;
		if (coverPreview) URL.revokeObjectURL(coverPreview);
		coverPreview = URL.createObjectURL(file);

		const key = crypto.randomUUID();
		blobToKeyMap.set(coverPreview, key);
		keyToBlobMap.set(key, coverPreview);
		putImage(key, file, file.name);
		scheduleSaveDraft();
	}

	function removeCover() {
		coverFile = null;
		if (coverPreview) {
			URL.revokeObjectURL(coverPreview);
			coverPreview = null;
		}
		if (fileInput) fileInput.value = '';
		scheduleSaveDraft();
	}

	// ── Publish ──

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
			// Upload cover image
			let coverImageBlob: unknown | undefined;
			if (coverFile) {
				const compressed = await compressImage(coverFile);
				const blobRef = await uploadBlob({ blob: compressed.blob });
				if (blobRef) coverImageBlob = blobRef;
			}

			// Convert content to markdown using tiptap's built-in markdown support
			let markdown = editorInstance?.getMarkdown() ?? '';

			// Upload all blob:// images and replace with CDN URLs
			const blobUrlRegex = /!\[([^\]]*)\]\((blob:[^)]+)\)/g;
			const matches = [...markdown.matchAll(blobUrlRegex)];

			for (const match of matches) {
				const blobUrl = match[2];
				try {
					const response = await fetch(blobUrl);
					const blob = await response.blob();
					const file = new File([blob], 'image.jpg', { type: blob.type });
					const compressed = await compressImage(file);
					const blobRef = await uploadBlob({ blob: compressed.blob });
					if (blobRef) {
						const cdnUrl = `https://cdn.bsky.app/img/feed_fullsize/plain/${user.did}/${blobRef.ref.$link}@jpeg`;
						markdown = markdown.replaceAll(blobUrl, cdnUrl);
					}
				} catch (e) {
					console.error('Failed to upload inline image:', e);
				}
			}

			const rkey = createTID();

			const record: Record<string, unknown> = {
				$type: 'site.standard.document',
				title: title.trim(),
				content: { $type: 'app.blento.markdown', value: markdown },
				site: `at://${user.did}/site.standard.publication/blento.self`,
				path: `/blog/${rkey}`,
				publishedAt: new Date().toISOString()
			};

			if (description.trim()) record.description = description.trim();
			if (coverImageBlob) record.coverImage = coverImageBlob;

			const response = await user.client.post('com.atproto.repo.createRecord', {
				input: {
					collection: 'site.standard.document',
					repo: user.did,
					rkey,
					record
				}
			});

			if (response.ok) {
				clearDraft();
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

	// ── Editor callbacks ──

	function onEditorUpdate(content: Content) {
		editorContent = content;
		trackNewImages(content);
		scheduleSaveDraft();
	}

	function onTitleInput() {
		scheduleSaveDraft();
	}

	function onDescriptionInput() {
		scheduleSaveDraft();
	}

	// ── Lifecycle ──

	onMount(async () => {
		await restoreDraft();
		draftRestored = true;
	});

	onDestroy(() => {
		clearTimeout(saveTimeout);
		for (const blobUrl of blobToKeyMap.keys()) {
			URL.revokeObjectURL(blobUrl);
		}
	});
</script>

<svelte:head>
	<title>Create Blog Post</title>
</svelte:head>

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12">
	<div class="mx-auto max-w-3xl">
		{#if user.isInitializing || !draftRestored}
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
			<!-- Draft badge -->
			{#if hasDraft}
				<div class="mb-6 flex items-center gap-3">
					<span
						class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
					>
						Draft
					</span>
					<button
						type="button"
						onclick={discardDraft}
						class="text-base-400 dark:text-base-500 text-xs transition-colors hover:text-red-500 dark:hover:text-red-400"
					>
						Discard draft
					</button>
				</div>
			{/if}

			<!-- Cover image — full-width like the blog post view -->
			<input
				bind:this={fileInput}
				type="file"
				id="cover"
				accept="image/*"
				onchange={onFileChange}
				class="hidden"
			/>
			{#if coverPreview}
				<div class="group relative mb-8">
					<img
						src={coverPreview}
						alt="Cover preview"
						class="aspect-video w-full rounded-2xl object-cover"
					/>
					<div
						class="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100"
					>
						<button
							type="button"
							onclick={() => fileInput?.click()}
							class="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white"
						>
							Replace
						</button>
						<button
							type="button"
							onclick={removeCover}
							class="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-white"
						>
							Remove
						</button>
					</div>
				</div>
			{:else}
				<button
					type="button"
					onclick={() => fileInput?.click()}
					class="border-base-300 dark:border-base-700 hover:border-base-400 dark:hover:border-base-600 text-base-400 dark:text-base-500 mb-8 flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="mb-2 size-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
						/>
					</svg>
					<span class="text-sm">Add cover image</span>
				</button>
			{/if}

			<!-- Title & description — styled like the blog post header -->
			<header class="mb-8">
				<input
					type="text"
					bind:value={title}
					oninput={onTitleInput}
					placeholder="Post title"
					class="text-base-900 dark:text-base-50 placeholder:text-base-300 dark:placeholder:text-base-700 mb-4 w-full border-none bg-transparent text-3xl leading-tight font-bold outline-none sm:text-4xl"
				/>
				<textarea
					bind:value={description}
					oninput={onDescriptionInput}
					placeholder="A short description (optional)"
					rows={1}
					class="text-base-500 dark:text-base-400 placeholder:text-base-300 dark:placeholder:text-base-700 w-full resize-none border-none bg-transparent text-sm leading-relaxed outline-none"
				></textarea>
			</header>

			<!-- Rich text editor — styled like the blog post content area -->
			<article
				class="prose dark:prose-invert prose-base prose-neutral prose-a:text-accent-600 dark:prose-a:text-accent-400 prose-img:rounded-xl mb-12 max-w-none"
			>
				<RichTextEditor
					bind:editor={editorInstance}
					content={editorContent}
					placeholder="Start writing..."
					onupdate={onEditorUpdate}
				/>
			</article>

			{#if error}
				<p class="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}

			<div class="border-base-200 dark:border-base-800 border-t pt-6">
				<Button onclick={handleSubmit} disabled={submitting} class="w-full">
					{submitting ? 'Publishing...' : 'Publish Post'}
				</Button>
			</div>
		{/if}
	</div>
</div>
