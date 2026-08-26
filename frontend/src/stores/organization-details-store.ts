import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useOrganizationBus } from '@/composables/bus';
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
    const route = useRoute();
    const router = useRouter();
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
      checkNotNullWithError,
    } = useServiceHandler<OrganizationDetails>('organization');

    authBus.on('logout', () => {
      reset();
    });

    router.beforeEach((to, from) => {
      const id = to.params.organizationId as string | undefined;
      if (id === (from.params.organizationId as string | undefined)) {
        return;
      }

      if (!id) {
        reset();
        organizationBus.emit('change', undefined);
        return;
      }

      invalidate();
    });

    async function fetchData(organizationId?: string) {
      const id = checkNotNullWithError(
        organizationId ?? (route.params.organizationId as string),
      );

      await lazyFetch(async () => {
        const result = await api.fetchOrganization(id);
        organizationBus.emit('change', result);

        return result;
      });
    }

    async function updateData(updateData: OrganizationUpdateData) {
      const id = checkNotNullWithError(
        route.params.organizationId as string | undefined,
      );

      await withProgressNotification('update', async () => {
        const previousStatus = data.value?.verificationStatus;
        const organization = await api.updateOrganization(id, updateData);

        data.value = organization;
        organizationBus.emit('update', organization);

        // Editing the vetted identity demotes the organization, and the status
        // is mirrored in `organizationAccess` — which gates newsletter
        // creation, so a stale copy would offer an action the API refuses.
        if (organization.verificationStatus !== previousStatus) {
          await profileStore.fetchProfile();
        }
      });
    }

    async function deleteData() {
      const id = checkNotNullWithError(
        route.params.organizationId as string | undefined,
      );

      await withProgressNotification('delete', async () => {
        await api.deleteOrganization(id);

        reset();
        organizationBus.emit('delete', id);
        await profileStore.fetchProfile();
      });
    }

    /** Resubmit for moderation after a rejection. */
    async function submitVerification() {
      const id = checkNotNullWithError(
        route.params.organizationId as string | undefined,
      );

      await withProgressNotification('submitVerification', async () => {
        const organization = await api.submitOrganizationVerification(id);

        data.value = organization;
        organizationBus.emit('update', organization);
        // The verification status is mirrored in `organizationAccess`.
        await profileStore.fetchProfile();
      });
    }

    async function reload() {
      const id = checkNotNullWithError(
        route.params.organizationId as string | undefined,
      );

      await forceFetch(() => api.fetchOrganization(id));
    }

    return {
      data,
      isLoading,
      error,
      reset,
      invalidate,
      fetchData,
      reload,
      updateData,
      deleteData,
      submitVerification,
    };
  },
);
