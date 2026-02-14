<script lang="ts">
	import Avatar from 'svelte-boring-avatars';

	let {
		name,
		dateStr,
		thumbnailUrl,
		rkey
	}: {
		name: string;
		dateStr: string;
		thumbnailUrl: string | null;
		rkey: string;
	} = $props();
</script>

<div class="flex h-full w-full bg-neutral-900 p-0">
	<div class="flex h-full shrink-0 items-center px-8">
		<div class="flex overflow-hidden rounded-3xl">
			{#if thumbnailUrl}
				<img src={thumbnailUrl} alt={name} width="420" height="420" style="object-fit: cover;" />
			{:else}
				<Avatar
					size={420}
					name={rkey}
					variant="marble"
					colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
					square
				/>
			{/if}
		</div>
	</div>

	<div class="flex min-w-0 flex-1 flex-col justify-center p-12">
		<h1
			class="text-7xl leading-tight font-bold text-neutral-50"
			style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;"
		>
			{name}
		</h1>

		<div class="mt-8 flex items-center">
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5v8c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5v-8c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z"
					stroke="#a3a3a3"
					stroke-width="1.5"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="ml-3 text-2xl text-neutral-300">{dateStr}</span>
		</div>
	</div>
</div>
