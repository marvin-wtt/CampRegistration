import type { Identifiable } from './Identifiable';
import type { Translatable } from './Translatable';

export interface ProgramEvent extends Identifiable {
  title: Translatable;
  details?: Translatable;
  location?: Translatable;
  date?: string;
  time?: string;
  duration?: number;
  color: string;
  side?: 'left' | 'right' | 'auto';
}

export type ProgramEventCreateData = Omit<ProgramEvent, 'id'>;

export type ProgramEventUpdateData = Partial<ProgramEventCreateData>;
