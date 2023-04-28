import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Room } from 'src/types/Room';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useNotification } from 'src/composables/notifications';

export const useRoomPlannerStore = defineStore('room-planner', () => {
  const apiService = useAPIService();
  const quasar = useQuasar();
  const route = useRoute();
  const { t } = useI18n();
  const { withProgressNotification } = useNotification();

  const data = ref<Room[]>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | object | null>(null);

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
