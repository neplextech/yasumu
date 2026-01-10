export const EMAIL_SCRIPT_PLACEHOLDER = /* typescript */ `
export function onEmail(ctx: YasumuScriptContext, email: YasumuEmail) {
  // filter email sender
  if (email.from !== 'sender@example.com') return;
  // filter email
  if (email.subject.toLowerCase().includes('verification code for')) {
    // extract otp
    const otp = email.html.match(/\\b\\d{6}\\b/)?.[0];
    if (otp) {
      // store otp in environment variable
      ctx.workspace.env.setVariable('VERIFICATION_CODE', otp);
    }
  }
}
`.trim();

export const EMAIL_TYPEDEF = /* typescript */ `
/**
 * The email entity object
 */
declare interface YasumuEmail {
   /**
   * The ID of the email.
   */
  id: string;
  /**
   * The from address of the email.
   */
  from: string;
  /**
   * The to addresses of the email.
   */
  to: string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * The HTML body of the email.
   */
  html: string;
  /**
   * The text body of the email.
   */
  text: string;
  /**
   * The CC addresses of the email.
   */
  cc: string | null;
  /**
   * The read/unread status of the email.
   */
  unread: boolean;
  /**
   * The date and time the email was created.
   */
  createdAt: number;
  /**
   * The date and time the email was last updated.
   */
  updatedAt: number;
}
`;
