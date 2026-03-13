import { Node, mergeAttributes } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import { matchEmbed } from '$lib/embeds';
import EmbedNodeComponent from './EmbedNodeComponent.svelte';
import { Plugin, PluginKey } from '@tiptap/pm/state';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		embed: {
			setEmbed: (options: { url: string }) => ReturnType;
		};
	}
}

export const EmbedNode = Node.create({
	name: 'embed',
	group: 'block',
	atom: true,
	draggable: true,
	selectable: true,
	inline: false,

	addAttributes() {
		return {
			url: { default: null },
			embedType: { default: null },
			embedData: { default: null }
		};
	},

	addCommands() {
		return {
			setEmbed:
				({ url }) =>
				({ commands }) => {
					const match = matchEmbed(url);
					if (!match) return false;
					return commands.insertContent({
						type: this.name,
						attrs: {
							url,
							embedType: match.type,
							embedData: JSON.stringify(match)
						}
					});
				}
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="embed"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes({ 'data-type': 'embed' }, HTMLAttributes)];
	},

	addNodeView() {
		return SvelteNodeViewRenderer(EmbedNodeComponent);
	},

	// Markdown integration for @tiptap/markdown
	// These fields are read by the Markdown extension via getExtensionField()

	markdownTokenName: 'embedUrl',

	markdownTokenizer: {
		name: 'embedUrl',
		level: 'block' as const,
		tokenize(src: string) {
			const match = src.match(/^(https?:\/\/\S+)\s*(?:\n|$)/);
			if (!match) return undefined;

			const url = match[1];
			const embedMatch = matchEmbed(url);
			if (!embedMatch) return undefined;

			return {
				type: 'embedUrl',
				raw: match[0],
				url,
				embedType: embedMatch.type,
				embedData: embedMatch
			};
		}
	},

	parseMarkdown(
		token: { url: string; embedType: string; embedData: Record<string, unknown> },
		helpers: { createNode: (type: string, attrs: Record<string, unknown>) => unknown }
	) {
		return helpers.createNode('embed', {
			url: token.url,
			embedType: token.embedType,
			embedData: JSON.stringify(token.embedData)
		});
	},

	renderMarkdown(node: { attrs?: { url?: string } }) {
		return (node.attrs?.url ?? '') + '\n';
	},

	addProseMirrorPlugins() {
		const nodeType = this.type;

		return [
			new Plugin({
				key: new PluginKey('embed-auto-detect'),
				appendTransaction(transactions, _oldState, newState) {
					const docChanged = transactions.some((tr) => tr.docChanged);
					if (!docChanged) return null;

					const tr = newState.tr;
					let modified = false;

					newState.doc.descendants((node, pos) => {
						if (modified) return false;
						if (node.type.name !== 'paragraph') return;
						if (node.childCount !== 1) return;

						const child = node.firstChild;
						if (!child || !child.isText) return;

						const text = child.text?.trim();
						if (!text) return;

						// Check if the text (possibly with a link mark) is a bare URL
						const urlMatch = text.match(/^(https?:\/\/\S+)$/);
						if (!urlMatch) return;

						const url = urlMatch[1];
						const embed = matchEmbed(url);
						if (!embed) return;

						// Only convert when cursor is NOT inside this paragraph
						const sel = newState.selection;
						const nodeEnd = pos + node.nodeSize;
						if (sel.from >= pos && sel.from <= nodeEnd) return;

						const embedNode = nodeType.create({
							url,
							embedType: embed.type,
							embedData: JSON.stringify(embed)
						});

						tr.replaceWith(pos, nodeEnd, embedNode);
						modified = true;
					});

					return modified ? tr : null;
				}
			})
		];
	}
});
