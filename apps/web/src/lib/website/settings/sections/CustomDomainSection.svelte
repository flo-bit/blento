<script lang="ts">
	import { getClient, putRecord } from '$lib/atproto/methods';
	import { user } from '$lib/atproto';
	import type { WebsiteData } from '$lib/types';
	import { Button, Input } from '@foxui/core';
	import { launchConfetti } from '@foxui/visual';
	import { untrack } from 'svelte';
	import { settingsOverlayState } from '../SettingsOverlay.svelte';

	let { data = $bindable() }: { data: WebsiteData } = $props();

	// The domain always belongs to the home page, even when this is opened from a sub-page editor.
	let homeUrl: string | undefined = $state();
	let currentDomain = $derived(domainOf(homeUrl));
	// The domain bound when the section was opened, released once it is replaced.
	let previousDomain = '';

	let step:
		| 'loading'
		| 'current'
		| 'input'
		| 'instructions'
		| 'verifying'
		| 'removing'
		| 'success'
		| 'error' = $state('input');
	let rawDomain = $state('');
	let domain = $derived(rawDomain.replace(/^https?:\/\//, '').replace(/\/+$/, ''));
	let errorMessage = $state('');
	let errorHint = $state('');
	let failedAction: 'load' | 'verify' | 'remove' = $state('verify');

	$effect(() => {
		if (settingsOverlayState.visible && settingsOverlayState.activeSection === 'domain') {
			untrack(loadCurrentDomain);
		}
	});

	function domainOf(url: string | undefined) {
		try {
			const { protocol, hostname } = new URL(url ?? '');
			return protocol === 'https:' && hostname !== 'blento.app' ? hostname : '';
		} catch {
			return '';
		}
	}

	async function loadCurrentDomain() {
		if (data.page === 'blento.self') {
			homeUrl = data.publication?.url;
		} else {
			failedAction = 'load';
			step = 'loading';
			try {
				homeUrl = (await getHomePageRecord()).url as string | undefined;
			} catch (err: unknown) {
				errorMessage = err instanceof Error ? err.message : String(err);
				errorHint = '';
				step = 'error';
				return;
			}
		}
		previousDomain = currentDomain;
		step = currentDomain ? 'current' : 'input';
	}

	// Read the stored home record rather than the editor state, so unsaved edits (and un-uploaded
	// icons) are not written along with the url. Home pages not re-saved since the move to
	// app.blento.page still only have the legacy record.
	async function getHomePageRecord(): Promise<Record<string, unknown>> {
		const did = user.did!;
		const client = await getClient({ did });
		for (const collection of ['app.blento.page', 'site.standard.publication'] as const) {
			const res = await client.get('com.atproto.repo.getRecord', {
				params: { repo: did, collection, rkey: 'blento.self' }
			});
			if (res.ok) return { ...(res.data.value as Record<string, unknown>) };
			// Only a missing record means "try the next one": on any other failure, writing
			// { url } on top of an empty record would wipe the home page's metadata.
			if (res.data.error !== 'RecordNotFound') {
				throw new Error(res.data.message ?? 'Failed to load your home page record.');
			}
		}
		return {};
	}

	async function setHomeUrl(url: string) {
		const record = await getHomePageRecord();
		await putRecord({
			collection: 'app.blento.page',
			rkey: 'blento.self',
			record: { ...record, url }
		});
		homeUrl = url;
		if (data.page === 'blento.self' && data.publication) data.publication.url = url;
	}

	async function unbindDomain(domain: string) {
		const res = await fetch('/api/activate-domain', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ domain })
		});
		if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove domain');
	}

	async function removeDomain() {
		failedAction = 'remove';
		step = 'removing';
		try {
			await unbindDomain(currentDomain);
			await setHomeUrl(`https://blento.app/${data.handle}`);
			previousDomain = '';
			step = 'input';
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : String(err);
			step = 'error';
		}
	}

	function goToInstructions() {
		if (!domain.trim()) return;
		step = 'instructions';
	}

	async function verify() {
		failedAction = 'verify';
		step = 'verifying';
		try {
			const dnsRes = await fetch('/api/verify-domain', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ domain })
			});

			const dnsData = await dnsRes.json();

			if (!dnsRes.ok || dnsData.error) {
				errorMessage = dnsData.error;
				errorHint = dnsData.hint || '';
				step = 'error';
				return;
			}

			await setHomeUrl('https://' + domain);

			const activateRes = await fetch('/api/activate-domain', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ did: user.did, domain })
			});

			const activateData = await activateRes.json();

			if (!activateRes.ok || activateData.error) {
				errorMessage = activateData.error;
				errorHint = '';
				step = 'error';
				return;
			}

			// Changing domains: release the old one so it stops serving this site.
			if (previousDomain && previousDomain !== domain.toLowerCase()) {
				await unbindDomain(previousDomain).catch(() => {});
			}
			previousDomain = domain.toLowerCase();

			launchConfetti();
			step = 'success';
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : String(err);
			step = 'error';
		}
	}

	async function copyToClipboard(text: string) {
		await navigator.clipboard.writeText(text);
	}
