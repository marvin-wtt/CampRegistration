import type { QSelectOption } from 'quasar';

export interface TokenRegistry {
  label?: string;
  caption?: string;
  category?: string | undefined;
  icon?: string;
  value: string;
  items: TokenRegistry[] | Token[];
}

export type Token = QSelectOption<string> & {
  caption?: string;
  category?: string | undefined;
};
