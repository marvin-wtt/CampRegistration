import { type Component } from 'vue';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';
import { ExpressionEvaluator } from '@/components/ExpressionEvaluator';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import type { ComponentRegistryEntry } from '@/components/event/table/ComponentRegistry';
import type { CsvFormatContext } from '@/utils/csvValueFormatter';

export class TableCellRenderer {
  private readonly _component: Component<TableCellProps>;
  private readonly _toCsv: ComponentRegistryEntry['options']['toCsv'];
  private readonly _column: CTableColumnTemplate;
  private _hideEvaluator?: ExpressionEvaluator;
  private _showEvaluator?: ExpressionEvaluator;

  constructor(entry: ComponentRegistryEntry, column: CTableColumnTemplate) {
    this._component = entry.component;
    this._toCsv = entry.options.toCsv;
    this._column = column;

    this.parse();
  }

  private parse(): void {
    if (this._column.showIf != null && this._column.showIf.trim().length > 0) {
      this._showEvaluator = new ExpressionEvaluator(this._column.showIf);
    }

    if (this._column.hideIf != null && this._column.hideIf.trim().length > 0) {
      this._hideEvaluator = new ExpressionEvaluator(this._column.hideIf);
    }
  }

  get component(): Component<TableCellProps> {
    return this._component;
  }

  get options(): object | undefined {
    return this._column.renderOptions;
  }

  toCsv(value: unknown, ctx: CsvFormatContext): string | undefined {
    return this._toCsv?.(value, ctx, this._column);
  }

  isArray(): boolean {
    return this._column.isArray ?? false;
  }

  isVisible(data: object): boolean {
    if (data === null) {
      return true;
    }

    const showCondition = this._showEvaluator
      ? this._showEvaluator.evaluate(data)
      : true;
    const hideCondition = this._hideEvaluator
      ? this._hideEvaluator.evaluate(data)
      : false;

    return showCondition && !hideCondition;
  }
}
