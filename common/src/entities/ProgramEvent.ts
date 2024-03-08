import type { Identifiable } from './Identifiable';
import type { Translatable } from './Translatable';

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

export type ProgramEventCreateData = Omit<ProgramEvent, 'id'>;

export type ProgramEventUpdateData = Partial<ProgramEventCreateData>;
