import { createYasumu } from '@yasumu/core';
import { isNative } from '../utils';
import { NativeAdapter } from './NativeAdapter';
import { WebAdapter } from './WebAdapter';

export const initYasumu = () => createYasumu(isNative() ? NativeAdapter() : WebAdapter());
