import { browser } from '$app/environment';

// Lightweight regex-based sanitizer for SSR in Cloudflare Workers
// where DOMPurify is not available. Strips common XSS vectors.
function regexSanitize(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '')
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi, '')
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object\s*>/gi, '')
		.replace(/<embed\b[^>]*\/?>/gi, '')
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style\s*>/gi, '')
		.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/href\s*=\s*["']?\s*javascript\s*:/gi, 'href="')
		.replace(/src\s*=\s*["']?\s*javascript\s*:/gi, 'src="');
}

let _purify: ((html: string, config?: { ADD_ATTR?: string[] }) => string) | null = null;

if (browser) {
	import('dompurify').then((mod) => {
		_purify = (html, config) => mod.default.sanitize(html, config) as string;
	});
}

export function sanitize(dirty: string, config?: { ADD_ATTR?: string[] }): string {
	if (_purify) {
		return _purify(dirty, config);
	}
	return regexSanitize(dirty);
}
