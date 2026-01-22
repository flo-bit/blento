# Game Cards

This folder contains interactive game cards (Tetris, Dino, etc.).

## Implementation Requirements

When creating a new game card, follow these patterns to ensure multiple games on the same page work independently.

### 1. Container Setup

Make the game container focusable and handle keyboard events on it (not on `svelte:window`):

```svelte
<script lang="ts">
	let container: HTMLDivElement;
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	class="relative h-full w-full overflow-hidden outline-none"
	tabindex="0"
	role="application"
	aria-label="Your game name"
	onkeydown={handleKeyDown}
	onkeyup={handleKeyUp}
>
	<!-- game content -->
</div>
```

### 2. Focus on Game Start

When the game starts, focus the container so keyboard events work:

```typescript
function startGame() {
	// ... game initialization
	container?.focus();
}
```

### 3. Keyboard Handlers

Do NOT use `<svelte:window onkeydown={...} />` - this captures all keyboard events globally and causes all games to respond at once.

Instead, attach handlers directly to the container div. The handlers will only fire when that specific game is focused.

```typescript
function handleKeyDown(e: KeyboardEvent) {
	if (e.code === 'Space') {
		e.preventDefault();
		// handle action
	}
}
```

### 4. Canvas Setup

Add `touch-none` and `select-none` classes to prevent scrolling and text selection during gameplay:

```svelte
<canvas
	bind:this={canvas}
	class="h-full w-full touch-none select-none"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
></canvas>
```

### 5. Touch Controls

For mobile support, add touch event handlers to the canvas. Prevent default to stop page scrolling:

```typescript
function handleTouchStart(e: TouchEvent) {
	if (gameState === 'playing') {
		e.preventDefault();
	}
	// handle touch
}
```

## Checklist for New Game Cards

- [ ] Container has `bind:this={container}` reference
- [ ] Container has `tabindex="0"` for focusability
- [ ] Container has `role="application"` and `aria-label`
- [ ] Container has `outline-none` class
- [ ] Keyboard handlers are on container, NOT `svelte:window`
- [ ] `startGame()` calls `container?.focus()`
- [ ] Canvas has `touch-none select-none` classes
- [ ] Touch handlers call `e.preventDefault()` when game is active
- [ ] No `isTyping()` check needed (focus handles this automatically)
