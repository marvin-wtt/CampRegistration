import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EventCard from '@/components/listedEvents/EventCard.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import type { Event } from '@camp-registration/common/entities';

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

const createEvent = (overrides: Partial<Event> = {}): Event => ({
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
  contactEmail: 'event@example.org',
  maxParticipants: 100,
  startAt: '2026-07-12T00:00:00Z',
  endAt: '2026-07-19T00:00:00Z',
  minAge: 8,
  maxAge: 14,
  price: 180,
  location: 'Bad Segeberg',
  freePlaces: null,
  registrationStatus: 'open',
  logo: null,
  banner: null,
  ...overrides,
});

const mountCard = (event: Event) =>
  mount(EventCard, {
    props: { event },
    global: { stubs: { CountryIcon: true } },
  });

const ownerLine = (event: Event) => mountCard(event).find('.event-card__owner');

describe('EventCard', () => {
  it('names the owning organization when it differs from the organizer', () => {
    const line = ownerLine(createEvent());

    expect(line.exists()).toBe(true);
    expect(line.text()).toBe('via:Pfadfinder Deutschland e.V.');
  });

  it('omits the organization when it repeats the organizer', () => {
    const line = ownerLine(
      createEvent({ organizer: 'Pfadfinder Deutschland e.V.' }),
    );

    expect(line.exists()).toBe(false);
  });

  it('ignores case and whitespace differences', () => {
    const line = ownerLine(
      createEvent({ organizer: '  pfadfinder   deutschland E.V. ' }),
    );

    expect(line.exists()).toBe(false);
  });

  it('compares the organizer translation actually rendered', () => {
    const event = createEvent({
      organizer: {
        de: 'Pfadfinder Deutschland e.V.',
        fr: "Scouts d'Allemagne",
      },
    });

    locale.value = 'de';
    expect(ownerLine(event).exists()).toBe(false);

    locale.value = 'fr';
    expect(ownerLine(event).exists()).toBe(true);

    locale.value = 'en';
  });

  describe('logo', () => {
    // The badge is rendered the same way whether or not there is a banner
    // photo — one visual treatment, not two.
    describe('without a banner', () => {
      it('shows the monogram badge without a logo', () => {
        const card = mountCard(createEvent());

        expect(card.find('.event-card__badge--plain').exists()).toBe(true);
        expect(card.find('.event-card__badge-monogram').text()).toBe('S');
        expect(card.find('.event-card__badge-logo').exists()).toBe(false);
      });

      it('shows the logo badge when set', () => {
        const card = mountCard(
          createEvent({ logo: 'https://api.test/events/1/files/slots/logo' }),
        );

        expect(card.find('.event-card__badge-logo').attributes('src')).toBe(
          'https://api.test/events/1/files/slots/logo',
        );
        expect(card.find('.event-card__badge-monogram').exists()).toBe(false);
      });

      it('falls back to the monogram badge when the logo fails to load', async () => {
        const card = mountCard(
          createEvent({ logo: 'https://api.test/events/1/files/slots/logo' }),
        );

        await card.find('.event-card__badge-logo').trigger('error');

        expect(card.find('.event-card__badge-logo').exists()).toBe(false);
        expect(card.find('.event-card__badge-monogram').exists()).toBe(true);
      });
    });

    describe('with a banner', () => {
      const banner = 'https://api.test/events/1/files/slots/banner';

      it('shows the monogram badge without a logo', () => {
        const card = mountCard(createEvent({ banner }));

        expect(card.find('.event-card__badge-logo').exists()).toBe(false);
        expect(card.find('.event-card__badge-monogram').text()).toBe('S');
      });

      it('shows the logo badge when set', () => {
        const card = mountCard(
          createEvent({
            banner,
            logo: 'https://api.test/events/1/files/slots/logo',
          }),
        );

        expect(card.find('.event-card__badge-logo').attributes('src')).toBe(
          'https://api.test/events/1/files/slots/logo',
        );
        expect(card.find('.event-card__badge-monogram').exists()).toBe(false);
      });

      it('falls back to the monogram badge when the logo fails to load', async () => {
        const card = mountCard(
          createEvent({
            banner,
            logo: 'https://api.test/events/1/files/slots/logo',
          }),
        );

        await card.find('.event-card__badge-logo').trigger('error');

        expect(card.find('.event-card__badge-logo').exists()).toBe(false);
        expect(card.find('.event-card__badge-monogram').exists()).toBe(true);
      });
    });
  });

  describe('banner', () => {
    it('falls back to the tone color without a banner', () => {
      const card = mountCard(createEvent());

      expect(card.find('.event-card__banner').exists()).toBe(true);
      expect(card.find('.event-card__banner-image').exists()).toBe(false);
    });

    it('renders the banner the API published', () => {
      const card = mountCard(
        createEvent({
          banner: 'https://api.test/events/1/files/slots/banner',
        }),
      );

      expect(card.find('.event-card__banner-image').attributes('src')).toBe(
        'https://api.test/events/1/files/slots/banner',
      );
    });

    it('falls back to the tone color when the banner fails to load', async () => {
      const card = mountCard(
        createEvent({
          banner: 'https://api.test/events/1/files/slots/banner',
        }),
      );

      await card.find('.event-card__banner-image').trigger('error');

      expect(card.find('.event-card__banner-image').exists()).toBe(false);
    });
  });
});
