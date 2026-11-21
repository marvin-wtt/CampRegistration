import type { Prisma } from '#generated/prisma/client.js';

/**
 * Newsletter consent is a consent purpose now (docs/privacy.md, 5): a boolean
 * tagged `eventDataType: 'newsletter_consent'` becomes `privacyConsent` with
 * the purpose `newsletter`, so its wording is kept as proof. Found anywhere in
 * the form, dynamic panels included. Other question types never filled the
 * column reliably and keep their tag, which no longer does anything.
 */
function rewrite(value: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item) => {
      const result = rewrite(item);
      changed ||= result.changed;
      return result.value;
    });

    return { value: items, changed };
  }
  if (!value || typeof value !== 'object') {
    return { value, changed: false };
  }

  let changed = false;
  const entries = Object.entries(value).map(([key, item]) => {
    const result = rewrite(item);
    changed ||= result.changed;
    return [key, result.value] as const;
  });
  const element: Record<string, unknown> = Object.fromEntries(entries);

  if (
    element.type === 'boolean' &&
    element.eventDataType === 'newsletter_consent'
  ) {
    const { eventDataType: _, ...rest } = element;
    const purposes: unknown[] = Array.isArray(rest.privacyConsentPurpose)
      ? rest.privacyConsentPurpose
      : [];

    return {
      value: {
        ...rest,
        privacyConsent: true,
        privacyConsentPurpose: purposes.includes('newsletter')
          ? purposes
          : [...purposes, 'newsletter'],
      },
      changed: true,
    };
  }

  return { value: element, changed };
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const events = await tx.event.findMany({ select: { id: true, form: true } });

  for (const event of events) {
    const { value, changed } = rewrite(event.form);
    if (!changed) {
      continue;
    }

    await tx.event.update({
      where: { id: event.id },
      data: { form: value as typeof event.form },
    });
  }
}
