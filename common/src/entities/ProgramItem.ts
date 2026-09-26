import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

export interface ProgramItem extends Identifiable {
  title: Translatable;
  details: Translatable | null;
  location: Translatable | null;
  date: string | null;
  time: string | null;
  duration: number | null;
  color: string | null;
  plan: 'a' | 'b' | 'both';
}

export type ProgramItemCreateData = Partial<Omit<ProgramItem, 'id' | 'title'>> &
  Pick<ProgramItem, 'title'>;

export type ProgramItemUpdateData = Partial<ProgramItemCreateData>;
