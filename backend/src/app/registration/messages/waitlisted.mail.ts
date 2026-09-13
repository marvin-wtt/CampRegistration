import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationWaitlistedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_waitlisted';
  static readonly type = 'registration:template:waitlisted';
}
