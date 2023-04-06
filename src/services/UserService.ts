import { api } from 'boot/axios';
import { User } from 'src/types/User';

export function useUserService() {
  async function fetchUsers(): Promise<User[]> {
    const response = await api.get('users/');

    return response.data.data;
  }

  async function fetchUser(id: string): Promise<User> {
    const response = await api.get(`users/${id}/`);

    return response.data.data;
  }

  async function createUser(data: User): Promise<void> {
    await api.post('users/', data);
  }

  async function updateUser(id: string, data: Partial<User>): Promise<void> {
    await api.patch(`users/${id}/`, data);
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
