import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import type {
  Registration,
  RegistrationCreateData,
  RegistrationDeleteQuery,
  RegistrationUpdateData,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { useCollection, useRouteKey } from '@/composables/resource';
import { useRegistrationBus } from '@/composables/bus';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { formatPersonName } from '@/utils/formatters';
import { removeById, replaceById } from '@/utils/collection';

export const useRegistrationsStore = defineStore('registrations', () => {
  const api = useAPIService();
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const bus = useRegistrationBus();
  // Live changes are refetched through the REST API (where full permissions
  // apply) and reconciled into the list.
  const registrations = useCollection<Registration>({
    name: 'registration',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchRegistrations(eventId),
    realtime: {
      resource: 'registration',
      fetchOne: (eventId, id) => api.fetchRegistration(eventId, id),
      onCreate: (registration) => {
        bus.emit('create', registration);
        showRealtimeCreateNotification(registration);
      },
      onUpdate: (registration) => bus.emit('update', registration),
      onDelete: (id) => bus.emit('delete', id),
    },
  });

  function showRealtimeCreateNotification(registration: Registration) {
    quasar.notify({
      type: 'positive',
      icon: 'person_add',
      message: t('stores.registration.realtimeCreate.message'),
      caption: t('stores.registration.realtimeCreate.caption', {
        name: registrationName(registration),
      }),
      timeout: 5000,
    });
  }

  function registrationName(registration: Registration): string {
    const name = [
      registration.computedData.firstName,
      registration.computedData.lastName,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(' ');

    return name.length > 0
      ? formatPersonName(name)
      : t('stores.registration.realtimeCreate.fallbackName');
  }

  function fetchData(eventId?: string) {
    return registrations.load(eventId);
  }

  // A public registration through the form; reported by the form itself.
  async function storeData(
    eventId: string,
    registration: RegistrationCreateData,
  ): Promise<void> {
    await api.createRegistration(eventId, registration);
  }

  async function updateData(
    registrationId: string,
    updateData: RegistrationUpdateData,
    params?: RegistrationUpdateQuery,
  ): Promise<void> {
    const registration = await registrations.mutate(
      'update',
      (eventId) =>
        api.updateRegistration(eventId, registrationId, updateData, params),
      { feedback: 'progress', apply: replaceById },
    );
    bus.emit('update', registration);
  }

  async function deleteData(
    registrationId: string,
    params?: RegistrationDeleteQuery,
  ): Promise<void> {
    await registrations.mutate(
      'delete',
      (eventId) => api.deleteRegistration(eventId, registrationId, params),
      {
        feedback: 'progress',
        apply: (list) => removeById(list, registrationId),
      },
    );
    bus.emit('delete', registrationId);
  }

  return {
    data: registrations.data,
    isLoading: registrations.isLoading,
    error: registrations.error,
    reset: registrations.reset,
    invalidate: registrations.invalidate,
    fetchData,
    storeData,
    updateData,
    deleteData,
  };
});
