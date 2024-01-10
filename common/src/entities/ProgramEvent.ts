import type { Identifiable } from './Identifiable';
import type { Translatable } from './Translatable';

export interface ProgramEvent extends Identifiable {
  seriesId?: string;
  title: Translatable;
  details?: Translatable;
  date?: string;
  duration?: number;
  time?: string;
  backgroundColor: string;
  side?: 'left' | 'right' | 'auto';
}
