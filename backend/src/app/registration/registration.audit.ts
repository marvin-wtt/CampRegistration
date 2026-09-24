import {
  changedKeysByAllowList,
  changedLeafPaths,
  changedValues,
  composeChangedFields,
  composeDetails,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Registration } from '#generated/prisma/client';
import type { AuditDetails } from '@camp-registration/common/entities';

// Bounded, non-identifying fields whose new value is recorded, not just the name.
const VALUE_FIELDS = ['status'] as const;

// `customFiles` maps each custom file slot to its file id; only set when the
// update touches custom files.
export type AuditedRegistration = Registration & {
  customFiles?: Record<string, string | null>;
};

export const registrationAuditPolicy: AuditChangePolicy<AuditedRegistration> = {
  entityType: 'registration',

  // Answers and custom fields by leaf path (`data.allergies`), never values.
  details(before, after) {
    return composeDetails({
      changedFields: composeChangedFields(
        changedKeysByAllowList(before, after, VALUE_FIELDS),
        changedLeafPaths(before?.data, after?.data, 'data'),
        changedLeafPaths(before?.customData, after?.customData, 'customData'),
        changedLeafPaths(
          before?.customFiles,
          after?.customFiles,
          'customFiles',
        ),
      ),
      values: changedValues(before, after, VALUE_FIELDS),
    });
  },
};

// The status a registration was created or deleted with.
export function registrationIdentity(
  registration: Pick<Registration, 'status'>,
): AuditDetails {
  return { context: { status: registration.status } };
}
