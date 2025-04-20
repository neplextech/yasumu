import { ExternalCollectionsProvider } from '../base/ExternalCollectionsProvider.js';
import type { PostmanCollection } from './types/index.js';
import type { YasumuStandaloneFormat } from '@/standalone/types.js';

export class PostmanExporter extends ExternalCollectionsProvider<PostmanCollection> {
  public async export(): Promise<PostmanCollection> {
    return {} as PostmanCollection;
  }

  public async import(
    data: PostmanCollection,
  ): Promise<YasumuStandaloneFormat> {
    return {} as YasumuStandaloneFormat;
  }
}
