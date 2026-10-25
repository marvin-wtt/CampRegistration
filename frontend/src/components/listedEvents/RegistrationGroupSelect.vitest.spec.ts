import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { EventDetails } from '@camp-registration/common/entities';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import EventCover from '@/components/listedEvents/EventCover.vue';
import RegistrationGroupSelect from '@/components/listedEvents/RegistrationGroupSelect.vue';

installQuasarPlugin();

const eventWith = (data: Partial<EventDetails> = {}) =>
  ({
    id: '01J0000000000000000000000A',
    name: 'Summer Camp',
    countries: ['de', 'fr'],
    freePlaces: { de: 3, fr: 0 },
    maxParticipants: { de: 10, fr: 10 },
    startAt: '2027-01-26T09:00:00',
    endAt: '2027-02-02T17:00:00',
    location: 'Sometown',
    logo: null,
    banner: null,
    ...data,
  }) as unknown as EventDetails;

const identity = (event: EventDetails) =>
  mount(RegistrationGroupSelect, { props: { event } }).find(
    '[data-test="registration-group-identity"]',
  );

describe('RegistrationGroupSelect', () => {
  // Image fallbacks are covered by EventCover's own tests.
  it('shows the event cover, centered under a wider banner', () => {
    const cover = identity(
      eventWith({ banner: '/banner.png', logo: '/logo.png' }),
    ).findComponent(EventCover);

    expect(cover.props()).toMatchObject({
      event: { banner: '/banner.png', logo: '/logo.png' },
      ratio: 3.4,
      badgeAlign: 'center',
    });
  });

  it('names the event', () => {
    expect(identity(eventWith()).find('h1').text()).toBe('Summer Camp');
  });

  it('shows when and where, with both dates in full', () => {
    const text = identity(eventWith()).text();

    expect(text).toMatch(/26\.01\.2027|01\/26\/2027/);
    expect(text).toMatch(/02\.02\.2027|02\/02\/2027/);
    expect(text).toContain('Sometown');
  });
});
