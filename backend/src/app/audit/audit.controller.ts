import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject } from 'inversify';
import { AuditService, type AuditLogWithActor } from '#app/audit/audit.service';
import { AuditResource } from '#app/audit/audit.resource';
import type { AuditLog } from '#generated/prisma/client.js';

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

    res.resource(AuditResource.collection(await this.withActors(logs)));
  }

  async indexForCamp(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    const logs = await this.auditService.listForCamp(camp.id);

    res.resource(AuditResource.collection(await this.withActors(logs)));
  }

  // `changedValues.userId` is the campManager policy's way of naming the
  // manager an entry is about (see `managerIdentity`) — resolved into a
  // `subject` here, the same way `actorId` is resolved into `actor`.
  private subjectUserId(log: AuditLog): string | null {
    const userId = log.changes?.changedValues?.userId;
    return typeof userId === 'string' ? userId : null;
  }

  private async withActors(logs: AuditLog[]): Promise<AuditLogWithActor[]> {
    const ids = logs.flatMap((log) => {
      const subjectId = this.subjectUserId(log);
      return [log.actorId, subjectId].filter((id): id is string => id !== null);
    });
    const users = await this.auditService.resolveActors(ids);

    return logs.map((log) => {
      const subjectId = this.subjectUserId(log);
      return {
        log,
        actor: log.actorId
          ? (users.get(log.actorId) ?? { id: log.actorId, name: null })
          : null,
        subject: subjectId
          ? (users.get(subjectId) ?? { id: subjectId, name: null })
          : null,
      };
    });
  }
}
