import type {
  User,
  UserCreateData,
  UserUpdateData,
} from '@camp-registration/common/entities';
import { useApi } from 'src/composables/api';

export function useUserService() {
  const api = useApi();

  async function fetchUsers(): Promise<User[]> {
    const response = await api.get('users/');

    return response?.data?.data;
  }

  async function fetchUser(id?: string): Promise<User> {
    const response = await api.get(`users/${id}/`);

    return response?.data?.data;
  }

  async function createUser(data: UserCreateData): Promise<User> {
    const response = await api.post('users/', data);

    return response?.data?.data;
  }

  async function updateUser(id: string, data: UserUpdateData): Promise<User> {
    const response = await api.patch(`users/${id}/`, data);

    return response?.data?.data;
  }

  async function deleteUser(id: string): Promise<void> {
    await api.delete(`users/${id}/`);
  }

  return {
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  };
}
