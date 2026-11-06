import { RegistrationEventMessage } from '#app/registration/messages/event.mail';

export class PaymentRequestedMessage extends RegistrationEventMessage {
  static readonly trigger = 'payment_requested';
  static readonly type = 'payment:template:requested';
}
