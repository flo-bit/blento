/** Isolate-local coalescing, not a distributed lock. Always release failed work too. */
export class SingleFlight {
	private pending = new Map<string, Promise<unknown>>();

	run<T>(key: string, loader: () => Promise<T>): Promise<T> {
		const existing = this.pending.get(key);
		if (existing) return existing as Promise<T>;
		// Bound memory when many different public keys arrive at once.
		if (this.pending.size >= 512) return loader();
		const promise = Promise.resolve().then(loader);
		this.pending.set(key, promise);
		void promise.finally(() => this.pending.delete(key)).catch(() => {});
		return promise;
	}
}
