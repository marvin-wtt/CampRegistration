import type { AppModule } from '#core/base/AppModule';
import { AuthModule } from '#app/auth/auth.module';
import { CampModule } from '#app/camp/camp.module';
import { RegistrationModule } from '#app/registration/registration.module';
import { TableTemplateModule } from '#app/tableTemplate/table-template.module';
import { CampManagerModule } from '#app/campManager/camp-manager.module.js';
import { MessageDeliveryModule } from '#app/messageDelivery/message-delivery.module';
import { MessageTemplateModule } from '#app/messageTemplate/message-template.module';
import { MessageModule } from '#app/message/message.module';
import { RoomModule } from '#app/room/room.module';
import { BedModule } from '#app/bed/bed.module';
import { FeedbackModule } from '#app/feedback/feedback.module';
import { ProfileModule } from '#app/profile/profile.module';
import { TranslationModule } from '#app/translation/translation.module';
import { TotpModule } from '#app/totp/totp.module';
import { UserModule } from '#app/user/user.module';
import { SetupModule } from '#app/setup/setup.module';
import { FileModule } from '#app/file/file.module';
import { TokenModule } from '#app/token/token.module';
import { HealthModule } from '#app/health/health.module';
import { LegalModule } from '#app/legal/legal.module';
import { QueueModule } from '#app/queue/queue.module';
import { ProgramEventModule } from '#app/programEvent/program-event.module';
import { TaskModule } from '#app/task/task.module';
import { MailModule } from '#app/mail/mail.module';
import { SettingModule } from '#app/setting/setting.module';
import { NewsletterModule } from '#app/newsletter/newsletter.module';
import { NewsletterSubscriberModule } from '#app/newsletterSubscriber/newsletter-subscriber.module';
import { NewsletterManagerModule } from '#app/newsletterManager/newsletter-manager.module';
import { NewsletterMessageModule } from '#app/newsletterMessage/newsletter-message.module';
import { RealtimeModule } from '#app/realtime/realtime.module';
import { AdminModule } from '#app/admin/admin.module';

// Order matters: earlier modules boot first and shut down last.
export const createModules = (): AppModule[] => [
  new MailModule(),
  new SettingModule(),
  new HealthModule(),
  new QueueModule(),
  new TokenModule(),
  new AuthModule(),
  new SetupModule(),
  new TotpModule(),
  new ProfileModule(),
  new FileModule(),
  new CampModule(),
  new UserModule(),
  new AdminModule(),
  new LegalModule(),
  new RegistrationModule(),
  new TableTemplateModule(),
  new CampManagerModule(),
  new MessageDeliveryModule(),
  new MessageModule(),
  new MessageTemplateModule(),
  new RoomModule(),
  new BedModule(),
  new ProgramEventModule(),
  new TaskModule(),
  new FeedbackModule(),
  new NewsletterModule(),
  new NewsletterSubscriberModule(),
  new NewsletterManagerModule(),
  new NewsletterMessageModule(),
  new RealtimeModule(),
  new TranslationModule(),
];
