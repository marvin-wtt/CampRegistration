import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject } from 'inversify';
import type { PaymentProviderOptions } from '@camp-registration/common/entities';
import { BaseController } from '#core/base/BaseController';
import { secretsAvailable } from '#core/secrets';
import { PaymentAccountService } from './payment-account.service.js';
import { PaymentAccountResource } from './payment-account.resource.js';
import { availableProviders } from './providers/payment.factory.js';
import validator from './payment.validation.js';

export class PaymentAccountController extends BaseController {
  constructor(
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');

    const account = await this.accountService.getByOrganization(
      organization.id,
    );

    if (!account) {
      res.json({ data: null });
      return;
    }

    res.resource(new PaymentAccountResource(account));
  }

  providers(_req: Request, res: Response) {
    res.json({
      data: {
        providers: availableProviders(),
        available: secretsAvailable(),
      } satisfies PaymentProviderOptions,
    });
  }

  async connect(req: Request, res: Response) {
    const { body } = await req.validate(validator.connect);
    const organization = req.modelOrFail('organization');

    const account = await this.accountService.connect(
      organization.id,
      body.provider,
      body.apiKey,
    );

    res.resource(new PaymentAccountResource(account));
  }

  async disconnect(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');

    await this.accountService.disconnect(organization.id);

    res.status(httpStatus.NO_CONTENT).send();
  }
}
