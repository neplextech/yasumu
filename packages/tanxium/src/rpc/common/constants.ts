export {
  asPathIdentifier,
  DEFAULT_WORKSPACE_NAME,
  DEFAULT_WORKSPACE_PATH,
  isDefaultWorkspacePath,
  PATH_IDENTIFIER_PREFIX,
} from '@yasumu/common';

export function isBodyLessMethod(method: string) {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
