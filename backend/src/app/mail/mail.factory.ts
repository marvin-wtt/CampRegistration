import { NodeMailer } from '#app/mail/node.mailer.js';

export class MailFactory {
  createMailer() {
    // TODO Load mailer form config
    return new NodeMailer();
  }
}
