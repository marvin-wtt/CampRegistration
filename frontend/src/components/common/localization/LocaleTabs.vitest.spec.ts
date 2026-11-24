import { describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import LocaleTabs from '@/components/common/localization/LocaleTabs.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';

installQuasarPlugin();

function tabs(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('[data-test^="locale-tab-"]')
    .map((tab) => tab.attributes('data-test')!.replace('locale-tab-', ''));
}

async function addLanguage(wrapper: VueWrapper, locale: string) {
  await wrapper.find('[data-test="add-translation-button"]').trigger('click');
  await flushPromises();
  document
    .querySelector<HTMLElement>(`[data-test="add-translation-${locale}"]`)!
    .click();
  await flushPromises();
}

function mountTabs(props: Record<string, unknown>) {
  const wrapper = mount(LocaleTabs, {
    props: {
      modelValue: 'en',
      'onUpdate:modelValue': (value: string) =>
        wrapper.setProps({ modelValue: value }),
      ...props,
    },
  });
  return wrapper;
}

describe('LocaleTabs', () => {
  it('should show every locale by default', () => {
    const wrapper = mountTabs({ locales: ['en', 'de', 'fr'] });

    expect(tabs(wrapper)).toEqual(['en', 'de', 'fr']);
    expect(wrapper.find('[data-test="add-translation-button"]').exists()).toBe(
      false,
    );
  });

  describe('adding languages one at a time', () => {
    it('should show the default and the filled locales', () => {
      const wrapper = mountTabs({
        locales: ['en', 'de', 'fr'],
        filled: ['fr'],
        addLanguages: true,
      });

      expect(tabs(wrapper)).toEqual(['en', 'fr']);
    });

    it('should select a language as it is added', async () => {
      const wrapper = mountTabs({
        locales: ['en', 'de', 'fr'],
        addLanguages: true,
      });

      await addLanguage(wrapper, 'fr');

      expect(tabs(wrapper)).toEqual(['en', 'fr']);
      expect(wrapper.props('modelValue')).toBe('fr');
      wrapper.unmount();
    });

    it('should remove an empty language and select the default', async () => {
      const wrapper = mountTabs({
        locales: ['en', 'de', 'fr'],
        addLanguages: true,
      });
      await addLanguage(wrapper, 'de');

      await wrapper
        .find('[data-test="remove-translation-de"]')
        .trigger('click');

      expect(tabs(wrapper)).toEqual(['en']);
      expect(wrapper.emitted('remove')).toEqual([['de']]);
      expect(wrapper.props('modelValue')).toBe('en');
      wrapper.unmount();
    });

    it('should not remove the default language', () => {
      const wrapper = mountTabs({
        locales: ['en', 'de'],
        filled: ['de'],
        addLanguages: true,
      });

      expect(wrapper.find('[data-test="remove-translation-en"]').exists()).toBe(
        false,
      );
      expect(wrapper.find('[data-test="remove-translation-de"]').exists()).toBe(
        true,
      );
    });

    it('should select a shown tab when the selected one is hidden', () => {
      const wrapper = mount(LocaleTabs, {
        props: {
          modelValue: 'fr',
          locales: ['en', 'de', 'fr'],
          addLanguages: true,
        },
      });

      expect(wrapper.emitted('update:modelValue')).toEqual([['en']]);
    });
  });
});
