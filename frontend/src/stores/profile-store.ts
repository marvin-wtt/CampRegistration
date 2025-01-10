import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import type {
  Profile,
  ProfileUpdateData,
} from '@camp-registration/common/entities';
import { useRouter } from 'vue-router';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useServiceHandler } from 'src/composables/serviceHandler';

export const useProfileStore = defineStore('profile', () => {
  const apiService = useAPIService();
  const router = useRouter();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    errorOnFailure,
  } = useServiceHandler<Profile>('profile');

  campBus.on('create', async () => {
    await fetchProfile();
  });

  campBus.on('delete', async (campId) => {
    const index = data.value?.camps.findIndex((camp) => camp.id === campId);
    if (index !== undefined && index >= 0) {
      data.value?.camps.splice(index);
    }
  });

  authBus.on('login', async (profile) => {
    data.value = profile;
  });

  authBus.on('logout', reset);

  async function fetchProfile(): Promise<void> {
    await errorOnFailure(async () => {
      return await apiService.fetchProfile();
    });
  }

  async function updateProfile(profile: ProfileUpdateData) {
    return withProgressNotification('update', async () => {
      const updatedProfile = await apiService.updateProfile(profile);

      data.value = updatedProfile;

      return updatedProfile;
    });
  }

  async function deleteProfile() {
    await withProgressNotification('delete', async () => {
      await apiService.deleteProfile();

      reset();
      authBus.emit('logout');

      await router.push('/');
    });
  }

  return {
    user: data,
    error,
    loading: isLoading,
    reset,
    fetchProfile,
    updateProfile,
    deleteProfile,
  };
});
