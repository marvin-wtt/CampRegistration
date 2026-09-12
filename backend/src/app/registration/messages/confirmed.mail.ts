import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationConfirmedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_confirmed';
  static readonly type = 'registration:template:confirmed';
}
