<script lang="ts">
	import { getIsMobile } from '$lib/helper';
	import type { GridStackWidget } from 'gridstack/dist/types.js';

	let {
		item,
		x = 0,
		y = 0,
		w = 1,
		h = 1,
		autoPosition,
		minW,
		maxW,
		minH,
		maxH,
		noResize,
		noMove,
		locked,
		id,
		content,
		lazyLoad,
		sizeToContent,
		resizeToContentParent,
		children
	}: GridStackWidget = $props();

	let isMobile = getIsMobile();
</script>

<div
	class="grid-stack-item"
	gs-x={isMobile() ? item.mobileX : x}
	gs-y={isMobile() ? item.mobileY : y}
	gs-w={isMobile() ? item.mobileW : w}
	gs-h={isMobile() ? item.mobileH : h}
	gs-auto-position={autoPosition}
	gs-min-w={minW}
	gs-max-w={maxW}
	gs-min-h={minH}
	gs-max-h={maxH}
	gs-no-resize={noResize}
	gs-no-move={noMove}
	gs-locked={locked}
	gs-id={id}
	gs-content={content}
	gs-lazy-load={lazyLoad}
	gs-size-to-content={sizeToContent}
	gs-resize-to-content-parent={resizeToContentParent}
>
	{@render children?.()}
	<div class="grid-stack-item-content"></div>
</div>
