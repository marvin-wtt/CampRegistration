import type { QSelectOption } from 'quasar';

export interface Token {
  label?: string;
  icon?: string;
  key: string;
  items: QSelectOption<string>[];
}
