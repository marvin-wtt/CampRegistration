import { guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { realtimeStream } from '#app/realtime/realtime.stream';
import {
  programPublicSubscriber,
  programPublicViewGuard,
} from '#app/programPublic/program-public.guard';
import { ProgramPublicController } from './program-public.controller.js';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramPublicRouter extends ModuleRouter {
  constructor(
    @inject(ProgramPublicController)
    private readonly programPublicController: ProgramPublicController,
  ) {
    super();
  }

  protected registerBindings() {
    // No bindings of its own: the `event` model is already bound globally for
    // `:eventId` by `EventRouter`.
  }

  protected defineRoutes() {
    // Deliberately no `auth()` anywhere in this router — the whole point is an
    // anonymous, read-only view. Reach is gated by `eventPubliclyVisible`
    // (organization verification), exactly like the event page itself; the
    // `program-public.enabled` setting is enforced inside the controller, not
    // here — see `program-public.guard.ts` for why the stream and the data
    // route are gated differently.
    this.router.get(
      '/',
      guard(programPublicViewGuard),
      controller(this.programPublicController, 'show'),
    );

    this.router.get(
      '/stream',
      guard(programPublicViewGuard),
      realtimeStream(programPublicSubscriber),
    );
  }
}
