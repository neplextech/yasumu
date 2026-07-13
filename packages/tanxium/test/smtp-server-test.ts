console.log('Starting SMTP Server on port 5555');

import { SMTPServer } from 'smtp-server';

const server = new SMTPServer({
  authOptional: true,
  onData(stream, _session, callback) {
    let emailData = '';
    stream.on('data', (chunk) => {
      emailData += chunk.toString();
    });
    stream.on('end', () => {
      console.log('Received email:', emailData);
      callback(null); // Accept the message
    });
  },
});

server.listen(5555, () => {
  console.log('SMTP server is running on port 5555');
});
