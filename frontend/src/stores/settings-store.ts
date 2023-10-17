import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const registrationKeys = ref<Record<string, string | undefined>>({
    firstName: 'first_name',
    lastName: 'last_name',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    country: 'country',
  });

  function getKey(name: string): string | undefined {
    if (name in registrationKeys.value) {
      return registrationKeys.value[name];
    }

    return undefined;
  }

  return {
    registrationKeys,
    getKey,
  };
});
