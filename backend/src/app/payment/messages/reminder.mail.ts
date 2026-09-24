import { RegistrationEventMessage } from '#app/registration/messages/event.mail';

export class PaymentReminderMessage extends RegistrationEventMessage {
  static readonly trigger = 'payment_reminder';
  static readonly type = 'payment:template:reminder';
}
