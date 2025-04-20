import { InvalidLocationError } from '@/common/errors/InvalidLocationError.js';
import type { YasumuWorkspace } from '../YasumuWorkspace.js';
import { YasumuFileNamesMap } from '@/common/constants.js';

export interface IndexParams {
  location: string;
  name: string;
  id: string;
}

export type Index = Record<string, string>;

export class YasumuIndexerService {
  public constructor(public readonly workspace: YasumuWorkspace) {}

  /**
   * Create an index for a location. If the index already exists, it will be updated.
   * @param options The options for creating the index.
   */
  public async createIndex(options: IndexParams) {
    const index = await this.getIndexFile(options.location);

    index[options.id] = options.name;

    return this.saveIndex(options.location, index);
  }

  /**
   * Delete an index for a location.
   * @param options The options for deleting the index.
   */
  public async deleteIndex(options: Omit<IndexParams, 'name'>) {
    const index = await this.getIndexFile(options.location);

    delete index[options.id];

    return this.saveIndex(options.location, index);
  }

  /**
   * Find the location of an ID in an index.
   * @param location The location of the index.
   * @param id The ID to find.
   * @returns The location of the ID, or `null` if not found.
   */
  public async findIndex(location: string, id: string): Promise<string | null> {
    const index = await this.getIndexFile(location);

    const value = index[id];

    if (!value) return null;

    return this.workspace.yasumu.utils.joinPathSync(location, value);
  }

  /**
   * The index of a location.
   * @param location The location of the index, or a file path within the index.
   * @returns The index of the location.
   */
  public async resolveIndexPath(location: string): Promise<string> {
    const path = this.workspace.yasumu.path;
    let targetLocation = location;

    const exists = await this.workspace.yasumu.fs.exists(location);

    if (!exists) throw new InvalidLocationError(location);

    const { isFile } = await this.workspace.yasumu.fs.lstat(location);

    if (isFile) {
      targetLocation = await path.dirname(location);
    }

    return targetLocation;
  }

  /**
   * Resolves the index file for a location.
   * @param location The location of the index.
   * @returns The index file.
   */
  public async getIndexFile(location: string): Promise<Index> {
    const targetLocation = await this.resolveIndexPath(location);
    const indexPath = this.workspace.yasumu.utils.joinPathSync(
      targetLocation,
      YasumuFileNamesMap.IndexFileName,
    );
    const exists = await this.workspace.yasumu.fs.exists(indexPath);

    if (!exists) {
      await this.workspace.yasumu.fs.writeTextFile(indexPath, '{}');
      return {};
    }
    const json = await this.workspace.yasumu.fs.readTextFile(indexPath);

    return JSON.parse(json);
  }

  /**
   * Save an index to a location.
   * @param location The location of the index.
   * @param index The index to save.
   */
  public async saveIndex(location: string, index: Index): Promise<void> {
    const targetLocation = await this.resolveIndexPath(location);
    const indexPath = this.workspace.yasumu.utils.joinPathSync(
      targetLocation,
      YasumuFileNamesMap.IndexFileName,
    );

    return this.workspace.yasumu.fs.writeTextFile(
      indexPath,
      JSON.stringify(index, null, 2),
    );
  }
}
