import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import type { TotpData } from '@camp-registration/common/entities';
import { useProfileStore } from 'stores/profile-store';
import { ref } from 'vue';

export const useTotpStore = defineStore('totp', () => {
  const apiService = useAPIService();
  const profileStore = useProfileStore();
  const { isLoading, error, errorOnFailure } = useServiceHandler<void>('totp');
  const data = ref<TotpData | undefined>(undefined);

  async function setupTotp(password: string): Promise<void> {
    await errorOnFailure(async () => {
      data.value = await apiService.setupTotp({
        password,
      });
    });
  }

  async function enableTotp(otp: string): Promise<void> {
    await errorOnFailure(async () => {
      await apiService.enableTotp({
        otp,
      });

      data.value = undefined;

      await profileStore.fetchProfile();
    });
  }

  async function disableTotp(password: string, otp: string): Promise<void> {
    await errorOnFailure(async () => {
      await apiService.disableTotp({
        password,
        otp,
      });

      data.value = undefined;

      await profileStore.fetchProfile();
    });
  }

  return {
    data,
    error,
    loading: isLoading,
    setupTotp,
    enableTotp,
    disableTotp,
  };
});
