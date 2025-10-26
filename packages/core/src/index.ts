import { Yasumu, type YasumuOptions } from './yasumu.js';

export function createYasumu(options: YasumuOptions) {
  return new Yasumu(options);
}

async function stub() {
  const yasumu = createYasumu({});

  const workspace = await yasumu.workspaces.open({ id: '123' });
  const req = await workspace.rest.open('213');

  console.log(req.url);
  // req.send()

  console.log(yasumu.workspaces.getActiveWorkspace(true).toJSON());
}
