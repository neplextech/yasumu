import type { CommonScriptRuntimeContext } from '../common/common.types.js';
import type { EmailData } from './email.js';

export interface EmailScriptContext extends CommonScriptRuntimeContext {
  /**
   * The email entity
   */
  email: EmailData;
}
