import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationSubmittedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_submitted';
  static readonly type = 'registration:template:submitted';
}
