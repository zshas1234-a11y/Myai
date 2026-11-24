
import { Puter } from '@heyputer/puter.js';
import { init } from '@heyputer/puter.js/src/init.cjs';

const token = process.env.puterAuthToken;

if (!token) {
  throw new Error('PUTER AUTH TOKEN is missing');
}

export const puter = init(token) as Puter;
