import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

export type ChoreRotationUnit = 'PERSON' | 'ROOM';

export type ChoreEligibility = 'PARTICIPANTS' | 'STAFF' | 'EVERYONE';

export type ChoreEffort = 'LIGHT' | 'NORMAL' | 'HEAVY';

export interface ChoreSlot extends Identifiable {
  name: Translatable;
  sortOrder: number;
  // Overrides of the chore's values; null falls back to the chore.
  headcount: number | null;
  supervisorCount: number | null;
  effort: ChoreEffort | null;
}

// Slots are upserted with their chore; order follows the array.
export type ChoreSlotData = Partial<Pick<ChoreSlot, 'id'>> &
  Pick<ChoreSlot, 'name'> &
  Partial<Pick<ChoreSlot, 'headcount' | 'supervisorCount' | 'effort'>>;

export interface Chore extends Identifiable {
  name: Translatable;
  sortOrder: number;
  defaultCount: number | null;
  supervisorCount: number;
  eligibility: ChoreEligibility;
  effort: ChoreEffort;
  defaultRotationUnit: ChoreRotationUnit;
  balanceCountries: boolean;
  slots: ChoreSlot[];
}

type ChoreSettings = Pick<
  Chore,
  | 'defaultCount'
  | 'supervisorCount'
  | 'eligibility'
  | 'effort'
  | 'defaultRotationUnit'
  | 'balanceCountries'
>;

export type ChoreCreateData = Pick<Chore, 'name'> &
  Partial<ChoreSettings> & { slots?: ChoreSlotData[] };

export type ChoreUpdateData = Partial<
  Pick<Chore, 'name' | 'sortOrder'> & ChoreSettings & { slots: ChoreSlotData[] }
>;
