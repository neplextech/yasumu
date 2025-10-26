import type { RpcMutation, RpcQuery } from './yasumu-rpc.js';
import type { RestEntityData } from '@/core/modules/rest/types.js';
import type { WorkspaceData } from '@/core/workspace/types.js';
import type { WorkspaceCreateOptions } from '@/core/manager/types.js';

export interface YasumuRPC {
  workspaces: {
    create: RpcMutation<[WorkspaceCreateOptions], WorkspaceData>;
    get: RpcQuery<[string], WorkspaceData>;
    list: RpcQuery<[], WorkspaceData[]>;
  };
  rest: {
    create: RpcMutation<[], RestEntityData>;
    get: RpcQuery<[string], RestEntityData>;
    list: RpcQuery<[], RestEntityData[]>;
  };
}
