import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import type {
  Profile,
  ProfileUpdateData,
} from '@camp-registration/common/entities';
import { useRouter } from 'vue-router';
import { useAuthBus, useEventBus } from '@/composables/bus';
import { useResource } from '@/composables/resource';

export const useProfileStore = defineStore('profile', () => {
  const api = useAPIService();
  const router = useRouter();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const profile = useResource<Profile>({
    name: 'profile',
    fetch: () => api.fetchProfile(),
  });

  authBus.on('login', (user) => {
    profile.seed(user);
  });

  eventBus.on('create', () => {
    void fetchProfile();
  });

  // Refreshes the profile in place: it gates every permission check, so it
  // must never be blank while a newer copy is on its way.
  async function fetchProfile(): Promise<void> {
    if (profile.data.value === undefined) {
      await profile.load();
    } else {
      await profile.reload();
    }
  }

  function updateProfile(update: ProfileUpdateData): Promise<Profile> {
    return profile.mutate('update', () => api.updateProfile(update), {
      feedback: 'progress',
      apply: (_, updated) => updated,
    });
  }

  async function deleteProfile(): Promise<void> {
    await profile.mutate('delete', () => api.deleteProfile(), {
      feedback: 'progress',
    });
    profile.reset();
    authBus.emit('logout');
    await router.push('/');
  }

  return {
    user: profile.data,
    error: profile.error,
    isLoading: profile.isLoading,
    reset: profile.reset,
    fetchProfile,
    updateProfile,
    deleteProfile,
  };
});
