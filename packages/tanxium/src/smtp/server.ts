import { SMTPServer } from 'smtp-server';
import { createEmail } from './create-email.ts';

export interface SmtpServerOptions {
  username?: string;
  password?: string;
  workspaceId: string;
}

export function createSmtpServer(options: SmtpServerOptions) {
  const server = new SMTPServer({
    disabledCommands: ['AUTH', 'STARTTLS'],
    authMethods: ['CRAM-MD5', 'PLAIN', 'LOGIN'],
    size: 25 * 1024 * 1024,
    hidePIPELINING: true,
    authOptional: !options.username && !options.password,
    onAuth(auth, _session, callback) {
      if (options.username && options.username !== auth.username) {
        return callback(new Error('Invalid username or password'));
      }

      if (
        options.password &&
        // @ts-expect-error CRAM-MD5 not typed
        (auth.method === 'CRAM-MD5'
          ? auth.validatePassword(options.password)
          : options.password !== auth.password)
      ) {
        return callback(new Error('Invalid username or password'));
      }

      callback(null, { user: auth.username || crypto.randomUUID() });
    },
    onMailFrom(mail, _session, callback) {
      if (/^reject/i.test(mail.address)) {
        return callback(new Error('Rejected email'));
      }

      callback();
    },
    onRcptTo(address, _session, callback) {
      if (/^reject/i.test(address.address)) {
        return callback(new Error('Rejected email'));
      }

      callback();
    },
    onData(stream, _session, callback) {
      createEmail(stream, options.workspaceId).then(
        () => callback(null),
        (err: Error) => callback(err),
      );
    },
  });

  server.on('error', async (err) => {
    console.error('SMTP Server Error', err);
    await Yasumu.ui.showNotification({
      title: 'SMTP Server Error',
      message: String(err),
      variant: 'error',
    });
  });

  return server;
}
