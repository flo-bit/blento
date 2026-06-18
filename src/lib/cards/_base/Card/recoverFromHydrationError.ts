/**
 * Svelte signals hydration mismatches by throwing a bare `{}` sentinel
 * (`HYDRATION_ERROR`). At the app root Svelte recovers by re-rendering
 * client-side, but inside `<svelte:boundary>` the sentinel is caught like a
 * normal error, so the card would show "Failed to render …: [object Object]"
 * (e.g. NumberFlow-based cards whose SSR markup never matches on hydration).
 * Returns an `onerror` handler that resets the boundary once so the card
 * re-renders fresh on the client; real errors still reach the failed snippet.
 */
export function recoverFromHydrationError() {
	let retried = false;

	return (error: unknown, reset: () => void) => {
		const isHydrationSentinel =
			error !== null &&
			typeof error === 'object' &&
			!(error instanceof Error) &&
			Object.keys(error).length === 0;

		if (isHydrationSentinel && !retried) {
			retried = true;
			// reset() throws if called synchronously from onerror
			queueMicrotask(reset);
		}
	};
}
