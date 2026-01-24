<script lang="ts">
	import { onMount } from 'svelte';

	let {
		url,
		icon,
		iconColor,
		class: className = ''
	}: {
		url: string;
		icon?: string;
		iconColor?: string;
		class?: string;
	} = $props();

	let container: HTMLDivElement | undefined = $state();

	// Convert SVG string to data URI for use as QR center image
	function svgToDataUri(svg: string, color: string): string {
		// Add fill color to SVG - insert fill attribute on the svg tag
		let coloredSvg = svg;
		if (!svg.includes('fill=')) {
			// No fill attribute, add it to the svg tag
			coloredSvg = svg.replace('<svg', `<svg fill="${color}"`);
		} else {
			// Replace existing fill attributes
			coloredSvg = svg.replace(/fill="[^"]*"/g, `fill="${color}"`);
		}
		const encoded = encodeURIComponent(coloredSvg);
		return `data:image/svg+xml,${encoded}`;
	}

	onMount(async () => {
		if (!container) return;

		// Use iconColor or default accent, ensure # prefix
		const rawColor = iconColor || 'f6339a';
		const dotColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;

		const module = await import('qr-code-styling');
		const QRCodeStyling = module.default;

		// Get container size for responsive QR
		const rect = container.getBoundingClientRect();
		const size = Math.min(rect.width, rect.height) || 280;

		const options: ConstructorParameters<typeof QRCodeStyling>[0] = {
			width: size,
			height: size,
			data: url,
			dotsOptions: {
				color: dotColor,
				type: 'rounded'
			},
			backgroundOptions: {
				color: '#FFF'
			},
			cornersSquareOptions: {
				type: 'extra-rounded',
				color: dotColor
			},
			cornersDotOptions: {
				type: 'dot',
				color: dotColor
			},
			margin: 10
		};

		// Add icon as center image if provided (as SVG string)
		if (icon) {
			options.image = svgToDataUri(icon, dotColor);
			options.imageOptions = {
				margin: 10,
				imageSize: 0.5
			};
		}

		const qrCode = new QRCodeStyling(options);
		qrCode.append(container);
	});
</script>

<div bind:this={container} class="flex items-center justify-center {className}"></div>
