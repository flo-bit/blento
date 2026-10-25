const forbiddenFiles = new Set([
	'/wp-login.php',
	'/xmlrpc.php',
	'/edit-comments.php',
	'/wp-config.php',
	'/phpinfo.php'
]);

/** Deliberately narrow: do not reject all dot paths, file extensions, or actor handles. */
export function isProbePath(path: string): boolean {
	for (let i = 0; i < 5; i++) {
		try {
			const decoded = decodeURIComponent(path);
			if (decoded === path) break;
			path = decoded;
		} catch {
			break;
		}
	}
	path = path.toLowerCase().replaceAll('\\', '/');
	const segments: string[] = [];
	for (const segment of path.split('/')) {
		if (segment === '..') segments.pop();
		else if (segment && segment !== '.') segments.push(segment);
	}
	path = '/' + segments.join('/');
	return (
		forbiddenFiles.has(path) ||
		segments.some(
			(segment) =>
				segment === '.env' ||
				segment.startsWith('.env.') ||
				['.git', '.claude', '.vscode', '.aws'].includes(segment)
		) ||
		// WordPress probe families are root paths, not legitimate Blento page names under /p/.
		['wp-admin', 'wp-content', 'wp-includes'].includes(segments[0]) ||
		path.startsWith('/@fs/') ||
		path.startsWith('/@vite/') ||
		path.startsWith('/vendor/phpunit/')
	);
}
