import type { Identifiable } from './Identifiable';

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

export interface TableColumnTemplate {
  name: string;
  label: string | Record<string, string>;
  field: string;
  required?: boolean;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortOrder?: 'ad' | 'da';
  renderAs?: string;
  renderOptions?: Record<string, unknown>;
  headerVertical?: boolean;
  editable?: boolean;
  shrink?: boolean;
  hideIf?: string;
  showIf?: string;

  // Style
  style?: string;
  classes?: string;
  headerStyle?: string;
  headerClasses?: string;
}
