import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

export interface ProgramEvent extends Identifiable {
  title: Translatable;
  details: Translatable | null;
  location: Translatable | null;
  date: string | null;
  time: string | null;
  duration: number | null;
  color: string | null;
  side: 'left' | 'right' | 'auto' | null;
}

export type ProgramEventCreateData = Partial<
  Omit<ProgramEvent, 'id' | 'title'>
> &
  Pick<ProgramEvent, 'title'>;

export type ProgramEventUpdateData = Partial<ProgramEventCreateData>;
