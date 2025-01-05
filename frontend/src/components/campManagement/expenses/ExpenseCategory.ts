import { QSelectOption } from 'quasar';

export interface ExpenseCategory extends QSelectOption<string> {
  children?: ExpenseCategory[];
}
