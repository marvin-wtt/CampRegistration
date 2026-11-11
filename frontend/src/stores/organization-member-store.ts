import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import type {
  OrganizationMember,
  OrganizationMemberCreateData,
  OrganizationMemberUpdateData,
} from '@camp-registration/common/entities';

export const useOrganizationMemberStore = defineStore(
  'organizationMember',
  () => {
    const api = useAPIService();
    const members = useCollection<OrganizationMember>({
      name: 'organizationMember',
      key: useRouteKey('organizationId'),
      fetch: (organizationId) => api.fetchOrganizationMembers(organizationId),
    });

    function fetchData() {
      return members.load();
    }

    async function createData(
      createData: OrganizationMemberCreateData,
    ): Promise<void> {
      await members.mutate(
        'create',
        (organizationId) =>
          api.createOrganizationMember(organizationId, createData),
        { feedback: 'progress', apply: upsertById },
      );
    }

    async function updateData(
      memberId: string,
      updateData: OrganizationMemberUpdateData,
    ): Promise<void> {
      await members.mutate(
        'update',
        (organizationId) =>
          api.updateOrganizationMember(organizationId, memberId, updateData),
        { feedback: 'progress', apply: replaceById },
      );
    }

    async function deleteData(memberId: string): Promise<void> {
      await members.mutate(
        'delete',
        (organizationId) =>
          api.deleteOrganizationMember(organizationId, memberId),
        { feedback: 'progress', apply: (list) => removeById(list, memberId) },
      );
    }

    return {
      data: members.data,
      isLoading: members.isLoading,
      error: members.error,
      reset: members.reset,
      fetchData,
      createData,
      updateData,
      deleteData,
    };
  },
);
