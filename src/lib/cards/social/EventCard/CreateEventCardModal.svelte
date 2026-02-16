<script lang="ts">
	import { Alert, Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { getRecord } from '$lib/atproto/methods';
	import type { Did } from '@atcute/lexicons';

	const EVENT_COLLECTION = 'community.lexicon.calendar.event';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isValidating = $state(false);
	let errorMessage = $state('');
	let eventUrl = $state('');

	function parseEventUrl(url: string): { did: string; rkey: string } | null {
		// Match smokesignal.events URLs: https://smokesignal.events/{did}/{rkey}
		const smokesignalMatch = url.match(/^https?:\/\/smokesignal\.events\/(did:[^/]+)\/([^/?#]+)/);
		if (smokesignalMatch) {
			return { did: smokesignalMatch[1], rkey: smokesignalMatch[2] };
		}

		// Match AT URIs: at://{did}/community.lexicon.calendar.event/{rkey}
		const atUriMatch = url.match(/^at:\/\/(did:[^/]+)\/([^/]+)\/([^/?#]+)/);
		if (atUriMatch && atUriMatch[2] === EVENT_COLLECTION) {
			return { did: atUriMatch[1], rkey: atUriMatch[3] };
		}

		return null;
	}

	async function validateAndCreate() {
		errorMessage = '';
		isValidating = true;

		try {
			const parsed = parseEventUrl(eventUrl.trim());

			if (!parsed) {
				throw new Error('Invalid URL format');
			}

			// Validate the event exists by fetching the record directly
			const record = await getRecord({
				did: parsed.did as Did,
				collection: EVENT_COLLECTION,
				rkey: parsed.rkey
			});

			if (!record?.value) {
				throw new Error('Event not found');
			}

			// Store as AT URI
			item.cardData.uri = `at://${parsed.did}/${EVENT_COLLECTION}/${parsed.rkey}`;

			return true;
		} catch (err) {
			errorMessage =
				err instanceof Error && err.message === 'Event not found'
					? "Couldn't find that event. Please check the URL and try again."
					: 'Invalid URL. Please enter a valid event AT URI or smokesignal.events URL.';
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
		<Subheading>Enter an event URL</Subheading>
		<Input
			bind:value={eventUrl}
			placeholder="at://did:.../community.lexicon.calendar.event/..."
			class="mt-4"
		/>

		{#if errorMessage}
			<Alert type="error" title="Failed to create event card"><span>{errorMessage}</span></Alert>
		{/if}

		<p class="text-base-500 dark:text-base-400 mt-2 text-xs">
			Paste an AT URI for a calendar event or a smokesignal.events URL.
		</p>

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={isValidating || !eventUrl.trim()}
				>{isValidating ? 'Creating...' : 'Create'}</Button
			>
		</div>
	</form>
</Modal>
