import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import type {
  Registration,
  RegistrationUpdateData,
} from '@camp-registration/common/entities';
import { useServiceHandler } from 'src/composables/serviceHandler';
import {
  useAuthBus,
  useCampBus,
  useRegistrationBus,
} from 'src/composables/bus';

export const useRegistrationsStore = defineStore('registrations', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const bus = useRegistrationBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    lazyFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Registration[]>('registration');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  async function fetchData(campId?: string) {
    const cid: string = campId ?? (route.params.camp as string);
    checkNotNullWithError(cid);

    await lazyFetch(async () => {
      return await apiService.fetchRegistrations(cid);
    });
  }

  async function storeData(campId: string, registration: unknown) {
    checkNotNullWithError(campId);

    await apiService.createRegistration(campId, registration);
  }

  async function storeFile(campId: string, file: File) {
    return apiService.createTemporaryFile({
      file,
    });
  }

  async function updateData(
    registrationId: string | undefined,
    updateData: RegistrationUpdateData,
  ) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(registrationId);
    await withProgressNotification('update', async () => {
      const updatedRegistration = await apiService.updateRegistration(
        cid,
        rid,
        updateData,
      );

      // Replace the registration with a new one
      data.value = data.value?.map((registration) =>
        registration.id === registrationId ? updatedRegistration : registration,
      );

      bus.emit('update', updatedRegistration);
    });
  }

  async function deleteData(registrationId?: string) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(registrationId);
    await withProgressNotification('delete', async () => {
      await apiService.deleteRegistration(cid, rid);

      // Replace the registration with a new one
      data.value = data.value?.filter(
        (registration) => registration.id !== registrationId,
      );

      bus.emit('delete', rid);
    });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    storeData,
    storeFile,
    updateData,
    deleteData,
  };
});
