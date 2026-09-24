import { JsonResource } from '#core/resource/JsonResource';
import type {
  AuditEntityType,
  AuditLogEntry,
} from '@camp-registration/common/entities';
import type { AuditLogView } from '#app/audit/audit.service';

export class AuditResource extends JsonResource<AuditLogView, AuditLogEntry> {
  transform(): AuditLogEntry {
    const { log, actor, subject, entityName } = this.data;
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType as AuditEntityType,
      entityId: log.entityId,
      eventId: log.eventId,
      actor,
      subject,
      ...(entityName !== undefined ? { entityName } : {}),
      details: log.details ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
