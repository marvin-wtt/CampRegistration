// This file will be run before each test file
import { afterEach, vi } from 'vitest';
import { enableAutoUnmount } from '@vue/test-utils';
import { ref } from 'vue';

enableAutoUnmount(afterEach);

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    d: (key: string) => key,
    locale: ref('en'),
  }),
})); // This file will be run before each test file
