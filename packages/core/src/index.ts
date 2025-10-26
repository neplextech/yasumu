import { Yasumu, type YasumuOptions } from './yasumu.js';

export function createYasumu(options: YasumuOptions) {
  return new Yasumu(options);
}

async function stub() {
  const yasumu = createYasumu({} as YasumuOptions);

  yasumu.rpc['workspaces.create'].$mutate({ parameters: [] });
}
