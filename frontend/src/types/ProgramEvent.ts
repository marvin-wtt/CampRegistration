import { Identifiable } from 'src/types/Identifiable';

export interface ProgramEvent extends Identifiable {
  seriesId?: string;
  title: string | Record<string, string>;
  details?: string | Record<string, string>;
  date?: string;
  duration?: number;
  time?: string;
  backgroundColor: string;
  side?: 'left' | 'right' | 'auto';
}
