import httpStatus from 'http-status';
import { PARTICIPANT_ROLE } from '@camp-registration/common/form';
import type { PerGroup } from '@camp-registration/common/entities';
import type { Prisma } from '#generated/prisma/client.js';
import ApiError from '#core/router/ApiError';

/**
 * The registrations that take a place, as `takesPlace` decides for one: a
 * participant, or one without a role. Staff never fill the event.
 */
export const TAKES_PLACE = {
  OR: [{ role: PARTICIPANT_ROLE }, { role: null }, { role: '' }],
} satisfies Prisma.RegistrationWhereInput;

/**
 * Whether the event (or, with a limit per group, the group) has no place
 * left. Waitlisted registrations count: they hold their turn.
 */
export async function isFull(
  tx: Prisma.TransactionClient,
  event: { id: string; maxParticipants: PerGroup<number> },
  group: string | null,
): Promise<boolean> {
  const limit = event.maxParticipants;
  if (typeof limit === 'number') {
    const taken = await tx.registration.count({
      where: { eventId: event.id, ...TAKES_PLACE },
    });
    return taken >= limit;
  }

  if (!group || !(group in limit)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or missing group');
  }
  const taken = await tx.registration.count({
    where: { eventId: event.id, group, ...TAKES_PLACE },
  });

  return taken >= limit[group];
}
