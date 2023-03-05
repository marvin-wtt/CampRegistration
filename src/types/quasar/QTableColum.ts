export interface QTableColumn {
  name: string;
  label: string;
  field: string | ((row: unknown) => unknown);
  required?: boolean;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sort?: (a: unknown, b: unknown, rowA: unknown, rowB: unknown) => number;
  sortOrder?: 'ad' | 'da';
  format?: (val: unknown, row: unknown) => unknown;
  style?: string | ((row: unknown) => string);
  classes?: string | ((row: unknown) => string);
  headerStyle?: string;
  headerClasses?: string;
}
