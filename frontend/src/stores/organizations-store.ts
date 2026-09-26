import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useOrganizationBus } from '@/composables/bus';
import { useProfileStore } from '@/stores/profile-store';
import type {
  Organization,
  OrganizationCreateData,
} from '@camp-registration/common/entities';

/** The organizations the signed-in user belongs to. */
export const useOrganizationsStore = defineStore('organizations', () => {
  const api = useAPIService();
  const authBus = useAuthBus();
  const organizationBus = useOrganizationBus();
  const profileStore = useProfileStore();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    lazyFetch,
    forceFetch,
    withProgressNotification,
  } = useServiceHandler<Organization[]>('organization');

  authBus.on('logout', () => {
    reset();
  });

  // The list and the detail view hold separate copies, so a change made through
  // one has to be reflected in the other — otherwise editing an organization
  // leaves the index showing its old status until a full refetch.
  organizationBus.on('update', (organization) => {
    data.value = data.value?.map((value) =>
      value.id === organization.id ? organization : value,
    );
  });

  organizationBus.on('delete', (organizationId) => {
    data.value = data.value?.filter((value) => value.id !== organizationId);
  });

  async function fetchData() {
    await lazyFetch(() => api.fetchOrganizations({ view: 'assigned' }));
  }

  async function reload() {
    await forceFetch(() => api.fetchOrganizations({ view: 'assigned' }));
  }

  async function createData(
    createData: OrganizationCreateData,
  ): Promise<Organization> {
    return withProgressNotification('create', async () => {
      const organization = await api.createOrganization(createData);

      // A user with no organization never had a list to fetch, so the new one
      // has to create it — pushing into `undefined` would drop it and leave
      // every list of organizations empty until the next full fetch.
      data.value = [...(data.value ?? []), organization];
      organizationBus.emit('create', organization);
      // The new membership reaches the client only through the profile, and
      // every permission gate reads it from there.
      await profileStore.fetchProfile();

      return organization;
    });
  }

  return {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    fetchData,
    reload,
    createData,
  };
});
