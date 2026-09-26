import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuditTimeline } from '@/composables/audit/auditTimeline';

describe('useAuditTimeline', () => {
  const { dayKey, relativeDay, actorLabel } = useAuditTimeline();

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('dayKey', () => {
    it('returns the calendar day in the given timezone', () => {
      const lateUtc = '2026-06-01T23:30:00.000Z';

      expect(dayKey(lateUtc, 'UTC')).toBe('2026-06-01');
      expect(dayKey(lateUtc, 'Europe/Berlin')).toBe('2026-06-02');
      expect(dayKey(lateUtc, 'America/New_York')).toBe('2026-06-01');
    });
  });

  describe('relativeDay', () => {
    it('resolves today and yesterday relative to now in the timezone', () => {
      vi.useFakeTimers();
      // 00:30 on June 2 in Berlin, still June 1 in UTC.
      vi.setSystemTime(new Date('2026-06-01T22:30:00.000Z'));

      expect(relativeDay('2026-06-01T22:10:00.000Z', 'Europe/Berlin')).toBe(
        'today',
      );
      expect(relativeDay('2026-06-01T12:00:00.000Z', 'Europe/Berlin')).toBe(
        'yesterday',
      );
      expect(relativeDay('2026-06-01T12:00:00.000Z', 'UTC')).toBe('today');
      expect(relativeDay('2026-05-30T12:00:00.000Z', 'UTC')).toBeNull();
    });
  });

  describe('actorLabel', () => {
    it('marks a deleted user whose name is still kept', () => {
      expect(actorLabel({ id: 'a', name: 'Jane' }, 'Deleted')).toBe('Jane');
      expect(
        actorLabel({ id: 'a', name: 'Jane', deleted: true }, 'Deleted'),
      ).toBe('Jane (Deleted)');
      expect(
        actorLabel({ id: 'a', name: null, deleted: true }, 'Deleted'),
      ).toBe('Deleted');
      expect(actorLabel(null, 'Deleted')).toBeNull();
    });
  });
});
