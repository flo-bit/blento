<script lang="ts">
	import type { ContentComponentProps } from '../../types';

	let { item }: ContentComponentProps = $props();

	let email = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');

	const username = $derived((item.cardData.username as string | undefined)?.trim() ?? '');
	const title = $derived((item.cardData.title as string | undefined) || 'Subscribe');
	const description = $derived(item.cardData.description as string | undefined);
	const buttonText = $derived((item.cardData.buttonText as string | undefined) || 'Subscribe');
	const placeholder = $derived(
		(item.cardData.placeholder as string | undefined) || 'you@example.com'
	);
	const successMessage = $derived(
		(item.cardData.successMessage as string | undefined) || 'Thanks! Check your inbox to confirm.'
	);

	const action = $derived(
		username
			? `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(username)}`
			: ''
	);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!username || !email.trim() || status === 'submitting') return;

		status = 'submitting';
		try {
			const body = new FormData();
			body.append('email', email.trim());
			body.append('embed', '1');
			await fetch(action, { method: 'POST', mode: 'no-cors', body });
			status = 'success';
			email = '';
		} catch {
			status = 'error';
		}
	}
</script>

<div class="flex h-full w-full flex-col justify-center gap-2 p-4">
	{#if status === 'success'}
		<div class="flex h-full flex-col items-center justify-center gap-2 text-center">
			<div
				class="bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200 accent:bg-white/20 accent:text-white flex size-10 items-center justify-center rounded-full"
				aria-hidden="true"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2.5"
					stroke="currentColor"
					class="size-5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
			</div>
			<p class="text-base-900 dark:text-base-100 accent:text-base-900 text-sm font-medium">
				{successMessage}
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-1">
			<h3
				class="text-base-900 dark:text-base-100 accent:text-base-900 text-xl leading-tight font-semibold @sm:text-2xl"
			>
				{title}
			</h3>
			{#if description}
				<p class="text-base-600 dark:text-base-400 accent:text-base-800 text-sm leading-snug">
					{description}
				</p>
			{/if}
		</div>

		{#if username}
			<form
				onsubmit={handleSubmit}
				action={action || undefined}
				method="post"
				target="_blank"
				class="mt-2 flex flex-col gap-2 @sm:flex-row"
			>
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					bind:value={email}
					{placeholder}
					disabled={status === 'submitting'}
					class="bg-base-50 dark:bg-base-900/60 border-base-300 dark:border-base-700 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-500 accent:bg-white/90 accent:border-white/40 accent:text-base-900 accent:placeholder:text-base-500 focus:border-accent-500 dark:focus:border-accent-400 focus:ring-accent-500/30 w-full flex-1 rounded-lg border px-3 py-2 text-sm transition focus:ring-2 focus:outline-none"
				/>
				<button
					type="submit"
					disabled={status === 'submitting' || !email.trim()}
					class="bg-accent-500 hover:bg-accent-600 dark:bg-accent-400 dark:hover:bg-accent-300 dark:text-base-950 accent:bg-base-900 accent:hover:bg-base-800 accent:text-white inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
				>
					{status === 'submitting' ? 'Subscribing…' : buttonText}
				</button>
			</form>

			{#if status === 'error'}
				<p class="accent:text-red-900 text-xs text-red-500 dark:text-red-400">
					Something went wrong. Please try again.
				</p>
			{/if}
		{:else}
			<p class="text-base-500 dark:text-base-400 accent:text-base-700 mt-2 text-xs italic">
				Set your Buttondown username in card settings to enable signups.
			</p>
		{/if}
	{/if}
</div>
