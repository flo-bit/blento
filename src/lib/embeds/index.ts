import type { EmbedDefinition } from './types';
import { youtubeEmbed } from './youtube';

/**
 * Registry of all embed definitions. To add a new embed type,
 * import its definition and add it to this array.
 */
export const embedDefinitions: EmbedDefinition[] = [youtubeEmbed];

/**
 * Try to match a URL against all registered embed definitions.
 * Returns the first match with { type, url, ...data }, or null.
 */
export function matchEmbed(
	url: string
): ({ type: string; url: string } & Record<string, unknown>) | null {
	for (const def of embedDefinitions) {
		const data = def.match(url);
		if (data) {
			return { type: def.type, url, ...data };
		}
	}
	return null;
}

/**
 * Get the embed definition for a given type string.
 */
export function getEmbedDefinition(type: string): EmbedDefinition | undefined {
	return embedDefinitions.find((d) => d.type === type);
}

export type ContentSegment =
	| { kind: 'markdown'; text: string }
	| { kind: 'embed'; type: string; url: string; data: Record<string, unknown> };

const BARE_URL_LINE = /^\s*(https?:\/\/\S+)\s*$/;

/**
 * Parse a markdown string into segments, splitting out embeddable URLs.
 * Lines that are just a bare URL matching an embed definition become embed segments.
 * Consecutive non-embed lines are grouped into markdown segments.
 */
export function parseContentSegments(markdown: string): ContentSegment[] {
	const lines = markdown.split('\n');
	const segments: ContentSegment[] = [];
	let buffer: string[] = [];

	function flush() {
		if (buffer.length > 0) {
			segments.push({ kind: 'markdown', text: buffer.join('\n') });
			buffer = [];
		}
	}

	for (const line of lines) {
		const urlMatch = line.match(BARE_URL_LINE);
		if (urlMatch) {
			const url = urlMatch[1];
			const embed = matchEmbed(url);
			if (embed) {
				flush();
				segments.push({ kind: 'embed', type: embed.type, url: embed.url, data: embed });
				continue;
			}
		}
		buffer.push(line);
	}

	flush();
	return segments;
}

export type { EmbedDefinition, EmbedComponentProps } from './types';
