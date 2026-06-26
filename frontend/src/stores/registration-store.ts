import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import type {
  Registration,
  RegistrationCreateData,
  RegistrationDeleteQuery,
  RegistrationUpdateData,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { useServiceHandler } from 'src/composables/serviceHandler';
import {
  useAuthBus,
  useCampBus,
  useRegistrationBus,
} from 'src/composables/bus';
import { useRealtimeStore } from 'stores/realtime-store';

export const useRegistrationsStore = defineStore('registrations', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const bus = useRegistrationBus();
  const campBus = useCampBus();
  const realtime = useRealtimeStore();
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

  // React to live changes pushed from other clients.
  realtime.on('registration', (event) => void handleRemoteChange(event));
  realtime.onReconnect('registration', () => void reload());

  async function fetchData(campId?: string) {
    const cid: string = campId ?? (route.params.campId as string);
    checkNotNullWithError(cid);

    await lazyFetch(async () => {
      return await apiService.fetchRegistrations(cid);
    });
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

  // Applies a realtime change pushed from the server. The event carries only an
  // id, so we refetch the affected registration through the REST API (where
  // full permissions apply) and reconcile it into the local list.
  async function handleRemoteChange(event: RealtimeEvent) {
    const campId = route.params.campId as string | undefined;
    if (!campId) {
      return;
    }

    // List not loaded on the current page — just mark stale so the next page
    // that needs it fetches fresh, rather than building a partial list.
    if (data.value === undefined) {
      invalidate();
      return;
    }

    if (event.operation === 'deleted') {
      data.value = data.value.filter(
        (registration) => registration.id !== event.id,
      );
      bus.emit('delete', event.id);
      return;
    }

    const registration = await apiService.fetchRegistration(campId, event.id);

    const exists = data.value.some((r) => r.id === registration.id);
    if (exists) {
      data.value = data.value.map((r) =>
        r.id === registration.id ? registration : r,
      );
      bus.emit('update', registration);
    } else {
      data.value = [...data.value, registration];
      bus.emit('create', registration);
    }
  }

  // Force a fresh list fetch (used after a (re)connect to catch missed events).
  async function reload() {
    invalidate();
    await fetchData();
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
