import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection } from '@/composables/resource';
import { useOrganizationBus } from '@/composables/bus';
import { useProfileStore } from '@/stores/profile-store';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import type {
  Organization,
  OrganizationCreateData,
} from '@camp-registration/common/entities';

/** The organizations the signed-in user belongs to. */
export const useOrganizationsStore = defineStore('organizations', () => {
  const api = useAPIService();
  const organizationBus = useOrganizationBus();
  const profileStore = useProfileStore();
  const organizations = useCollection<Organization>({
    name: 'organization',
    fetch: () => api.fetchOrganizations({ view: 'assigned' }),
  });

  // The list and the detail view hold separate copies, so a change made through
  // one has to be reflected in the other — otherwise editing an organization
  // leaves the index showing its old status until a full refetch.
  organizationBus.on('update', (organization) => {
    organizations.update((list) => replaceById(list, organization));
  });

  organizationBus.on('delete', (organizationId) => {
    organizations.update((list) => removeById(list, organizationId));
  });

  function fetchData() {
    return organizations.load();
  }

  async function createData(
    createData: OrganizationCreateData,
  ): Promise<Organization> {
    // Without a loaded list there is nothing to add to; the next load
    // brings the new organization along.
    const organization = await organizations.mutate(
      'create',
      () => api.createOrganization(createData),
      { feedback: 'progress', apply: upsertById },
    );
    organizationBus.emit('create', organization);
    // The new membership reaches the client only through the profile, and
    // every permission gate reads it from there.
    await profileStore.fetchProfile();
    return organization;
  }

  return {
    data: organizations.data,
    isLoading: organizations.isLoading,
    error: organizations.error,
    reset: organizations.reset,
    invalidate: organizations.invalidate,
    reload: organizations.reload,
    fetchData,
    createData,
  };
});
