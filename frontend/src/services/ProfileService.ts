import type {
  Profile,
  ProfileUpdateData,
} from '@camp-registration/common/entities';
import { useApi } from 'src/composables/api';

export function useProfileService() {
  const api = useApi();

  async function fetchProfile(): Promise<Profile> {
    const response = await api.get('profile');

    return response?.data?.data;
  }

  async function updateProfile(data: ProfileUpdateData): Promise<Profile> {
    const response = await api.patch('profile', data);

    return response?.data?.data;
  }

  async function deleteProfile(): Promise<void> {
    await api.delete('profile');
  }

  return {
    fetchProfile,
    updateProfile,
    deleteProfile,
  };
}
