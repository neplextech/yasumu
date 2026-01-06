import { TabularPair } from '@yasumu/common';
import { YasumuWorkspaceFormat } from '../common/yasumu-workspace-format.ts';
import { PostmanEnvironment } from './types.ts';

export class PostmanEnvironmentImporter {
  public importEnvironment(env: PostmanEnvironment): YasumuWorkspaceFormat {
    const variables: TabularPair[] = [];
    const secrets: TabularPair[] = [];

    for (const val of env.values) {
      const pair: TabularPair = {
        key: val.key,
        value: val.value ?? '',
        enabled: val.enabled !== false,
      };

      if (val.type === 'secret') {
        secrets.push(pair);
      } else {
        variables.push(pair);
      }
    }

    return {
      environments: [
        {
          id: Yasumu.cuid(),
          name: env.name || 'Imported Environment',
          variables,
          secrets,
        },
      ],
      rest: [],
      entityGroups: [],
    };
  }
}
