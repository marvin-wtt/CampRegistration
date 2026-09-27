import { describe, expect, it } from 'vitest';
import {
  ChoreAssignmentFactory,
  ChoreFactory,
  EventFactory,
} from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { up } from '../../../prisma/migrations/20260927120000_chore_planner_rework/migration.js';

describe('data migration: chore_planner_rework', () => {
  it('turns free-text slots into chore slots and links the assignments', async () => {
    const event = await EventFactory.create();
    const kitchen = await ChoreFactory.create({
      event: { connect: { id: event.id } },
    });
    const trash = await ChoreFactory.create({
      event: { connect: { id: event.id } },
    });
    const assignment = (date: string, choreId: string, slot: string | null) =>
      ChoreAssignmentFactory.create({
        event: { connect: { id: event.id } },
        chore: { connect: { id: choreId } },
        date,
        slot,
      });

    const lunch = await assignment('2026-09-01', kitchen.id, 'Lunch');
    const dinner = await assignment('2026-09-01', kitchen.id, ' Dinner ');
    const lunchAgain = await assignment('2026-09-02', kitchen.id, 'Lunch');
    const trashLunch = await assignment('2026-09-02', trash.id, 'Lunch');
    const noSlot = await assignment('2026-09-03', kitchen.id, null);

    await prisma.$transaction((tx) => up(tx));

    const slots = await prisma.choreSlot.findMany({
      orderBy: [{ choreId: 'asc' }, { sortOrder: 'asc' }],
    });
    const kitchenSlots = slots.filter((slot) => slot.choreId === kitchen.id);
    expect(kitchenSlots.map((slot) => [slot.name, slot.sortOrder])).toEqual([
      ['Lunch', 0],
      ['Dinner', 1],
    ]);
    expect(slots.filter((slot) => slot.choreId === trash.id)).toHaveLength(1);

    const slotIdOf = async (id: string) =>
      (await prisma.choreAssignment.findUniqueOrThrow({ where: { id } }))
        .slotId;
    expect(await slotIdOf(lunch.id)).toBe(kitchenSlots[0]?.id);
    expect(await slotIdOf(lunchAgain.id)).toBe(kitchenSlots[0]?.id);
    expect(await slotIdOf(dinner.id)).toBe(kitchenSlots[1]?.id);
    expect(await slotIdOf(trashLunch.id)).not.toBe(kitchenSlots[0]?.id);
    expect(await slotIdOf(noSlot.id)).toBeNull();

    // Running it again changes nothing.
    await prisma.$transaction((tx) => up(tx));
    expect(await prisma.choreSlot.count()).toBe(3);
  });
});
