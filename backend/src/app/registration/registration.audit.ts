import {
  changedLeafPaths,
  changedValues,
  composeChangedFields,
  composeChangeSet,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Registration } from '#generated/prisma/client';

// Bounded, non-identifying fields whose new value is recorded (not just the
// name) so the timeline can show the outcome — e.g. status "Accepted".
const VALUE_FIELDS = ['status'] as const;

export const registrationAuditPolicy: AuditChangePolicy<Registration> = {
  entityType: 'registration',

  // `data` and `customData` are recorded by full leaf path (`data.allergies`,
  // `customData.foo`) so the trail shows exactly which answers changed — but
  // only the path, never the value.
  changeSet(before, after) {
    return composeChangeSet(
      composeChangedFields(
        changedLeafPaths(before?.data, after?.data, 'data'),
        changedLeafPaths(before?.customData, after?.customData, 'customData'),
      ),
      changedValues(before, after, VALUE_FIELDS),
    );
  },
};
