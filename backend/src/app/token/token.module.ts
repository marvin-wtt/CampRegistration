import type { AppModule, BindOptions } from '#core/base/AppModule';
import { TokenService } from '#app/token/token.service';

export class TokenModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TokenService).toSelf().inSingletonScope();
  }
}
