<script lang="ts" module>
	export const customDomainModalState = $state({
		visible: false,
		show: () => (customDomainModalState.visible = true),
		hide: () => (customDomainModalState.visible = false)
	});
</script>

<script lang="ts">
	import { putRecord, getRecord, getHandleOrDid } from '$lib/atproto/methods';
	import { user } from '$lib/atproto';
	import { Button, Input } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import { launchConfetti } from '@foxui/visual';

	let { publicationUrl }: { publicationUrl?: string } = $props();

	let currentDomain = $derived(
		publicationUrl?.startsWith('https://') && !publicationUrl.includes('blento.app')
			? publicationUrl.replace('https://', '')
			: ''
	);

	let step: 'current' | 'input' | 'instructions' | 'verifying' | 'removing' | 'success' | 'error' =
		$state('input');
	let domain = $state('');
	let errorMessage = $state('');
	let errorHint = $state('');

	$effect(() => {
		if (customDomainModalState.visible) {
			step = currentDomain ? 'current' : 'input';
		} else {
			step = 'input';
			domain = '';
			errorMessage = '';
			errorHint = '';
		}
	});

	async function removeDomain() {
		step = 'removing';
		try {
			const existing = await getRecord({
				collection: 'site.standard.publication',
				rkey: 'blento.self'
			});

			if (existing?.value) {
				const { url: _url, ...rest } = existing.value as Record<string, unknown>;
				await putRecord({
					collection: 'site.standard.publication',
					rkey: 'blento.self',
					record: rest
				});
			}

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
		step = 'verifying';
		try {
			// Step 1: Verify DNS records
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

			// Step 2: Write URL to ATProto profile
			const existing = await getRecord({
				collection: 'site.standard.publication',
				rkey: 'blento.self'
			});

			await putRecord({
				collection: 'site.standard.publication',
				rkey: 'blento.self',
				record: {
					...(existing?.value || {}),
					url: 'https://' + domain
				}
			});

			// Step 3: Activate domain in KV (server verifies profile has the URL)
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

			// Refresh cached profile
			if (user.profile) {
				fetch(`/${getHandleOrDid(user.profile)}/api/refresh`).catch(() => {});
			}

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

<Modal bind:open={customDomainModalState.visible}>
	{#if step === 'current'}
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Custom Domain
		</h3>

		<div
			class="bg-base-200 dark:bg-base-700 mt-2 flex items-center justify-between rounded-2xl px-3 py-2 font-mono text-sm"
		>
			<span>{currentDomain}</span>
		</div>

		<div class="mt-4 flex gap-2">
			<Button variant="ghost" onclick={removeDomain}>Remove</Button>
			<Button variant="ghost" onclick={() => (step = 'input')}>Change</Button>
			<Button onclick={() => customDomainModalState.hide()}>Close</Button>
		</div>
	{:else if step === 'input'}
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Custom Domain
		</h3>

		<Input type="text" bind:value={domain} placeholder="mydomain.com" />

		<div class="mt-4 flex gap-2">
			<Button variant="ghost" onclick={() => customDomainModalState.hide()}>Cancel</Button>
			<Button onclick={goToInstructions} disabled={!domain.trim()}>Next</Button>
		</div>
	{:else if step === 'instructions'}
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Set up your domain
		</h3>

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
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Verifying...
		</h3>

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
	{:else if step === 'removing'}
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Removing...
		</h3>

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
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Domain verified!
		</h3>

		<p class="text-base-800 dark:text-base-200 mt-2 text-sm">
			Your custom domain {domain} has been set up successfully.
		</p>

		<div class="mt-4">
			<Button onclick={() => customDomainModalState.hide()}>Close</Button>
		</div>
	{:else if step === 'error'}
		<h3 class="text-base-900 dark:text-base-100 font-semibold" id="custom-domain-modal-title">
			Verification failed
		</h3>

		<p class="mt-2 text-sm text-red-500 dark:text-red-400">
			{errorMessage}
		</p>
		{#if errorHint}
			<p class="mt-1 text-sm font-bold text-red-500 dark:text-red-400">
				{errorHint}
			</p>
		{/if}

		<div class="mt-4 flex gap-2">
			<Button variant="ghost" onclick={() => customDomainModalState.hide()}>Close</Button>
			<Button onclick={verify}>Retry</Button>
		</div>
	{/if}
</Modal>
