export const textAlignClasses: Record<string, string> = {
	left: 'text-left',
	center: 'text-center',
	right: 'text-right'
};

export const textSizeClasses = ['prose-sm', 'prose-base', 'prose-lg', 'prose-xl'];

export function defaultTextSectionData(): Record<string, any> {
	return {
		text: '## A heading\n\nWrite some **markdown** here. Links like [this one](https://blento.app) work too.',
		textAlign: 'left',
		textSize: 1
	};
}
