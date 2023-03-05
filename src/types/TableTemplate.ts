import { SimpleTranslation } from 'src/composables/objectTranslation';
import { TableColumnTemplate } from 'src/types/TableColumnTemplate';
import { Identifiable } from 'src/types/Identifiable';

export interface TableTemplate extends Identifiable {
  title: string | SimpleTranslation;
  columns: TableColumnTemplate[];
  order: number | undefined;
  filter?: string;
  printOptions?: {
    orientation?: 'portrait' | 'landscape';
  };
}
