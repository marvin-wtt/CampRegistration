import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';

installQuasarPlugin();

describe('DateTimeInput', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'Europe/Berlin');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  function mountComponent(utcDate: string) {
    const wrapper = mount(DateTimeInput, {
      props: {
        modelValue: utcDate,
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    return wrapper;
  }

  it('should mount', () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z'); // 15:30Z -> 16:30 local in Berlin (Dec)

    expect(wrapper.exists()).toBeTruthy();
  });

  it('shows local time', () => {
    const wrapper = mountComponent('2025-12-24T15:30:00.000Z'); // 15:30Z -> 16:30 local in Berlin (Dec)

    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.element.value).toBe('2025-12-24 16:30');
  });

  it('updates model value', async () => {
    const wrapper = mountComponent('2025-12-24T00:00:00.000Z');

    const input = wrapper.find('input');
    await input.setValue('2025-12-24 16:30');

    expect(wrapper.props('modelValue')).toBe('2025-12-24T15:30:00.000Z');
  });
});
