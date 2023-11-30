import { Identifiable } from 'src/types/Identifiable';
import { Translatable } from 'src/types/Translatable';

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
