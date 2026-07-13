import type { EmailData } from '@yasumu/common';
import { SMTPServer } from 'smtp-server';

import { createEmail } from './create-email.ts';

const SMTP_SERVER_DEBUG = Deno.env.get('SMTP_SERVER_DEBUG') === 'true';

export interface SmtpServerOptions {
  username?: string | null;
  password?: string | null;
  port: number;
  workspaceId: string;
  smtpId: string;
  onEmailReceived: (workspaceId: string, email: EmailData) => Promise<void>;
}

export interface SMTPServerInstance {
  server: SMTPServer;
  port: number;
}

const debug = (...args: unknown[]) => {
  if (!SMTP_SERVER_DEBUG) return;
  console.log(...args);
};

export function createSmtpServer(options: SmtpServerOptions) {
  debug(
    `Starting SMTP Server on port ${options.port} (workspaceId: ${options.workspaceId}, smtpId: ${options.smtpId})`,
  );
  const { promise, resolve, reject } = Promise.withResolvers<SMTPServerInstance>();

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
        (auth.method === 'CRAM-MD5' ? auth.validatePassword(options.password) : options.password !== auth.password)
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
      createEmail(stream, options.workspaceId, options.smtpId)
        .then((data) => {
          callback(null);
          if (!data) return;
          return options.onEmailReceived(data.workspaceId, data.email);
        })
        .catch((err: Error) => {
          callback(err);
        });
    },
  });

  server.on('error', (err) => {
    if (server.server.listening) {
      server.close();
    }

    console.error('SMTP Server Error', err);
    reject(err);

    void Yasumu.ui.showNotification({
      title: 'SMTP Server Error',
      message: String(err),
      variant: 'error',
    });
  });

  server.listen(options.port ?? 0, () => {
    let port;

    const address = server.server.address();
    if (!address || typeof address === 'string') {
      port = options.port ?? 0;
    } else {
      port = address.port;
    }

    console.log(
      `SMTP Server listening on localhost:${port} (workspaceId: ${options.workspaceId}, smtpId: ${options.smtpId})`,
    );

    resolve({
      server,
      port,
    });
  });

  return promise;
}
