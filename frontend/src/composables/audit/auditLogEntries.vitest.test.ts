import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type {
  AuditLogEntry,
  AuditEntityType,
} from '@camp-registration/common/entities';
import { useAuditLogEntries } from '@/composables/audit/auditLogEntries';

vi.mock('vue-i18n', async () => {
  const { ref } = await import('vue');
  return {
    useI18n: () => ({ t: (key: string) => key, locale: ref('en-US') }),
  };
});

vi.mock('@/composables/audit/auditLabels', async () => {
  const { ref } = await import('vue');
  return {
    useAuditLabels: () => ({
      entityLabel: (type: string) => type,
      actionLabel: (_: string, action: string) => action,
      fieldLabel: (_: string, path: string) => path,
      valueLabel: (_: string, __: string, value: unknown) => String(value),
      reasonLabel: (_: string, reason: string) => reason,
    }),
    useFormFieldLabels: () => ref(new Map()),
  };
});

vi.mock('@/composables/audit/auditEntities', () => ({
  useAuditEntities: () => {
    const view = { icon: 'x' };
    return {
      event: view,
      registration: {
        icon: 'person',
        open: { label: () => 'open', run: vi.fn() },
      },
      eventManager: view,
      message: view,
      messageTemplate: view,
    };
  },
}));

function entry(
  id: string,
  createdAt: string,
  overrides: Partial<AuditLogEntry> = {},
): AuditLogEntry {
  return {
    id,
    action: 'updated',
    entityType: 'registration' as AuditEntityType,
    entityId: id,
    eventId: 'event',
    actor: { id: 'user', name: 'Jane' },
    subject: null,
    details: null,
    createdAt,
    ...overrides,
  };
}

describe('useAuditLogEntries', () => {
  it('groups newest-first entries by day with card boundaries', () => {
    const entries = ref([
      entry('a', '2026-06-02T10:00:00.000Z'),
      entry('b', '2026-06-02T08:00:00.000Z'),
      entry('c', '2026-06-01T10:00:00.000Z'),
    ]);
    const { items } = useAuditLogEntries(entries, ref('UTC'));

    expect(
      items.value.map((item) =>
        item.kind === 'day'
          ? `day:${item.key}`
          : `${item.key}:${String(item.first)}:${String(item.last)}`,
      ),
    ).toEqual([
      'day:2026-06-02',
      'a:true:false',
      'b:false:true',
      'day:2026-06-01',
      'c:true:true',
    ]);
  });

  it('splits days in the event timezone', () => {
    const entries = ref([
      entry('a', '2026-06-01T23:30:00.000Z'),
      entry('b', '2026-06-01T21:00:00.000Z'),
    ]);

    const utc = useAuditLogEntries(entries, ref('UTC'));
    const berlin = useAuditLogEntries(entries, ref('Europe/Berlin'));

    expect(utc.items.value.filter((i) => i.kind === 'day')).toHaveLength(1);
    expect(berlin.items.value.filter((i) => i.kind === 'day')).toHaveLength(2);
  });

  it('names existing records and offers opening only those', () => {
    const entries = ref([
      entry('live', '2026-06-01T10:00:00.000Z', { entityName: 'Jane Doe' }),
      entry('gone', '2026-06-01T09:00:00.000Z', { entityName: null }),
    ]);
    const { items } = useAuditLogEntries(entries, ref('UTC'));

    const rows = items.value.flatMap((item) =>
      item.kind === 'entry' ? [item.entry] : [],
    );
    expect(rows.map((row) => row.openLabel)).toEqual(['open', null]);
    expect(rows[0]?.subject).toBe('Jane Doe');
  });

  it('shows recorded values as chips and not again as bare fields', () => {
    const entries = ref([
      entry('a', '2026-06-01T10:00:00.000Z', {
        details: {
          changedFields: ['data.allergies', 'status'],
          values: { status: 'ACCEPTED' },
          reason: 'duplicate',
        },
      }),
    ]);
    const { items } = useAuditLogEntries(entries, ref('UTC'));

    const item = items.value[1];
    expect(item?.kind).toBe('entry');
    if (item?.kind !== 'entry') {
      return;
    }
    expect(item.entry.valueDetails).toEqual([
      { label: 'audit.reason', value: 'duplicate' },
      { label: 'status', value: 'ACCEPTED' },
    ]);
    expect(item.entry.fieldLabels).toEqual(['data.allergies']);
  });
});
