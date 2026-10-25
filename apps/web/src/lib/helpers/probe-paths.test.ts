import { describe, expect, it } from 'vitest';
import { isProbePath } from './probe-paths';

describe('probe paths', () => {
	it.each([
		'/.env',
		'/api/.env',
		'/.env.local',
		'/.git/config',
		'/.claude/settings.local.json',
		'/wp-content/plugin/test.php',
		'/wp-admin/',
		'/.vscode/settings.json',
		'/%2eenv',
		'/%252egit/config',
		'/API/%2EENV',
		'/x/../.env',
		'/.git%2fconfig',
		'/foo\\.git\\config',
		'/@fs/src/.env',
		'/vendor/phpunit/test.php'
	])('rejects %s', (path) => expect(isProbePath(path)).toBe(true));

	it.each([
		'/',
		'/.well-known/atproto-did',
		'/did:plc:example/.well-known/atproto-did',
		'/.well-known/site.standard.publication',
		'/oauth-client-metadata.json',
		'/oauth/callback',
		'/alice.bsky.social',
		'/alice.php',
		'/alice.test/p/wp-content-notes',
		'/alice.test/p/wp-content',
		'/alice.test/p/wp-admin',
		'/alice.test/p/wp-includes',
		'/_app/immutable/file.js',
		'/og-default.png',
		'/healthz',
		'/api/links',
		'/%invalid'
	])('preserves %s', (path) => expect(isProbePath(path)).toBe(false));
});
