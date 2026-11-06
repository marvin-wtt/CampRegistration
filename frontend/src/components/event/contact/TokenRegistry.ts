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
  // `url` tokens always hold a link, so a button may point at them.
  type?: 'url' | undefined;
};
