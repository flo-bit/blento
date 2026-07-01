import { generateClientAssertionKey } from '@atcute/oauth-node-client';

const key = await generateClientAssertionKey('main-key');
console.log(JSON.stringify(key));
