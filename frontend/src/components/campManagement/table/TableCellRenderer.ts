import { type Component } from 'vue';
import type { CTableColumnTemplate } from 'src/types/CTableTemplate';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

export class TableCellRenderer {
  private readonly _component: Component<TableCellProps>;
  private readonly _column: CTableColumnTemplate;
  private _hideEvaluator?: ExpressionEvaluator;
  private _showEvaluator?: ExpressionEvaluator;

  constructor(
    component: Component<TableCellProps>,
    column: CTableColumnTemplate,
  ) {
    this._component = component;
    this._column = column;

    this.parse();
  }

  private parse(): void {
    if (this._column.showIf != null) {
      this._showEvaluator = new ExpressionEvaluator(this._column.showIf);
    }

    if (this._column.hideIf != null) {
      this._hideEvaluator = new ExpressionEvaluator(this._column.hideIf);
    }
  }

  get component(): Component<TableCellProps> {
    return this._component;
  }

  get options(): object | undefined {
    return this._column.renderOptions;
  }

  isArray(): boolean {
    return this._column.isArray ?? false;
  }

  isVisible(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return true;
    }

    return this._hideEvaluator
      ? this._hideEvaluator.evaluate(data) === false
      : this._showEvaluator
        ? this._showEvaluator.evaluate(data) === true
        : true;
  }
}
