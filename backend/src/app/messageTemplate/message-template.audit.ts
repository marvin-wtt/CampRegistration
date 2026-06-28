import {
  composeChangeSet,
  diffByAllowList,
  pickSnapshot,
} from '#app/audit/audit.diff';
import type {
  AuditChangePolicy,
  AuditSnapshotPolicy,
} from '#app/audit/audit.policy';
import type { MessageTemplate } from '#generated/prisma/client';

// Editable template content. `event`/`country` identify the template (which
// automated email + country variant) and are set at create; `subject`/`body`/
// `priority`/`replyTo` are the editable content. `body` (full email HTML) is
// included because "who changed the template body" is the point — it is template
// content, not participant PII. Attachments (a relation) are out of scope.
const FIELD_ALLOWLIST: (keyof MessageTemplate)[] = [
  'event',
  'country',
  'subject',
  'body',
  'priority',
  'replyTo',
];

// Identifies the template on create/delete; `body` omitted to keep rows small.
const SNAPSHOT_KEYS: (keyof MessageTemplate)[] = [
  'event',
  'country',
  'subject',
  'priority',
];

export const messageTemplateAuditPolicy: AuditChangePolicy<MessageTemplate> &
  AuditSnapshotPolicy<MessageTemplate> = {
  entityType: 'messageTemplate',

  changeSet(before, after) {
    return composeChangeSet(diffByAllowList(before, after, FIELD_ALLOWLIST));
  },

  snapshot(entity) {
    return pickSnapshot(entity, SNAPSHOT_KEYS);
  },
};
