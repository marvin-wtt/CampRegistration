import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationDeletedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_canceled';
  static readonly type = 'registration:template:canceled';
}
