import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

export interface Chore extends Identifiable {
  name: Translatable;
  sortOrder: number;
  /**
   * Usual number of units (participants or rooms, whichever a given
   * occurrence is assigned by) this chore needs — not enforced, just sizes
   * the suggestion. Meaningless until an occurrence picks a rotation unit.
   */
  defaultCount: number | null;
  /** Exclude staff, and rooms with no participant occupants, from suggestions. */
  excludeStaff: boolean;
  /**
   * Nice-to-have: try to spread suggested participants across countries.
   * Only ever a secondary tiebreak — fairness always wins first.
   */
  balanceCountries: boolean;
}

export type ChoreCreateData = Pick<Chore, 'name'> &
  Partial<Pick<Chore, 'defaultCount' | 'excludeStaff' | 'balanceCountries'>>;

export type ChoreUpdateData = Partial<
  Pick<
    Chore,
    'name' | 'sortOrder' | 'defaultCount' | 'excludeStaff' | 'balanceCountries'
  >
>;
