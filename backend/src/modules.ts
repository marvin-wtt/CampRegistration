import type { AppModule } from '#core/base/AppModule';
import { AuthModule } from '#app/auth/auth.module';
import { EventModule } from '#app/event/event.module';
import { OrganizationModule } from '#app/organization/organization.module';
import { OrganizationMemberModule } from '#app/organizationMember/organization-member.module';
import { RegistrationModule } from '#app/registration/registration.module';
import { TableTemplateModule } from '#app/tableTemplate/table-template.module';
import { EventManagerModule } from '#app/eventManager/event-manager.module.js';
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
import { PrivacyNoticeModule } from '#app/privacyNotice/privacy-notice.module';
import { QueueModule } from '#app/queue/queue.module';
import { ProgramItemModule } from '#app/programItem/program-item.module';
import { TaskModule } from '#app/task/task.module';
import { ChoreModule } from '#app/chore/chore.module';
import { ChoreAssignmentModule } from '#app/choreAssignment/choreAssignment.module';
import { SettingModule } from '#app/setting/setting.module';
import { NewsletterModule } from '#app/newsletter/newsletter.module';
import { NewsletterSubscriberModule } from '#app/newsletterSubscriber/newsletter-subscriber.module';
import { NewsletterManagerModule } from '#app/newsletterManager/newsletter-manager.module';
import { NewsletterMessageModule } from '#app/newsletterMessage/newsletter-message.module';
import { AuditModule } from '#app/audit/audit.module';
import { AdminModule } from '#app/admin/admin.module';
import { PermissionModule } from '#app/permission/permission.module';
import type { CoreModule } from '#core/base/CoreModule';
import { DatabaseModule } from '#core/database/database.module';
import { I18nModule } from '#core/i18n/i18n.module';
import { QueueManagerModule } from '#core/queue/queue-manager.module';
import { SchedulerModule } from '#core/scheduler/scheduler.module';
import { MailModule } from '#core/mail/mail.module';
import { RealtimeModule } from '#core/realtime/realtime.module';
import { ContextModule } from '#core/context/context.module';

// Order matters: earlier modules boot first and shut down last.
export const createCoreModules = (): CoreModule[] => [
  new DatabaseModule(),
  new I18nModule(),
  new QueueManagerModule(),
  new SchedulerModule(),
  new MailModule(),
  new ContextModule(),
  new RealtimeModule(),
];

// Order matters: earlier modules boot first and shut down last.
export const createAppModules = (): AppModule[] => [
  new SettingModule(),
  new HealthModule(),
  new QueueModule(),
  new AuditModule(),
  new TokenModule(),
  new AuthModule(),
  new SetupModule(),
  new TotpModule(),
  new ProfileModule(),
  new FileModule(),
  new OrganizationModule(),
  new OrganizationMemberModule(),
  new EventModule(),
  new UserModule(),
  new AdminModule(),
  new LegalModule(),
  new PrivacyNoticeModule(),
  new RegistrationModule(),
  new TableTemplateModule(),
  new EventManagerModule(),
  new MessageDeliveryModule(),
  new MessageModule(),
  new MessageTemplateModule(),
  new RoomModule(),
  new BedModule(),
  new ProgramItemModule(),
  new TaskModule(),
  new ChoreModule(),
  new ChoreAssignmentModule(),
  new FeedbackModule(),
  new NewsletterModule(),
  new NewsletterSubscriberModule(),
  new NewsletterManagerModule(),
  new NewsletterMessageModule(),
  new TranslationModule(),
  // Last: serves the policy every other module has contributed to.
  new PermissionModule(),
];
