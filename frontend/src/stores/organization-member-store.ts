import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useOrganizationBus } from '@/composables/bus';
import type {
  OrganizationMember,
  OrganizationMemberCreateData,
  OrganizationMemberUpdateData,
} from '@camp-registration/common/entities';

export const useOrganizationMemberStore = defineStore(
  'organizationMember',
  () => {
    const route = useRoute();
    const api = useAPIService();
    const authBus = useAuthBus();
    const organizationBus = useOrganizationBus();
    const {
      data,
      isLoading,
      error,
      reset,
      invalidate,
      lazyFetch,
      withProgressNotification,
      checkNotNullWithError,
      checkNotNullWithNotification,
    } = useServiceHandler<OrganizationMember[]>('organizationMember');

    authBus.on('logout', () => {
      reset();
    });

    organizationBus.on('change', () => {
      invalidate();
    });

    function organizationId(): string {
      return checkNotNullWithError(
        route.params.organizationId as string | undefined,
      );
    }

    async function fetchData() {
      const id = organizationId();

      await lazyFetch(() => api.fetchOrganizationMembers(id));
    }

    async function createData(createData: OrganizationMemberCreateData) {
      const id = organizationId();

      await withProgressNotification('create', async () => {
        const member = await api.createOrganizationMember(id, createData);

        data.value?.push(member);
      });
    }

    async function updateData(
      memberId: string,
      updateData: OrganizationMemberUpdateData,
    ) {
      const id = organizationId();
      checkNotNullWithNotification(memberId);

      await withProgressNotification('update', async () => {
        const member = await api.updateOrganizationMember(
          id,
          memberId,
          updateData,
        );

        data.value = data.value?.map((value) =>
          value.id === member.id ? member : value,
        );
      });
    }

    async function deleteData(memberId: string) {
      const id = organizationId();
      checkNotNullWithNotification(memberId);

      await withProgressNotification('delete', async () => {
        await api.deleteOrganizationMember(id, memberId);

        data.value = data.value?.filter((member) => member.id !== memberId);
      });
    }

    return {
      data,
      isLoading,
      error,
      reset,
      fetchData,
      createData,
      updateData,
      deleteData,
    };
  },
);
