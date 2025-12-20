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
  username?: string;
  /**
   * The password to use for the SMTP server.
   */
  password?: string;
}
