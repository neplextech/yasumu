import { customAlphabet } from './nanoid-lib';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

const _nanoid_normal = customAlphabet(alphabet, 16);
const _nanoid_strong = customAlphabet(alphabet, 24);
const _nanoid_stronger = customAlphabet(alphabet, 32);

/** prefixes like app- or mod- */

export const maxIDLength = 32;

export const nanoid = (type: 'normal' | 'strong' | 'stronger' = 'normal') => {
  switch (type) {
    case 'normal':
      return _nanoid_normal();
    case 'strong':
      return _nanoid_strong();
    case 'stronger':
      return _nanoid_stronger();
  }
};
