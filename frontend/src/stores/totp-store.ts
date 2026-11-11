import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAPIService } from '@/services/APIService';
import { useFormSubmission } from '@/composables/formSubmission';
import type { TotpData } from '@camp-registration/common/entities';
import { useProfileStore } from '@/stores/profile-store';

// The two-factor dialogs show failures inline.
export const useTotpStore = defineStore('totp', () => {
  const api = useAPIService();
  const profileStore = useProfileStore();
  const form = useFormSubmission();
  const data = ref<TotpData>();
  const recoveryCodes = ref<string[]>();

  function setupTotp(password: string): Promise<void> {
    return form.submit(async () => {
      data.value = await api.setupTotp({ password });
    });
  }

  function enableTotp(otp: string): Promise<void> {
    return form.submit(async () => {
      await api.enableTotp({ otp });
      data.value = undefined;
      await profileStore.fetchProfile();
    });
  }

  function disableTotp(password: string, otp: string): Promise<void> {
    return form.submit(async () => {
      await api.disableTotp({ password, otp });
      data.value = undefined;
      recoveryCodes.value = undefined;
      await profileStore.fetchProfile();
    });
  }

  function generateRecoveryCodes(password: string, otp: string): Promise<void> {
    return form.submit(async () => {
      recoveryCodes.value = (
        await api.generateTotpRecoveryCodes({ password, otp })
      ).codes;
    });
  }

  function clearRecoveryCodes(): void {
    recoveryCodes.value = undefined;
  }

  return {
    data,
    error: form.error,
    isLoading: form.isLoading,
    recoveryCodes,
    setupTotp,
    enableTotp,
    disableTotp,
    generateRecoveryCodes,
    clearRecoveryCodes,
  };
});
