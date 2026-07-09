import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import type {
  Registration,
  RegistrationCreateData,
  RegistrationDeleteQuery,
  RegistrationUpdateData,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useCampBus, useRegistrationBus } from '@/composables/bus';

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
    backgroundFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Registration[]>('registration');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients: refetch the affected
  // registration through the REST API (where full permissions apply) and
  // reconcile it into the local list.
  useRealtimeCollection<Registration>('registration', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (campId, id) => apiService.fetchRegistration(campId, id),
    onCreate: (registration) => bus.emit('create', registration),
    onUpdate: (registration) => bus.emit('update', registration),
    onDelete: (id) => bus.emit('delete', id),
  });

  async function fetchData(campId?: string, opts?: { background?: boolean }) {
    const cid: string = campId ?? (route.params.campId as string);
    checkNotNullWithError(cid);

    const fetcher = () => apiService.fetchRegistrations(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function storeData(
    campId: string,
    registration: RegistrationCreateData,
  ) {
    checkNotNullWithError(campId);

    await apiService.createRegistration(campId, registration);
  }

  async function updateData(
    registrationId: string | undefined,
    updateData: RegistrationUpdateData,
    params?: RegistrationUpdateQuery,
  ) {
    const campId = route.params.campId as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(registrationId);
    await withProgressNotification('update', async () => {
      const updatedRegistration = await apiService.updateRegistration(
        cid,
        rid,
        updateData,
        params,
      );

      // Replace the registration with a new one
      data.value = data.value?.map((registration) =>
        registration.id === registrationId ? updatedRegistration : registration,
      );

      bus.emit('update', updatedRegistration);
    });
  }

  async function deleteData(
    registrationId?: string,
    params?: RegistrationDeleteQuery,
  ) {
    const campId = route.params.campId as string;

    const cid = checkNotNullWithError(campId);
    const rid = checkNotNullWithNotification(registrationId);
    await withProgressNotification('delete', async () => {
      await apiService.deleteRegistration(cid, rid, params);

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
    updateData,
    deleteData,
    invalidate,
  };
});
