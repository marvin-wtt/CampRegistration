import type { AppModule } from '#core/base/AppModule';
import apiRouter from '#routes/api';
import { AuthModule } from '#app/auth/auth.module';
import { CampModule } from '#app/camp/camp.module';
import { RegistrationModule } from '#app/registration/registration.module';
import { TableTemplateModule } from '#app/tableTemplate/table-template.module';
import { ManagerModule } from '#app/manager/manager.module';
import { MessageTemplateModule } from '#app/messageTemplate/message-template.module';
import { MessageModule } from '#app/message/message.module';
import { RoomModule } from '#app/room/room.module';
import { BedModule } from '#app/bed/bed.module';
import { FeedbackModule } from '#app/feedback/feedback.module';
import { ProfileModule } from '#app/profile/profile.module';
import { TotpModule } from '#app/totp/totp.module';
import { UserModule } from '#app/user/user.module';
import { FileModule } from '#app/file/file.module';
import { TokenModule } from '#app/token/token.module';
import { HealthModule } from '#app/health/health.module';
import { MailModule } from '#app/mail/mail.module';
import { permissionRegistry } from '#core/permission-registry';
import { initI18n } from '#core/i18n';
import { startJobs, stopJobs } from '#jobs/index';
import { connectDatabase, disconnectDatabase } from '#core/database';

let modules: AppModule[] = [];

const loadModules = () =>
  // Modules in order
  (modules = [
    new MailModule(),
    new HealthModule(),
    new TokenModule(),
    new AuthModule(),
    new TotpModule(),
    new ProfileModule(),
    new UserModule(),
    new FileModule(),
    new CampModule(),
    new RegistrationModule(),
    new TableTemplateModule(),
    new ManagerModule(),
    new MessageModule(),
    new MessageTemplateModule(),
    new RoomModule(),
    new BedModule(),
    new FeedbackModule(),
  ]);

export async function boot() {
  await connectDatabase();

  await initI18n();

  loadModules();

  await bootModules();

  // Start jobs
  startJobs();
}

export async function shutdown() {
  stopJobs();

  await shutdownModules();

  await disconnectDatabase();
}

async function bootModules() {
  // Configure modules
  for (const module of modules) {
    if (module.configure) {
      await module.configure({});
    }
  }

  // Register permissions
  for (const module of modules) {
    if (module.registerPermissions) {
      const permissions = module.registerPermissions();
      permissionRegistry.registerAll(permissions);
    }
  }

  // Register routes
  for (const module of modules) {
    if (module.registerRoutes) {
      module.registerRoutes(apiRouter);
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
