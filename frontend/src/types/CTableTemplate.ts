import type {
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';

type FieldResolver = (row: unknown) => unknown;

export interface CTableColumnTemplate
  extends Omit<TableColumnTemplate, 'field'> {
  field: string | FieldResolver;
  fieldName: string;
}
export interface CTableTemplate extends Omit<TableTemplate, 'columns'> {
  columns: CTableColumnTemplate[];
}
