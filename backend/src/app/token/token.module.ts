import type { AppModule } from '#core/base/AppModule';

export class TokenModule implements AppModule {
  configure(): Promise<void> | void {
    // This does currently nothing...
  }
}
