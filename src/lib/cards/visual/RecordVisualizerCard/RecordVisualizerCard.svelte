<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as PIXI from 'pixi.js';
	import type { ContentComponentProps } from '../../types';

	let { item }: ContentComponentProps = $props();

	type RecordVisualizerCardData = {
		emoji?: string;
		collection?: string;
		direction?: 'down' | 'up';
		speed?: number;
	};

	let cardData = $derived(item.cardData as RecordVisualizerCardData);

	let emoji = $derived(cardData.emoji || '💙');
	let collection = $derived(cardData.collection || 'app.bsky.feed.like');
	let direction = $derived(cardData.direction || 'down');
	let speed = $derived(Math.max(0.5, Math.min(2, cardData.speed || 1)));

	let containerEl: HTMLDivElement | null = null;
	let canvasEl: HTMLCanvasElement | null = null;
	let app: PIXI.Application | null = null;
	let ws: WebSocket | null = null;
	let prevCollection = $state<string | null>(null);
	let prevEmoji = $state<string | null>(null);
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

	const RECONNECT_DEBOUNCE = 1000;
	const MAX_PARTICLES = 10000;

	// Particle system
	interface ParticleSprite extends PIXI.Sprite {
		speedX: number;
		speedY: number;
		age: number;
		maxAge: number;
		initialSize: number;
	}

	let particles: ParticleSprite[] = [];
	let particlePool: ParticleSprite[] = [];
	let particleContainer: PIXI.Container | null = null;
	let emojiTexture: PIXI.Texture | null = null;

	function createEmojiTexture(emojiChar: string): PIXI.Texture {
		const canvas = document.createElement('canvas');
		const size = 64;
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		ctx.font = `${size * 0.8}px serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(emojiChar, size / 2, size / 2);
		return PIXI.Texture.from(canvas);
	}

	function spawnParticle() {
		if (!app || !particleContainer || !emojiTexture) return;

		let particle: ParticleSprite;
		if (particlePool.length > 0) {
			particle = particlePool.pop()!;
			particle.texture = emojiTexture;
		} else if (particles.length < MAX_PARTICLES) {
			particle = new PIXI.Sprite(emojiTexture) as ParticleSprite;
			particle.anchor.set(0.5, 0.5);
			particleContainer.addChild(particle);
		} else {
			return;
		}

		const w = app.screen.width;
		const h = app.screen.height;

		// Parallax: random scale from 0.3 (far/small) to 1.0 (near/large)
		const scale = Math.random() * 0.7 + 0.3;
		const baseSize = (Math.random() * 30 + 15) * scale;

		particle.visible = true;
		particle.x = Math.random() * w;
		particle.y = direction === 'down' ? -baseSize : h + baseSize;
		particle.width = particle.height = baseSize;
		particle.alpha = 0.4 + scale * 0.6;
		particle.rotation = (Math.random() - 0.5) * 0.3;
		particle.zIndex = Math.round(scale * 10);

		// Speed based on scale (smaller = slower for parallax)
		const baseSpeed = 80 * speed;
		const effectiveSpeed = baseSpeed * scale;
		particle.speedX = (Math.random() - 0.5) * 20;
		particle.speedY = direction === 'down' ? effectiveSpeed : -effectiveSpeed;

		particle.age = 0;
		particle.maxAge = (h + baseSize * 2) / effectiveSpeed + 2;
		particle.initialSize = baseSize;

		particles.push(particle);
	}

	function removeParticle(particle: ParticleSprite) {
		const index = particles.indexOf(particle);
		if (index !== -1) {
			particle.visible = false;
			particles.splice(index, 1);
			particlePool.push(particle);
		}
	}

	function updateParticles(deltaTime: number) {
		if (!app) return;
		const h = app.screen.height;

		for (let i = particles.length - 1; i >= 0; i--) {
			const particle = particles[i];
			particle.x += particle.speedX * deltaTime;
			particle.y += particle.speedY * deltaTime;
			particle.age += deltaTime;

			// Remove if off screen or too old
			const isOffScreen =
				direction === 'down'
					? particle.y > h + particle.initialSize
					: particle.y < -particle.initialSize;

			if (particle.age >= particle.maxAge || isOffScreen) {
				removeParticle(particle);
			}
		}
	}

	async function initPixi() {
		if (!browser || !containerEl || !canvasEl) return;

		// Clean up existing app
		if (app) {
			app.destroy(true, { children: true, texture: true });
			app = null;
		}

		particles = [];
		particlePool = [];

		app = new PIXI.Application();
		await app.init({
			canvas: canvasEl,
			width: containerEl.clientWidth,
			height: containerEl.clientHeight,
			backgroundAlpha: 0,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true
		});

		particleContainer = new PIXI.Container();
		particleContainer.sortableChildren = true;
		app.stage.addChild(particleContainer);

		emojiTexture = createEmojiTexture(emoji);

		app.ticker.add((ticker) => {
			updateParticles(ticker.deltaMS * 0.001);
		});

		// Handle resize
		const resizeObserver = new ResizeObserver(() => {
			if (app && containerEl) {
				app.renderer.resize(containerEl.clientWidth, containerEl.clientHeight);
			}
		});
		resizeObserver.observe(containerEl);

		return () => {
			resizeObserver.disconnect();
		};
	}

	function connectWebSocket() {
		if (!browser) return;

		if (ws) {
			ws.close();
		}

		const wsUrl = `wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=${encodeURIComponent(collection)}`;

		try {
			ws = new WebSocket(wsUrl);

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.kind === 'commit' && data.commit?.operation === 'create') {
						spawnParticle();
					}
				} catch {
					// Ignore parse errors
				}
			};

			ws.onerror = () => {
				// Silently handle errors
			};

			ws.onclose = () => {
				setTimeout(() => {
					if (containerEl) {
						connectWebSocket();
					}
				}, 5000);
			};
		} catch {
			// Failed to create WebSocket
		}
	}

	onMount(() => {
		let cleanupResize: (() => void) | undefined;

		initPixi().then((cleanup) => {
			cleanupResize = cleanup;
		});
		connectWebSocket();

		return () => {
			if (ws) {
				ws.close();
				ws = null;
			}
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
			}
			if (app) {
				app.destroy(true, { children: true, texture: true });
				app = null;
			}
			cleanupResize?.();
		};
	});

	// Reconnect when collection changes (debounced)
	$effect(() => {
		const currentCollection = collection;

		if (prevCollection !== null && prevCollection !== currentCollection) {
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
			}
			reconnectTimeout = setTimeout(() => {
				if (ws) {
					ws.close();
				}
				connectWebSocket();
			}, RECONNECT_DEBOUNCE);
		}

		prevCollection = currentCollection;
	});

	// Update emoji texture when emoji changes
	$effect(() => {
		const currentEmoji = emoji;

		if (prevEmoji !== null && prevEmoji !== currentEmoji && app) {
			emojiTexture = createEmojiTexture(currentEmoji);
		}

		prevEmoji = currentEmoji;
	});
</script>

<div bind:this={containerEl} class="h-full w-full overflow-hidden">
	<canvas bind:this={canvasEl} class="h-full w-full"></canvas>
</div>
