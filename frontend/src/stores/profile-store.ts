import { defineStore } from 'pinia';
import { computed, readonly, ref } from 'vue';
import { useAPIService } from '@/services/APIService';
import type {
  AdminAccessGrant,
  AdminAccessGrantCreateData,
  Profile,
  ProfileUpdateData,
} from '@camp-registration/common/entities';
import type { PermissionScope } from '@camp-registration/common/permissions';
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

  // Mirrors the backend: the role grants nothing without two-factor auth.
  const administrator = computed<boolean>(
    () =>
      profile.data.value?.role === 'ADMIN' &&
      profile.data.value.twoFactorEnabled,
  );

  const administratorNeedsTwoFactor = computed<boolean>(
    () =>
      profile.data.value?.role === 'ADMIN' &&
      !profile.data.value.twoFactorEnabled,
  );

  // Grants run out without a server round trip; re-check twice a minute.
  const now = ref(Date.now());
  setInterval(() => (now.value = Date.now()), 30_000);

  const adminAccess = computed<AdminAccessGrant[]>(() =>
    administrator.value
      ? (profile.data.value?.adminAccess ?? []).filter(
          (grant) =>
            grant.endedAt === null &&
            new Date(grant.expiresAt).getTime() > now.value,
        )
      : [],
  );

  function activeAdminAccess(
    scope: PermissionScope,
    scopeId: string | undefined,
  ): AdminAccessGrant | undefined {
    return adminAccess.value.find(
      (grant) => grant.scope === scope && grant.scopeId === scopeId,
    );
  }

  async function requestAdminAccess(
    data: AdminAccessGrantCreateData,
  ): Promise<void> {
    await api.requestAdminAccess(data);
    await fetchProfile();
  }

  async function endAdminAccess(grantId: string): Promise<void> {
    await api.endAdminAccess(grantId);
    await fetchProfile();
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
    administrator,
    administratorNeedsTwoFactor,
    adminAccess,
    activeAdminAccess,
    now: readonly(now),
    requestAdminAccess,
    endAdminAccess,
    error: profile.error,
    isLoading: profile.isLoading,
    reset: profile.reset,
    fetchProfile,
    updateProfile,
    deleteProfile,
  };
});
