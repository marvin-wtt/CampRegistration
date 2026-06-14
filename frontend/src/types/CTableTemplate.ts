import type {
  Registration,
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';

type FieldResolver = (row: unknown) => unknown;

export interface CTableColumnTemplate extends Omit<
  TableColumnTemplate,
  'field'
> {
  field: string | FieldResolver;
  fieldName: string;
}
export interface CTableTemplate extends Omit<TableTemplate, 'columns'> {
  columns: CTableColumnTemplate[];
  /**
   * Local (frontend-only) templates set this so they stay out of the template
   * picker. They are still resolvable by id, e.g. as a dashboard route target.
   */
  hidden?: boolean;
  /**
   * Runtime predicate applied on top of the declarative filters. Used by local
   * templates whose condition cannot be expressed as a filter string (e.g.
   * "missing contact details" or "age outside the camp range").
   */
  localFilter?: (registration: Registration) => boolean;
}
