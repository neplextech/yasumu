export const DEFAULT_WORKSPACE_PATH = '__yasumu:default:workspace__' as const;
export const DEFAULT_WORKSPACE_NAME = 'Yasumu Playground' as const;
export const PATH_IDENTIFIER_PREFIX = 'path://' as const;

export function asPathIdentifier(path: string) {
  return `${PATH_IDENTIFIER_PREFIX}${path}`;
}

export function isDefaultWorkspacePath(path: string) {
  return path === DEFAULT_WORKSPACE_PATH;
}
