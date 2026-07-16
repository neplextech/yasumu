export const EMAIL_SCRIPT_PLACEHOLDER = /* typescript */ `
export function onEmail(ctx: EmailHookContext) {
  const { email } = ctx;
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
 * @deprecated Use WorkspaceEmail from the shared runtime API.
 */
declare type YasumuEmail = WorkspaceEmail;
`;
