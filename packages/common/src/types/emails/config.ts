import type { YasumuEmbeddedScript } from '../common/common.types.js';

/**
 * The SMTP server configuration.
 */
export interface SmtpConfig {
  /**
   * The port number to use for the SMTP server.
   */
  port: number;
  /**
   * The username to use for the SMTP server.
   */
  username?: string | null;
  /**
   * The password to use for the SMTP server.
   */
  password?: string | null;
  /**
   * The embedded script for this SMTP server.
   */
  script?: YasumuEmbeddedScript | null;
}
