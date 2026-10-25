import { describe, expect, it, vi } from 'vitest';
import type { Registration } from '@camp-registration/common/entities';
import { useEventStatistics } from '@/composables/eventStatistics';

const person = (group: string, addressCountry: string) =>
  ({
    group,
    role: 'participant',
    status: 'ACCEPTED',
    computedData: { role: 'participant', address: { country: addressCountry } },
  }) as unknown as Registration;

// A member of the French group living in Germany.
const registrations = [person('de', 'de'), person('fr', 'de')];

vi.mock('@/stores/event-details-store', () => ({
  useEventDetailsStore: () => ({
    data: { countries: ['de', 'fr'], maxParticipants: { de: 5, fr: 5 } },
  }),
}));
vi.mock('@/stores/registration-store', () => ({
  useRegistrationsStore: () => ({ data: registrations }),
}));

describe('useEventStatistics group dimension', () => {
  it('counts people by their group, not by where they live', () => {
    const { crossTab } = useEventStatistics();

    expect(crossTab(registrations, 'group')).toMatchObject({
      categories: ['de', 'fr'],
      series: [{ data: [1, 1] }],
      hasUnknown: false,
    });
  });
});
