import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const DEV_PORT = 5179;

const cwd = process.cwd();
const envPath = resolve(cwd, '.env');
const vitePath = resolve(cwd, 'vite.config.ts');

let tunnelUrl: string | null = null;
let statusBarActive = false;

// ── ANSI status bar ──────────────────────────────────────────────
function getColumns(): number {
	return process.stdout.columns || 80;
}

function getRows(): number {
	return process.stdout.rows || 24;
}

function setupScrollRegion(): void {
	if (!process.stdout.isTTY) return;
	statusBarActive = true;
	const rows = getRows();
	process.stdout.write(`\x1b[1;${rows - 1}r`);
	process.stdout.write(`\x1b[${rows - 1};1H`);
}

function drawStatusBar(text: string): void {
	if (!process.stdout.isTTY) {
		process.stdout.write(text + '\n');
		return;
	}
	const rows = getRows();
	const cols = getColumns();
	process.stdout.write('\x1b7');
	process.stdout.write(`\x1b[${rows};1H`);
	process.stdout.write('\x1b[2K');
	process.stdout.write(`\x1b[7m ${text.padEnd(cols - 1)}\x1b[0m`);
	process.stdout.write('\x1b8');
}

function clearStatusBar(): void {
	if (!process.stdout.isTTY || !statusBarActive) return;
	const rows = getRows();
	process.stdout.write(`\x1b[1;${rows}r`);
	process.stdout.write(`\x1b[${rows};1H\x1b[2K`);
	process.stdout.write(`\x1b[${rows - 1};1H`);
	statusBarActive = false;
}

function writeLog(text: string): void {
	process.stdout.write(text);
}

process.stdout.on('resize', () => {
	if (!statusBarActive || !tunnelUrl) return;
	setupScrollRegion();
	drawStatusBar(`Tunnel: ${tunnelUrl}  |  Ctrl+C to stop`);
});

// ── .env helpers ─────────────────────────────────────────────────
function readEnv(): string {
	return readFileSync(envPath, 'utf8');
}

function writeEnv(content: string): void {
	writeFileSync(envPath, content);
}

function setEnvVar(key: string, value: string): void {
	let env = readEnv();
	const re = new RegExp(`^(#\\s*)?${key}=.*$`, 'm');
	const line = `${key}=${value}`;

	if (re.test(env)) {
		env = env.replace(re, line);
	} else {
		env = env.trimEnd() + '\n' + line + '\n';
	}
	writeEnv(env);
}

function clearEnvVar(key: string): void {
	let env = readEnv();
	const re = new RegExp(`^${key}=.*$`, 'm');

	if (re.test(env)) {
		env = env.replace(re, `# ${key}=`);
		writeEnv(env);
	}
}

// ── vite config helpers ──────────────────────────────────────────
function setViteAllowedHosts(hostname: string): void {
	let vite = readFileSync(vitePath, 'utf8');

	if (/allowedHosts\s*:/.test(vite)) {
		vite = vite.replace(/allowedHosts\s*:\s*\[.*?\]/s, `allowedHosts: ['${hostname}']`);
	} else if (/server\s*:\s*\{/.test(vite)) {
		vite = vite.replace(/server\s*:\s*\{/, `server: {\n\t\tallowedHosts: ['${hostname}'],`);
	}

	writeFileSync(vitePath, vite);
}

function clearViteAllowedHosts(): void {
	let vite = readFileSync(vitePath, 'utf8');

	if (/allowedHosts\s*:/.test(vite)) {
		vite = vite.replace(/allowedHosts\s*:\s*\[.*?\]/s, 'allowedHosts: []');
	}

	writeFileSync(vitePath, vite);
}

// ── cleanup ──────────────────────────────────────────────────────
function cleanup(): void {
	clearStatusBar();
	console.log('\nCleaning up...');
	if (tunnelUrl) {
		clearEnvVar('OAUTH_PUBLIC_URL');
		console.log('  Cleared OAUTH_PUBLIC_URL from .env');
		clearViteAllowedHosts();
		console.log('  Cleared allowedHosts from vite.config.ts');
	}
}

// ── main ─────────────────────────────────────────────────────────
const child = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${DEV_PORT}`], {
	stdio: ['ignore', 'pipe', 'pipe']
});

child.stderr.on('data', (data: Buffer) => {
	const output = data.toString();

	if (!tunnelUrl) {
		const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
		if (match) {
			tunnelUrl = match[0];
			const hostname = new URL(tunnelUrl).hostname;

			setEnvVar('OAUTH_PUBLIC_URL', tunnelUrl);
			setViteAllowedHosts(hostname);

			writeLog(`\n  Set OAUTH_PUBLIC_URL=${tunnelUrl}\n`);
			writeLog(`  Set vite allowedHosts to [${hostname}]\n`);
			writeLog(`  Tunnel is ready! Restart your dev server to pick up the new URL.\n\n`);

			setupScrollRegion();
			drawStatusBar(`Tunnel: ${tunnelUrl}  |  Ctrl+C to stop`);
			return;
		}
	}

	writeLog(output);
});

child.stdout.on('data', (data: Buffer) => {
	writeLog(data.toString());
});

child.on('close', (code) => {
	cleanup();
	process.exit(code ?? 0);
});

process.on('SIGINT', () => {
	child.kill('SIGINT');
});

process.on('SIGTERM', () => {
	child.kill('SIGTERM');
});
