import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Room } from 'src/types/Room';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useNotification } from 'src/composables/notifications';
import { useCampBus, useRegistrationBus } from 'src/composables/bus';
import { Camp } from 'src/types/Camp';

export const useRoomPlannerStore = defineStore('room-planner', () => {
  const apiService = useAPIService();
  const quasar = useQuasar();
  const route = useRoute();
  const { t } = useI18n();
  const { withProgressNotification } = useNotification();
  const campBus = useCampBus();
  const registrationBus = useRegistrationBus();

  const data = ref<Room[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | object | null>(null);

  campBus.on('change', async (camp: Camp) => {
    // TODO It should be monitored if the rooms are even needed at that point of time
    await fetchData(camp.id);
  });

  registrationBus.on('update', () => {
    // TODO Check if changes or just remap
  });

  // TODO Registration store should listen to changes

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  async function fetchData(campId?: string) {
    isLoading.value = true;
    error.value = null;

    campId = campId ?? (route.params.camp as string | undefined);
    if (campId === undefined) {
      error.value = '404';
      isLoading.value = false;
      return;
    }

    try {
      data.value = await apiService.fetchRooms(campId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'error';

      quasar.notify({
        type: 'negative',
        message: t('stores.room-planner.fetch.error'),
        position: 'top',
      });
    }

    isLoading.value = false;
  }

  async function updateData(roomId: string | undefined, data: Partial<Room>) {
    const campId = route.params.camp as string;

    if (campId === undefined || roomId === undefined) {
      quasar.notify({
        type: 'negative',
        message: t('stores.room-planner.update.invalid'),
        position: 'top',
      });
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.updateRoom(campId, roomId, data);
      },
      {
        progress: {
          message: t('stores.room-planner.update.progress'),
        },
        success: {
          message: t('stores.room-planner.update.success'),
        },
        error: {
          message: t('stores.room-planner.update.error'),
        },
      }
    );

    // Fetch data again because it updated
    if (success) {
      await fetchData();
    }
  }

  async function deleteData(roomId?: string) {
    const campId = route.params.camp as string;

    if (campId === undefined || roomId === undefined) {
      quasar.notify({
        type: 'negative',
        message: t('stores.room-planner.delete.invalid'),
        position: 'top',
      });
      return;
    }

    const success = await withProgressNotification(
      async () => {
        await apiService.deleteRoom(campId, roomId);
      },
      {
        success: {
          message: t('stores.room-planner.delete.success'),
        },
        error: {
          message: t('stores.room-planner.delete.error'),
        },
      }
    );

    // Fetch data again because it updated
    if (success) {
      await fetchData();
    }
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    updateData,
    deleteData,
  };
});
