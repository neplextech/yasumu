import { ExternalWorkspaceImportStrategy } from '@yasumu/common';
import { ExternalWorkspaceStrategy } from '../common/external-workspace-strategy.ts';
import { NotImplementedException } from '../../../common/exceptions/http.exception.ts';
import { YasumuWorkspaceFormat } from '../common/yasumu-workspace-format.ts';
import { MaybePromise } from '@/common/types.ts';
import type { PostmanCollection } from './types.ts';
import { PostmanEnvironmentImporter } from './environment-importer.ts';
import { PostmanCollectionImporter } from './collection-importer.ts';
import { isPostmanEnvironment } from './utils.ts';

export class PostmanWorkspaceStrategy implements ExternalWorkspaceStrategy {
  public readonly name = ExternalWorkspaceImportStrategy.Postman;
  private readonly environmentImporter = new PostmanEnvironmentImporter();
  private readonly collectionImporter = new PostmanCollectionImporter();

  public import(content: string): MaybePromise<YasumuWorkspaceFormat> {
    const parsed = JSON.parse(content);

    if (isPostmanEnvironment(parsed)) {
      return this.environmentImporter.importEnvironment(parsed);
    }

    return this.collectionImporter.importCollection(
      parsed as PostmanCollection,
    );
  }

  // deno-lint-ignore require-await
  public async export(_workspace: YasumuWorkspaceFormat): Promise<unknown> {
    throw new NotImplementedException('Exporting to Postman is not supported');
  }
}
