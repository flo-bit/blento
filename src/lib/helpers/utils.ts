export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function isTyping() {
	const active = document.activeElement;

	const isEditable =
		active instanceof HTMLInputElement ||
		active instanceof HTMLTextAreaElement ||
		// @ts-expect-error this fine
		active?.isContentEditable;

	return isEditable;
}