</script>

{#if step === 'current'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Custom Domain</h3>

	<div
		class="bg-base-200 dark:bg-base-700 mt-3 flex items-center justify-between rounded-2xl px-3 py-2 font-mono text-sm"
	>
		<span>{currentDomain}</span>
	</div>

	<div class="mt-4 flex gap-2">
		<Button variant="ghost" onclick={removeDomain}>Remove</Button>
		<Button variant="ghost" onclick={() => (step = 'input')}>Change</Button>
		<Button onclick={() => settingsOverlayState.hide()}>Close</Button>
	</div>
{:else if step === 'input'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Custom Domain</h3>

	<div class="mt-3">
		<Input type="text" bind:value={rawDomain} placeholder="mydomain.com" />
	</div>

	<div class="mt-4 flex gap-2">
		<Button variant="ghost" onclick={() => settingsOverlayState.hide()}>Cancel</Button>
		<Button onclick={goToInstructions} disabled={!domain.trim()}>Next</Button>
	</div>
{:else if step === 'instructions'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Set up your domain</h3>

	<p class="text-base-800 dark:text-base-200 mt-2 text-sm">
		Add a CNAME record for your domain pointing to:
	</p>

	<div
		class="bg-base-200 dark:bg-base-700 mt-2 flex items-center justify-between rounded-2xl px-3 py-2 font-mono text-sm"
	>
		<span>blento-proxy.fly.dev</span>
		<button
			class="text-base-600 hover:text-base-900 dark:text-base-400 dark:hover:text-base-100 ml-2 cursor-pointer"
			onclick={() => copyToClipboard('blento-proxy.fly.dev')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
				/>
			</svg>
			<span class="sr-only">Copy to clipboard</span>
		</button>
	</div>

	<div class="mt-4 flex gap-2">
		<Button variant="ghost" onclick={() => (step = 'input')}>Back</Button>
		<Button onclick={verify}>Verify</Button>
	</div>
{:else if step === 'verifying'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Verifying...</h3>

	<p class="text-base-800 dark:text-base-200 mt-2 text-sm">
		Checking DNS records and verifying your domain.
	</p>

	<div class="mt-4 flex items-center gap-2">
		<svg
			class="text-base-500 size-5 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
		<span class="text-base-600 dark:text-base-400 text-sm">Verifying...</span>
	</div>
{:else if step === 'loading'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Custom Domain</h3>

	<div class="mt-4 flex items-center gap-2">
		<svg
			class="text-base-500 size-5 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
		<span class="text-base-600 dark:text-base-400 text-sm">Loading...</span>
	</div>
{:else if step === 'removing'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Removing...</h3>

	<div class="mt-4 flex items-center gap-2">
		<svg
			class="text-base-500 size-5 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
		<span class="text-base-600 dark:text-base-400 text-sm">Removing domain...</span>
	</div>
{:else if step === 'success'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Domain verified!</h3>

	<p class="text-base-800 dark:text-base-200 mt-2 text-sm">
		Your custom domain {domain} has been set up successfully.
	</p>

	<div class="mt-4">
		<Button onclick={() => settingsOverlayState.hide()}>Close</Button>
	</div>
{:else if step === 'error'}
	<h3 class="text-base-900 dark:text-base-100 text-lg font-semibold">Verification failed</h3>

	<p class="mt-2 text-sm text-red-500 dark:text-red-400">
		{errorMessage}
	</p>
	{#if errorHint}
		<p class="mt-1 text-sm font-bold text-red-500 dark:text-red-400">
			{errorHint}
		</p>
	{/if}

	<div class="mt-4 flex gap-2">
		<Button variant="ghost" onclick={() => settingsOverlayState.hide()}>Close</Button>
		<Button
			onclick={failedAction === 'load'
				? loadCurrentDomain
				: failedAction === 'remove'
					? removeDomain
					: verify}>Retry</Button
		>
	</div>
{/if}
