import { Yasumu, type YasumuConfig } from './yasumu.js';

/**
 * Creates a new Yasumu instance.
 * @param config The configuration for the Yasumu application.
 * @returns The Yasumu instance.
 */
export function createYasumu(config: YasumuConfig) {
  return new Yasumu(config);
}
