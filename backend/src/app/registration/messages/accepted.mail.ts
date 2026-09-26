import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationAcceptedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_waitlist_accepted';
  static readonly type = 'registration:template:accepted';
}
