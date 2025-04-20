export const WorkspaceModuleType = {
  Rest: 'Rest',
  GraphQL: 'GraphQL',
  Websocket: 'WebSocket',
  SocketIO: 'SocketIO',
  SSE: 'SSE',
  SMTP: 'SMTP',
} as const;

export type WorkspaceModuleType =
  (typeof WorkspaceModuleType)[keyof typeof WorkspaceModuleType];
