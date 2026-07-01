<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import QRCodeModal, { type QRContext } from './QRCodeModal.svelte';
	import { registerQRModal, unregisterQRModal } from './qrOverlay.svelte';

	let open = $state(false);
	let href = $state('');
	let context = $state<QRContext>({});

	function showModal(newHref: string, newContext: QRContext) {
		href = newHref;
		context = newContext;
		open = true;
	}

	onMount(() => {
		registerQRModal(showModal);
	});

	onDestroy(() => {
		unregisterQRModal();
	});
</script>

<QRCodeModal bind:open {href} {context} />
