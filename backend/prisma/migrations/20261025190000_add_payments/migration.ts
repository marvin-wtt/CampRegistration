import type { Prisma } from '#generated/prisma/client.js';

/**
 * The camp preset tracked fees in a free-text custom field. Saved tables get
 * the payment column in its place; where a registration has a value in the
 * old field, a read-only "(old)" column keeps it in view.
 */
const OLD_FIELD = 'customData.participation_fee_paid';

// Frozen copy: later label changes must not change what this migration does.
const OLD_SUFFIX: Record<string, string> = {
  en: '(old)',
  de: '(alt)',
  fr: '(ancien)',
  pl: '(stare)',
  cs: '(staré)',
};

type Column = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function withOldSuffix(label: unknown): unknown {
  if (typeof label === 'string') {
    return `${label} ${OLD_SUFFIX.en}`;
  }
  if (!isRecord(label)) {
    return label;
  }

  return Object.fromEntries(
    Object.entries(label).map(([locale, text]) => [
      locale,
      typeof text === 'string'
        ? `${text} ${OLD_SUFFIX[locale] ?? OLD_SUFFIX.en}`
        : text,
    ]),
  );
}

function hasOldValue(customData: unknown): boolean {
  if (!isRecord(customData)) {
    return false;
  }
  const value = customData.participation_fee_paid;

  return value !== undefined && value !== null && value !== '';
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const templates = await tx.tableTemplate.findMany();
  const oldValuesByEvent = new Map<string, boolean>();

  for (const template of templates) {
    const data = template.data;
    if (!isRecord(data) || !Array.isArray(data.columns)) {
      continue;
    }
    const columns = data.columns as Column[];
    const index = columns.findIndex(
      (column) => isRecord(column) && column.field === OLD_FIELD,
    );
    if (index === -1) {
      continue;
    }

    let keepOld = oldValuesByEvent.get(template.eventId);
    if (keepOld === undefined) {
      const registrations = await tx.registration.findMany({
        where: { eventId: template.eventId },
        select: { customData: true },
      });
      keepOld = registrations.some(({ customData }) => hasOldValue(customData));
      oldValuesByEvent.set(template.eventId, keepOld);
    }

    const old = columns[index]!;
    const replacement: Column[] = [];
    if (
      !columns.some((column) => isRecord(column) && column.name === 'payment')
    ) {
      replacement.push({
        name: 'payment',
        field: 'payment',
        source: 'meta',
        label: old.label,
        align: 'left',
        renderAs: 'payment',
        sortable: false,
      });
    }
    if (keepOld) {
      replacement.push({
        ...old,
        label: withOldSuffix(old.label),
        renderAs: 'default',
      });
    }

    await tx.tableTemplate.update({
      where: { id: template.id },
      data: {
        data: {
          ...data,
          columns: [
            ...columns.slice(0, index),
            ...replacement,
            ...columns.slice(index + 1),
          ],
        } as Prisma.InputJsonObject,
      },
    });
  }
}
