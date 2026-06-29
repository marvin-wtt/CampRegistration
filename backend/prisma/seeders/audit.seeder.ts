import { BaseSeeder } from './BaseSeeder';
import type { PrismaClient } from '#generated/prisma/client.js';
import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';

// The seed factories write rows directly (bypassing the services that normally
// record audit entries), so this seeder back-fills the trail: a "created" event
// for every seeded entity, plus a handful of dummy manager edits so the
// registration timeline has some history to show.

// The user the camp-manager seeder makes a manager of every seeded camp.
const MANAGER_USER_ID = '01H4BK7J4WV75DZNAQBHMM99MA';
const MANAGER_IP = '203.0.113.10';

// Form-answer paths (matching the example camp's questions) used for dummy edits.
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
    const camps = await prisma.camp.findMany({
      select: { id: true, createdAt: true },
    });
    const campCreatedAt = new Map(
      camps.map((camp) => [camp.id, camp.createdAt ?? new Date()]),
    );

    // Initial "created" events for camps and managers (manager-attributed).
    for (const camp of camps) {
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'camp',
          entityId: camp.id,
          campId: camp.id,
          actorId: MANAGER_USER_ID,
          actorIp: MANAGER_IP,
          createdAt: campCreatedAt.get(camp.id),
        },
      });
    }

    const managers = await prisma.campManager.findMany({
      select: { id: true, campId: true },
    });
    for (const manager of managers) {
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'campManager',
          entityId: manager.id,
          campId: manager.campId,
          actorId: MANAGER_USER_ID,
          actorIp: MANAGER_IP,
          createdAt: campCreatedAt.get(manager.campId),
        },
      });
    }

    const registrations = await prisma.registration.findMany({
      select: { id: true, campId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const [index, registration] of registrations.entries()) {
      // The registration itself is created via the public form — system-attributed.
      await prisma.auditLog.create({
        data: {
          action: 'created',
          entityType: 'registration',
          entityId: registration.id,
          campId: registration.campId,
          actorId: null,
          actorIp: null,
          createdAt: registration.createdAt,
        },
      });

      // Only give the first dozen some manager-edit history.
      if (index >= 12) {
        continue;
      }

      const editedAt = moment(registration.createdAt)
        .add(faker.number.int({ min: 1, max: 5 }), 'days')
        .toDate();

      // A manager edits some answers (field names only — never the values).
      await prisma.auditLog.create({
        data: {
          action: 'updated',
          entityType: 'registration',
          entityId: registration.id,
          campId: registration.campId,
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
            campId: registration.campId,
            actorId: MANAGER_USER_ID,
            actorIp: MANAGER_IP,
            changes: { changedValues: { status: registration.status } },
            createdAt: moment(editedAt)
              .add(faker.number.int({ min: 1, max: 3 }), 'days')
              .toDate(),
          },
        });
      }
    }
  }
}

export default new AuditSeeder();
