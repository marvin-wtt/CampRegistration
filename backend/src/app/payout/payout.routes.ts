import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission, hasEventView } from '#app/event/event.guard';
import { PayoutService } from '#app/payout/payout.service';
import { PayoutController } from '#app/payout/payout.controller';

@injectable()
export class PayoutRouter extends ModuleRouter {
  constructor(
    @inject(PayoutService) private readonly payoutService: PayoutService,
    @inject(PayoutController)
    private readonly payoutController: PayoutController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel(
      'payout',
      (req, id) => {
        const event = req.modelOrFail('event');
        return this.payoutService.getPayoutById(event.id, id);
      },
      { ownedBy: ['recipientUserId'] },
    );
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventView('event.payouts.view')),
      controller(this.payoutController, 'index'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.payouts.create')),
      controller(this.payoutController, 'store'),
    );
    this.router.patch(
      '/:payoutId',
      guard(hasEventPermission('event.payouts.edit')),
      controller(this.payoutController, 'update'),
    );
    // Signed on the treasurer's device, or by the recipient on their own.
    this.router.put(
      '/:payoutId/signature',
      guard(hasEventPermission('event.payouts.sign', { own: 'payout' })),
      controller(this.payoutController, 'sign'),
    );
    // Only the treasurer takes a signature back; the recipient can't.
    this.router.delete(
      '/:payoutId/signature',
      guard(hasEventPermission('event.payouts.edit')),
      controller(this.payoutController, 'unsign'),
    );
    this.router.delete(
      '/:payoutId',
      guard(hasEventPermission('event.payouts.delete')),
      controller(this.payoutController, 'destroy'),
    );
  }
}
