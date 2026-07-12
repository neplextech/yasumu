import { ExternalWorkspaceImportStrategy } from '@yasumu/common';

import type { ExternalWorkspaceStrategy, MaybePromise } from '../common/external-workspace-strategy.js';
import type { YasumuWorkspaceFormat } from '../common/yasumu-workspace-format.js';
import { PostmanCollectionImporter } from './collection-importer.js';
import { PostmanEnvironmentImporter } from './environment-importer.js';
import type { PostmanCollection } from './types.js';
import { isPostmanEnvironment } from './utils.js';

export class PostmanWorkspaceStrategy implements ExternalWorkspaceStrategy {
  public readonly name = ExternalWorkspaceImportStrategy.Postman;
  private readonly environmentImporter = new PostmanEnvironmentImporter();
  private readonly collectionImporter = new PostmanCollectionImporter();

  public import(content: string): MaybePromise<YasumuWorkspaceFormat> {
    const parsed = JSON.parse(content);

    if (isPostmanEnvironment(parsed)) {
      return this.environmentImporter.importEnvironment(parsed);
    }

    return this.collectionImporter.importCollection(parsed as PostmanCollection);
  }

  // deno-lint-ignore require-await
  public async export(_workspace: YasumuWorkspaceFormat): Promise<unknown> {
    throw new Error('Exporting to Postman is not supported');
  }
}
