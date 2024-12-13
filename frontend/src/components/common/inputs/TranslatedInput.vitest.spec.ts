import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';

installQuasarPlugin();

describe('SafeDeleteDialog', () => {
  it('should mount', async () => {
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

    await inputs[0].setValue('Test Value 1');
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

    await inputs[0].setValue(42);
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

    await inputs[0].setValue('Test Value de');
    await inputs[1].setValue('Test Value fr');

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
        type: 'number',
        locales: ['de', 'fr'],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);

    await inputs[0].setValue(42);
    await inputs[1].setValue(0);

    expect(wrapper.props().modelValue).toHaveProperty('de', 42);
    expect(wrapper.props().modelValue).toHaveProperty('fr', 0);
  });
});
