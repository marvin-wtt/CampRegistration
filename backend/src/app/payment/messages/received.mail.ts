import { RegistrationEventMessage } from '#app/registration/messages/event.mail';

export class PaymentReceivedMessage extends RegistrationEventMessage {
  static readonly trigger = 'payment_received';
  static readonly type = 'payment:template:received';
}
