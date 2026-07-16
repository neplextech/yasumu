import type { ScriptSource, ScriptWorkspaceDescriptor } from '@yasumu/runtime-api';

export interface NodeWorkerData {
  workspace: ScriptWorkspaceDescriptor;
  workspaceModule?: ScriptSource;
}
