<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationId: number;

	// Game state
	let gameState = $state<'idle' | 'playing' | 'gameover'>('idle');
	let score = $state(0);
	let highScore = $state(0);

	// Sprite images (processed with transparent backgrounds)
	let spritesLoaded = $state(false);
	const sprites: Record<string, HTMLCanvasElement> = {};

	// Tile size (original is 16x16)
	const TILE_SIZE = 16;

	// Dynamic scaling - will be calculated based on canvas size
	let scale = 2.5;
	let scaledTile = TILE_SIZE * scale;

	// Game constants (will be recalculated on resize)
	const GRAVITY_BASE = 0.6;
	const JUMP_FORCE_BASE = -12;
	let gravity = GRAVITY_BASE;
	let jumpForce = JUMP_FORCE_BASE;
	let groundHeight = scaledTile + 10;

	// Game objects
	let player = {
		x: 50,
		y: 0,
		width: scaledTile,
		height: scaledTile,
		velocityY: 0,
		isJumping: false,
		isDucking: false,
		frame: 0
	};

	let obstacles: Array<{
		x: number;
		y: number;
		width: number;
		height: number;
		type: 'ground' | 'air';
		sprite: string;
		frame?: number;
	}> = [];

	let groundTiles: Array<{ x: number }> = [];

	let gameSpeed = 5;
	let frameCount = 0;
	let lastFrameTimestamp = 0;
	let lastSpawnFrame = 0;
	let lastWalkFrame = 0;
	let lastBatFrame = 0;
	let lastSpeedScore = 0;
	const FRAME_TIME_MS = 1000 / 60;
	const MAX_SPEED_BASE = 10.5;

	// Sprite positions in tilemap (row, column - 1-indexed based on cells.txt)
	const SPRITE_POSITIONS: Record<string, { row: number; col: number }> = {
		// Player - row 14: walk (col 2-4), jump (col 5), fall (col 6)
		playerWalk1: { row: 14, col: 2 },
		playerWalk2: { row: 14, col: 3 },
		playerWalk3: { row: 14, col: 4 },
		playerJump: { row: 14, col: 5 },
		playerFall: { row: 14, col: 6 },
		playerDuck: { row: 14, col: 6 }, // Use fall sprite for duck
		// Floor - row 5, column 6
		floor: { row: 5, col: 6 },
		// Mushroom obstacle - row 3, column 15
		mushroom: { row: 3, col: 15 },
		// Spikes obstacle - row 10, column 4
		spikes: { row: 10, col: 4 },
		// Plants obstacles - columns 17-19, rows 1-2
		plant1: { row: 1, col: 17 },
		plant2: { row: 1, col: 18 },
		plant3: { row: 1, col: 19 },
		plant4: { row: 2, col: 17 },
		plant5: { row: 2, col: 18 },
		plant6: { row: 2, col: 19 },
		// Flying obstacles - row 20, columns 1-2
		bat1: { row: 20, col: 1 },
		bat2: { row: 20, col: 2 }
	};

	// Extract a tile from the tilemap and process it (white to black)
	function extractTile(img: HTMLImageElement, row: number, col: number): HTMLCanvasElement {
		const offscreen = document.createElement('canvas');
		offscreen.width = TILE_SIZE;
		offscreen.height = TILE_SIZE;
		const offCtx = offscreen.getContext('2d')!;

		// Calculate position (1-indexed to 0-indexed, with 1px spacing between tiles)
		const TILE_SPACING = 1;
		const sx = (col - 1) * (TILE_SIZE + TILE_SPACING);
		const sy = (row - 1) * (TILE_SIZE + TILE_SPACING);

		offCtx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);

		return offscreen;
	}

	async function loadSprites() {
		return new Promise<void>((resolve) => {
			const img = new Image();
			img.onload = () => {
				for (const [key, pos] of Object.entries(SPRITE_POSITIONS)) {
					sprites[key] = extractTile(img, pos.row, pos.col);
				}
				spritesLoaded = true;
				resolve();
			};
			img.onerror = () => resolve();
			img.src = '/dino/Tilemap/monochrome_tilemap_transparent.png';
		});
	}

	function calculateScale() {
		if (!canvas) return;

		// Scale based on canvas height - aim for ~4 tiles vertically for gameplay area
		const targetTilesVertical = 5;
		scale = Math.max(1.5, Math.min(4, canvas.height / (TILE_SIZE * targetTilesVertical)));
		scaledTile = TILE_SIZE * scale;

		// Recalculate physics based on scale
		const scaleRatio = scale / 2.5;
		gravity = GRAVITY_BASE * scaleRatio;
		jumpForce = JUMP_FORCE_BASE * scaleRatio;
		groundHeight = scaledTile + 10 * scaleRatio;

		// Update player dimensions
		player.width = scaledTile;
		player.height = scaledTile;
		player.x = Math.max(30, scaledTile);
	}

	function resetGame() {
		calculateScale();
		player = {
			x: Math.max(30, scaledTile),
			y: 0,
			width: scaledTile,
			height: scaledTile,
			velocityY: 0,
			isJumping: false,
			isDucking: false,
			frame: 0
		};
		obstacles = [];
		gameSpeed = 4.2 * (scale / 2.5);
		score = 0;
		frameCount = 0;
		lastSpawnFrame = 0;
		lastWalkFrame = 0;
		lastBatFrame = 0;
		lastSpeedScore = 0;
		initGroundTiles();
	}

	function initGroundTiles() {
		if (!canvas) return;
		groundTiles = [];
		// Add extra tiles to ensure no gaps
		const numTiles = Math.ceil(canvas.width / scaledTile) + 4;
		for (let i = 0; i < numTiles; i++) {
			groundTiles.push({ x: i * scaledTile });
		}
	}

	function startGame() {
		resetGame();
		gameState = 'playing';
		// Focus container so keyboard events work for this game
		container?.focus();
	}

	function jump() {
		if (gameState === 'idle') {
			startGame();
			return;
		}
		if (gameState === 'gameover') {
			startGame();
			return;
		}
		if (!player.isJumping && !player.isDucking) {
			player.velocityY = jumpForce;
			player.isJumping = true;
		}
	}

	function duck(ducking: boolean) {
		if (gameState !== 'playing') return;
		if (ducking && !player.isJumping) {
			player.isDucking = true;
		} else if (!ducking) {
			player.isDucking = false;
		}
	}

	// Handle keyboard input (only responds when this game container is focused)
	function handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
			e.preventDefault();
			jump();
		}
		if (e.code === 'ArrowDown' || e.code === 'KeyS') {
			e.preventDefault();
			duck(true);
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.code === 'ArrowDown' || e.code === 'KeyS') {
			duck(false);
		}
	}

	function handleTouch(e: TouchEvent) {
		e.preventDefault();
		// Simple tap to jump, could add swipe down for duck
		jump();
	}

	function spawnObstacle(canvasWidth: number, groundY: number) {
		const rand = Math.random();

		// After score 100, start spawning flying obstacles
		const canSpawnFlying = score > 100;

		if (canSpawnFlying && rand < 0.2) {
			// Flying bat - requires ducking
			const batFrame = Math.random() > 0.5 ? 1 : 2;
			obstacles.push({
				x: canvasWidth,
				y: groundY - scaledTile * 1.8, // Float above ground at player head height
				width: scaledTile,
				height: scaledTile,
				type: 'air',
				sprite: `bat${batFrame}`,
				frame: batFrame
			});
		} else if (rand < 0.4) {
			// Spikes
			obstacles.push({
				x: canvasWidth,
				y: groundY - scaledTile,
				width: scaledTile,
				height: scaledTile,
				type: 'ground',
				sprite: 'spikes'
			});
		} else if (rand < 0.55) {
			// Mushroom
			obstacles.push({
				x: canvasWidth,
				y: groundY - scaledTile,
				width: scaledTile,
				height: scaledTile,
				type: 'ground',
				sprite: 'mushroom'
			});
		} else {
			// Plants
			const plantSprites = ['plant1', 'plant2', 'plant3', 'plant4', 'plant5', 'plant6'];
			const sprite = plantSprites[Math.floor(Math.random() * plantSprites.length)];
			obstacles.push({
				x: canvasWidth,
				y: groundY - scaledTile,
				width: scaledTile,
				height: scaledTile,
				type: 'ground',
				sprite
			});
		}
	}

	function checkCollision(
		rect1: { x: number; y: number; width: number; height: number },
		rect2: { x: number; y: number; width: number; height: number }
	) {
		const padding = scaledTile * 0.3;
		return (
			rect1.x + padding < rect2.x + rect2.width - padding &&
			rect1.x + rect1.width - padding > rect2.x + padding &&
			rect1.y + padding < rect2.y + rect2.height - padding &&
			rect1.y + rect1.height - padding > rect2.y + padding
		);
	}

	function drawSprite(spriteKey: string, x: number, y: number, width: number, height: number) {
		if (!ctx || !sprites[spriteKey]) return;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(sprites[spriteKey], x, y, width, height);
	}

	function gameLoop(timestamp = 0) {
		if (!ctx || !canvas || !spritesLoaded) {
			animationId = requestAnimationFrame(gameLoop);
			return;
		}

		if (!lastFrameTimestamp) {
			lastFrameTimestamp = timestamp;
		}

		const deltaMs = timestamp - lastFrameTimestamp;
		lastFrameTimestamp = timestamp;
		const deltaFrames = Math.min(deltaMs / FRAME_TIME_MS, 3);

		const canvasWidth = canvas.width;
		const canvasHeight = canvas.height;
		const groundY = canvasHeight - groundHeight;

		// Clear canvas (transparent to show card background)
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Draw ground tiles - continuous floor (slight overlap to prevent gaps)
		for (const tile of groundTiles) {
			drawSprite('floor', Math.floor(tile.x), groundY, Math.ceil(scaledTile) + 1, scaledTile);
		}

		if (gameState === 'playing') {
			frameCount += deltaFrames;

			// Update ground tiles - seamless scrolling
			for (const tile of groundTiles) {
				tile.x -= gameSpeed * deltaFrames;
			}

			// Find the rightmost tile and reposition tiles that went off-screen
			const rightmostX = Math.max(...groundTiles.map((t) => t.x));
			for (const tile of groundTiles) {
				if (tile.x < -scaledTile) {
					tile.x = rightmostX + scaledTile;
				}
			}

			// Update player physics
			if (player.isJumping) {
				player.velocityY += gravity * deltaFrames;
				player.y += player.velocityY * deltaFrames;

				if (player.y >= groundY - player.height) {
					player.y = groundY - player.height;
					player.isJumping = false;
					player.velocityY = 0;
				}
			} else {
				player.y = groundY - player.height;
			}

			// Animate player (3 walk frames)
			if (frameCount - lastWalkFrame >= 8) {
				player.frame = (player.frame + 1) % 3;
				lastWalkFrame = frameCount;
			}

			// Animate flying obstacles
			for (const obs of obstacles) {
				if (obs.type === 'air' && frameCount - lastBatFrame >= 12) {
					obs.frame = obs.frame === 1 ? 2 : 1;
					obs.sprite = `bat${obs.frame}`;
					lastBatFrame = frameCount;
				}
			}

			// Spawn obstacles
			const baseSpawnRate = 120;
			const spawnRate = Math.max(60, baseSpawnRate - Math.floor(score / 100) * 5);
			if (frameCount - lastSpawnFrame >= spawnRate || (obstacles.length === 0 && frameCount > 60)) {
				spawnObstacle(canvasWidth, groundY);
				lastSpawnFrame = frameCount;
			}

			// Update obstacles
			obstacles = obstacles.filter((obs) => {
				obs.x -= gameSpeed * deltaFrames;
				return obs.x > -obs.width;
			});

			// Check collisions
			for (const obstacle of obstacles) {
				let playerHitbox;

				if (player.isDucking) {
					// Ducking hitbox - lower and shorter
					playerHitbox = {
						x: player.x,
						y: groundY - player.height * 0.5,
						width: player.width,
						height: player.height * 0.5
					};
				} else if (player.isJumping) {
					playerHitbox = {
						x: player.x,
						y: player.y,
						width: player.width,
						height: player.height
					};
				} else {
					playerHitbox = {
						x: player.x,
						y: groundY - player.height,
						width: player.width,
						height: player.height
					};
				}

				if (checkCollision(playerHitbox, obstacle)) {
					gameState = 'gameover';
					if (score > highScore) {
						highScore = score;
					}
					break;
				}
			}

			// Update score
			score = Math.floor(frameCount / 5);

			// Increase speed every 100 points up to a cap
			if (score >= lastSpeedScore + 100) {
				gameSpeed = Math.min(gameSpeed + 0.25 * (scale / 2.5), MAX_SPEED_BASE * (scale / 2.5));
				lastSpeedScore = score - (score % 100);
			}
		}

		// Draw obstacles
		for (const obstacle of obstacles) {
			drawSprite(obstacle.sprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
		}

		// Draw player
		const playerY = player.isJumping
			? player.y
			: player.isDucking
				? groundY - player.height * 0.6
				: groundY - player.height;

		let playerSprite: string;
		if (player.isDucking) {
			playerSprite = 'playerDuck';
		} else if (player.isJumping) {
			if (player.velocityY < 0) {
				playerSprite = 'playerJump';
			} else {
				playerSprite = 'playerFall';
			}
		} else {
			// 3-frame walk cycle
			const walkFrames = ['playerWalk1', 'playerWalk2', 'playerWalk3'];
			playerSprite = walkFrames[player.frame];
		}

		// When ducking, draw shorter
		const drawHeight = player.isDucking ? player.height * 0.6 : player.height;
		drawSprite(playerSprite, player.x, playerY, player.width, drawHeight);

		// Draw score
		ctx.fillStyle = '#ffffff';
		ctx.font = `bold ${Math.max(12, Math.floor(14 * (scale / 2.5)))}px monospace`;
		ctx.textAlign = 'right';
		ctx.fillText(String(score).padStart(5, '0'), canvasWidth - 10, 25);

		if (highScore > 0) {
			ctx.fillStyle = 'rgba(256, 256, 256, 0.5)';
			ctx.fillText(
				'HI ' + String(highScore).padStart(5, '0'),
				canvasWidth - 70 * (scale / 2.5),
				25
			);
		}

		// Draw game over text (no overlay background)
		if (gameState === 'gameover') {
			ctx.fillStyle = '#ffffff';
			ctx.font = `bold ${Math.max(14, Math.floor(20 * (scale / 2.5)))}px monospace`;
			ctx.textAlign = 'center';
			ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 40);
		}

		animationId = requestAnimationFrame(gameLoop);
	}

	function resizeCanvas() {
		if (!canvas) return;
		const container = canvas.parentElement;
		if (!container) return;
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		calculateScale();
		initGroundTiles();
	}

	let resizeObserver: ResizeObserver | undefined = $state();

	onMount(async () => {
		ctx = canvas.getContext('2d');
		await loadSprites();
		resizeCanvas();

		resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});
		resizeObserver.observe(canvas.parentElement!);

		gameLoop();
	});

	onDestroy(() => {
		resizeObserver?.disconnect();

		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	class="relative h-full w-full overflow-hidden outline-none"
	tabindex="0"
	role="application"
	aria-label="Dino game"
	onkeydown={handleKeyDown}
	onkeyup={handleKeyUp}
>
	<canvas
		bind:this={canvas}
		class="h-full w-full touch-none invert select-none dark:invert-0"
		ontouchstart={handleTouch}
	></canvas>

	{#if gameState === 'idle' || gameState === 'gameover'}
		<button
			onclick={startGame}
			class="bg-base-50/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform cursor-pointer rounded-lg border-2 border-black px-6 py-3 font-mono font-bold text-black transition-colors duration-200 hover:bg-black hover:text-white"
		>
			{gameState === 'gameover' ? 'PLAY AGAIN' : 'START'}
		</button>
	{/if}
</div>
