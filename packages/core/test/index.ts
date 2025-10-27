import { createYasumu } from '../src/index.js';

const yasumu = createYasumu({
  platformBridge: {
    async invoke(command) {
      command.parameters;
      if (command.isType('workspaces.create')) {
        command.parameters;
        // ^?
      }

      return {} as any;
    },
  },
});
