// Global state for fullscreen image viewer
let openFn: ((src: string) => void) | null = null;

export function registerImageViewer(fn: (src: string) => void) {
	openFn = fn;
}

export function unregisterImageViewer() {
	openFn = null;
}

export function openImageViewer(src: string) {
	openFn?.(src);
}
