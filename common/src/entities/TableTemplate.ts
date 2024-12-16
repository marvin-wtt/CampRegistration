import type { Identifiable } from './Identifiable.js';

export interface TableTemplate extends Identifiable {
  title: string | Record<string, string>;
  columns: TableColumnTemplate[];
  order: number;
  filter?: string;
  filterWaitingList?: 'include' | 'exclude' | 'only';
  filterRoles?: string[];
  printOptions?: {
    orientation?: 'portrait' | 'landscape';
  };
  indexed?: boolean;
  actions?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  generated?: boolean;
}

export type TableTemplateCreateData = Omit<TableTemplate, 'id'>;

export type TableTemplateUpdateData = Partial<TableTemplateCreateData>;

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
  isArray?: boolean;
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
