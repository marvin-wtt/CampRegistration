import type { Identifiable } from './Identifiable.js';
import type { EventPhase } from './Event.js';

export interface TableTemplate extends Identifiable {
  title: string | Record<string, string>;
  columns: TableColumnTemplate[];
  order: number;
  filter?: string | null | undefined;
  filterStatus?: ('PENDING' | 'WAITLISTED' | 'ACCEPTED')[];
  filterRoles?: string[] | undefined;
  printOptions?: {
    orientation?: 'portrait' | 'landscape' | undefined;
  };
  indexed?: boolean | undefined;
  actions?: boolean | undefined;
  sortBy?: string | null | undefined;
  sortDirection?: 'asc' | 'desc' | undefined;
  generated?: boolean | undefined;
  /**
   * The phases the template is meant for; empty or unset means all. Outside
   * them it moves to the end of the picker and is never the default.
   */
  phases?: EventPhase[] | undefined;
}

export type TableTemplateCreateData = Omit<TableTemplate, 'id'>;

export type TableTemplateUpdateData = Partial<TableTemplateCreateData>;

export interface TableColumnTemplate {
  name: string;
  label: string | Record<string, string>;
  source?: 'form' | 'custom' | 'computed' | 'meta' | undefined;
  field: string;
  required?: boolean | undefined;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean | undefined;
  sortOrder?: 'ad' | 'da' | undefined;
  renderAs?: string | undefined;
  renderOptions?: Record<string, unknown> | undefined;
  isArray?: boolean | undefined;
  headerVertical?: boolean | undefined;
  shrink?: boolean | undefined;
  hideIf?: string | null | undefined;
  showIf?: string | null | undefined;

  // Style
  style?: string | undefined;
  classes?: string | undefined;
  headerStyle?: string | undefined;
  headerClasses?: string | undefined;
}
