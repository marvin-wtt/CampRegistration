export interface Token<TPath extends string = string> {
  label: string;
  // The full template path; groups only arrange tokens for the picker.
  value: TPath;
  caption?: string | undefined;
  category?: string | undefined;
  // `url` tokens always hold a link, so a button may point at them.
  type?: 'url' | undefined;
}

export interface TokenGroup<TPath extends string = string> {
  label: string;
  caption?: string | undefined;
  items: TokenItem<TPath>[];
}

export type TokenItem<TPath extends string = string> =
  TokenGroup<TPath> | Token<TPath>;

export function isTokenGroup(item: TokenItem): item is TokenGroup {
  return 'items' in item;
}

/** Every token below `items`, each in the category of its nearest group. */
export function flattenTokens(items: TokenItem[], category?: string): Token[] {
  return items.flatMap((item) =>
    isTokenGroup(item)
      ? flattenTokens(item.items, item.label)
      : [{ ...item, category: item.category ?? category }],
  );
}
