import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import TimeInput from '@/components/common/inputs/TimeInput.vue';

installQuasarPlugin();

describe('TimeInput', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'Europe/Berlin');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  function mountComponent(utcDate?: string) {
    const wrapper = mount(TimeInput, {
      props: {
        ...(utcDate !== undefined && { modelValue: utcDate }),
        'onUpdate:modelValue': (e?: string) =>
          wrapper.setProps({ modelValue: e }),
      },
    });

    return wrapper;
  }

  it('shows local time', () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z');

    expect(wrapper.find('input').element.value).toBe('16:30');
  });

  it('passes QInput props on to the input', () => {
    const wrapper = mount(TimeInput, {
      props: {
        modelValue: '2025-12-24T15:30:00.000Z',
        label: 'Start time',
        disable: true,
      },
    });

    expect(wrapper.text()).toContain('Start time');
    expect(wrapper.find('.q-field--disabled').exists()).toBe(true);
    // Not overridden by the undeclared defaults of the wrapped input
    expect(wrapper.find('.q-field--outlined').exists()).toBe(true);
  });

  it('passes undeclared attributes on to the input', () => {
    const wrapper = mount(TimeInput, {
      props: { modelValue: '2025-12-24T15:30:00.000Z' },
      attrs: { 'data-test': 'start-time', class: 'col' },
    });

    // QInput puts non-field attributes on the native input, classes on its root
    expect(wrapper.find('input').attributes('data-test')).toBe('start-time');
    expect(wrapper.classes()).toContain('col');
  });

  it('keeps the date when the time changes', async () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z');

    await wrapper.find('input').setValue('08:00');

    expect(wrapper.props('modelValue')).toBe('2025-12-24T07:00:00.000Z');
  });

  it('keeps the date across midnight', async () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z');

    await wrapper.find('input').setValue('00:00');

    // 00:00 local on Dec 24 is 23:00Z on Dec 23 in Berlin
    expect(wrapper.props('modelValue')).toBe('2025-12-23T23:00:00.000Z');
  });

  it('ignores incomplete input instead of dropping the value', async () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z');
    const input = wrapper.find('input');

    await input.setValue('0');
    await input.setValue('08:');

    expect(wrapper.props('modelValue')).toBe('2025-12-24T15:30:00.000Z');
  });

  it('restores the model value on blur', async () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z');
    const input = wrapper.find('input');

    await input.trigger('focusin');
    await input.setValue('0');
    await input.trigger('focusout');
    // QField defers its blur emit by a macrotask
    await new Promise((resolve) => setTimeout(resolve));
    await flushPromises();

    expect(input.element.value).toBe('16:30');
  });

  it('clears the value for empty input', async () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z');

    await wrapper.find('input').setValue('');

    expect(wrapper.props('modelValue')).toBeUndefined();
  });

  it('accepts a time before a date is set', async () => {
    vi.setSystemTime(new Date(2025, 11, 24, 9, 0));
    const wrapper = mountComponent();

    await wrapper.find('input').setValue('16:30');

    expect(wrapper.props('modelValue')).toBe('2025-12-24T15:30:00.000Z');
    vi.useRealTimers();
  });
});
