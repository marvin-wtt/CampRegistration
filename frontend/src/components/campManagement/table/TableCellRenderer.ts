import { Component } from 'vue';
import { CTableColumnTemplate } from 'src/types/CTableTemplate';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';

export class TableCellRenderer {
  private readonly _component: Component;
  private readonly _column: CTableColumnTemplate;
  private _hideEvaluator?: ExpressionEvaluator;
  private _showEvaluator?: ExpressionEvaluator;

  constructor(component: Component, column: CTableColumnTemplate) {
    this._component = component;
    this._column = column;

    this.parse();
  }

  private parse(): void {
    if (this._column.showIf !== undefined) {
      this._showEvaluator = new ExpressionEvaluator(this._column.showIf);
    }

    if (this._column.hideIf !== undefined) {
      this._hideEvaluator = new ExpressionEvaluator(this._column.hideIf);
    }
  }

  get component(): Component {
    return this._component;
  }

  get options(): object | undefined {
    return this._column.renderOptions;
  }

  isEditable(): boolean {
    return this._column.editable ?? false;
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
