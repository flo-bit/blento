<script lang="ts">
	import { deleteRecord, listRecords, parseUri } from '$lib/atproto/methods';
	import { user, logout } from '$lib/atproto';
	import { Button } from '@foxui/core';
	import type { Did } from '@atcute/lexicons';
	import { settingsOverlayState } from '../SettingsOverlay.svelte';

	const blentoCollections = [
		'app.blento.card',
		'app.blento.page',
		'app.blento.section',
		'app.blento.settings',
		'site.standard.publication'
	] as const;

	let deleteConfirm = $state(false);
	let isDeleting = $state(false);
	let deleteError = $state('');

	async function deleteAllData() {
		if (!user.did) return;
		isDeleting = true;
		deleteError = '';

		try {
			for (const collection of blentoCollections) {
				const records = await listRecords({
					did: user.did as Did,
					collection,
					limit: 0
				});
				for (const record of records) {
					const parsed = parseUri(record.uri);
					if (!parsed?.rkey) continue;
					if (collection === 'site.standard.publication' && !parsed.rkey.startsWith('blento.')) {
						continue;
					}
					await deleteRecord({ collection, rkey: parsed.rkey });
				}
			}

			settingsOverlayState.hide();
			logout();
		} catch (err: unknown) {
			deleteError = err instanceof Error ? err.message : String(err);
		} finally {
			isDeleting = false;
		}
	}
</script>

<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Account</h3>

<div class="mt-6">
	<Button
		variant="ghost"
		onclick={() => {
			settingsOverlayState.hide();
			logout();
		}}
	>
		Logout
	</Button>
</div>

<div
	class="mt-6 rounded-xl border border-red-200 bg-red-100 p-4 dark:border-red-800 dark:bg-red-950/40"
>
	<h4 class="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h4>

	<p class="text-base-600 dark:text-base-400 mt-2 text-sm">
		Delete all your Blento data (cards, pages, sections, and settings). This does
		<strong>not</strong> delete your account — only your Blento site data stored in your PDS.
	</p>

	{#if deleteError}
		<p class="mt-2 text-sm text-red-500 dark:text-red-400">{deleteError}</p>
	{/if}

	{#if !deleteConfirm}
		<Button
			variant="ghost"
			class="mt-3 text-red-600 dark:text-red-400"
			onclick={() => (deleteConfirm = true)}
		>
			Delete all my data
		</Button>
	{:else}
		<p class="text-base-800 dark:text-base-200 mt-3 text-sm font-medium">
			Are you sure? This cannot be undone.
		</p>
		<div class="mt-2 flex gap-2">
			<Button variant="ghost" onclick={() => (deleteConfirm = false)} disabled={isDeleting}>
				Cancel
			</Button>
			<Button onclick={deleteAllData} disabled={isDeleting} variant="red">
				{isDeleting ? 'Deleting...' : 'Yes, delete everything'}
			</Button>
		</div>
	{/if}
</div>
