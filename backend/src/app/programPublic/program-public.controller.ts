import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import { utcCarrierToNaiveDateTime } from '@camp-registration/common/utils';
import { BaseController } from '#core/base/BaseController';
import { ProgramPublicService } from './program-public.service.js';
import { ProgramPublicResource } from './program-public.resource.js';
import validator from './program-public.validation.js';

@injectable()
export class ProgramPublicController extends BaseController {
  constructor(
    @inject(ProgramPublicService)
    private readonly programPublicService: ProgramPublicService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    const { query } = await req.validate(validator.show);
    const event = req.modelOrFail('event');

    const view = await this.programPublicService.getPublicView(
      event.id,
      {
        startAt: utcCarrierToNaiveDateTime(event.startAt),
        endAt: utcCarrierToNaiveDateTime(event.endAt),
        timezone: event.timezone,
      },
      query.date,
    );

    res.resource(new ProgramPublicResource(view));
  }
}
