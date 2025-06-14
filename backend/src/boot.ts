import { type Express } from 'express';
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
import { ExpenseModule } from '#app/expense/expense.module';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import staticRoutes from '#routes/static';
import { permissionRegistry } from '#core/permission-registry';

const loadModules = (): AppModule[] =>
  // Modules in order
  [
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
    new ExpenseModule(),
    new RoomModule(),
    new BedModule(),
    new FeedbackModule(),
  ];

export async function boot(app: Express) {
  const modules = loadModules();

  await configureModules(modules, app);

  registerModulePermissions(modules);
}

async function configureModules(modules: AppModule[], app: Express) {
  // Create router for /api/v1 routes
  for (const module of modules) {
    await module.configure({ app, router: apiRouter });
  }

  app.use('/api/v1', apiRouter);

  // send back a 404 error for any unknown api request
  app.use('/api', (_req, _res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
  });

  app.use(staticRoutes);
}

function registerModulePermissions(modules: AppModule[]) {
  for (const module of modules) {
    if (module.registerPermissions) {
      const permissions = module.registerPermissions();
      permissionRegistry.registerAll(permissions);
    }
  }
}
