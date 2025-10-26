export const RpcCommand = {
  CreateWorkspace: 'workspaces.create',
  UpdateWorkspace: 'workspaces.update',
  DeleteWorkspace: 'workspaces.delete',
  GetWorkspace: 'workspaces.get',
  ListWorkspaces: 'workspaces.list',
  CreateRest: 'rest.create',
  UpdateRest: 'rest.update',
  DeleteRest: 'rest.delete',
  GetRest: 'rest.get',
  ListRest: 'rest.list',
} as const;

export type RpcCommand = (typeof RpcCommand)[keyof typeof RpcCommand];
