import { defineStore } from 'pinia';
import type {
  User,
  UserCreateData,
  UserUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus } from 'src/composables/bus';

export const useUsersStore = defineStore('users', () => {
  // FIXME Store does not update!

  const apiService = useAPIService();
  const authBus = useAuthBus();
  const {
    data,
    isLoading,
    error,
    reset,
    withProgressNotification,
    lazyFetch,
    forceFetch,
    checkNotNullWithNotification,
  } = useServiceHandler<User[]>('user');

  authBus.on('logout', () => {
    reset();
  });

  async function fetchData() {
    return lazyFetch(() => apiService.fetchUsers());
  }

  async function createEntry(
    createData: UserCreateData,
  ): Promise<User | undefined> {
    const user = withProgressNotification('update', async () => {
      return await apiService.createUser(createData);
    });

    // Update store
    await forceFetch(() => apiService.fetchUsers());

    return user;
  }

  async function updateEntry(
    id: string,
    updateData: UserUpdateData,
  ): Promise<User | undefined> {
    checkNotNullWithNotification(id);
    const user = withProgressNotification('update', async () => {
      return await apiService.updateUser(id, updateData);
    });

    // Update store
    await forceFetch(() => apiService.fetchUsers());

    return user;
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteUser(id);
    });

    // Update store
    await forceFetch(() => apiService.fetchUsers());
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
