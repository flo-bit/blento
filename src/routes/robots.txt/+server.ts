import { text } from '@sveltejs/kit';

/**
 * Crawlers that collect content for AI training / generative-AI datasets.
 * We disallow these site-wide while leaving ordinary search engines free to
 * index the site (they fall under the `User-agent: *` allow rule below).
 *
 * This is a declarative signal — only well-behaved crawlers honor it — and is
 * published alongside the `Content-Usage`/`X-Robots-Tag` headers (hooks.server.ts),
 * the `noai` meta tag (app.html), and `.well-known/tdmrep.json`.
 */
const AI_USER_AGENTS = [
	'GPTBot', // OpenAI
	'OAI-SearchBot', // OpenAI
	'ChatGPT-User', // OpenAI
	'ClaudeBot', // Anthropic
	'anthropic-ai', // Anthropic
	'Claude-Web', // Anthropic
	'Google-Extended', // Google AI training token
	'Applebot-Extended', // Apple AI training token
	'CCBot', // Common Crawl (widely used for training corpora)
	'PerplexityBot', // Perplexity
	'Perplexity-User', // Perplexity
	'Bytespider', // ByteDance
	'Amazonbot', // Amazon
	'Meta-ExternalAgent', // Meta AI
	'FacebookBot', // Meta
	'Diffbot',
	'Omgilibot',
	'Omgili',
	'ImagesiftBot',
	'cohere-ai',
	'AI2Bot',
	'Timpibot',
	'YouBot',
	'Webzio-Extended'
];

const BODY = [
	'# We do not permit this site’s content to be used for AI training.',
	'# See also: /.well-known/tdmrep.json and the Content-Usage / X-Robots-Tag response headers.',
	'',
	...AI_USER_AGENTS.flatMap((ua) => [`User-agent: ${ua}`, 'Disallow: /', '']),
	'User-agent: *',
	'Allow: /',
	''
].join('\n');

export function GET() {
	return text(BODY, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=86400'
		}
	});
}
