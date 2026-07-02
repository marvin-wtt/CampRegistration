import type { AppModule } from '#core/base/AppModule';
import apiRouter from '#routes/api';
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
import { TotpModule } from '#app/totp/totp.module';
import { UserModule } from '#app/user/user.module';
import { SetupModule } from '#app/setup/setup.module';
import { FileModule } from '#app/file/file.module';
import { TokenModule } from '#app/token/token.module';
import { HealthModule } from '#app/health/health.module';
import { QueueModule } from '#app/queue/queue.module';
import { ProgramEventModule } from '#app/programEvent/program-event.module';
import { MailModule } from '#app/mail/mail.module';
import { NewsletterModule } from '#app/newsletter/newsletter.module';
import { NewsletterSubscriberModule } from '#app/newsletterSubscriber/newsletter-subscriber.module';
import { NewsletterManagerModule } from '#app/newsletterManager/newsletter-manager.module';
import { NewsletterMessageModule } from '#app/newsletterMessage/newsletter-message.module';
import { AuditModule } from '#app/audit/audit.module';
import {
  campPermissionRegistry,
  newsletterPermissionRegistry,
} from '#core/permission-registry';
import { initI18n } from '#core/i18n';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { verifyDatabaseConnection, disconnectDatabase } from '#core/database';
import { ContainerModule } from 'inversify';
import { container, resolve } from '#core/ioc/container';

let modules: AppModule[] = [];

const loadModules = () =>
  // Modules in order
  (modules = [
    new MailModule(),
    new HealthModule(),
    new QueueModule(),
    new AuditModule(),
    new TokenModule(),
    new AuthModule(),
    new SetupModule(),
    new TotpModule(),
    new ProfileModule(),
    new FileModule(),
    new CampModule(),
    new UserModule(),
    new RegistrationModule(),
    new TableTemplateModule(),
    new CampManagerModule(),
    new MessageDeliveryModule(),
    new MessageModule(),
    new MessageTemplateModule(),
    new RoomModule(),
    new BedModule(),
    new ProgramEventModule(),
    new FeedbackModule(),
    new NewsletterModule(),
    new NewsletterSubscriberModule(),
    new NewsletterManagerModule(),
    new NewsletterMessageModule(),
  ]);

export async function boot() {
  await verifyDatabaseConnection();

  await initI18n();

  loadModules();

  await bootModules();
}

export async function shutdown() {
  stopJobs();

  await shutdownModules();

  await disconnectDatabase();
}

function stopJobs() {
  resolve(JobScheduler).stop();
}

async function bootModules() {
  // Bind module services
  container.load(
    ...modules.map(
      (module) =>
        new ContainerModule((options) => {
          module.bindContainers?.(options);
        }),
    ),
  );

  // Configure modules
  for (const module of modules) {
    if (module.configure) {
      await module.configure({});
    }
  }

  // Register permissions
  for (const module of modules) {
    if (module.registerPermissions) {
      campPermissionRegistry.registerAll(module.registerPermissions());
    }
    if (module.registerNewsletterPermissions) {
      newsletterPermissionRegistry.registerAll(
        module.registerNewsletterPermissions(),
      );
    }
  }

  // Register routes
  for (const module of modules) {
    if (module.registerRoutes) {
      module.registerRoutes(apiRouter);
    }
  }

  // Register recurring jobs
  const scheduler = resolve(JobScheduler);
  for (const module of modules) {
    if (module.registerJobs) {
      module.registerJobs(scheduler);
    }
  }
}

async function shutdownModules() {
  for (const module of modules) {
    if (module.shutdown) {
      await module.shutdown();
    }
  }
}
