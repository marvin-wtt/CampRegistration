import { JsonResource } from '#core/resource/JsonResource';
import type {
  AuditEntityType,
  AuditLogEntry,
} from '@camp-registration/common/entities';
import type { AuditLogWithActor } from '#app/audit/audit.service';

export class AuditResource extends JsonResource<
  AuditLogWithActor,
  AuditLogEntry
> {
  transform(): AuditLogEntry {
    const { log, actor, subject } = this.data;
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType as AuditEntityType,
      entityId: log.entityId,
      campId: log.campId,
      actor,
      subject,
      changes: log.changes ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
