import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject } from 'inversify';
import { AuditService } from '#app/audit/audit.service';
import { AuditResource } from '#app/audit/audit.resource';
import validator from '#app/audit/audit.validation';

export class AuditController extends BaseController {
  constructor(
    @inject(AuditService) private readonly auditService: AuditService,
  ) {
    super();
  }

  async indexForRegistration(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    const logs = await this.auditService.listForRegistration(
      event.id,
      registration.id,
    );

    res.resource(
      AuditResource.collection(await this.auditService.present(event.id, logs)),
    );
  }

  async indexForEvent(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { query } = await req.validate(validator.index);

    const { logs, nextCursor, limit, total } =
      await this.auditService.listForEvent(
        event.id,
        {
          entityType: query?.entityType,
          entityId: query?.entityId,
          actorId: query?.actorId,
          hideSystem: query?.hideSystem,
          from: query?.from,
          to: query?.to,
        },
        { cursor: query?.cursor, limit: query?.limit },
      );

    const views = await this.auditService.present(event.id, logs, {
      withEntityNames: true,
    });

    res.resource(
      AuditResource.collection(views).withCursor(nextCursor, limit, total),
    );
  }

  async actorsForEvent(req: Request, res: Response) {
    const event = req.modelOrFail('event');

    const actors = await this.auditService.listActorsForEvent(event.id);

    res.json({ data: actors });
  }
}
