import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { Editor, Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import SuggestionSelect from './SuggestionSelect.svelte';
import { mount, unmount } from 'svelte';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import type { RichTextTypes } from '..';

export default Extension.create({
	name: 'slash',

	addOptions() {
		return {
			suggestion: {
				char: '/',

				command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
					props.command({ editor, range });
				}
			}
		};
	},

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion
			})
		];
	}
});

export function suggestion({
	char,
	pluginKey,
	switchTo,
	processImageFile
}: {
	char: string;
	pluginKey: string;
	switchTo: (value: RichTextTypes) => void;
	processImageFile: (file: File) => void;
}) {
	return {
		char,
		pluginKey: new PluginKey(pluginKey),

		items: ({ query }: { query: string }) => {
			return [
				{
					value: 'paragraph',
					label: 'Paragraph',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('paragraph');
					}
				},
				{
					value: 'heading-1',
					label: 'Heading 1',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('heading-1');
					}
				},
				{
					value: 'heading-2',
					label: 'Heading 2',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('heading-2');
					}
				},
				{
					value: 'heading-3',
					label: 'Heading 3',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('heading-3');
					}
				},
				{
					value: 'blockquote',
					label: 'Blockquote',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('blockquote');
					}
				},
				{
					value: 'code',
					label: 'Code Block',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('code');
					}
				},
				{
					value: 'bullet-list',
					label: 'Bullet List',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('bullet-list');
					}
				},
				{
					value: 'ordered-list',
					label: 'Ordered List',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();
						switchTo('ordered-list');
					}
				},
				{
					value: 'image',
					label: 'Add Image',
					command: ({ editor, range }: { editor: Editor; range: Range }) => {
						editor.chain().focus().deleteRange(range).run();

						const fileInput = document.createElement('input');
						fileInput.type = 'file';
						fileInput.click();
						fileInput.addEventListener('change', (event) => {
							const input = event.target as HTMLInputElement;
							if (!input.files?.length) return;
							const file = input.files[0];
							if (!file?.type.startsWith('image/')) return;
							processImageFile(file);

							input.remove();
						});
					}
				}
			].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
		},

		render: () => {
			let component: ReturnType<typeof SuggestionSelect>;
			let floatingEl: HTMLElement;

			function updatePosition(clientRect: (() => DOMRect | null) | null | undefined) {
				if (!clientRect || !floatingEl) return;
				const rect = clientRect();
				if (!rect) return;

				// Create a virtual reference element for floating-ui
				const virtualRef = {
					getBoundingClientRect: () => rect
				};

				computePosition(virtualRef, floatingEl, {
					placement: 'bottom-start',
					middleware: [offset(8), flip(), shift({ padding: 8 })]
				}).then(({ x, y }) => {
					Object.assign(floatingEl.style, {
						left: `${x}px`,
						top: `${y}px`
					});
				});
			}

			return {
				onStart: (props: SuggestionProps) => {
					floatingEl = document.createElement('div');
					floatingEl.style.position = 'absolute';
					floatingEl.style.zIndex = '50';
					document.body.appendChild(floatingEl);

					component = mount(SuggestionSelect, {
						target: floatingEl,
						props
					});

					updatePosition(props.clientRect);
				},
				onUpdate: (props: SuggestionProps) => {
					component.setItems(props.items);
					component.setRange(props.range);
					updatePosition(props.clientRect);
				},
				onKeyDown: (props: SuggestionKeyDownProps) => {
					if (props.event.key === 'Escape') {
						floatingEl.style.display = 'none';
						return true;
					}

					return component.onKeyDown(props.event);
				},
				onExit: () => {
					unmount(component);
					floatingEl.remove();
				}
			};
		}
	};
}
