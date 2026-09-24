import { BaseSeeder } from './BaseSeeder';
import type { PrismaClient } from '#generated/prisma/client.js';
import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';
import { USER_IDS } from './ids';
import { managerGrant } from '#app/eventManager/event-manager.audit.js';
import { registrationIdentity } from '#app/registration/registration.audit.js';

// Factories bypass the services that record audit entries, so this back-fills
// a "created" entry per entity plus some manager edits for the timeline.

// Manager of every seeded event (see the event-manager seeder).
const MANAGER_USER_ID = USER_IDS.john;

// Question paths of the example event's form.
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

    for (const event of events) {
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'event',
          entityId: event.id,
          eventId: event.id,
          actorId: MANAGER_USER_ID,
          createdAt: eventCreatedAt.get(event.id),
        },
      });
    }

    const managers = await prisma.eventManager.findMany({
      include: { invitation: true },
    });
    for (const manager of managers) {
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'eventManager',
          entityId: manager.id,
          eventId: manager.eventId,
          actorId: MANAGER_USER_ID,
          details: managerGrant(manager),
          createdAt: eventCreatedAt.get(manager.eventId),
        },
      });
    }

    const registrations = await prisma.registration.findMany({
      select: { id: true, eventId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const [index, registration] of registrations.entries()) {
      // The first dozen get edits; a decided one started out pending.
      const edited = index < 12;
      const decided = edited && registration.status !== 'PENDING';

      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'registration',
          entityId: registration.id,
          eventId: registration.eventId,
          actorId: null,
          details: registrationIdentity(
            decided ? { status: 'PENDING' } : registration,
          ),
          createdAt: registration.createdAt,
        },
      });

      if (!edited) {
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

      await prisma.auditLog.create({
        data: {
          action: 'updated',
          entityType: 'registration',
          entityId: registration.id,
          eventId: registration.eventId,
          actorId: MANAGER_USER_ID,
          details: {
            changedFields: faker.helpers
              .arrayElements(DATA_FIELDS, { min: 1, max: 2 })
              .sort(),
          },
          createdAt: editedAt,
        },
      });

      if (decided) {
        await prisma.auditLog.create({
          data: {
            action: 'updated',
            entityType: 'registration',
            entityId: registration.id,
            eventId: registration.eventId,
            actorId: MANAGER_USER_ID,
            details: {
              changedFields: ['status'],
              values: { status: registration.status },
            },
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
