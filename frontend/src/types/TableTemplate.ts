import { TableColumnTemplate } from 'src/types/TableColumnTemplate';
import { Identifiable } from 'src/types/Identifiable';

export interface TableTemplate extends Identifiable {
  title: string | Record<string, string>;
  columns: TableColumnTemplate[];
  order: number;
  filter?: string;
  filterWaitingList?: boolean;
  filterCounselors?: boolean;
  filterParticipants?: boolean;
  printOptions?: {
    orientation?: 'portrait' | 'landscape';
  };
  indexed?: boolean;
  actions?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  generated?: boolean;
}

export type TemplateCreateData = Omit<TableTemplate, 'id'>;

export type TemplateUpdateData = Partial<TemplateCreateData>;
