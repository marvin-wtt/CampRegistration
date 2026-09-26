import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';

installQuasarPlugin();

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('SafeDeleteDialog', () => {
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
        locales: ['de', 'fr'],
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
        locales: ['de', 'fr'],
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
        locales: ['de', 'fr'],
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
});
