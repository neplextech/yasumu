import { createYasumu } from '@yasumu/core';
import { WebAdapter } from './WebAdapter';

export const initYasumu = async () => {
  const adapter = WebAdapter();
  const yasumu = createYasumu(adapter);

  await yasumu
    .openWorkspace({
      path: '/dev/null',
    })
    .catch(console.error);

  return yasumu;
};
