import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { ref } from 'vue';
import { User } from 'src/types/User';

export const useAuthStore = defineStore('auth', () => {
  const api = useAPIService();

  const data = ref<User[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function login(email: string, password: string) {
    isLoading.value = true;

    try {
      await api.login(email, password);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'error';
    }

    isLoading.value = false;
  }

  async function register(email: string, password: string) {
    await api.register(email, password);
  }

  async function forgotPassword(email: string) {
    await api.forgotPassword(email);
  }

  async function resetPassword(email: string, password: string) {
    await api.resetPassword(email, password);
  }

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
  };
});
