import type { Identifiable } from './Identifiable.js';

export interface TableTemplate extends Identifiable {
  title: string | Record<string, string>;
  columns: TableColumnTemplate[];
  order: number;
  filter?: string | undefined;
  filterWaitingList?: 'include' | 'exclude' | 'only';
  filterRoles?: string[] | undefined;
  printOptions?: {
    orientation?: 'portrait' | 'landscape';
  };
  indexed?: boolean | undefined;
  actions?: boolean | undefined;
  sortBy?: string | undefined;
  sortDirection?: 'asc' | 'desc' | undefined;
  generated?: boolean | undefined;
}

export type TableTemplateCreateData = Omit<TableTemplate, 'id'>;

export type TableTemplateUpdateData = Partial<TableTemplateCreateData>;

export interface TableColumnTemplate {
  name: string;
  label: string | Record<string, string>;
  field: string;
  required?: boolean | undefined;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean | undefined;
  sortOrder?: 'ad' | 'da' | undefined;
  renderAs?: string | undefined;
  renderOptions?: Record<string, unknown> | undefined;
  isArray?: boolean | undefined;
  headerVertical?: boolean | undefined;
  editable?: boolean | undefined;
  shrink?: boolean | undefined;
  hideIf?: string | undefined;
  showIf?: string | undefined;

  // Style
  style?: string | undefined;
  classes?: string | undefined;
  headerStyle?: string | undefined;
  headerClasses?: string | undefined;
}
