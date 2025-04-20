import { deepMerge, generateId } from '@/common/utils.js';
import type { YasumuWorkspace } from './YasumuWorkspace.js';
import type { DeepPartial } from './modules/index.js';
import { WorkspaceModuleType } from './modules/common/constants.js';
import { YasumuSchemaActions } from '@yasumu/schema';
import {
  WorkspaceSchema,
  type WorkspaceSchemaType,
} from './schema/WorkspaceSchema.js';
import { YASUMU_WORKSPACE_ANNOTATION } from '@/common/constants.js';
import { YasumuWorkspaceEvents } from './events/common.js';

export type RootIndex<T> = { entities: Record<string, T> };

export type MetadataSetter =
  | ((data: WorkspaceSchemaType) => DeepPartial<WorkspaceSchemaType>)
  | DeepPartial<WorkspaceSchemaType>;

export class YasumuWorkspaceMetadata {
  /**
   * The schema for the workspace metadata.
   */
  public static readonly schema = new YasumuSchemaActions(WorkspaceSchema);

  /**
   * The metadata for a workspace.
   * @param workspace The workspace this metadata belongs to.
   * @param data The raw metadata.
   * @param save Whether to save the metadata. Defaults to `false`.
   */
  public constructor(
    public readonly workspace: YasumuWorkspace,
    private data: WorkspaceSchemaType,
  ) {
    this.#reformat();
  }

  /**
   * Reformat the metadata. This is used to ensure all metadata is present.
   * @param save Whether to save the metadata.
   */
  #reformat() {
    this.data.annotation = YASUMU_WORKSPACE_ANNOTATION;
    this.data.blocks ??= {
      Metadata: {},
    } as typeof this.data.blocks;
    this.data.blocks.Metadata.createdAt ??= Date.now();
    this.data.blocks.Metadata.version ??= this.workspace.yasumu.apiVersion;
    this.data.blocks.Metadata.name ??= 'Untitled Workspace';
    this.data.blocks.Metadata.id ??= generateId();

    this.data.blocks.Environment ??= {
      selectedEnvironment: '',
      environments: {},
    };
    this.data.blocks.Environment.selectedEnvironment ??= '';
    this.data.blocks.Environment.environments ??= {};
    this.data.blocks[WorkspaceModuleType.Rest] ??= { entities: {} };
    this.data.blocks[WorkspaceModuleType.GraphQL] ??= { entities: {} };
    this.data.blocks[WorkspaceModuleType.SMTP] ??= { entities: {} };
    this.data.blocks[WorkspaceModuleType.SSE] ??= { entities: {} };
    this.data.blocks[WorkspaceModuleType.SocketIO] ??= { entities: {} };
    this.data.blocks[WorkspaceModuleType.Websocket] ??= { entities: {} };
  }

  /**
   * The ID of this workspace.
   */
  public get id(): string {
    return this.data.blocks.Metadata.id;
  }

  /**
   * The name of this workspace.
   */
  public get name(): string {
    return this.data.blocks.Metadata.name;
  }

  /**
   * The raw metadata of this workspace.
   */
  public getRawData(): WorkspaceSchemaType {
    return this.data;
  }

  /**
   * Sets the raw metadata of this workspace.
   */
  public setRawData(data: WorkspaceSchemaType) {
    this.data = data;
  }

  /**
   * Merges the raw metadata of this workspace.
   */
  public mergeRawData(data: WorkspaceSchemaType) {
    deepMerge(this.data, data);
  }

  /**
   * Sets the name of this workspace.
   * @param value The new name.
   */
  public setName(value: string) {
    this.data.blocks.Metadata.name = value;
  }

  /**
   * Updates the metadata.
   * @param value The value to update the metadata with.
   */
  public update(value: MetadataSetter) {
    let data: DeepPartial<typeof this.data>;

    if (typeof value === 'function') {
      data = value(this.data);
    } else {
      data = value;
    }

    deepMerge(this.data, data);
  }

  /**
   * The date this workspace was created.
   */
  public get createdAt(): Date {
    return new Date(this.data.blocks.Metadata.createdAt);
  }

  /**
   * The version of this workspace.
   */
  public get version(): string {
    return this.data.blocks.Metadata.version;
  }

  /**
   * Refreshes this workspace's metadata.
   */
  public async refresh(): Promise<void> {
    const metadata = await this.workspace.yasumu.fs.readTextFile(
      this.workspace.metadataPath,
    );
    this.data = this.deserialize(metadata);
    this.#reformat();
  }

  /**
   * Saves this workspace's metadata.
   */
  public async save(): Promise<void> {
    return this.workspace.yasumu.fs
      .writeTextFile(this.workspace.metadataPath, this.serialize())
      .then(() => {
        this.workspace.events.emit(
          YasumuWorkspaceEvents.WorkspaceMetadataUpdated,
          this,
        );
      });
  }

  /**
   * Deserializes a string to workspace metadata.
   */
  public deserialize(data: string): WorkspaceSchemaType {
    const deserialized = YasumuWorkspaceMetadata.deserialize(data);
    return deserialized;
  }

  /**
   * Serializes this workspace's metadata to a string.
   */
  public serialize(): string {
    const serialized = YasumuWorkspaceMetadata.serialize(this.data);
    return serialized;
  }

  /**
   * Deserializes a string to workspace metadata.
   */
  public static deserialize(data: string): WorkspaceSchemaType {
    return this.schema.parse(data) as any;
  }

  /**
   * Serializes this workspace's metadata to a string.
   */
  public static serialize(data: WorkspaceSchemaType): string {
    return this.schema.serialize(data as any);
  }

  /**
   * JSON representation of this workspace's metadata.
   */
  public toJSON(): WorkspaceSchemaType {
    return this.data;
  }
}

/**
 * Creates a new workspace metadata. This is used when creating a new workspace.
 * @param workspace The workspace to create metadata for.
 * @param options The options to create the workspace with.
 */
export async function createWorkspaceMetadata(
  workspace: YasumuWorkspace,
  options: Partial<WorkspaceSchemaType> = {},
  save = false,
): Promise<YasumuWorkspaceMetadata> {
  const metadata = new YasumuWorkspaceMetadata(
    workspace,
    options as WorkspaceSchemaType,
  );

  if (save) await metadata.save();

  return metadata;
}
