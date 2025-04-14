import express, { type Express } from 'express';
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
import { TokenModule } from '#app/token/file.module';
import { HealthModule } from '#app/health/health.module';
import extensions from '#middlewares/extension.middleware.js';

export async function boot(app: Express) {
  // Modules in order
  const modules: AppModule[] = [
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
  ];

  // Create router for /api/v1 routes
  const router = express.Router();
  router.use(extensions);

  for (const module of modules) {
    await module.configure({ app, router });
  }

  apiRouter.use('/v1', router);
}
