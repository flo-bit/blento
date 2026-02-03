<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Tetris8BitMusic from './Tetris8Bit.mp3';

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationId: number;
	let audioCtx: AudioContext | null = null;

	// Background music
	let bgMusic: HTMLAudioElement | null = null;

	// Theme detection
	let isAccentMode = $state(false);
	let isDarkMode = $state(false);

	// Game state
	let gameState = $state<'idle' | 'playing' | 'gameover'>('idle');
	let score = $state(0);
	let lines = $state(0);
	let level = $state(1);

	// Line clear animation
	let clearingLines: number[] = [];
	let clearAnimationProgress = 0;
	let isClearingAnimation = $state(false);
	const CLEAR_ANIMATION_DURATION = 120; // ms - fast and crisp
	let clearAnimationStart = 0;

	// Grid settings
	const COLS = 10;
	const ROWS = 20;
	let cellSize = 20;

	// Vibrant color palette - tailwind 500 colors
	const VIBRANT_COLORS = {
		cyan: '#06b6d4',
		emerald: '#10b981',
		violet: '#8b5cf6',
		amber: '#f59e0b',
		rose: '#f43f5e',
		blue: '#3b82f6',
		lime: '#84cc16',
		fuchsia: '#d946ef',
		orange: '#f97316',
		teal: '#14b8a6',
		indigo: '#6366f1',
		pink: '#ec4899',
		red: '#ef4444',
		yellow: '#eab308',
		green: '#22c55e',
		purple: '#a855f7',
		sky: '#0ea5e9'
	};

	// Color families that should not be used together (too similar)
	const COLOR_FAMILIES: Record<string, string[]> = {
		pink: ['pink', 'rose', 'red', 'fuchsia'],
		rose: ['rose', 'pink', 'red', 'fuchsia'],
		red: ['red', 'rose', 'pink', 'orange'],
		orange: ['orange', 'amber', 'red', 'yellow'],
		amber: ['amber', 'orange', 'yellow'],
		yellow: ['yellow', 'amber', 'lime', 'orange'],
		lime: ['lime', 'green', 'yellow', 'emerald'],
		green: ['green', 'emerald', 'lime', 'teal'],
		emerald: ['emerald', 'green', 'teal', 'cyan'],
		teal: ['teal', 'cyan', 'emerald', 'green'],
		cyan: ['cyan', 'teal', 'sky', 'blue'],
		sky: ['sky', 'cyan', 'blue'],
		blue: ['blue', 'sky', 'indigo', 'cyan'],
		indigo: ['indigo', 'blue', 'violet', 'purple'],
		violet: ['violet', 'purple', 'indigo', 'fuchsia'],
		purple: ['purple', 'violet', 'fuchsia', 'indigo'],
		fuchsia: ['fuchsia', 'purple', 'pink', 'violet']
	};

	let detectedAccentFamily = $state<string | null>(null);

	function detectAccentColor() {
		if (!container) return null;
		// Look for accent color class on parent card
		const card = container.closest('.card');
		if (!card) return null;

		for (const colorName of Object.keys(COLOR_FAMILIES)) {
			if (card.classList.contains(colorName)) {
				return colorName;
			}
		}
		return null;
	}

	function getColorScheme(): Record<string, string> {
		// Get colors that contrast well with the current background
		const excludeColors =
			isAccentMode && detectedAccentFamily ? COLOR_FAMILIES[detectedAccentFamily] || [] : [];

		// Pick 7 contrasting vibrant colors for the 7 tetrominos
		const availableColors = Object.entries(VIBRANT_COLORS)
			.filter(([name]) => !excludeColors.includes(name))
			.map(([, color]) => color);

		// Always ensure we have enough colors
		const allColors = Object.values(VIBRANT_COLORS);
		while (availableColors.length < 7) {
			const fallback = allColors[availableColors.length % allColors.length];
			if (!availableColors.includes(fallback)) {
				availableColors.push(fallback);
			} else {
				availableColors.push(allColors[(availableColors.length * 3) % allColors.length]);
			}
		}

		// For dark mode on base background, use slightly brighter versions
		if (isDarkMode && !isAccentMode) {
			return {
				I: '#22d3ee', // cyan-400
				O: '#fbbf24', // amber-400
				T: '#a78bfa', // violet-400
				S: '#34d399', // emerald-400
				Z: '#fb7185', // rose-400
				J: '#60a5fa', // blue-400
				L: '#a3e635' // lime-400
			};
		}

		// For accent mode, use contrasting colors
		if (isAccentMode) {
			return {
				I: availableColors[0],
				O: availableColors[1],
				T: availableColors[2],
				S: availableColors[3],
				Z: availableColors[4],
				J: availableColors[5],
				L: availableColors[6]
			};
		}

		// Light mode - vibrant standard colors
		return {
			I: '#06b6d4', // cyan
			O: '#f59e0b', // amber
			T: '#8b5cf6', // violet
			S: '#10b981', // emerald
			Z: '#f43f5e', // rose
			J: '#3b82f6', // blue
			L: '#84cc16' // lime
		};
	}

	// Tetromino definitions (each has rotations)
	const TETROMINOES = {
		I: { shape: [[1, 1, 1, 1]] },
		O: {
			shape: [
				[1, 1],
				[1, 1]
			]
		},
		T: {
			shape: [
				[0, 1, 0],
				[1, 1, 1]
			]
		},
		S: {
			shape: [
				[0, 1, 1],
				[1, 1, 0]
			]
		},
		Z: {
			shape: [
				[1, 1, 0],
				[0, 1, 1]
			]
		},
		J: {
			shape: [
				[1, 0, 0],
				[1, 1, 1]
			]
		},
		L: {
			shape: [
				[0, 0, 1],
				[1, 1, 1]
			]
		}
	};

	type TetrominoType = keyof typeof TETROMINOES;

	// Game grid - stores tetromino type for color lookup
	let grid: (TetrominoType | null)[][] = [];

	// Current piece
	let currentPiece: {
		type: TetrominoType;
		shape: number[][];
		x: number;
		y: number;
	} | null = null;

	let nextPiece: TetrominoType | null = null;

	function detectTheme() {
		if (!container) return;
		// Check if we're inside an accent card (has .accent class ancestor)
		isAccentMode = container.closest('.accent') !== null;
		// Check dark mode
		isDarkMode = container.closest('.dark') !== null && !container.closest('.light');
		// Detect accent color family for smart contrast
		detectedAccentFamily = detectAccentColor();
	}

	// Timing
	let lastDrop = 0;
	let dropInterval = 1000;

	// Audio functions
	function initAudio() {
		if (!audioCtx) {
			audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
		}
	}

	type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';
	function playTone(
		frequency: number,
		duration: number,
		type: OscillatorType = 'square',
		volume: number = 0.04
	) {
		if (!audioCtx) return;
		try {
			const oscillator = audioCtx.createOscillator();
			const gainNode = audioCtx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioCtx.destination);

			oscillator.frequency.value = frequency;
			oscillator.type = type;

			gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

			oscillator.start(audioCtx.currentTime);
			oscillator.stop(audioCtx.currentTime + duration);
		} catch {
			// Audio not supported
		}
	}

	function playMove() {
		// 8-bit tick
		playTone(200, 0.03, 'square', 0.08);
	}

	function playRotate() {
		// 8-bit blip
		playTone(400, 0.04, 'square', 0.1);
	}

	function playDrop() {
		// 8-bit thud
		playTone(80, 0.1, 'square', 0.12);
	}

	function playLineClear(count: number) {
		// Swoosh - original style
		const baseFreq = 400;
		for (let i = 0; i < count; i++) {
			setTimeout(() => playTone(baseFreq + i * 100, 0.15, 'sine', 0.15), i * 80);
		}
	}

	function playGameOver() {
		// 8-bit descending
		playTone(300, 0.15, 'square', 0.1);
		setTimeout(() => playTone(200, 0.15, 'square', 0.08), 150);
		setTimeout(() => playTone(120, 0.3, 'square', 0.06), 300);
		stopMusic();
	}

	function startMusic() {
		if (!bgMusic) {
			bgMusic = new Audio(Tetris8BitMusic);
			bgMusic.loop = true;
			bgMusic.volume = 0.08;
		}
		bgMusic.currentTime = 0;
		bgMusic.play().catch(() => {
			// Autoplay blocked, ignore
		});
	}

	function stopMusic() {
		if (bgMusic) {
			bgMusic.pause();
			bgMusic.currentTime = 0;
		}
	}

	// Initialize grid
	function initGrid() {
		grid = Array(ROWS)
			.fill(null)
			.map(() => Array(COLS).fill(null));
	}

	// Get random tetromino
	function randomTetromino(): TetrominoType {
		const types = Object.keys(TETROMINOES) as TetrominoType[];
		return types[Math.floor(Math.random() * types.length)];
	}

	// Spawn new piece
	function spawnPiece() {
		const type = nextPiece || randomTetromino();
		nextPiece = randomTetromino();

		const tetromino = TETROMINOES[type];
		currentPiece = {
			type,
			shape: tetromino.shape.map((row) => [...row]),
			x: Math.floor((COLS - tetromino.shape[0].length) / 2),
			y: 0
		};

		// Check if spawn position is blocked (game over)
		if (!isValidPosition(currentPiece.shape, currentPiece.x, currentPiece.y)) {
			gameState = 'gameover';
			playGameOver();
		}
	}

	// Check if position is valid
	function isValidPosition(shape: number[][], x: number, y: number): boolean {
		for (let row = 0; row < shape.length; row++) {
			for (let col = 0; col < shape[row].length; col++) {
				if (shape[row][col]) {
					const newX = x + col;
					const newY = y + row;

					if (newX < 0 || newX >= COLS || newY >= ROWS) {
						return false;
					}

					if (newY >= 0 && grid[newY][newX]) {
						return false;
					}
				}
			}
		}
		return true;
	}

	// Rotate piece
	function rotatePiece() {
		if (!currentPiece) return;

		const rotated: number[][] = [];
		const rows = currentPiece.shape.length;
		const cols = currentPiece.shape[0].length;

		for (let col = 0; col < cols; col++) {
			rotated[col] = [];
			for (let row = rows - 1; row >= 0; row--) {
				rotated[col][rows - 1 - row] = currentPiece.shape[row][col];
			}
		}

		// Try rotation, with wall kicks
		const kicks = [0, -1, 1, -2, 2];
		for (const kick of kicks) {
			if (isValidPosition(rotated, currentPiece.x + kick, currentPiece.y)) {
				currentPiece.shape = rotated;
				currentPiece.x += kick;
				playRotate();
				return;
			}
		}
	}

	// Move piece
	function movePiece(dx: number, dy: number): boolean {
		if (!currentPiece) return false;

		if (isValidPosition(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) {
			currentPiece.x += dx;
			currentPiece.y += dy;
			if (dx !== 0) playMove();
			return true;
		}
		return false;
	}

	// Lock piece to grid
	function lockPiece() {
		if (!currentPiece) return;

		for (let row = 0; row < currentPiece.shape.length; row++) {
			for (let col = 0; col < currentPiece.shape[row].length; col++) {
				if (currentPiece.shape[row][col]) {
					const gridY = currentPiece.y + row;
					const gridX = currentPiece.x + col;
					if (gridY >= 0) {
						grid[gridY][gridX] = currentPiece.type;
					}
				}
			}
		}

		playDrop();
		checkAndClearLines();
	}

	// Check for completed lines and start animation
	function checkAndClearLines() {
		// Find all completed lines
		clearingLines = [];
		for (let row = 0; row < ROWS; row++) {
			if (grid[row].every((cell) => cell !== null)) {
				clearingLines.push(row);
			}
		}

		if (clearingLines.length > 0) {
			// Start swoosh animation
			isClearingAnimation = true;
			clearAnimationStart = performance.now();
			clearAnimationProgress = 0;
			playLineClear(clearingLines.length);
		} else {
			spawnPiece();
		}
	}

	// Actually remove the cleared lines (called after animation)
	function finishLineClear() {
		const cleared = clearingLines.length;

		// Remove lines from bottom to top to maintain indices
		// Do all splices first, then add empty rows, to avoid index shifting issues
		for (const row of [...clearingLines].sort((a, b) => b - a)) {
			grid.splice(row, 1);
		}
		for (let i = 0; i < cleared; i++) {
			grid.unshift(Array(COLS).fill(null));
		}

		lines += cleared;
		// Scoring: 100, 300, 500, 800 for 1, 2, 3, 4 lines
		const points = [0, 100, 300, 500, 800];
		score += points[Math.min(cleared, 4)] * level;

		// Level up every 10 lines
		const newLevel = Math.floor(lines / 10) + 1;
		if (newLevel > level) {
			level = newLevel;
			dropInterval = Math.max(100, 1000 - (level - 1) * 100);
		}

		clearingLines = [];
		isClearingAnimation = false;

		// Check if there are more complete lines (chains/cascades)
		checkAndClearLines();
	}

	// Hard drop
	function hardDrop() {
		if (!currentPiece) return;

		while (movePiece(0, 1)) {
			score += 2;
		}
		lockPiece();
	}

	// Handle keyboard input (only responds when this game container is focused)
	function handleKeyDown(e: KeyboardEvent) {
		if (gameState !== 'playing' || isClearingAnimation) {
			if (e.code === 'Space' || e.code === 'Enter') {
				e.preventDefault();
				if (gameState !== 'playing') startGame();
			}
			return;
		}

		switch (e.code) {
			case 'ArrowLeft':
			case 'KeyA':
				e.preventDefault();
				movePiece(-1, 0);
				break;
			case 'ArrowRight':
			case 'KeyD':
				e.preventDefault();
				movePiece(1, 0);
				break;
			case 'ArrowDown':
			case 'KeyS':
				e.preventDefault();
				if (movePiece(0, 1)) score += 1;
				break;
			case 'ArrowUp':
			case 'KeyW':
				e.preventDefault();
				rotatePiece();
				break;
			case 'Space':
				e.preventDefault();
				hardDrop();
				break;
		}
	}

	// Touch controls
	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartTime = 0;
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let isLongPressing = false;
	let longPressInterval: ReturnType<typeof setInterval> | null = null;
	let lastMoveX = 0;
	let hasMoved = false;

	const LONG_PRESS_DELAY = 300;
	const LONG_PRESS_MOVE_INTERVAL = 50;
	const SWIPE_THRESHOLD = 30;
	const MOVE_CELL_THRESHOLD = 25;

	function handleTouchStart(e: TouchEvent) {
		// Prevent page scrolling when game is active
		if (gameState === 'playing') {
			e.preventDefault();
		}

		if (gameState !== 'playing' || isClearingAnimation) {
			if (gameState !== 'playing') startGame();
			return;
		}

		const touch = e.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchStartTime = performance.now();
		lastMoveX = touch.clientX;
		hasMoved = false;
		isLongPressing = false;

		// Start long press detection
		longPressTimer = setTimeout(() => {
			isLongPressing = true;
			// Start accelerated falling
			longPressInterval = setInterval(() => {
				if (gameState === 'playing' && !isClearingAnimation) {
					if (movePiece(0, 1)) score += 1;
				}
			}, LONG_PRESS_MOVE_INTERVAL);
		}, LONG_PRESS_DELAY);
	}

	function handleTouchMove(e: TouchEvent) {
		if (gameState !== 'playing' || isClearingAnimation) return;

		// Prevent page scrolling
		e.preventDefault();

		const touch = e.touches[0];
		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;

		// If moved significantly, cancel long press
		if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
			if (longPressInterval) {
				clearInterval(longPressInterval);
				longPressInterval = null;
				isLongPressing = false;
			}
		}

		// Only allow horizontal movement if not swiping down
		// (vertical movement is greater than horizontal)
		if (Math.abs(dy) > Math.abs(dx) && dy > SWIPE_THRESHOLD) {
			return;
		}

		// Handle horizontal movement in cells
		const cellsMoved = Math.floor((touch.clientX - lastMoveX) / MOVE_CELL_THRESHOLD);
		if (cellsMoved !== 0) {
			hasMoved = true;
			for (let i = 0; i < Math.abs(cellsMoved); i++) {
				movePiece(cellsMoved > 0 ? 1 : -1, 0);
			}
			lastMoveX += cellsMoved * MOVE_CELL_THRESHOLD;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		// Clean up long press
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		if (longPressInterval) {
			clearInterval(longPressInterval);
			longPressInterval = null;
		}

		if (gameState !== 'playing' || isClearingAnimation) return;

		// If was long pressing, don't do anything else
		if (isLongPressing) {
			isLongPressing = false;
			return;
		}

		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const dx = touchEndX - touchStartX;
		const dy = touchEndY - touchStartY;
		const elapsed = performance.now() - touchStartTime;

		// Quick tap (no movement) - rotate
		if (
			!hasMoved &&
			Math.abs(dx) < SWIPE_THRESHOLD &&
			Math.abs(dy) < SWIPE_THRESHOLD &&
			elapsed < 300
		) {
			rotatePiece();
			return;
		}

		// Swipe down - hard drop
		if (dy > SWIPE_THRESHOLD * 2 && Math.abs(dy) > Math.abs(dx)) {
			hardDrop();
		}
	}

	function startGame() {
		detectTheme();
		initAudio();
		initGrid();
		score = 0;
		lines = 0;
		level = 1;
		dropInterval = 1000;
		clearingLines = [];
		isClearingAnimation = false;
		nextPiece = randomTetromino();
		spawnPiece();
		gameState = 'playing';
		lastDrop = performance.now();
		startMusic();
		// Focus container so keyboard events work for this game
		container?.focus();
	}

	function calculateSize() {
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;

		const padding = 8;
		const availableWidth = parent.clientWidth - padding * 2;
		const availableHeight = parent.clientHeight - padding * 2;

		// Calculate cell size to fit the grid in available space
		// Use full width/height, UI will overlay on top
		cellSize = Math.floor(Math.min(availableWidth / COLS, availableHeight / ROWS));
		cellSize = Math.max(8, cellSize); // minimum 8px cells for very small cards

		canvas.width = parent.clientWidth;
		canvas.height = parent.clientHeight;
	}

	function drawBlock(x: number, y: number, color: string, size: number = cellSize) {
		if (!ctx) return;

		const gap = size >= 12 ? 1 : 0;
		ctx.fillStyle = color;
		ctx.fillRect(x, y, size - gap, size - gap);

		// Only draw highlights/shadows for larger cells
		if (size >= 10) {
			const edge = Math.max(2, Math.floor(size * 0.15));

			// Highlight
			ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.fillRect(x, y, size - gap, edge);
			ctx.fillRect(x, y, edge, size - gap);

			// Shadow
			ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
			ctx.fillRect(x + size - gap - edge, y, edge, size - gap);
			ctx.fillRect(x, y + size - gap - edge, size - gap, edge);
		}
	}

	function gameLoop(timestamp: number) {
		if (!ctx || !canvas) {
			animationId = requestAnimationFrame(gameLoop);
			return;
		}

		// Detect theme on every frame for dynamic updates
		detectTheme();

		const colors = getColorScheme();
		const textColor = isAccentMode ? '#000000' : isDarkMode ? '#ffffff' : '#000000';
		const gridBgColor = isAccentMode
			? 'rgba(0, 0, 0, 0.15)'
			: isDarkMode
				? 'rgba(255, 255, 255, 0.05)'
				: 'rgba(0, 0, 0, 0.05)';
		const gridLineColor = isAccentMode
			? 'rgba(0, 0, 0, 0.1)'
			: isDarkMode
				? 'rgba(255, 255, 255, 0.05)'
				: 'rgba(0, 0, 0, 0.08)';

		const canvasWidth = canvas.width;
		const canvasHeight = canvas.height;

		// Clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Calculate grid position (centered, using full space)
		const gridWidth = COLS * cellSize;
		const gridHeight = ROWS * cellSize;
		const offsetX = Math.floor((canvasWidth - gridWidth) / 2);
		const offsetY = Math.floor((canvasHeight - gridHeight) / 2);

		// Draw grid background
		ctx.fillStyle = gridBgColor;
		ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);

		// Only draw grid lines if cells are big enough
		if (cellSize >= 12) {
			ctx.strokeStyle = gridLineColor;
			ctx.lineWidth = 1;
			for (let i = 0; i <= COLS; i++) {
				ctx.beginPath();
				ctx.moveTo(offsetX + i * cellSize, offsetY);
				ctx.lineTo(offsetX + i * cellSize, offsetY + gridHeight);
				ctx.stroke();
			}
			for (let i = 0; i <= ROWS; i++) {
				ctx.beginPath();
				ctx.moveTo(offsetX, offsetY + i * cellSize);
				ctx.lineTo(offsetX + gridWidth, offsetY + i * cellSize);
				ctx.stroke();
			}
		}

		// Handle line clear animation
		if (isClearingAnimation) {
			const elapsed = timestamp - clearAnimationStart;
			clearAnimationProgress = Math.min(1, elapsed / CLEAR_ANIMATION_DURATION);

			if (clearAnimationProgress >= 1) {
				finishLineClear();
			}
		}

		// Draw locked pieces
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				const cellType = grid[row][col];
				if (cellType) {
					const cellColor = colors[cellType];

					// Check if this row is being cleared
					if (clearingLines.includes(row)) {
						// Swoosh animation: white sweep from left to right
						const swooshCol = clearAnimationProgress * (COLS + 2); // +2 for overshoot
						if (col < swooshCol - 1) {
							// Already swept - show white fading out
							const fadeProgress = Math.min(1, (swooshCol - col - 1) / 2);
							ctx.fillStyle = `rgba(255, 255, 255, ${1 - fadeProgress})`;
							ctx.fillRect(
								offsetX + col * cellSize,
								offsetY + row * cellSize,
								cellSize - 1,
								cellSize - 1
							);
						} else if (col < swooshCol) {
							// Sweep edge - bright white
							ctx.fillStyle = '#ffffff';
							ctx.fillRect(
								offsetX + col * cellSize,
								offsetY + row * cellSize,
								cellSize - 1,
								cellSize - 1
							);
						} else {
							// Not yet swept - show block
							drawBlock(offsetX + col * cellSize, offsetY + row * cellSize, cellColor);
						}
					} else {
						drawBlock(offsetX + col * cellSize, offsetY + row * cellSize, cellColor);
					}
				}
			}
		}

		// Game logic (pause during animation)
		if (gameState === 'playing' && currentPiece && !isClearingAnimation) {
			// Auto drop
			if (timestamp - lastDrop > dropInterval) {
				if (!movePiece(0, 1)) {
					lockPiece();
				}
				lastDrop = timestamp;
			}

			// Draw ghost piece
			const pieceColor = colors[currentPiece.type];
			let ghostY = currentPiece.y;
			while (isValidPosition(currentPiece.shape, currentPiece.x, ghostY + 1)) {
				ghostY++;
			}
			ctx.globalAlpha = 0.3;
			for (let row = 0; row < currentPiece.shape.length; row++) {
				for (let col = 0; col < currentPiece.shape[row].length; col++) {
					if (currentPiece.shape[row][col]) {
						drawBlock(
							offsetX + (currentPiece.x + col) * cellSize,
							offsetY + (ghostY + row) * cellSize,
							pieceColor
						);
					}
				}
			}
			ctx.globalAlpha = 1;

			// Draw current piece
			for (let row = 0; row < currentPiece.shape.length; row++) {
				for (let col = 0; col < currentPiece.shape[row].length; col++) {
					if (currentPiece.shape[row][col]) {
						drawBlock(
							offsetX + (currentPiece.x + col) * cellSize,
							offsetY + (currentPiece.y + row) * cellSize,
							pieceColor
						);
					}
				}
			}
		}

		// Draw next piece preview (top-right corner overlay)
		if (nextPiece && (gameState === 'playing' || isClearingAnimation)) {
			const nextTetromino = TETROMINOES[nextPiece];
			const previewSize = Math.max(8, Math.floor(cellSize * 0.6));
			const previewPadding = 4;
			const previewWidth = 4 * previewSize + previewPadding * 2;
			const previewHeight = 2 * previewSize + previewPadding * 2 + 12;
			const previewX = offsetX + gridWidth - previewWidth;
			const previewY = offsetY;

			// Semi-transparent background
			ctx.fillStyle = isAccentMode
				? 'rgba(255, 255, 255, 0.3)'
				: isDarkMode
					? 'rgba(0, 0, 0, 0.4)'
					: 'rgba(255, 255, 255, 0.5)';
			ctx.fillRect(previewX, previewY, previewWidth, previewHeight);

			// Only show "NEXT" label if there's enough space
			if (cellSize >= 12) {
				ctx.fillStyle = textColor;
				ctx.font = `bold ${Math.max(8, previewSize * 0.8)}px monospace`;
				ctx.textAlign = 'left';
				ctx.fillText('NEXT', previewX + previewPadding, previewY + 10);
			}

			const nextColor = colors[nextPiece];
			const pieceOffsetY = cellSize >= 12 ? 14 : 4;
			for (let row = 0; row < nextTetromino.shape.length; row++) {
				for (let col = 0; col < nextTetromino.shape[row].length; col++) {
					if (nextTetromino.shape[row][col]) {
						drawBlock(
							previewX + previewPadding + col * previewSize,
							previewY + pieceOffsetY + row * previewSize,
							nextColor,
							previewSize
						);
					}
				}
			}
		}

		// Draw score (top-left corner overlay)
		if (gameState === 'playing' || gameState === 'gameover' || isClearingAnimation) {
			const scoreSize = Math.max(10, cellSize * 0.6);
			const scorePadding = 4;

			// Semi-transparent background
			ctx.fillStyle = isAccentMode
				? 'rgba(255, 255, 255, 0.3)'
				: isDarkMode
					? 'rgba(0, 0, 0, 0.4)'
					: 'rgba(255, 255, 255, 0.5)';
			const scoreBoxWidth = Math.max(40, scoreSize * 4);
			const scoreBoxHeight = cellSize >= 12 ? scoreSize * 2.5 : scoreSize * 1.5;
			ctx.fillRect(offsetX, offsetY, scoreBoxWidth, scoreBoxHeight);

			ctx.fillStyle = textColor;
			ctx.font = `bold ${scoreSize}px monospace`;
			ctx.textAlign = 'left';
			ctx.fillText(`${score}`, offsetX + scorePadding, offsetY + scoreSize);

			if (cellSize >= 12) {
				ctx.font = `${Math.max(8, scoreSize * 0.6)}px monospace`;
				ctx.fillText(`L${level}`, offsetX + scorePadding, offsetY + scoreSize * 1.8);
			}
		}

		// Draw game over
		if (gameState === 'gameover') {
			ctx.fillStyle = textColor;
			const gameOverSize = Math.max(12, Math.min(cellSize * 0.8, 24));
			ctx.font = `bold ${gameOverSize}px monospace`;
			ctx.textAlign = 'center';
			ctx.fillText('GAME', offsetX + gridWidth / 2, offsetY + gridHeight / 2 - gameOverSize * 0.3);
			ctx.fillText('OVER', offsetX + gridWidth / 2, offsetY + gridHeight / 2 + gameOverSize * 0.9);
		}

		// Draw start screen with controls
		if (gameState === 'idle') {
			ctx.fillStyle = textColor;
			ctx.textAlign = 'center';

			const centerX = offsetX + gridWidth / 2;
			const centerY = offsetY + gridHeight / 2;
			const titleSize = Math.max(12, Math.min(cellSize * 0.8, 20));

			ctx.font = `bold ${titleSize}px monospace`;
			ctx.fillText('TETRIS', centerX, centerY - titleSize);

			// Only show controls on larger cards
			if (cellSize >= 15) {
				const controlSize = Math.max(8, cellSize * 0.35);
				ctx.font = `${controlSize}px monospace`;
				ctx.fillText('\u2190\u2192 Move', centerX, centerY + controlSize * 0.5);
				ctx.fillText('\u2191 Rotate  \u2193 Down', centerX, centerY + controlSize * 2);
				ctx.fillText('SPACE Drop', centerX, centerY + controlSize * 3.5);
			}
		}

		animationId = requestAnimationFrame(gameLoop);
	}

	function resizeCanvas() {
		calculateSize();
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		detectTheme();
		calculateSize();
		initGrid();

		const resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});
		resizeObserver.observe(canvas.parentElement!);

		animationId = requestAnimationFrame(gameLoop);

		return () => {
			resizeObserver.disconnect();
		};
	});

	onDestroy(() => {
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
		if (audioCtx) {
			audioCtx.close();
		}
		if (bgMusic) {
			bgMusic.pause();
			bgMusic = null;
		}
		if (longPressTimer) {
			clearTimeout(longPressTimer);
		}
		if (longPressInterval) {
			clearInterval(longPressInterval);
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={container}
	class="relative h-full w-full overflow-hidden outline-none"
	tabindex="0"
	role="application"
	aria-label="Tetris game"
	onkeydown={handleKeyDown}
>
	<canvas
		bind:this={canvas}
		class="h-full w-full touch-none select-none"
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
	></canvas>

	{#if gameState === 'idle' || gameState === 'gameover'}
		<button
			onclick={startGame}
			class="border-base-800 bg-base-100/80 text-base-800 hover:bg-base-800 hover:text-base-100 dark:border-base-200 dark:bg-base-800/80 dark:text-base-200 dark:hover:bg-base-200 dark:hover:text-base-800 accent:border-base-900 accent:bg-white/80 accent:text-base-900 accent:hover:bg-base-900 accent:hover:text-white absolute bottom-4 left-1/2 -translate-x-1/2 transform cursor-pointer rounded-lg border-2 px-4 py-2 font-mono text-xs font-bold transition-colors"
		>
			{gameState === 'gameover' ? 'PLAY AGAIN' : 'START'}
		</button>
	{/if}
</div>
