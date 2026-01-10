import type { CommonScriptRuntimeContext } from '../common/common.types.js';
import type { EmailData } from './email.js';

export interface EmailScriptWorkspaceContext {
  /**
   * The id of the workspace.
   */
  id: string;
  /**
   * The name of the workspace.
   */
  name: string;
  /**
   * The path of the workspace.
   */
  path: string | null;
}

export interface EmailScriptContext extends CommonScriptRuntimeContext {
  /**
   * The workspace context.
   */
  workspace: EmailScriptWorkspaceContext;
  /**
   * The email entity
   */
  email: EmailData;
}
