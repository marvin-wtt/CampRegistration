import { AuditService } from '#app/audit/audit.service';
import logger from '#core/logger';
import { resolve } from '#core/ioc/container';

// Audit entries are retained for this many days, then purged. Defense-in-depth
// against indefinite retention of the PII some entries carry (data diffs,
// delete snapshots). Adjust to your jurisdiction's accountability requirements.
const AUDIT_RETENTION_DAYS = 365 * 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export const purgeExpiredAuditLogs = async () => {
  const auditService = resolve(AuditService);
  const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * DAY_MS);
  const count = await auditService.purgeOlderThan(cutoff);
  logger.info(`Removed ${count.toString()} audit log entry(ies).`);
};
