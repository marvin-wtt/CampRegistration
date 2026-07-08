import { api } from '@/services/api';
import type {
  User,
  UserCreateData,
  UserUpdateData,
  UserQuery,
  CursorPaginated,
} from '@camp-registration/common/entities';

export function useUserService() {
  async function fetchUsers(): Promise<User[]> {
    const response = await api.get('users/');

    return response?.data?.data;
  }

  async function fetchUsersPaginated(
    query?: UserQuery,
  ): Promise<CursorPaginated<User>> {
    const response = await api.get('users/', { params: query });

    return {
      data: response?.data?.data,
      meta: response?.data?.meta,
    };
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
    fetchUsersPaginated,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  };
}
