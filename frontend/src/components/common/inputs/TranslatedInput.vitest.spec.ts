import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { flushPromises } from '@vue/test-utils';

const translateText = vi.fn();
vi.mock('@/services/APIService', () => ({
  useAPIService: () => ({
    fetchTranslationStatus: () => Promise.resolve({ available: true }),
    translateText,
  }),
}));

installQuasarPlugin();

beforeEach(() => {
  setActivePinia(createPinia());
  translateText.mockReset();
});

describe('TranslatedInput', () => {
  it('should mount', () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: '',
      },
    });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should set a single string', async () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(1);

    await inputs[0]!.setValue('Test Value 1');
    expect(wrapper.props().modelValue).toBe('Test Value 1');
  });

  it('should set a single number', async () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        modelModifiers: {
          number: true,
        },
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(1);

    await inputs[0]!.setValue(42);
    expect(wrapper.props().modelValue).toBe(42);
  });

  it('should set multiple strings', async () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        locales: ['de', 'fr'],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    await wrapper.find('[data-test="add-translation-fr"]').trigger('click');
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);

    await inputs[0]!.setValue('Test Value de');
    await inputs[1]!.setValue('Test Value fr');

    expect(wrapper.props().modelValue).toHaveProperty('de', 'Test Value de');
    expect(wrapper.props().modelValue).toHaveProperty('fr', 'Test Value fr');
  });

  it('should set multiple numbers', async () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        modelModifiers: {
          number: true,
        },
        type: 'number' as const,
        countries: ['de', 'fr'],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);

    await inputs[0]!.setValue(42);
    await inputs[1]!.setValue(0);

    expect(wrapper.props().modelValue).toHaveProperty('de', 42);
    expect(wrapper.props().modelValue).toHaveProperty('fr', 0);
  });

  it('should preserve data when translations are disabled', async () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        locales: ['de', 'fr'],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    await wrapper.find('[data-test="add-translation-fr"]').trigger('click');
    const inputs = wrapper.findAll('input');
    await inputs[0]!.setValue('Test Value de');
    await inputs[1]!.setValue('Test Value fr');

    await wrapper.find('button[aria-label="action.disable"]').trigger('click');

    expect(wrapper.props().modelValue).toBe('Test Value de');
  });

  // Mirrors how the event edit/create forms use this component for
  // `maxParticipants`: a per-locale (per-country) number that isn't language
  // text, so `noTranslation` suppresses the auto-translate action while the
  // toggle itself stays available whenever the event has multiple countries.
  it('should show the toggle for a no-translation numeric field with multiple locales', () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        modelModifiers: {
          number: true,
        },
        type: 'number' as const,
        countries: ['de', 'fr'],
        noTranslation: true,
      },
    });

    expect(wrapper.find('button[aria-label="action.disable"]').exists()).toBe(
      true,
    );
  });

  it('should switch a no-translation numeric field between a shared number and per-locale numbers', async () => {
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: undefined,
        modelModifiers: {
          number: true,
        },
        type: 'number' as const,
        countries: ['de', 'fr'],
        noTranslation: true,
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    // Starts per-locale (the model is unset, which defaults translations on).
    let inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);

    await inputs[0]!.setValue(5);
    await inputs[1]!.setValue(3);
    expect(wrapper.props().modelValue).toStrictEqual({ de: 5, fr: 3 });

    // Toggling off collapses to a single shared number, seeded from the first
    // filled locale.
    await wrapper.find('button[aria-label="action.disable"]').trigger('click');
    expect(wrapper.props().modelValue).toBe(5);

    inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(1);
    await inputs[0]!.setValue(10);
    expect(wrapper.props().modelValue).toBe(10);

    // Toggling back on restores per-locale editing.
    await wrapper.find('button[aria-label="action.enable"]').trigger('click');
    inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);
  });

  it('should translate country keys in the language spoken there', async () => {
    translateText.mockResolvedValue({ cs: 'Ahoj' });
    const wrapper = mount(TranslatedInput, {
      props: {
        modelValue: { de: 'Hallo' },
        countries: ['de', 'cz', 'gb'],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });
    await flushPromises();

    // Rendered in key order, so the first action belongs to `cz`.
    await wrapper.find('.translate-action').trigger('click');
    await flushPromises();

    expect(translateText).toHaveBeenCalledWith('Hallo', ['cs'], 'de');
    expect(wrapper.props().modelValue).toStrictEqual({
      de: 'Hallo',
      cz: 'Ahoj',
    });
  });

  describe('adding languages one at a time', () => {
    it('should show the default language and offer the others', () => {
      const wrapper = mount(TranslatedInput, {
        props: {
          modelValue: undefined,
          locales: ['de', 'fr', 'pl'],
        },
      });

      expect(wrapper.findAll('input')).toHaveLength(1);
      expect(wrapper.find('[data-test="add-translation-de"]').exists()).toBe(
        false,
      );
      expect(wrapper.find('[data-test="add-translation-fr"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-test="add-translation-pl"]').exists()).toBe(
        true,
      );
    });

    it('should show every language that already has text', () => {
      const wrapper = mount(TranslatedInput, {
        props: {
          modelValue: { de: 'Hallo', pl: 'Cześć' },
          locales: ['de', 'fr', 'pl'],
        },
      });

      expect(wrapper.findAll('input')).toHaveLength(2);
      expect(wrapper.find('[data-test="add-translation-fr"]').exists()).toBe(
        true,
      );
    });

    it('should translate into a language as it is added', async () => {
      translateText.mockResolvedValue({ fr: 'Bonjour' });
      const wrapper = mount(TranslatedInput, {
        props: {
          modelValue: { de: 'Hallo' },
          locales: ['de', 'fr'],
          'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
        },
      });
      await flushPromises();

      await wrapper.find('[data-test="add-translation-fr"]').trigger('click');
      await flushPromises();

      expect(translateText).toHaveBeenCalledWith('Hallo', ['fr'], 'de');
      expect(wrapper.props().modelValue).toStrictEqual({
        de: 'Hallo',
        fr: 'Bonjour',
      });
    });

    it('should list every group for values per country', () => {
      const wrapper = mount(TranslatedInput, {
        props: {
          modelValue: undefined,
          countries: ['de', 'fr', 'pl'],
        },
      });

      expect(wrapper.findAll('input')).toHaveLength(3);
      expect(wrapper.find('[data-test="add-translation"]').exists()).toBe(
        false,
      );
    });
  });
});
