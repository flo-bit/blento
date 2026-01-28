<script lang="ts" module>
	export const loginModalState = $state({
		visible: false,
		show: () => (loginModalState.visible = true),
		hide: () => (loginModalState.visible = false)
	});
</script>

<script lang="ts">
	import { login, signup } from '$lib/atproto';
	import type { ActorIdentifier, Did } from '@atcute/lexicons';
	import Button from './Button.svelte';
	import { onMount, tick } from 'svelte';
	import SecondaryButton from './SecondaryButton.svelte';
	import HandleInput from './HandleInput.svelte';
	import { AppBskyActorDefs } from '@atcute/bluesky';
	import { Avatar } from '@foxui/core';

	let { signUp = true, loginOnSelect = true }: { signUp?: boolean; loginOnSelect?: boolean } =
		$props();

	let value = $state('');
	let error: string | null = $state(null);
	let loadingLogin = $state(false);
	let loadingSignup = $state(false);

	async function onSubmit(event?: Event) {
		event?.preventDefault();
		if (loadingLogin) return;

		error = null;
		loadingLogin = true;

		try {
			await login(value as ActorIdentifier);
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			loadingLogin = false;
		}
	}

	let input: HTMLInputElement | null = $state(null);
	let submitButton: HTMLButtonElement | null = $state(null);

	$effect(() => {
		if (!loginModalState.visible) {
			error = null;
			value = '';
			loadingLogin = false;
			selectedActor = undefined;
		} else {
			focusInput();
		}
	});

	function focusInput() {
		tick().then(() => {
			input?.focus();
		});
	}
	function focusSubmit() {
		tick().then(() => {
			submitButton?.focus();
		});
	}

	let selectedActor: AppBskyActorDefs.ProfileViewBasic | undefined = $state();

	let recentLogins: Record<Did, AppBskyActorDefs.ProfileViewBasic> = $state({});

	onMount(() => {
		try {
			recentLogins = JSON.parse(localStorage.getItem('recent-logins') || '{}');
		} catch {
			console.error('Failed to load recent logins');
		}
	});

	function removeRecentLogin(did: Did) {
		try {
			delete recentLogins[did];

			localStorage.setItem('recent-logins', JSON.stringify(recentLogins));
		} catch {
			console.error('Failed to remove recent login');
		}
	}

	let recentLoginsView = $state(true);

	let showRecentLogins = $derived(
		Object.keys(recentLogins).length > 0 && !loadingLogin && !selectedActor && recentLoginsView
	);
</script>

{#if loginModalState.visible}
	<div
		class="fixed inset-0 z-100 w-screen overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-base-50/90 dark:bg-base-950/90 fixed inset-0 backdrop-blur-sm transition-opacity"
			onclick={() => (loginModalState.visible = false)}
			aria-hidden="true"
		></div>

		<div class="pointer-events-none fixed inset-0 isolate z-10 w-screen overflow-y-auto">
			<div
				class="flex min-h-full w-screen items-end justify-center p-4 text-center sm:items-center sm:p-0"
			>
				<div
					class="border-base-200 bg-base-100 dark:border-base-700 dark:bg-base-800 pointer-events-auto relative w-full transform overflow-hidden rounded-2xl border px-4 pt-4 pb-4 text-left shadow-xl transition-all sm:my-8 sm:max-w-sm sm:p-6"
				>
					<h3 class="text-base-900 dark:text-base-100 font-semibold" id="modal-title">
						Login with your internet handle
					</h3>

					<div class="text-base-800 dark:text-base-200 mt-2 mb-2 text-xs font-light">
						e.g. your bluesky account
					</div>

					<form onsubmit={onSubmit} class="mt-2 flex w-full flex-col gap-2">
						{#if showRecentLogins}
							<div class="mt-2 mb-2 text-sm font-medium">Recent logins</div>
							<div class="flex flex-col gap-2">
								{#each Object.values(recentLogins)
									.filter((l) => l.handle && l.handle !== 'handle.invalid')
									.slice(0, 4) as recentLogin (recentLogin.did)}
									<div class="group">
										<div
											class="group-hover:bg-base-300 bg-base-200 dark:bg-base-700 dark:hover:bg-base-600 dark:border-base-500/50 border-base-300 relative flex h-10 w-full items-center justify-between gap-2 rounded-full border px-2 font-semibold transition-colors duration-100"
										>
											<div class="flex items-center gap-2">
												<Avatar class="size-6" src={recentLogin.avatar} />
												{recentLogin.handle}
											</div>
											<button
												class="z-20 cursor-pointer"
												onclick={() => {
													value = recentLogin.handle;
													selectedActor = recentLogin;
													if (loginOnSelect) onSubmit();
													else focusSubmit();
												}}
											>
												<div class="absolute inset-0 h-full w-full"></div>
												<span class="sr-only">login</span>
											</button>

											<button
												onclick={() => {
													removeRecentLogin(recentLogin.did);
												}}
												class="z-30 cursor-pointer rounded-full p-0.5"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													class="size-3"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M6 18 18 6M6 6l12 12"
													/>
												</svg>
												<span class="sr-only">sign in with other account</span>
											</button>
										</div>
									</div>
								{/each}
							</div>
						{:else if !selectedActor}
							<div class="mt-4 w-full">
								<HandleInput
									bind:value
									onselected={(a) => {
										selectedActor = a;
										value = a.handle;
										if (loginOnSelect) onSubmit();
										else focusSubmit();
									}}
									bind:ref={input}
								/>
							</div>
						{:else}
							<div
								class="bg-base-200 dark:bg-base-700 border-base-300 dark:border-base-600 mt-4 flex h-10 w-full items-center justify-between gap-2 rounded-full border px-2 font-semibold"
							>
								<div class="flex items-center gap-2">
									<Avatar class="size-6" src={selectedActor.avatar} />
									{selectedActor.handle}
								</div>

								<button
									onclick={() => {
										selectedActor = undefined;
										value = '';
									}}
									class="cursor-pointer rounded-full p-0.5"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="size-3"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
									</svg>
									<span class="sr-only">sign in with other account</span>
								</button>
							</div>
						{/if}

						{#if error}
							<p class="text-accent-500 text-sm font-semibold">{error}</p>
						{/if}

						<div class="mt-4">
							{#if showRecentLogins}
								<div class="mt-2 mb-4 text-sm font-medium">Or login with new handle</div>

								<Button
									onclick={() => {
										recentLoginsView = false;
										focusInput();
									}}
									class="w-full">Login with new handle</Button
								>
							{:else}
								<Button bind:ref={submitButton} type="submit" disabled={loadingLogin} class="w-full"
									>{loadingLogin ? 'Loading...' : 'Login'}</Button
								>
							{/if}
						</div>

						{#if signUp}
							<div
								class="border-base-200 dark:border-base-700 text-base-800 dark:text-base-200 mt-4 border-t pt-4 text-sm leading-7"
							>
								Don't have an account?
								<div class="mt-3">
									<SecondaryButton
										onclick={async () => {
											loadingSignup = true;
											await signup();
										}}
										disabled={loadingSignup}
										class="w-full">{loadingSignup ? 'Loading...' : 'Sign Up'}</SecondaryButton
									>
								</div>
							</div>
						{/if}
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
