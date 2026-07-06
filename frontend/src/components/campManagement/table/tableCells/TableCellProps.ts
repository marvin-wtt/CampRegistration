import type { QTableBodyCellProps } from '@/types/quasar/QTableBodyCellProps';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';

export interface TableCellProps<
  Options extends object | undefined = undefined,
> {
  props: QTableBodyCellProps<unknown, Registration>;
  camp: CampDetails;
  options?: Options | undefined;
  printing: boolean;
  readonly?: boolean | undefined;
  // True when the cell is rendered outside the table grid (e.g. in the row
  // card dialog). Renderers may use this to decide how to present missing /
  // empty values or which editing affordance to show.
  gridMode?: boolean | undefined;
}
