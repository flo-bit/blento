export type SnakeDirection = 'up' | 'down' | 'left' | 'right';
export type SnakePhase = 'idle' | 'playing' | 'gameover';

export type SnakePosition = {
	x: number;
	y: number;
};

export type SnakeGameConfig = {
	cols?: number;
	rows?: number;
	initialLength?: number;
};

export type SnakeGameState = {
	cols: number;
	rows: number;
	initialLength: number;
	snake: SnakePosition[];
	direction: SnakeDirection;
	queuedDirection: SnakeDirection | null;
	food: SnakePosition | null;
	score: number;
	tick: number;
	phase: SnakePhase;
};

type RandomFn = () => number;

const DEFAULT_COLS = 16;
const DEFAULT_ROWS = 16;
const DEFAULT_INITIAL_LENGTH = 3;

const OPPOSITES: Record<SnakeDirection, SnakeDirection> = {
	up: 'down',
	down: 'up',
	left: 'right',
	right: 'left'
};

const DIRECTION_VECTORS: Record<SnakeDirection, SnakePosition> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 }
};

function clampRandom(value: number): number {
	if (!Number.isFinite(value)) return 0;
	if (value <= 0) return 0;
	if (value >= 1) return 0.999999999999;
	return value;
}

function positionKey(pos: SnakePosition): string {
	return `${pos.x}:${pos.y}`;
}

function isSamePosition(a: SnakePosition, b: SnakePosition): boolean {
	return a.x === b.x && a.y === b.y;
}

function buildInitialSnake(cols: number, rows: number, length: number): SnakePosition[] {
	const safeLength = Math.max(2, Math.min(length, cols));
	const headX = Math.min(cols - 1, Math.max(safeLength - 1, Math.floor(cols / 2)));
	const y = Math.max(0, Math.floor(rows / 2));

	const snake: SnakePosition[] = [];
	for (let i = 0; i < safeLength; i++) {
		snake.push({ x: headX - i, y });
	}

	return snake;
}

function spawnFood(
	snake: SnakePosition[],
	cols: number,
	rows: number,
	rng: RandomFn
): SnakePosition | null {
	const occupied = new Set(snake.map(positionKey));
	const freeCells: SnakePosition[] = [];

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const key = `${x}:${y}`;
			if (!occupied.has(key)) {
				freeCells.push({ x, y });
			}
		}
	}

	if (freeCells.length === 0) {
		return null;
	}

	const index = Math.floor(clampRandom(rng()) * freeCells.length);
	return freeCells[index];
}

function createBaseState(
	{
		cols = DEFAULT_COLS,
		rows = DEFAULT_ROWS,
		initialLength = DEFAULT_INITIAL_LENGTH
	}: SnakeGameConfig,
	rng: RandomFn,
	phase: SnakePhase
): SnakeGameState {
	const safeCols = Math.max(4, cols);
	const safeRows = Math.max(4, rows);
	const safeInitialLength = Math.max(2, Math.min(initialLength, safeCols));
	const snake = buildInitialSnake(safeCols, safeRows, safeInitialLength);

	return {
		cols: safeCols,
		rows: safeRows,
		initialLength: safeInitialLength,
		snake,
		direction: 'right',
		queuedDirection: null,
		food: spawnFood(snake, safeCols, safeRows, rng),
		score: 0,
		tick: 0,
		phase
	};
}

export function createSnakeGame(
	config: SnakeGameConfig = {},
	rng: RandomFn = Math.random
): SnakeGameState {
	return createBaseState(config, rng, 'idle');
}

export function startSnakeGame(state: SnakeGameState): SnakeGameState {
	if (state.phase === 'playing' || state.phase === 'gameover') return state;
	return { ...state, phase: 'playing' };
}

export function restartSnakeGame(
	state: SnakeGameState,
	rng: RandomFn = Math.random
): SnakeGameState {
	return createBaseState(
		{ cols: state.cols, rows: state.rows, initialLength: state.initialLength },
		rng,
		'playing'
	);
}

export function setSnakeDirection(
	state: SnakeGameState,
	direction: SnakeDirection
): SnakeGameState {
	if (state.phase !== 'playing') return state;
	if (direction === state.direction || OPPOSITES[state.direction] === direction) {
		return state;
	}
	return { ...state, queuedDirection: direction };
}

export function tickSnakeGame(state: SnakeGameState, rng: RandomFn = Math.random): SnakeGameState {
	if (state.phase !== 'playing') return state;

	const nextDirection = state.queuedDirection ?? state.direction;
	const vector = DIRECTION_VECTORS[nextDirection];
	const head = state.snake[0];
	const nextHead = {
		x: (head.x + vector.x + state.cols) % state.cols,
		y: (head.y + vector.y + state.rows) % state.rows
	};

	const isEating = Boolean(state.food && isSamePosition(nextHead, state.food));
	const collisionBody = isEating ? state.snake : state.snake.slice(0, -1);

	if (collisionBody.some((part) => isSamePosition(part, nextHead))) {
		return {
			...state,
			direction: nextDirection,
			queuedDirection: null,
			phase: 'gameover'
		};
	}

	const snake = [nextHead, ...state.snake];
	if (!isEating) {
		snake.pop();
	}

	let food = state.food;
	let score = state.score;
	let phase: SnakeGameState['phase'] = state.phase;

	if (isEating) {
		score += 1;
		food = spawnFood(snake, state.cols, state.rows, rng);
		if (!food) {
			phase = 'gameover';
		}
	}

	return {
		...state,
		snake,
		food,
		score,
		tick: state.tick + 1,
		direction: nextDirection,
		queuedDirection: null,
		phase
	};
}
