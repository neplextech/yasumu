import * as fs from 'node:fs';
import * as path from 'node:path';
import { deserialize, type Infer } from '@yasumu/schema';
import {
  WorkspaceSchema,
  RestSchema,
  EnvironmentSchema,
} from '../schemas/index.js';

export interface WorkspaceInfo {
  path: string;
  metadata: Infer<typeof WorkspaceSchema>['blocks']['metadata'];
  snapshot: number;
  groups: Infer<typeof WorkspaceSchema>['blocks']['groups'];
}

export interface RestEntity {
  id: string;
  name: string;
  method: string;
  url: string | null;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  parameters: Array<{ key: string; value: string; enabled: boolean }>;
  searchParameters: Array<{ key: string; value: string; enabled: boolean }>;
  body: { type: string; content: string | null } | null;
  script: string | null;
  test: string | null;
  groupId: string | null;
  filePath: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Array<{ key: string; value: string; enabled: boolean }>;
  secrets: Array<{ key: string; value: string; enabled: boolean }>;
  filePath: string;
}

export class WorkspaceLoader {
  private readonly yasumuPath: string;

  constructor(basePath: string) {
    this.yasumuPath = path.join(basePath, 'yasumu');
  }

  exists(): boolean {
    return fs.existsSync(path.join(this.yasumuPath, 'workspace.ysl'));
  }

  loadWorkspace(): WorkspaceInfo | null {
    const workspaceFile = path.join(this.yasumuPath, 'workspace.ysl');

    if (!fs.existsSync(workspaceFile)) {
      return null;
    }

    const content = fs.readFileSync(workspaceFile, 'utf-8');
    const parsed = deserialize(content, WorkspaceSchema);

    return {
      path: this.yasumuPath,
      metadata: parsed.blocks.metadata,
      snapshot: parsed.blocks.snapshot,
      groups: parsed.blocks.groups,
    };
  }

  loadRestEntities(): RestEntity[] {
    const restDir = path.join(this.yasumuPath, 'rest');

    if (!fs.existsSync(restDir)) {
      return [];
    }

    const files = fs.readdirSync(restDir).filter((f) => f.endsWith('.ysl'));
    const entities: RestEntity[] = [];

    for (const file of files) {
      const filePath = path.join(restDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const parsed = deserialize(content, RestSchema);
        entities.push({
          id: parsed.blocks.metadata.id,
          name: parsed.blocks.metadata.name,
          method: parsed.blocks.metadata.method,
          url: parsed.blocks.request.url,
          headers: parsed.blocks.request.headers,
          parameters: parsed.blocks.request.parameters,
          searchParameters: parsed.blocks.request.searchParameters,
          body: parsed.blocks.request.body,
          script: parsed.blocks.script,
          test: parsed.blocks.test,
          groupId: parsed.blocks.metadata.groupId,
          filePath,
        });
      } catch {
        // Skip invalid files
      }
    }

    return entities;
  }

  loadEnvironments(): Environment[] {
    const envDir = path.join(this.yasumuPath, 'environment');

    if (!fs.existsSync(envDir)) {
      return [];
    }

    const files = fs.readdirSync(envDir).filter((f) => f.endsWith('.ysl'));
    const environments: Environment[] = [];

    for (const file of files) {
      const filePath = path.join(envDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const parsed = deserialize(content, EnvironmentSchema);
        environments.push({
          id: parsed.blocks.metadata.id,
          name: parsed.blocks.metadata.name,
          variables: parsed.blocks.variables,
          secrets: parsed.blocks.secrets,
          filePath,
        });
      } catch {
        // Skip invalid files
      }
    }

    return environments;
  }

  findRestEntity(nameOrId: string): RestEntity | null {
    const entities = this.loadRestEntities();
    return (
      entities.find(
        (e) =>
          e.id === nameOrId || e.name.toLowerCase() === nameOrId.toLowerCase(),
      ) ?? null
    );
  }

  findEnvironment(nameOrId: string): Environment | null {
    const environments = this.loadEnvironments();
    return (
      environments.find(
        (e) =>
          e.id === nameOrId || e.name.toLowerCase() === nameOrId.toLowerCase(),
      ) ?? null
    );
  }
}

export function resolveWorkspacePath(givenPath?: string): string {
  return givenPath ? path.resolve(givenPath) : process.cwd();
}

