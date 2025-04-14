import { createYasumu } from '@yasumu/core';
import { isNative } from '../common/utils';
// import { NativeAdapter } from './NativeAdapter';
import { WebAdapter } from './WebAdapter';

export const initYasumu = async () => {
  // const native = isNative();
  // const adapter = native ? NativeAdapter() : WebAdapter();
  const adapter = WebAdapter();
  const yasumu = createYasumu(adapter);

  // create a dummy workspace if not in native environment, because we don't have a reliable file system
  // if (!native) {
  // when not under native env it uses localStorage as a file system and simulates fs api with memfs
  await yasumu
    .openWorkspace({
      path: '/dev/null',
    })
    .catch(console.error);
  // }

  return yasumu;
};
