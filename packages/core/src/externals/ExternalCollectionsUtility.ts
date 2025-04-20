import { WorkspaceModuleType } from '../modules/common/constants.js';
import {
  createStandalone,
  type YasumuStandaloneFormat,
} from '../standalone/types.js';
import type { YasumuWorkspace } from '../YasumuWorkspace.js';
import { Insomnia } from './insomnia/Insomnia.js';
import { PostmanExporter as Postman } from './postman/Postman.js';
import { Yaak } from './yaak/Yaak.js';

export interface FromStandaloneOptions {
  /**
   * The workspace to import the data into. If not provided, the data will be imported into the current workspace.
   */
  workspace?: YasumuWorkspace | null;
  /**
   * Whether to overwrite existing data. Defaults to `true`.
   */
  overwrite?: boolean;
}

export class ExternalCollectionsUtility {
  public readonly postman: Postman;
  public readonly insomnia: Insomnia;
  public readonly yaak: Yaak;

  public constructor(public readonly workspace: YasumuWorkspace) {
    this.postman = new Postman(this.workspace);
    this.insomnia = new Insomnia(this.workspace);
    this.yaak = new Yaak(this.workspace);
  }

  public async toStandalone(): Promise<YasumuStandaloneFormat> {
    return createStandalone({
      workspace: this.workspace.getMetadata().getRawData(),
      entities: {
        [WorkspaceModuleType.GraphQL]:
          await this.workspace.graphql.toStandalone(),
        [WorkspaceModuleType.Rest]: await this.workspace.rest.toStandalone(),
      },
    });
  }

  public async fromStandalone(
    data: YasumuStandaloneFormat,
    options: FromStandaloneOptions = {},
  ): Promise<void> {
    const workspace = options.workspace ?? this.workspace;
    const overwrite = options.overwrite ?? true;

    if (overwrite) {
      await workspace.getMetadata().setRawData(data.workspace);
    } else {
      await workspace.getMetadata().mergeRawData(data.workspace);
    }

    await workspace.graphql.fromStandalone(
      data.entities[WorkspaceModuleType.GraphQL],
      { overwrite },
    );
    await workspace.rest.fromStandalone(
      data.entities[WorkspaceModuleType.Rest],
      { overwrite },
    );
    await workspace.smtp.fromStandalone(
      data.entities[WorkspaceModuleType.SMTP],
      { overwrite },
    );
    await workspace.sse.fromStandalone(data.entities[WorkspaceModuleType.SSE], {
      overwrite,
    });
    await workspace.socketio.fromStandalone(
      data.entities[WorkspaceModuleType.SocketIO],
      { overwrite },
    );
    await workspace.websocket.fromStandalone(
      data.entities[WorkspaceModuleType.Websocket],
      { overwrite },
    );
  }
}
