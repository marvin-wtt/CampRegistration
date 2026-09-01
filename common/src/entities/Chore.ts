import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

export interface Chore extends Identifiable {
  name: Translatable;
  sortOrder: number;
  defaultCount: number | null;
  excludeStaff: boolean;
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
