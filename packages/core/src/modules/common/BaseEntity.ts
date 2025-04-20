import type { YasumuBaseModule } from './BaseModule.js';
import type {
  YasumuSchemaParsableToType,
  YasumuSchemaParsableScript,
  _YasumuSchemaParsableScriptExpect,
} from '@yasumu/schema';
import type { ExecutionOptions, ExecutionResult } from './types.js';

/**
 * Represents an entity that can be executed.
 */
export abstract class BaseEntity<T extends Record<string, any> = any> {
  public abstract readonly data: T;
  public abstract module: YasumuBaseModule;

  /**
   * Executes the entity.
   * @param options The execution options.
   */
  public abstract execute(options?: ExecutionOptions): Promise<ExecutionResult>;

  /**
   * The creation date of this entity
   */
  public get createdAt() {
    return new Date(this.data.blocks.Metadata.createdAt);
  }

  /**
   * The creation timestamp of this entity
   */
  public get createdTimestamp() {
    return this.data.blocks.Metadata.createdAt;
  }

  /**
   * The unique id of this entity
   */
  public get id() {
    return this.data.blocks.Metadata.id;
  }

  /**
   * The name of this entity
   */
  public get name() {
    return this.data.blocks.Metadata.name;
  }

  /**
   * The file name of this entity
   */
  public get filename() {
    return `${this.name}--${this.createdTimestamp}.ysl`;
  }

  /**
   * The path of this entity
   */
  public get path() {
    return this.data.blocks.Metadata.path;
  }

  /**
   * The full path to this entity
   */
  public get fullPath() {
    return this.module.workspace.yasumu.utils.joinPathSync(
      this.module.getLocation(),
      this.path,
      this.filename,
    );
  }

  /**
   * The base path of this entity
   */
  public get basePath() {
    return this.module.workspace.yasumu.utils.joinPathSync(
      this.module.getLocation(),
      this.path,
    );
  }

  /**
   * Update the path of this entity
   * @param path The new path
   */
  public async setPath(path: string) {
    const normalizedPath =
      await this.module.workspace.yasumu.path.normalize(path);
    const normalizedOldPath = await this.module.workspace.yasumu.path.normalize(
      this.data.blocks.Metadata.path,
    );
    const oldPath = this.fullPath;
    const oldIndexPath = this.basePath;

    if (normalizedPath === normalizedOldPath) return;

    this.data.blocks.Metadata.path = path;

    await this.save();

    return this.#handleRename(oldPath, oldIndexPath);
  }

  /**
   * Rename this entity
   * @param name The new name
   */
  public async rename(name: string) {
    const oldName = this.data.blocks.Metadata.name;
    const oldPath = this.fullPath;

    if (oldName === name) return;

    this.data.blocks.Metadata.name = name;

    await this.save();

    if (oldPath === this.fullPath) return;

    return this.#handleRename(oldPath);
  }

  /**
   * Move this entity to a new path
   * @param path The new path
   */
  public async move(path: string) {
    return this.setPath(path);
  }

  /**
   * Save this entity data
   */
  public async save() {
    const serialized = await this.serialize();
    await this.#ensurePath();
    await this.module.workspace.yasumu.fs.writeTextFile(
      this.fullPath,
      serialized,
    );
    return this.updateDependencies();
  }

  /**
   * Delete this entity
   */
  public async delete() {
    await this.module.workspace.yasumu.fs.remove(this.fullPath);
    return this.deleteDependencies();
  }

  async #ensurePath() {
    const exists = await this.module.workspace.yasumu.fs.exists(this.basePath);
    if (!exists)
      await this.module.workspace.yasumu.fs.mkdir(this.basePath, {
        recursive: true,
      });
  }

  /**
   * Delete the dependencies of this entity
   */
  public async deleteDependencies() {
    await this.module.workspace.indexer.deleteIndex({
      id: this.id,
      location: this.basePath,
    });

    const metadata = this.module.workspace.getMetadata();
    const data = metadata.getRawData();

    delete data.blocks[this.module.type].entities[this.id];

    await metadata.save();

    this.module.notifyDeleted(this);
  }

  /**
   * Update the dependencies of this entity
   */
  public async updateDependencies() {
    await this.module.workspace.indexer.createIndex({
      id: this.id,
      location: this.basePath,
      name: this.filename,
    });

    const metadata = this.module.workspace.getMetadata();

    metadata.update({
      blocks: {
        [this.module.type]: {
          entities: {
            [this.id]: this.createRootIndexData(),
          },
        },
      },
    });

    await metadata.save();

    this.module.notifyChange(this);
  }

  public abstract createRootIndexData(): Record<string, any>;

  /**
   * Serialize this entity into a string
   * @returns serialized data
   */
  public async serialize() {
    return this.module.schema.serialize(
      this.data as unknown as YasumuSchemaParsableToType<
        YasumuSchemaParsableScript<_YasumuSchemaParsableScriptExpect>
      >,
    );
  }

  /**
   * String representation of this entity
   */
  public toString() {
    return this.name;
  }

  /**
   * JSON representation of this entity
   */
  public toJSON() {
    return this.data;
  }

  async #handleRename(oldPath: string, indexPath?: string) {
    await this.module.workspace.yasumu.fs.remove(oldPath).catch(Object);

    if (indexPath) {
      await this.module.workspace.indexer.deleteIndex({
        id: this.id,
        location: indexPath,
      });
    }

    // if we somehow accidentally removed the current file
    await this.save();
  }
}
