import { BaseSeeder } from './BaseSeeder';
import type { PrismaClient } from '#generated/prisma/client.js';
import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';
import { USER_IDS } from './ids';

// The seed factories write rows directly (bypassing the services that normally
// record audit entries), so this seeder back-fills the trail: a "created"
// event for every seeded entity, plus a handful of dummy manager edits so the
// registration timeline has some history to show.

// The user the event-manager seeder makes a manager of every seeded event.
const MANAGER_USER_ID = USER_IDS.john;
const MANAGER_IP = '203.0.113.10';

// Form-answer paths (matching the example event's questions) used for dummy edits.
const DATA_FIELDS = [
  'data.medical_restrictions',
  'data.food_intolerance',
  'data.emergency_contacts.*.phone_number',
];

class AuditSeeder extends BaseSeeder {
  name(): string {
    return 'audit';
  }

  async run(prisma: PrismaClient): Promise<void> {
    const events = await prisma.event.findMany({
      select: { id: true, createdAt: true },
    });
    const eventCreatedAt = new Map(
      events.map((event) => [event.id, event.createdAt ?? new Date()]),
    );

    // Initial "created" events for events and managers (manager-attributed).
    for (const event of events) {
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'event',
          entityId: event.id,
          eventId: event.id,
          actorId: MANAGER_USER_ID,
          actorIp: MANAGER_IP,
          createdAt: eventCreatedAt.get(event.id),
        },
      });
    }

    const managers = await prisma.eventManager.findMany({
      select: { id: true, eventId: true },
    });
    for (const manager of managers) {
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'eventManager',
          entityId: manager.id,
          eventId: manager.eventId,
          actorId: MANAGER_USER_ID,
          actorIp: MANAGER_IP,
          createdAt: eventCreatedAt.get(manager.eventId),
        },
      });
    }

    const registrations = await prisma.registration.findMany({
      select: { id: true, eventId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const [index, registration] of registrations.entries()) {
      // The registration itself is created via the public form — system-attributed.
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'registration',
          entityId: registration.id,
          eventId: registration.eventId,
          actorId: null,
          actorIp: null,
          createdAt: registration.createdAt,
        },
      });

      // Only give the first dozen some manager-edit history.
      if (index >= 12) {
        continue;
      }

      const editedAt = moment
        .min(
          moment(registration.createdAt).add(
            faker.number.int({ min: 1, max: 5 }),
            'days',
          ),
          moment(),
        )
        .toDate();

      // A manager edits some answers (field names only — never the values).
      await prisma.auditLog.create({
        data: {
          action: 'updated',
          entityType: 'registration',
          entityId: registration.id,
          eventId: registration.eventId,
          actorId: MANAGER_USER_ID,
          actorIp: MANAGER_IP,
          changes: {
            changedFields: faker.helpers
              .arrayElements(DATA_FIELDS, { min: 1, max: 2 })
              .sort(),
          },
          createdAt: editedAt,
        },
      });

      // A manager records a status decision (the new status value is kept).
      if (registration.status !== 'PENDING') {
        await prisma.auditLog.create({
          data: {
            action: 'updated',
            entityType: 'registration',
            entityId: registration.id,
            eventId: registration.eventId,
            actorId: MANAGER_USER_ID,
            actorIp: MANAGER_IP,
            changes: { changedValues: { status: registration.status } },
            createdAt: moment
              .min(
                moment(editedAt).add(
                  faker.number.int({ min: 1, max: 3 }),
                  'days',
                ),
                moment(),
              )
              .toDate(),
          },
        });
      }
    }
  }
}

export default new AuditSeeder();
