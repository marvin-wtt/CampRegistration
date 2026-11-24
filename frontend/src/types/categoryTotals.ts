/** Rows of a per-category breakdown, as `CategoryTotalsCard` shows them. */
import type { RouteLocationRaw } from 'vue-router';

export interface CategoryTotalRow {
  key: string;
  name: string;
  caption?: string | undefined;
  total: number;
  /** Only when not the event's currency. */
  currency?: string | undefined;
  to: RouteLocationRaw;
}

export interface CategoryTotalGroup {
  key: string;
  /** Empty for categories outside a group. */
  name: string;
  total: number;
  rows: CategoryTotalRow[];
}
