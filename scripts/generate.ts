import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/lib/contrail/config';
import { generateLexicons } from '@atmo-dev/contrail/generate';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

generateLexicons({
	config,
	rootDir: ROOT_DIR,
	lexiconDir: join(ROOT_DIR, 'lexicons'),
	outputDir: join(ROOT_DIR, 'lexicons-generated'),
	writeRuntimeFiles: true
});
