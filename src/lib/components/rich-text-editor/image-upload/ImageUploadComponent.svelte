<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import { onMount } from 'svelte';
	import { NodeViewWrapper } from 'svelte-tiptap';

	let props: NodeViewProps = $props();

	onMount(() => {
		const pos = props.getPos();
		if (pos == null) return;

		props.deleteNode();
		props.editor
			.chain()
			.focus()
			.insertContentAt(pos, [
				{
					type: 'image',
					attrs: { src: props.node.attrs.preview, alt: 'image', title: 'image' }
				}
			])
			.run();
	});
</script>

<NodeViewWrapper>
	<img src={props.node.attrs.preview} alt="Upload preview" />
</NodeViewWrapper>
