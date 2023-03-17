import { TableColumnTemplate } from 'src/types/TableColumnTemplate';
import { Identifiable } from 'src/types/Identifiable';

export interface TableTemplate extends Identifiable {
  title: string | Record<string, string>;
  columns: TableColumnTemplate[];
  order: number | undefined;
  filter?: string;
  printOptions?: {
    orientation?: 'portrait' | 'landscape';
  };
  indexed?: boolean;
  actions?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
