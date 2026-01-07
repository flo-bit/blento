<script lang="ts">
	let { x = 0, y = 0, w = 1, h = 1, id = '', children, ...rest } = $props();
</script>

<div class="grid-stack-item grid-stack-sub-grid" gs-x={x} gs-y={y} gs-w={w} gs-h={h} gs-id={id}>
	<div class="grid-stack-item-content">
		<div class={(rest.class || 'grid-stack') + ' grid-stack-nested'}>
			{@render children?.()}
		</div>
	</div>
</div>
