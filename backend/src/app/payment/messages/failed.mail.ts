import { RegistrationEventMessage } from '#app/registration/messages/event.mail';

export class PaymentFailedMessage extends RegistrationEventMessage {
  static readonly trigger = 'payment_failed';
  static readonly type = 'payment:template:failed';
}
