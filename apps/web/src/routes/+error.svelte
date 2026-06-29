<script lang="ts">
	import { page } from '$app/stores';
	import MadeWithBlento from '$lib/website/view/MadeWithBlento.svelte';
</script>

<div
	class="bg-base-100 dark:bg-base-950 text-base-900 dark:text-base-50 min-h-screen px-4 py-8 lg:px-8"
>
	<div class="@container/grid mx-auto max-w-4xl">
		<!-- Bento Grid -->
		<div class="grid grid-cols-4 gap-3 lg:grid-cols-8 lg:gap-4">
			<!-- Error Code - Large prominent card -->
			<div
				class="col-span-4 row-span-2 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 p-8 text-white lg:col-span-4"
			>
				<span class="text-8xl font-black lg:text-9xl">{$page.status}</span>
				<span class="mt-2 text-xl font-medium opacity-90">Error</span>
			</div>

			<!-- Oops card -->
			<div
				class="col-span-2 flex items-center justify-center rounded-3xl bg-amber-500 p-6 text-white"
			>
				<span class="text-2xl font-bold lg:text-3xl">Oops!</span>
			</div>

			<!-- Decorative emoji card -->
			<div
				class="col-span-2 flex items-center justify-center rounded-3xl bg-violet-500 p-6 text-4xl lg:text-5xl"
			>
				<span class="animate-bounce">:(</span>
			</div>

			<!-- Message card -->
			<div
				class="bg-base-200/50 dark:bg-base-800/50 text-base-700 dark:text-base-300 col-span-4 flex items-center justify-center rounded-3xl p-6 text-center"
			>
				<p class="text-lg font-medium">
					{$page.error?.message ||
						"Something went wrong. We couldn't find what you're looking for."}
				</p>
			</div>

			<!-- Decorative pattern card -->
			<div
				class="col-span-2 flex items-center justify-center overflow-hidden rounded-3xl bg-cyan-500 p-4"
			>
				<div class="grid grid-cols-3 gap-2">
					{#each Array(9) as _, i (i)}
						<div class="h-3 w-3 rounded-full bg-white/40 lg:h-4 lg:w-4"></div>
					{/each}
				</div>
			</div>

			<!-- Home link card -->
			<a
				href="/"
				class="col-span-2 flex items-center justify-center rounded-3xl bg-emerald-500 p-6 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
			>
				<span class="text-lg font-bold lg:text-xl">Go Home</span>
			</a>

			<!-- Decorative stripes card -->
			<div class="col-span-2 overflow-hidden rounded-3xl bg-blue-500 p-4">
				<div class="flex h-full w-full flex-col justify-center gap-2">
					<div class="h-2 w-full rounded-full bg-white/30"></div>
					<div class="h-2 w-3/4 rounded-full bg-white/40"></div>
					<div class="h-2 w-1/2 rounded-full bg-white/50"></div>
				</div>
			</div>

			<!-- Decorative circles card -->
			<div
				class="col-span-2 flex items-center justify-center rounded-3xl bg-orange-500 p-4 lg:col-span-2"
			>
				<div class="relative h-16 w-16 lg:h-20 lg:w-20">
					<div class="absolute inset-0 rounded-full border-4 border-white/40"></div>
					<div class="absolute inset-2 rounded-full border-4 border-white/50"></div>
					<div class="absolute inset-4 rounded-full border-4 border-white/60"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<MadeWithBlento class="text-base-500 mt-12 text-center" />
</div>
