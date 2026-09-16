import type { CoreModule } from '#core/base/CoreModule';
import type { BindOptions } from '#core/base/AppModule';
import { ActorContext } from '#core/context/ActorContext';

export class ContextModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(ActorContext).toSelf().inSingletonScope();
  }
}
