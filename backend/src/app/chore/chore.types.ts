import type { Chore, ChoreSlot } from '#generated/prisma/client.js';

export interface ChoreWithSlots extends Chore {
  slots: ChoreSlot[];
}
