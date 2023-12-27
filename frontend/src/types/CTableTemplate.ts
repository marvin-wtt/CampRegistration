import {
  TableColumnTemplate,
  type TableTemplate,
} from '@camp-registration/common/dist/node/entities';

type FieldResolver = (row: unknown) => unknown;

export interface CTableColumnTemplate
  extends Omit<TableColumnTemplate, 'field'> {
  field: string | FieldResolver;
}
export interface CTableTemplate extends Omit<TableTemplate, 'columns'> {
  columns: CTableColumnTemplate[];
}
