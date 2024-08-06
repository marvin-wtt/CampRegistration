import { defineStore } from 'pinia';
import type {
  User,
  UserCreateData,
  UserUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus } from 'src/composables/bus';

export const useUsersStore = defineStore('camps', () => {
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    lazyFetch,
    checkNotNullWithNotification,
  } = useServiceHandler<User[]>('user');

  authBus.on('logout', () => {
    reset();
  });

  async function fetchData() {
    return lazyFetch(async () => await apiService.fetchUsers());
  }

  async function createEntry(
    createData: UserCreateData,
  ): Promise<User | undefined> {
    return withProgressNotification('update', async () => {
      return await apiService.createUser(createData);
    });
  }

  async function updateEntry(
    id: string,
    updateData: UserUpdateData,
  ): Promise<User | undefined> {
    checkNotNullWithNotification(id);
    return withProgressNotification('update', async () => {
      return await apiService.updateUser(id, updateData);
    });
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteUser(id);
    });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
