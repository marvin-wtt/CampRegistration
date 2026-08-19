import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CampCard from '@/components/camps/CampCard.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import type { Camp } from '@camp-registration/common/entities';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const locale = ref<string>('en');
const fallbackLocale = ref<string>('en');

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale,
    fallbackLocale,
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
  }),
}));

installQuasarPlugin();

const createCamp = (overrides: Partial<Camp> = {}): Camp => ({
  id: '01J0000000000000000000000A',
  organizationId: '01J0000000000000000000000B',
  organizationName: 'Pfadfinder Deutschland e.V.',
  organizationVerificationStatus: 'VERIFIED',
  name: 'Sommerlager',
  confirmationMode: 'AUTOMATIC',
  listed: true,
  registrationOpensAt: null,
  registrationClosesAt: null,
  countries: ['de'],
  locales: ['de'],
  organizer: 'DPSG Stamm St. Georg',
  contactEmail: 'camp@example.org',
  maxParticipants: 100,
  startAt: '2026-07-12T00:00:00Z',
  endAt: '2026-07-19T00:00:00Z',
  minAge: 8,
  maxAge: 14,
  price: 180,
  location: 'Bad Segeberg',
  freePlaces: null,
  registrationStatus: 'open',
  ...overrides,
});

const ownerLine = (camp: Camp) =>
  mount(CampCard, {
    props: { camp },
    global: { stubs: { CountryIcon: true } },
  }).find('.camp-card__owner');

describe('CampCard', () => {
  it('names the owning organization when it differs from the organizer', () => {
    const line = ownerLine(createCamp());

    expect(line.exists()).toBe(true);
    expect(line.text()).toBe('via:Pfadfinder Deutschland e.V.');
  });

  it('omits the organization when it repeats the organizer', () => {
    const line = ownerLine(
      createCamp({ organizer: 'Pfadfinder Deutschland e.V.' }),
    );

    expect(line.exists()).toBe(false);
  });

  it('ignores case and whitespace differences', () => {
    const line = ownerLine(
      createCamp({ organizer: '  pfadfinder   deutschland E.V. ' }),
    );

    expect(line.exists()).toBe(false);
  });

  it('compares the organizer translation actually rendered', () => {
    const camp = createCamp({
      organizer: {
        de: 'Pfadfinder Deutschland e.V.',
        fr: "Scouts d'Allemagne",
      },
    });

    locale.value = 'de';
    expect(ownerLine(camp).exists()).toBe(false);

    locale.value = 'fr';
    expect(ownerLine(camp).exists()).toBe(true);

    locale.value = 'en';
  });
});
