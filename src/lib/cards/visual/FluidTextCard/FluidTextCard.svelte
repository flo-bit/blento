<script lang="ts">
	import { colorToHue, getHexCSSVar, getHexOfCardColor } from '../../helper';
	import type { ContentComponentProps } from '../../types';
	import { onMount, onDestroy, tick } from 'svelte';
	let { item }: ContentComponentProps = $props();

	let container: HTMLDivElement;
	let fluidCanvas: HTMLCanvasElement;
	let maskCanvas: HTMLCanvasElement;
	let shadowCanvas: HTMLCanvasElement;
	let animationId: number;
	let splatIntervalId: ReturnType<typeof setInterval>;
	let maskDrawRaf = 0;
	let maskReady = false;
	let isInitialized = $state(false);
	let resizeObserver: ResizeObserver | null = null;
	let themeObserver: MutationObserver | null = null;

	// Pure hash function for shader keyword caching
	function hashCode(s: string) {
		if (s.length === 0) return 0;
		let hash = 0;
		for (let i = 0; i < s.length; i++) {
			hash = (hash << 5) - hash + s.charCodeAt(i);
			hash |= 0;
		}
		return hash;
	}

	// WebGL helper types
	type CompileShaderFn = (type: number, source: string, keywords?: string[]) => WebGLShader;
	type CreateProgramFn = (vs: WebGLShader, fs: WebGLShader) => WebGLProgram;
	type GetUniformsFn = (program: WebGLProgram) => Record<string, WebGLUniformLocation | null>;

	// Material class for shader programs with keyword variants
	class Material {
		private gl: WebGL2RenderingContext;
		private compileShader: CompileShaderFn;
		private createProgramFn: CreateProgramFn;
		private getUniformsFn: GetUniformsFn;
		vertexShader: WebGLShader;
		fragmentShaderSource: string;
		programs: Record<number, WebGLProgram> = {};
		activeProgram: WebGLProgram | null = null;
		uniforms: Record<string, WebGLUniformLocation | null> = {};

		constructor(
			gl: WebGL2RenderingContext,
			vertexShader: WebGLShader,
			fragmentShaderSource: string,
			compileShader: CompileShaderFn,
			createProgramFn: CreateProgramFn,
			getUniformsFn: GetUniformsFn
		) {
			this.gl = gl;
			this.compileShader = compileShader;
			this.createProgramFn = createProgramFn;
			this.getUniformsFn = getUniformsFn;
			this.vertexShader = vertexShader;
			this.fragmentShaderSource = fragmentShaderSource;
		}

		setKeywords(keywords: string[]) {
			let hash = 0;
			for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

			let program = this.programs[hash];
			if (!program) {
				const fragmentShader = this.compileShader(
					this.gl.FRAGMENT_SHADER,
					this.fragmentShaderSource,
					keywords
				);
				program = this.createProgramFn(this.vertexShader, fragmentShader);
				this.programs[hash] = program;
			}

			if (program === this.activeProgram) return;

			this.uniforms = this.getUniformsFn(program);
			this.activeProgram = program;
		}

		bind() {
			this.gl.useProgram(this.activeProgram);
		}
	}

	// Program class for simple shader programs
	class Program {
		private gl: WebGL2RenderingContext;
		uniforms: Record<string, WebGLUniformLocation | null> = {};
		program: WebGLProgram;

		constructor(
			gl: WebGL2RenderingContext,
			vertexShader: WebGLShader,
			fragmentShader: WebGLShader,
			createProgramFn: CreateProgramFn,
			getUniformsFn: GetUniformsFn
		) {
			this.gl = gl;
			this.program = createProgramFn(vertexShader, fragmentShader);
			this.uniforms = getUniformsFn(this.program);
		}

		bind() {
			this.gl.useProgram(this.program);
		}
	}

	// Get text from card data
	const text = $derived((item.cardData?.text as string) || 'hello');
	const fontWeight = '900';
	const fontFamily = 'Arial';
	const fontSize = $derived(parseFloat(item.cardData?.fontSize) || 0.33);

	// Draw text mask on overlay canvas
	function drawOverlayCanvas() {
		if (!maskCanvas || !container) return;

		const width = container.clientWidth;
		const height = container.clientHeight;
		if (width === 0 || height === 0) return;

		const dpr = window.devicePixelRatio || 1;
		const isDark = document.documentElement.classList.contains('dark');

		// Draw shadow behind fluid (light mode only, transparent only)
		if (shadowCanvas && item.color === 'transparent') {
			shadowCanvas.width = width * dpr;
			shadowCanvas.height = height * dpr;
			const shadowCtx = shadowCanvas.getContext('2d')!;
			shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
			shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
			shadowCtx.scale(dpr, dpr);

			const textFontSize = Math.round(width * fontSize);
			shadowCtx.font = `${fontWeight} ${textFontSize}px ${fontFamily}`;
			shadowCtx.textAlign = 'center';

			const metrics = shadowCtx.measureText(text);
			let textY = height / 2;
			if (
				metrics.actualBoundingBoxAscent !== undefined &&
				metrics.actualBoundingBoxDescent !== undefined
			) {
				shadowCtx.textBaseline = 'alphabetic';
				textY = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
			} else {
				shadowCtx.textBaseline = 'middle';
			}

			// Draw darkened text shape behind fluid
			shadowCtx.fillStyle = getHexCSSVar(isDark ? '--color-base-950' : '--color-base-200');
			shadowCtx.fillText(text, width / 2, textY);
		} else if (shadowCanvas) {
			// Clear shadow canvas when not transparent
			shadowCanvas.width = 1;
			shadowCanvas.height = 1;
		}

		maskCanvas.width = width * dpr;
		maskCanvas.height = height * dpr;

		const ctx = maskCanvas.getContext('2d')!;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
		ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
		ctx.scale(dpr, dpr);

		const bgColor =
			item.color === 'transparent'
				? getHexCSSVar(isDark ? '--color-base-900' : '--color-base-50')
				: 'black';
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, width, height);

		// Font size as percentage of container width
		const textFontSize = Math.round(width * fontSize);
		ctx.font = `${fontWeight} ${textFontSize}px ${fontFamily}`;

		ctx.lineWidth = 3;
		ctx.textAlign = 'center';

		const metrics = ctx.measureText(text);
		let textY = height / 2;
		if (
			metrics.actualBoundingBoxAscent !== undefined &&
			metrics.actualBoundingBoxDescent !== undefined
		) {
			ctx.textBaseline = 'alphabetic';
			textY = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
		} else {
			ctx.textBaseline = 'middle';
		}

		if (item.color === 'transparent') {
			// Partially cut out the stroke area so fluid shows through
			ctx.globalCompositeOperation = 'destination-out';
			ctx.globalAlpha = 0.7;
			ctx.strokeStyle = 'white';
			ctx.strokeText(text, width / 2, textY);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = 'source-over';

			// Add overlay: brighten in dark mode, darken in light mode
			ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)';
			ctx.strokeText(text, width / 2, textY);
		} else {
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.strokeText(text, width / 2, textY);
		}

		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillText(text, width / 2, textY);
		ctx.globalCompositeOperation = 'source-over';
		maskReady = true;
	}

	function scheduleMaskDraw() {
		const width = container?.clientWidth ?? 0;
		const height = container?.clientHeight ?? 0;
		if (width > 0 && height > 0) {
			drawOverlayCanvas();
			return;
		}
		if (maskDrawRaf) return;
		maskDrawRaf = requestAnimationFrame(() => {
			maskDrawRaf = 0;
			const nextWidth = container?.clientWidth ?? 0;
			const nextHeight = container?.clientHeight ?? 0;
			if (nextWidth === 0 || nextHeight === 0) {
				scheduleMaskDraw();
				return;
			}
			drawOverlayCanvas();
		});
	}

	// Redraw overlay when text settings change (only after initialization)
	$effect(() => {
		// Access all reactive values to track them
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		text;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		fontSize;
		// Only redraw if already initialized
		if (isInitialized) {
			scheduleMaskDraw();
		}
	});

	onMount(async () => {
		// Wait for layout to settle
		await tick();

		const computedColor = getHexOfCardColor(item);
		const hue = colorToHue(computedColor) / 360;

		// Wait for a frame to ensure dimensions are set
		requestAnimationFrame(() => {
			initFluidSimulation(hue, hue - 0.3);
		});

		if (document.fonts?.ready) {
			document.fonts.ready.then(() => {
				if (isInitialized) scheduleMaskDraw();
			});
		}

		// Watch for dark mode changes to redraw mask with correct background
		if (item.color === 'transparent') {
			themeObserver = new MutationObserver(() => {
				if (isInitialized) scheduleMaskDraw();
			});
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class']
			});
		}
	});

	onDestroy(() => {
		if (animationId) cancelAnimationFrame(animationId);
		if (splatIntervalId) clearInterval(splatIntervalId);
		if (maskDrawRaf) cancelAnimationFrame(maskDrawRaf);
		if (resizeObserver) resizeObserver.disconnect();
		if (themeObserver) themeObserver.disconnect();
	});

	function initFluidSimulation(startHue: number, endHue: number) {
		if (!fluidCanvas || !maskCanvas || !container) return;

		maskReady = false;
		scheduleMaskDraw();

		// Simulation config
		const config = {
			SIM_RESOLUTION: 128,
			DYE_RESOLUTION: 1024,
			CAPTURE_RESOLUTION: 512,
			DENSITY_DISSIPATION: 1.0,
			VELOCITY_DISSIPATION: 0.1,
			PRESSURE: 0.8,
			PRESSURE_ITERATIONS: 20,
			CURL: 30,
			SPLAT_RADIUS: 0.25,
			SPLAT_FORCE: 1000,
			SHADING: true,
			COLORFUL: true,
			COLOR_UPDATE_SPEED: 10,
			PAUSED: false,
			BACK_COLOR: { r: 0, g: 0, b: 0 },
			TRANSPARENT: item.color === 'transparent',
			BLOOM: false,
			BLOOM_ITERATIONS: 8,
			BLOOM_RESOLUTION: 256,
			BLOOM_INTENSITY: 0.8,
			BLOOM_THRESHOLD: 0.8,
			BLOOM_SOFT_KNEE: 0.7,
			SUNRAYS: true,
			SUNRAYS_RESOLUTION: 196,
			SUNRAYS_WEIGHT: 1.0,
			START_HUE: startHue,
			END_HUE: endHue,
			RENDER_SPEED: 0.4
		};

		function PointerPrototype() {
			return {
				id: -1,
				texcoordX: 0,
				texcoordY: 0,
				prevTexcoordX: 0,
				prevTexcoordY: 0,
				deltaX: 0,
				deltaY: 0,
				down: false,
				moved: false,
				color: [0, 0, 0] as [number, number, number]
			};
		}

		type Pointer = ReturnType<typeof PointerPrototype>;
		let pointers: Pointer[] = [PointerPrototype()];
		let splatStack: number[] = [];

		const { gl: glMaybeNull, ext } = getWebGLContext(fluidCanvas);
		if (!glMaybeNull) return;
		const gl = glMaybeNull;

		if (isMobile()) {
			config.DYE_RESOLUTION = 512;
		}
		if (!ext.supportLinearFiltering) {
			config.DYE_RESOLUTION = 512;
			config.SHADING = false;
			config.BLOOM = false;
			config.SUNRAYS = false;
		}

		function getWebGLContext(canvas: HTMLCanvasElement) {
			const params = {
				alpha: true,
				depth: false,
				stencil: true,
				antialias: false,
				preserveDrawingBuffer: false
			};

			let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
			const isWebGL2 = !!gl;
			if (!isWebGL2) {
				gl = (canvas.getContext('webgl', params) ||
					canvas.getContext('experimental-webgl', params)) as WebGL2RenderingContext | null;
			}

			if (!gl) return { gl: null, ext: { supportLinearFiltering: false } as any };

			let halfFloat: any;
			let supportLinearFiltering = false;
			if (isWebGL2) {
				gl.getExtension('EXT_color_buffer_float');
				supportLinearFiltering = !!gl.getExtension('OES_texture_float_linear');
			} else {
				halfFloat = gl.getExtension('OES_texture_half_float');
				supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
			}

			gl.clearColor(0.0, 0.0, 0.0, 1.0);

			let halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat?.HALF_FLOAT_OES;
			let fallbackToUnsignedByte = false;
			if (!halfFloatTexType) {
				halfFloatTexType = gl.UNSIGNED_BYTE;
				supportLinearFiltering = true;
				fallbackToUnsignedByte = true;
			}
			let formatRGBA: any;
			let formatRG: any;
			let formatR: any;

			if (isWebGL2) {
				if (fallbackToUnsignedByte) {
					formatRGBA = { internalFormat: gl.RGBA8, format: gl.RGBA };
					formatRG = { internalFormat: gl.RGBA8, format: gl.RGBA };
					formatR = { internalFormat: gl.RGBA8, format: gl.RGBA };
				} else {
					formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
					formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
					formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
					if (!formatRGBA) formatRGBA = { internalFormat: gl.RGBA8, format: gl.RGBA };
					if (!formatRG) formatRG = { internalFormat: gl.RGBA8, format: gl.RGBA };
					if (!formatR) formatR = { internalFormat: gl.RGBA8, format: gl.RGBA };
				}
			} else {
				formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
				formatRG = { internalFormat: gl.RGBA, format: gl.RGBA };
				formatR = { internalFormat: gl.RGBA, format: gl.RGBA };
				if (!fallbackToUnsignedByte) {
					formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType) ?? formatRGBA;
					formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType) ?? formatRG;
					formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType) ?? formatR;
				}
			}

			return {
				gl,
				ext: {
					formatRGBA,
					formatRG,
					formatR,
					halfFloatTexType,
					supportLinearFiltering
				}
			};
		}

		function getSupportedFormat(
			gl: WebGL2RenderingContext,
			internalFormat: number,
			format: number,
			type: number
		): { internalFormat: number; format: number } | null {
			if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
				switch (internalFormat) {
					case gl.R16F:
						return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
					case gl.RG16F:
						return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
					default:
						return null;
				}
			}
			return { internalFormat, format };
		}

		function supportRenderTextureFormat(
			gl: WebGL2RenderingContext,
			internalFormat: number,
			format: number,
			type: number
		) {
			if (!type) return false;
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

			const fbo = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			return status === gl.FRAMEBUFFER_COMPLETE;
		}

		function isMobile() {
			return /Mobi|Android/i.test(navigator.userAgent);
		}

		function createWebGLProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
			const program = gl.createProgram()!;
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);

			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.trace(gl.getProgramInfoLog(program));
			}

			return program;
		}

		function getUniforms(program: WebGLProgram) {
			const uniforms: Record<string, WebGLUniformLocation | null> = {};
			const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
			for (let i = 0; i < uniformCount; i++) {
				const uniformName = gl.getActiveUniform(program, i)!.name;
				uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
			}
			return uniforms;
		}

		function compileShader(type: number, source: string, keywords?: string[]) {
			source = addKeywords(source, keywords);

			const shader = gl.createShader(type)!;
			gl.shaderSource(shader, source);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.trace(gl.getShaderInfoLog(shader));
			}

			return shader;
		}

		function addKeywords(source: string, keywords?: string[]) {
			if (!keywords) return source;
			let keywordsString = '';
			keywords.forEach((keyword) => {
				keywordsString += '#define ' + keyword + '\n';
			});
			return keywordsString + source;
		}

		const baseVertexShader = compileShader(
			gl.VERTEX_SHADER,
			`
			precision highp float;
			attribute vec2 aPosition;
			varying vec2 vUv;
			varying vec2 vL;
			varying vec2 vR;
			varying vec2 vT;
			varying vec2 vB;
			uniform vec2 texelSize;
			void main () {
				vUv = aPosition * 0.5 + 0.5;
				vL = vUv - vec2(texelSize.x, 0.0);
				vR = vUv + vec2(texelSize.x, 0.0);
				vT = vUv + vec2(0.0, texelSize.y);
				vB = vUv - vec2(0.0, texelSize.y);
				gl_Position = vec4(aPosition, 0.0, 1.0);
			}
		`
		);

		const blurVertexShader = compileShader(
			gl.VERTEX_SHADER,
			`
			precision highp float;
			attribute vec2 aPosition;
			varying vec2 vUv;
			varying vec2 vL;
			varying vec2 vR;
			uniform vec2 texelSize;
			void main () {
				vUv = aPosition * 0.5 + 0.5;
				float offset = 1.33333333;
				vL = vUv - texelSize * offset;
				vR = vUv + texelSize * offset;
				gl_Position = vec4(aPosition, 0.0, 1.0);
			}
		`
		);

		const blurShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying vec2 vUv;
			varying vec2 vL;
			varying vec2 vR;
			uniform sampler2D uTexture;
			void main () {
				vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
				sum += texture2D(uTexture, vL) * 0.35294117;
				sum += texture2D(uTexture, vR) * 0.35294117;
				gl_FragColor = sum;
			}
		`
		);

		const copyShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying highp vec2 vUv;
			uniform sampler2D uTexture;
			void main () {
				gl_FragColor = texture2D(uTexture, vUv);
			}
		`
		);

		const clearShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying highp vec2 vUv;
			uniform sampler2D uTexture;
			uniform float value;
			void main () {
				gl_FragColor = value * texture2D(uTexture, vUv);
			}
		`
		);

		const colorShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			uniform vec4 color;
			void main () {
				gl_FragColor = color;
			}
		`
		);

		const displayShaderSource = `
			precision highp float;
			precision highp sampler2D;
			varying vec2 vUv;
			varying vec2 vL;
			varying vec2 vR;
			varying vec2 vT;
			varying vec2 vB;
			uniform sampler2D uTexture;
			uniform sampler2D uBloom;
			uniform sampler2D uSunrays;
			uniform sampler2D uDithering;
			uniform vec2 ditherScale;
			uniform vec2 texelSize;
			vec3 linearToGamma (vec3 color) {
				color = max(color, vec3(0));
				return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
			}
			void main () {
				vec3 c = texture2D(uTexture, vUv).rgb;
			#ifdef SHADING
				vec3 lc = texture2D(uTexture, vL).rgb;
				vec3 rc = texture2D(uTexture, vR).rgb;
				vec3 tc = texture2D(uTexture, vT).rgb;
				vec3 bc = texture2D(uTexture, vB).rgb;
				float dx = length(rc) - length(lc);
				float dy = length(tc) - length(bc);
				vec3 n = normalize(vec3(dx, dy, length(texelSize)));
				vec3 l = vec3(0.0, 0.0, 1.0);
				float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
				c *= diffuse;
			#endif
			#ifdef BLOOM
				vec3 bloom = texture2D(uBloom, vUv).rgb;
			#endif
			#ifdef SUNRAYS
				float sunrays = texture2D(uSunrays, vUv).r;
				c *= sunrays;
			#ifdef BLOOM
				bloom *= sunrays;
			#endif
			#endif
			#ifdef BLOOM
				float noise = texture2D(uDithering, vUv * ditherScale).r;
				noise = noise * 2.0 - 1.0;
				bloom += noise / 255.0;
				bloom = linearToGamma(bloom);
				c += bloom;
			#endif
				float a = max(c.r, max(c.g, c.b));
				gl_FragColor = vec4(c, a);
			}
		`;

		const splatShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision highp float;
			precision highp sampler2D;
			varying vec2 vUv;
			uniform sampler2D uTarget;
			uniform float aspectRatio;
			uniform vec3 color;
			uniform vec2 point;
			uniform float radius;
			void main () {
				vec2 p = vUv - point.xy;
				p.x *= aspectRatio;
				vec3 splat = exp(-dot(p, p) / radius) * color;
				vec3 base = texture2D(uTarget, vUv).xyz;
				gl_FragColor = vec4(base + splat, 1.0);
			}
		`
		);

		const advectionShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision highp float;
			precision highp sampler2D;
			varying vec2 vUv;
			uniform sampler2D uVelocity;
			uniform sampler2D uSource;
			uniform vec2 texelSize;
			uniform vec2 dyeTexelSize;
			uniform float dt;
			uniform float dissipation;
			vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
				vec2 st = uv / tsize - 0.5;
				vec2 iuv = floor(st);
				vec2 fuv = fract(st);
				vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
				vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
				vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
				vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
				return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
			}
			void main () {
			#ifdef MANUAL_FILTERING
				vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
				vec4 result = bilerp(uSource, coord, dyeTexelSize);
			#else
				vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
				vec4 result = texture2D(uSource, coord);
			#endif
				float decay = 1.0 + dissipation * dt;
				gl_FragColor = result / decay;
			}`,
			ext.supportLinearFiltering ? undefined : ['MANUAL_FILTERING']
		);

		const divergenceShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying highp vec2 vUv;
			varying highp vec2 vL;
			varying highp vec2 vR;
			varying highp vec2 vT;
			varying highp vec2 vB;
			uniform sampler2D uVelocity;
			void main () {
				float L = texture2D(uVelocity, vL).x;
				float R = texture2D(uVelocity, vR).x;
				float T = texture2D(uVelocity, vT).y;
				float B = texture2D(uVelocity, vB).y;
				vec2 C = texture2D(uVelocity, vUv).xy;
				if (vL.x < 0.0) { L = -C.x; }
				if (vR.x > 1.0) { R = -C.x; }
				if (vT.y > 1.0) { T = -C.y; }
				if (vB.y < 0.0) { B = -C.y; }
				float div = 0.5 * (R - L + T - B);
				gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
			}
		`
		);

		const curlShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying highp vec2 vUv;
			varying highp vec2 vL;
			varying highp vec2 vR;
			varying highp vec2 vT;
			varying highp vec2 vB;
			uniform sampler2D uVelocity;
			void main () {
				float L = texture2D(uVelocity, vL).y;
				float R = texture2D(uVelocity, vR).y;
				float T = texture2D(uVelocity, vT).x;
				float B = texture2D(uVelocity, vB).x;
				float vorticity = R - L - T + B;
				gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
			}
		`
		);

		const vorticityShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision highp float;
			precision highp sampler2D;
			varying vec2 vUv;
			varying vec2 vL;
			varying vec2 vR;
			varying vec2 vT;
			varying vec2 vB;
			uniform sampler2D uVelocity;
			uniform sampler2D uCurl;
			uniform float curl;
			uniform float dt;
			void main () {
				float L = texture2D(uCurl, vL).x;
				float R = texture2D(uCurl, vR).x;
				float T = texture2D(uCurl, vT).x;
				float B = texture2D(uCurl, vB).x;
				float C = texture2D(uCurl, vUv).x;
				vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
				force /= length(force) + 0.0001;
				force *= curl * C;
				force.y *= -1.0;
				vec2 velocity = texture2D(uVelocity, vUv).xy;
				velocity += force * dt;
				velocity = min(max(velocity, -1000.0), 1000.0);
				gl_FragColor = vec4(velocity, 0.0, 1.0);
			}
		`
		);

		const pressureShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying highp vec2 vUv;
			varying highp vec2 vL;
			varying highp vec2 vR;
			varying highp vec2 vT;
			varying highp vec2 vB;
			uniform sampler2D uPressure;
			uniform sampler2D uDivergence;
			void main () {
				float L = texture2D(uPressure, vL).x;
				float R = texture2D(uPressure, vR).x;
				float T = texture2D(uPressure, vT).x;
				float B = texture2D(uPressure, vB).x;
				float C = texture2D(uPressure, vUv).x;
				float divergence = texture2D(uDivergence, vUv).x;
				float pressure = (L + R + B + T - divergence) * 0.25;
				gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
			}
		`
		);

		const gradientSubtractShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			precision mediump sampler2D;
			varying highp vec2 vUv;
			varying highp vec2 vL;
			varying highp vec2 vR;
			varying highp vec2 vT;
			varying highp vec2 vB;
			uniform sampler2D uPressure;
			uniform sampler2D uVelocity;
			void main () {
				float L = texture2D(uPressure, vL).x;
				float R = texture2D(uPressure, vR).x;
				float T = texture2D(uPressure, vT).x;
				float B = texture2D(uPressure, vB).x;
				vec2 velocity = texture2D(uVelocity, vUv).xy;
				velocity.xy -= vec2(R - L, T - B);
				gl_FragColor = vec4(velocity, 0.0, 1.0);
			}
		`
		);

		const sunraysMaskShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision highp float;
			precision highp sampler2D;
			varying vec2 vUv;
			uniform sampler2D uTexture;
			void main () {
				vec4 c = texture2D(uTexture, vUv);
				float br = max(c.r, max(c.g, c.b));
				c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
				gl_FragColor = c;
			}
		`
		);

		const sunraysShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
			precision highp float;
			precision highp sampler2D;
			varying vec2 vUv;
			uniform sampler2D uTexture;
			uniform float weight;
			#define ITERATIONS 16
			void main () {
				float Density = 0.3;
				float Decay = 0.95;
				float Exposure = 0.7;
				vec2 coord = vUv;
				vec2 dir = vUv - 0.5;
				dir *= 1.0 / float(ITERATIONS) * Density;
				float illuminationDecay = 1.0;
				float color = texture2D(uTexture, vUv).a;
				for (int i = 0; i < ITERATIONS; i++) {
					coord -= dir;
					float col = texture2D(uTexture, coord).a;
					color += col * illuminationDecay * weight;
					illuminationDecay *= Decay;
				}
				gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
			}
		`
		);

		// Setup blit
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);

		type FBO = {
			texture: WebGLTexture;
			fbo: WebGLFramebuffer;
			width: number;
			height: number;
			texelSizeX: number;
			texelSizeY: number;
			attach: (id: number) => number;
		};

		type DoubleFBO = {
			width: number;
			height: number;
			texelSizeX: number;
			texelSizeY: number;
			read: FBO;
			write: FBO;
			swap: () => void;
		};

		function blit(target: FBO | null, clear = false) {
			if (target === null) {
				gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			} else {
				gl.viewport(0, 0, target.width, target.height);
				gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
			}
			if (clear) {
				gl.clearColor(0.0, 0.0, 0.0, 1.0);
				gl.clear(gl.COLOR_BUFFER_BIT);
			}
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}

		let dye: DoubleFBO;
		let velocity: DoubleFBO;
		let divergence: FBO;
		let curl: FBO;
		let pressure: DoubleFBO;
		let sunrays: FBO;
		let sunraysTemp: FBO;

		const blurProgram = new Program(
			gl,
			blurVertexShader,
			blurShader,
			createWebGLProgram,
			getUniforms
		);
		const copyProgram = new Program(
			gl,
			baseVertexShader,
			copyShader,
			createWebGLProgram,
			getUniforms
		);
		const clearProgram = new Program(
			gl,
			baseVertexShader,
			clearShader,
			createWebGLProgram,
			getUniforms
		);
		const colorProgram = new Program(
			gl,
			baseVertexShader,
			colorShader,
			createWebGLProgram,
			getUniforms
		);
		const splatProgram = new Program(
			gl,
			baseVertexShader,
			splatShader,
			createWebGLProgram,
			getUniforms
		);
		const advectionProgram = new Program(
			gl,
			baseVertexShader,
			advectionShader,
			createWebGLProgram,
			getUniforms
		);
		const divergenceProgram = new Program(
			gl,
			baseVertexShader,
			divergenceShader,
			createWebGLProgram,
			getUniforms
		);
		const curlProgram = new Program(
			gl,
			baseVertexShader,
			curlShader,
			createWebGLProgram,
			getUniforms
		);
		const vorticityProgram = new Program(
			gl,
			baseVertexShader,
			vorticityShader,
			createWebGLProgram,
			getUniforms
		);
		const pressureProgram = new Program(
			gl,
			baseVertexShader,
			pressureShader,
			createWebGLProgram,
			getUniforms
		);
		const gradienSubtractProgram = new Program(
			gl,
			baseVertexShader,
			gradientSubtractShader,
			createWebGLProgram,
			getUniforms
		);
		const sunraysMaskProgram = new Program(
			gl,
			baseVertexShader,
			sunraysMaskShader,
			createWebGLProgram,
			getUniforms
		);
		const sunraysProgram = new Program(
			gl,
			baseVertexShader,
			sunraysShader,
			createWebGLProgram,
			getUniforms
		);

		const displayMaterial = new Material(
			gl,
			baseVertexShader,
			displayShaderSource,
			compileShader,
			createWebGLProgram,
			getUniforms
		);

		function getResolution(resolution: number) {
			let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
			if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
			const min = Math.round(resolution);
			const max = Math.round(resolution * aspectRatio);
			if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
			else return { width: min, height: max };
		}

		function createFBO(
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number
		): FBO {
			gl.activeTexture(gl.TEXTURE0);
			const texture = gl.createTexture()!;
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

			const fbo = gl.createFramebuffer()!;
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
			gl.viewport(0, 0, w, h);
			gl.clear(gl.COLOR_BUFFER_BIT);

			const texelSizeX = 1.0 / w;
			const texelSizeY = 1.0 / h;

			return {
				texture,
				fbo,
				width: w,
				height: h,
				texelSizeX,
				texelSizeY,
				attach(id: number) {
					gl.activeTexture(gl.TEXTURE0 + id);
					gl.bindTexture(gl.TEXTURE_2D, texture);
					return id;
				}
			};
		}

		function createDoubleFBO(
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number
		): DoubleFBO {
			let fbo1 = createFBO(w, h, internalFormat, format, type, param);
			let fbo2 = createFBO(w, h, internalFormat, format, type, param);

			return {
				width: w,
				height: h,
				texelSizeX: fbo1.texelSizeX,
				texelSizeY: fbo1.texelSizeY,
				get read() {
					return fbo1;
				},
				set read(value) {
					fbo1 = value;
				},
				get write() {
					return fbo2;
				},
				set write(value) {
					fbo2 = value;
				},
				swap() {
					const temp = fbo1;
					fbo1 = fbo2;
					fbo2 = temp;
				}
			};
		}

		function resizeFBO(
			target: FBO,
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number
		) {
			const newFBO = createFBO(w, h, internalFormat, format, type, param);
			copyProgram.bind();
			gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
			blit(newFBO);
			return newFBO;
		}

		function resizeDoubleFBO(
			target: DoubleFBO,
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number
		) {
			if (target.width === w && target.height === h) return target;
			target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
			target.write = createFBO(w, h, internalFormat, format, type, param);
			target.width = w;
			target.height = h;
			target.texelSizeX = 1.0 / w;
			target.texelSizeY = 1.0 / h;
			return target;
		}

		function initFramebuffers() {
			const simRes = getResolution(config.SIM_RESOLUTION);
			const dyeRes = getResolution(config.DYE_RESOLUTION);

			const texType = ext.halfFloatTexType;
			const rgba = ext.formatRGBA;
			const rg = ext.formatRG;
			const r = ext.formatR;
			const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

			gl.disable(gl.BLEND);

			if (!dye) {
				dye = createDoubleFBO(
					dyeRes.width,
					dyeRes.height,
					rgba.internalFormat,
					rgba.format,
					texType,
					filtering
				);
			} else {
				dye = resizeDoubleFBO(
					dye,
					dyeRes.width,
					dyeRes.height,
					rgba.internalFormat,
					rgba.format,
					texType,
					filtering
				);
			}

			if (!velocity) {
				velocity = createDoubleFBO(
					simRes.width,
					simRes.height,
					rg.internalFormat,
					rg.format,
					texType,
					filtering
				);
			} else {
				velocity = resizeDoubleFBO(
					velocity,
					simRes.width,
					simRes.height,
					rg.internalFormat,
					rg.format,
					texType,
					filtering
				);
			}

			divergence = createFBO(
				simRes.width,
				simRes.height,
				r.internalFormat,
				r.format,
				texType,
				gl.NEAREST
			);
			curl = createFBO(
				simRes.width,
				simRes.height,
				r.internalFormat,
				r.format,
				texType,
				gl.NEAREST
			);
			pressure = createDoubleFBO(
				simRes.width,
				simRes.height,
				r.internalFormat,
				r.format,
				texType,
				gl.NEAREST
			);

			initSunraysFramebuffers();
		}

		function initSunraysFramebuffers() {
			const res = getResolution(config.SUNRAYS_RESOLUTION);
			const texType = ext.halfFloatTexType;
			const r = ext.formatR;
			const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

			sunrays = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
			sunraysTemp = createFBO(
				res.width,
				res.height,
				r.internalFormat,
				r.format,
				texType,
				filtering
			);
		}

		function updateKeywords() {
			const displayKeywords: string[] = [];
			if (config.SHADING) displayKeywords.push('SHADING');
			if (config.SUNRAYS) displayKeywords.push('SUNRAYS');
			displayMaterial.setKeywords(displayKeywords);
		}

		function scaleByPixelRatio(input: number) {
			const pixelRatio = window.devicePixelRatio || 1;
			return Math.floor(input * pixelRatio);
		}

		function resizeCanvas() {
			const width = scaleByPixelRatio(fluidCanvas.clientWidth);
			const height = scaleByPixelRatio(fluidCanvas.clientHeight);
			if (fluidCanvas.width !== width || fluidCanvas.height !== height) {
				fluidCanvas.width = width;
				fluidCanvas.height = height;
				scheduleMaskDraw();
				return true;
			}
			return false;
		}

		function HSVtoRGB(h: number, s: number, v: number) {
			let r = 0,
				g = 0,
				b = 0;
			const i = Math.floor(h * 6);
			const f = h * 6 - i;
			const p = v * (1 - s);
			const q = v * (1 - f * s);
			const t = v * (1 - (1 - f) * s);

			switch (i % 6) {
				case 0:
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					((r = v), (g = t), (b = p));
					break;
				case 1:
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					((r = q), (g = v), (b = p));
					break;
				case 2:
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					((r = p), (g = v), (b = t));
					break;
				case 3:
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					((r = p), (g = q), (b = v));
					break;
				case 4:
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					((r = t), (g = p), (b = v));
					break;
				case 5:
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					((r = v), (g = p), (b = q));
					break;
			}

			return { r, g, b };
		}

		function generateColor() {
			const c = HSVtoRGB(
				Math.random() * (config.END_HUE - config.START_HUE) + config.START_HUE,
				1.0,
				1.0
			);
			c.r *= 0.15;
			c.g *= 0.15;
			c.b *= 0.15;
			return c;
		}

		function correctRadius(radius: number) {
			const aspectRatio = fluidCanvas.width / fluidCanvas.height;
			if (aspectRatio > 1) radius *= aspectRatio;
			return radius;
		}

		function splat(
			x: number,
			y: number,
			dx: number,
			dy: number,
			color: { r: number; g: number; b: number }
		) {
			splatProgram.bind();
			gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
			gl.uniform1f(splatProgram.uniforms.aspectRatio, fluidCanvas.width / fluidCanvas.height);
			gl.uniform2f(splatProgram.uniforms.point, x, y);
			gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
			gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
			blit(velocity.write);
			velocity.swap();

			gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
			gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
			blit(dye.write);
			dye.swap();
		}

		function multipleSplats(amount: number) {
			for (let i = 0; i < amount; i++) {
				const color = generateColor();
				color.r *= 10.0;
				color.g *= 10.0;
				color.b *= 10.0;
				const x = Math.random();
				const y = Math.random() < 0.5 ? 0.95 : 0.05;
				const dx = 300 * (Math.random() - 0.5);
				const dy = 3000 * (Math.random() - 0.5);
				splat(x, y, dx, dy, color);
			}
		}

		function splatPointer(pointer: Pointer) {
			const dx = pointer.deltaX * config.SPLAT_FORCE * 12;
			const dy = pointer.deltaY * config.SPLAT_FORCE * 12;
			splat(pointer.texcoordX, pointer.texcoordY, dx, dy, {
				r: pointer.color[0],
				g: pointer.color[1],
				b: pointer.color[2]
			});
		}

		function step(dt: number) {
			gl.disable(gl.BLEND);

			curlProgram.bind();
			gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
			gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
			blit(curl);

			vorticityProgram.bind();
			gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
			gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
			gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
			gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
			gl.uniform1f(vorticityProgram.uniforms.dt, dt);
			blit(velocity.write);
			velocity.swap();

			divergenceProgram.bind();
			gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
			gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
			blit(divergence);

			clearProgram.bind();
			gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
			gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
			blit(pressure.write);
			pressure.swap();

			pressureProgram.bind();
			gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
			gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
			for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
				gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
				blit(pressure.write);
				pressure.swap();
			}

			gradienSubtractProgram.bind();
			gl.uniform2f(
				gradienSubtractProgram.uniforms.texelSize,
				velocity.texelSizeX,
				velocity.texelSizeY
			);
			gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
			gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
			blit(velocity.write);
			velocity.swap();

			advectionProgram.bind();
			gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
			if (!ext.supportLinearFiltering) {
				gl.uniform2f(
					advectionProgram.uniforms.dyeTexelSize,
					velocity.texelSizeX,
					velocity.texelSizeY
				);
			}
			const velocityId = velocity.read.attach(0);
			gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
			gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
			gl.uniform1f(advectionProgram.uniforms.dt, dt);
			gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
			blit(velocity.write);
			velocity.swap();

			if (!ext.supportLinearFiltering) {
				gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
			}
			gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
			gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
			gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
			blit(dye.write);
			dye.swap();
		}

		function blur(target: FBO, temp: FBO, iterations: number) {
			blurProgram.bind();
			for (let i = 0; i < iterations; i++) {
				gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
				gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
				blit(temp);

				gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
				gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
				blit(target);
			}
		}

		function applySunrays(source: FBO, mask: FBO, destination: FBO) {
			gl.disable(gl.BLEND);
			sunraysMaskProgram.bind();
			gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0));
			blit(mask);

			sunraysProgram.bind();
			gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
			gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0));
			blit(destination);
		}

		function drawColor(target: FBO | null, color: { r: number; g: number; b: number }) {
			colorProgram.bind();
			gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
			blit(target);
		}

		function drawDisplay(target: FBO | null) {
			const width = target === null ? gl.drawingBufferWidth : target.width;
			const height = target === null ? gl.drawingBufferHeight : target.height;

			displayMaterial.bind();
			if (config.SHADING) {
				gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
			}
			gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
			if (config.SUNRAYS) {
				gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
			}
			blit(target);
		}

		function render(target: FBO | null) {
			if (config.SUNRAYS) {
				applySunrays(dye.read, dye.write, sunrays);
				blur(sunrays, sunraysTemp, 1);
			}

			if (target === null || !config.TRANSPARENT) {
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				gl.enable(gl.BLEND);
			} else {
				gl.disable(gl.BLEND);
			}

			if (!config.TRANSPARENT) {
				drawColor(target, {
					r: config.BACK_COLOR.r / 255,
					g: config.BACK_COLOR.g / 255,
					b: config.BACK_COLOR.b / 255
				});
			}
			drawDisplay(target);
		}

		function wrap(value: number, min: number, max: number) {
			const range = max - min;
			if (range === 0) return min;
			return ((value - min) % range) + min;
		}

		let lastUpdateTime = Date.now();
		let colorUpdateTimer = 0.0;

		function updateColors(dt: number) {
			if (!config.COLORFUL) return;
			colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
			if (colorUpdateTimer >= 1) {
				colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
				pointers.forEach((p) => {
					const c = generateColor();
					p.color = [c.r, c.g, c.b];
				});
			}
		}

		function applyInputs() {
			if (splatStack.length > 0) multipleSplats(splatStack.pop()!);

			pointers.forEach((p) => {
				if (p.moved) {
					p.moved = false;
					splatPointer(p);
				}
			});
		}

		function calcDeltaTime() {
			const now = Date.now();
			let dt = (now - lastUpdateTime) / 1000;
			// Allow up to ~30fps worth of time to pass per frame to handle browser throttling
			// This prevents the simulation from appearing to slow down when RAF is throttled
			dt = Math.min(dt, 0.033);
			lastUpdateTime = now;
			return dt;
		}

		function update() {
			const dt = calcDeltaTime() * (config.RENDER_SPEED ?? 1.0);
			if (resizeCanvas()) initFramebuffers();
			if (!maskReady) {
				scheduleMaskDraw();
				gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
				gl.clearColor(0.0, 0.0, 0.0, 1.0);
				gl.clear(gl.COLOR_BUFFER_BIT);
				animationId = requestAnimationFrame(update);
				return;
			}
			updateColors(dt);
			applyInputs();
			if (!config.PAUSED) step(dt);
			render(null);
			animationId = requestAnimationFrame(update);
		}

		function correctDeltaX(delta: number) {
			const aspectRatio = fluidCanvas.width / fluidCanvas.height;
			if (aspectRatio < 1) delta *= aspectRatio;
			return delta;
		}

		function correctDeltaY(delta: number) {
			const aspectRatio = fluidCanvas.width / fluidCanvas.height;
			if (aspectRatio > 1) delta /= aspectRatio;
			return delta;
		}

		function updatePointerDownData(pointer: Pointer, id: number, posX: number, posY: number) {
			pointer.id = id;
			pointer.down = true;
			pointer.moved = false;
			pointer.texcoordX = posX / fluidCanvas.width;
			pointer.texcoordY = 1.0 - posY / fluidCanvas.height;
			pointer.prevTexcoordX = pointer.texcoordX;
			pointer.prevTexcoordY = pointer.texcoordY;
			pointer.deltaX = 0;
			pointer.deltaY = 0;
			const c = generateColor();
			pointer.color = [c.r, c.g, c.b];
		}

		function updatePointerMoveData(pointer: Pointer, posX: number, posY: number) {
			pointer.prevTexcoordX = pointer.texcoordX;
			pointer.prevTexcoordY = pointer.texcoordY;
			pointer.texcoordX = posX / fluidCanvas.width;
			pointer.texcoordY = 1.0 - posY / fluidCanvas.height;
			pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
			pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
			pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
		}

		function updatePointerUpData(pointer: Pointer) {
			pointer.down = false;
		}

		// Event handlers - use container so events work over both canvases
		container.addEventListener('mouseenter', (e) => {
			// Create a small burst when mouse enters the card
			const rect = container.getBoundingClientRect();
			const posX = scaleByPixelRatio(e.clientX - rect.left);
			const posY = scaleByPixelRatio(e.clientY - rect.top);
			const x = posX / fluidCanvas.width;
			const y = 1.0 - posY / fluidCanvas.height;
			const color = generateColor();
			color.r *= 10.0;
			color.g *= 10.0;
			color.b *= 10.0;
			splat(x, y, 300 * (Math.random() - 0.5), 300 * (Math.random() - 0.5), color);
		});

		container.addEventListener('mousedown', (e) => {
			const rect = container.getBoundingClientRect();
			const posX = scaleByPixelRatio(e.clientX - rect.left);
			const posY = scaleByPixelRatio(e.clientY - rect.top);
			let pointer = pointers.find((p) => p.id === -1);
			if (!pointer) pointer = PointerPrototype();
			updatePointerDownData(pointer, -1, posX, posY);
		});

		container.addEventListener('mousemove', (e) => {
			const pointer = pointers[0];
			const rect = container.getBoundingClientRect();
			const posX = scaleByPixelRatio(e.clientX - rect.left);
			const posY = scaleByPixelRatio(e.clientY - rect.top);
			updatePointerMoveData(pointer, posX, posY);
			// Always create swish effect on hover
			if (pointer.moved) {
				pointer.moved = false;
				// Generate a new color for visual interest
				const c = generateColor();
				pointer.color = [c.r, c.g, c.b];
				splat(
					pointer.texcoordX,
					pointer.texcoordY,
					pointer.deltaX * config.SPLAT_FORCE * 12,
					pointer.deltaY * config.SPLAT_FORCE * 12,
					{
						r: pointer.color[0],
						g: pointer.color[1],
						b: pointer.color[2]
					}
				);
			}
		});

		container.addEventListener('mouseup', () => {
			updatePointerUpData(pointers[0]);
		});

		container.addEventListener('touchstart', (e) => {
			e.preventDefault();
			const touches = e.targetTouches;
			while (touches.length >= pointers.length) pointers.push(PointerPrototype());
			for (let i = 0; i < touches.length; i++) {
				const rect = container.getBoundingClientRect();
				const posX = scaleByPixelRatio(touches[i].clientX - rect.left);
				const posY = scaleByPixelRatio(touches[i].clientY - rect.top);
				updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
			}
		});

		container.addEventListener('touchmove', (e) => {
			e.preventDefault();
			const touches = e.targetTouches;
			for (let i = 0; i < touches.length; i++) {
				const pointer = pointers[i + 1];
				if (!pointer.down) continue;
				const rect = container.getBoundingClientRect();
				const posX = scaleByPixelRatio(touches[i].clientX - rect.left);
				const posY = scaleByPixelRatio(touches[i].clientY - rect.top);
				updatePointerMoveData(pointer, posX, posY);
			}
		});

		container.addEventListener('touchend', (e) => {
			const touches = e.changedTouches;
			for (let i = 0; i < touches.length; i++) {
				const pointer = pointers.find((p) => p.id === touches[i].identifier);
				if (pointer) updatePointerUpData(pointer);
			}
		});

		// Initialize
		updateKeywords();
		initFramebuffers();
		multipleSplats(25);
		update();

		// Auto splat interval
		splatIntervalId = setInterval(() => {
			multipleSplats(5);
		}, 500);

		// Resize observer - also triggers initial draw
		resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
			maskReady = false;
			scheduleMaskDraw();
		});
		resizeObserver.observe(container);

		// Mark as initialized after first resize callback
		isInitialized = true;
	}
</script>

<div
	bind:this={container}
	class="relative h-full w-full overflow-hidden {item.color === 'transparent'
		? 'bg-base-50 dark:bg-base-900'
		: 'bg-black'}"
>
	<canvas bind:this={shadowCanvas} class="absolute h-full w-full"></canvas>
	<canvas bind:this={fluidCanvas} class="absolute h-full w-full"></canvas>
	<canvas bind:this={maskCanvas} class="absolute h-full w-full"></canvas>
</div>
