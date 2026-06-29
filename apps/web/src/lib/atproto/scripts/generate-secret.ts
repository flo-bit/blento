import { randomBytes } from 'node:crypto';

console.log(randomBytes(32).toString('base64url'));
