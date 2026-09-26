import { defineStore } from 'pinia';
import type {
  Event,
  EventCreateData,
  EventUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useEventBus } from '@/composables/bus';

export const useEventsStore = defineStore('events', () => {
  const apiService = useAPIService();
  const bus = useEventBus();
  const { withProgressNotification, checkNotNullWithNotification } =
    useServiceNotifications('event');

  async function createEntry(createData: EventCreateData): Promise<Event> {
    return withProgressNotification('update', async () => {
      const newEvent = await apiService.createEvent(createData);

      bus.emit('create', newEvent);

      return newEvent;
    });
  }

  async function updateEntry(
    id: string,
    updateData: EventUpdateData,
  ): Promise<Event | undefined> {
    checkNotNullWithNotification(id);
    return withProgressNotification('update', async () => {
      const updatedEvent = await apiService.updateEvent(id, updateData);

      bus.emit('update', updatedEvent);

      return updatedEvent;
    });
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteEvent(id);

      bus.emit('delete', id);
    });
  }

  return {
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
