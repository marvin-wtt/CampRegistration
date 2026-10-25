import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EventCover from '@/components/listedEvents/EventCover.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale: ref('en'), fallbackLocale: ref('en') }),
}));

installQuasarPlugin();

const logo = 'https://api.test/events/1/files/slots/logo';
const banner = 'https://api.test/events/1/files/slots/banner';

const mountCover = (
  overrides: { logo?: string | null; banner?: string | null } = {},
  props: { badgeAlign?: 'start' | 'center' } = {},
) =>
  mount(EventCover, {
    props: {
      event: {
        id: '01J0000000000000000000000A',
        name: 'Sommerlager',
        logo: null,
        banner: null,
        ...overrides,
      },
      ...props,
    },
  });

describe('EventCover', () => {
  describe('logo', () => {
    // The badge is rendered the same way whether or not there is a banner
    // photo — one visual treatment, not two.
    describe.each([
      ['without a banner', null],
      ['with a banner', banner],
    ])('%s', (_, bannerUrl) => {
      it('shows the monogram badge without a logo', () => {
        const cover = mountCover({ banner: bannerUrl });

        expect(cover.find('.event-cover__badge--plain').exists()).toBe(true);
        expect(cover.find('.event-cover__monogram').text()).toBe('S');
        expect(cover.find('.event-cover__logo').exists()).toBe(false);
      });

      it('shows the logo badge when set', () => {
        const cover = mountCover({ banner: bannerUrl, logo });

        expect(cover.find('.event-cover__logo').attributes('src')).toBe(logo);
        expect(cover.find('.event-cover__monogram').exists()).toBe(false);
      });

      it('falls back to the monogram badge when the logo fails to load', async () => {
        const cover = mountCover({ banner: bannerUrl, logo });

        await cover.find('.event-cover__logo').trigger('error');

        expect(cover.find('.event-cover__logo').exists()).toBe(false);
        expect(cover.find('.event-cover__monogram').exists()).toBe(true);
      });
    });
  });

  describe('banner', () => {
    it('shows the placeholder shapes without a banner', () => {
      const cover = mountCover();

      expect(cover.find('.event-cover__image').exists()).toBe(false);
      expect(cover.findAll('.event-cover__shape')).toHaveLength(2);
    });

    it('renders the banner the API published', () => {
      const cover = mountCover({ banner });

      expect(cover.find('.event-cover__image').attributes('src')).toBe(banner);
      expect(cover.find('.event-cover__shape').exists()).toBe(false);
    });

    it('falls back to the placeholder when the banner fails to load', async () => {
      const cover = mountCover({ banner });

      await cover.find('.event-cover__image').trigger('error');

      expect(cover.find('.event-cover__image').exists()).toBe(false);
      expect(cover.find('.event-cover__shape').exists()).toBe(true);
    });

    it('shows a new banner after the previous one failed', async () => {
      const cover = mountCover({ banner });
      await cover.find('.event-cover__image').trigger('error');

      await cover.setProps({
        event: { ...cover.props('event'), banner: `${banner}?v=2` },
      });

      expect(cover.find('.event-cover__image').exists()).toBe(true);
    });
  });

  it('applies the requested badge alignment', () => {
    const cover = mountCover({}, { badgeAlign: 'center' });

    expect(cover.classes()).toContain('event-cover--badge-center');
  });
});
