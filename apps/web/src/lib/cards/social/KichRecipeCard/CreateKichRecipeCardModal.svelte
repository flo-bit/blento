<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import type { Did, Handle } from '@atcute/lexicons';
	import { getRecord, parseUri, resolveHandle } from '$lib/atproto';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';

	const KICH_RECIPE_COLLECTION = 'io.kich.recipe.recipe';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isValidating = $state(false);
	let errorMessage = $state('');
	let recipeUri = $state('');

	function parseKichRecipeInput(
		input: string
	):
		| { type: 'at'; did: string; rkey: string }
		| { type: 'url'; handle: string; rkey: string }
		| null {
		const trimmed = input.trim();

		// at://did:.../io.kich.recipe.recipe/{rkey}
		const parsedAt = parseUri(trimmed);
		if (parsedAt?.repo && parsedAt?.rkey && parsedAt.collection === KICH_RECIPE_COLLECTION) {
			return { type: 'at', did: parsedAt.repo, rkey: parsedAt.rkey };
		}

		// https://kich.io/profile/{handle}/recipe/{rkey}
		const kichMatch = trimmed.match(
			/^https?:\/\/(?:www\.)?kich\.io\/profile\/([^/]+)\/recipe\/([^/?#]+)\/?$/i
		);
		if (kichMatch) {
			return { type: 'url', handle: decodeURIComponent(kichMatch[1]), rkey: kichMatch[2] };
		}

		return null;
	}

	async function validateAndCreate() {
		errorMessage = '';
		isValidating = true;

		try {
			const parsed = parseKichRecipeInput(recipeUri);
			if (!parsed) {
				throw new Error('Invalid recipe input');
			}

			const did =
				parsed.type === 'at'
					? parsed.did
					: await resolveHandle({ handle: parsed.handle as Handle }).catch(() => undefined);

			if (!did) {
				throw new Error('Could not resolve handle');
			}

			const record = await getRecord({
				did: did as Did,
				collection: KICH_RECIPE_COLLECTION,
				rkey: parsed.rkey
			});

			if (!record?.value) {
				throw new Error('Recipe not found');
			}

			item.cardData.uri = `at://${did}/${KICH_RECIPE_COLLECTION}/${parsed.rkey}`;
			item.cardData.kichHandle = parsed.type === 'url' ? parsed.handle : did;
			item.cardData.href = `https://kich.io/profile/${item.cardData.kichHandle}/recipe/${parsed.rkey}`;
			return true;
		} catch {
			errorMessage =
				'Enter an AT URI (at://...) or a Kich URL (https://kich.io/profile/{handle}/recipe/...).';
			return false;
		} finally {
			isValidating = false;
		}
	}
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={async () => {
			if (await validateAndCreate()) oncreate();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a Kich recipe URL or AT URI</Subheading>
		<Input
			bind:value={recipeUri}
			placeholder="https://kich.io/profile/hipstersmoothie.com/recipe/..."
			class="mt-4"
		/>

		{#if errorMessage}
			<Alert type="error" title="Failed to create recipe card"><span>{errorMessage}</span></Alert>
		{/if}

		<p class="text-base-500 dark:text-base-400 mt-2 text-xs">
			Paste an AT URI or a <code>kich.io/profile/hipstersmoothie.com/recipe/...</code> URL.
		</p>

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={isValidating || !recipeUri.trim()}
				>{isValidating ? 'Creating...' : 'Create'}</Button
			>
		</div>
	</form>
</Modal>
