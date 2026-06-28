import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject } from 'inversify';
import { AuditService, type AuditLogWithActor } from '#app/audit/audit.service';
import { AuditResource } from '#app/audit/audit.resource';

export class AuditController extends BaseController {
  constructor(
    @inject(AuditService) private readonly auditService: AuditService,
  ) {
    super();
  }

  async indexForRegistration(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const registration = req.modelOrFail('registration');

    const logs = await this.auditService.listForRegistration(
      camp.id,
      registration.id,
    );

    const actors = await this.auditService.resolveActors(
      logs.map((log) => log.actorId),
    );

    const entries: AuditLogWithActor[] = logs.map((log) => ({
      log,
      actor: log.actorId ? (actors.get(log.actorId) ?? null) : null,
    }));

    res.resource(AuditResource.collection(entries));
  }
}
