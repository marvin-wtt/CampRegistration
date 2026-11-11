import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useResource, useRouteKey } from '@/composables/resource';
import { useOrganizationBus } from '@/composables/bus';
import { useProfileStore } from '@/stores/profile-store';
import type {
  OrganizationDetails,
  OrganizationUpdateData,
} from '@camp-registration/common/entities';

/**
 * The organization named by the current route. Mirrors `event-details-store`:
 * navigation drives the fetch, so pages can read it without wiring their own.
 */
export const useOrganizationDetailsStore = defineStore(
  'organizationDetails',
  () => {
    const router = useRouter();
    const api = useAPIService();
    const organizationBus = useOrganizationBus();
    const profileStore = useProfileStore();
    const details = useResource<OrganizationDetails>({
      name: 'organization',
      key: useRouteKey('organizationId'),
      fetch: async (organizationId) => {
        const organization = await api.fetchOrganization(organizationId);
        organizationBus.emit('change', organization);
        return organization;
      },
    });

    router.beforeEach((to, from) => {
      const id = to.params.organizationId as string | undefined;
      if (id !== undefined || from.params.organizationId === undefined) {
        return;
      }
      details.reset();
      organizationBus.emit('change', undefined);
    });

    function fetchData(organizationId?: string) {
      return details.load(organizationId);
    }

    async function updateData(update: OrganizationUpdateData): Promise<void> {
      const previousStatus = details.data.value?.verificationStatus;
      const organization = await details.mutate(
        'update',
        (id) => api.updateOrganization(id, update),
        { feedback: 'progress', apply: (_, updated) => updated },
      );
      organizationBus.emit('update', organization);

      // Editing the vetted identity demotes the organization, and the status
      // is mirrored in `organizationAccess` — which gates newsletter
      // creation, so a stale copy would offer an action the API refuses.
      if (organization.verificationStatus !== previousStatus) {
        await profileStore.fetchProfile();
      }
    }

    async function deleteData(): Promise<void> {
      const id = await details.mutate(
        'delete',
        async (id) => {
          await api.deleteOrganization(id);
          return id;
        },
        { feedback: 'progress' },
      );
      details.reset();
      organizationBus.emit('delete', id);
      await profileStore.fetchProfile();
    }

    /** Resubmit for moderation after a rejection. */
    async function submitVerification(): Promise<void> {
      const organization = await details.mutate(
        'submitVerification',
        (id) => api.submitOrganizationVerification(id),
        { feedback: 'progress', apply: (_, updated) => updated },
      );
      organizationBus.emit('update', organization);
      // The verification status is mirrored in `organizationAccess`.
      await profileStore.fetchProfile();
    }

    return {
      data: details.data,
      isLoading: details.isLoading,
      error: details.error,
      reset: details.reset,
      invalidate: details.invalidate,
      reload: details.reload,
      fetchData,
      updateData,
      deleteData,
      submitVerification,
    };
  },
);
