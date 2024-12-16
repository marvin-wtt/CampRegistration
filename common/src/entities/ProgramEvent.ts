import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

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
