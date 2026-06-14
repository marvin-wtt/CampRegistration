import type { Prisma } from '#generated/prisma/client.js';

/**
 * The `permission_leave` table cell renderer has been removed in favour of the
 * generic `icon_mapping` renderer. Rewrite every stored table-template column
 * that used it, seeding render options that reproduce the previous behaviour
 * (2 = alone, 1 = group, 0 = none).
 *
 * Table templates are stored as a single JSON document in `table_templates.data`,
 * with the renderer for each column held under `columns[].renderAs`.
 */

// The old permission_leave renderer matched both the numeric values (2/1/0)
// and their legacy string aliases (alone/group/none), so reproduce both here —
// otherwise rows storing the string form would fall through to the fallback.
const RENDER_OPTIONS = {
  mappings: [
    { value: '2', icon: 'person', color: 'positive' },
    { value: 'alone', icon: 'person', color: 'positive' },
    { value: '1', icon: 'groups', color: 'warning' },
    { value: 'group', icon: 'groups', color: 'warning' },
    { value: '0', icon: 'close', color: 'negative' },
    { value: 'none', icon: 'close', color: 'negative' },
  ],
  fallback: { icon: 'question_mark', color: 'grey' },
} as const;

interface TemplateColumn {
  renderAs?: string;
  renderOptions?: unknown;
  [key: string]: unknown;
}

interface TemplateData {
  columns?: TemplateColumn[];
  [key: string]: unknown;
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const templates = await tx.tableTemplate.findMany();

  for (const template of templates) {
    const data = template.data as TemplateData | null;
    if (!data || !Array.isArray(data.columns)) {
      continue;
    }

    let changed = false;
    for (const column of data.columns) {
      if (column.renderAs !== 'permission_leave') {
        continue;
      }

      column.renderAs = 'icon_mapping';
      // Preserve any render options that might already exist; otherwise seed the
      // options that mirror the old hard-coded renderer.
      if (column.renderOptions == null) {
        column.renderOptions = structuredClone(RENDER_OPTIONS);
      }
      changed = true;
    }

    if (changed) {
      await tx.tableTemplate.update({
        where: { id: template.id },
        data: { data },
      });
    }
  }
}
