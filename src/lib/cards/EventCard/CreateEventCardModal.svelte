<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

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

			// Validate the event exists by fetching it
			const response = await fetch(
				`https://smokesignal.events/xrpc/community.lexicon.calendar.GetEvent?repository=${encodeURIComponent(parsed.did)}&record_key=${encodeURIComponent(parsed.rkey)}`
			);

			if (!response.ok) {
				throw new Error('Event not found');
			}

			// Store as AT URI
			item.cardData.uri = `at://${parsed.did}/${EVENT_COLLECTION}/${parsed.rkey}`;

			return true;
		} catch (err) {
			errorMessage =
				err instanceof Error && err.message === 'Event not found'
					? "Couldn't find that event. Please check the URL and try again."
					: 'Invalid URL. Please enter a valid smokesignal.events URL or AT URI.';
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
		<Subheading>Enter a Smoke Signal event URL</Subheading>
		<Input
			bind:value={eventUrl}
			placeholder="https://smokesignal.events/did:.../..."
			class="mt-4"
		/>

		{#if errorMessage}
			<Alert type="error" title="Failed to create event card"><span>{errorMessage}</span></Alert>
		{/if}

		<p class="text-base-500 dark:text-base-400 mt-2 text-xs">
			Paste a URL from <a
				href="https://smokesignal.events"
				class="text-accent-800 dark:text-accent-300"
				target="_blank">smokesignal.events</a
			> or an AT URI for a calendar event.
		</p>

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={isValidating || !eventUrl.trim()}
				>{isValidating ? 'Creating...' : 'Create'}</Button
			>
		</div>
	</form>
</Modal>
