import { defineStore } from 'pinia';
import type {
  Event,
  EventCreateData,
  EventUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useAction } from '@/composables/action';
import { useEventBus } from '@/composables/bus';

/** Writes to events by id; the lists holding them follow through the bus. */
export const useEventsStore = defineStore('events', () => {
  const api = useAPIService();
  const bus = useEventBus();
  const { run } = useAction('event');

  async function createEntry(createData: EventCreateData): Promise<Event> {
    const event = await run('update', () => api.createEvent(createData), {
      feedback: 'progress',
    });
    bus.emit('create', event);
    return event;
  }

  async function updateEntry(
    id: string,
    updateData: EventUpdateData,
  ): Promise<Event> {
    const event = await run('update', () => api.updateEvent(id, updateData), {
      feedback: 'progress',
    });
    bus.emit('update', event);
    return event;
  }

  async function deleteEntry(id: string): Promise<void> {
    await run('delete', () => api.deleteEvent(id), { feedback: 'progress' });
    bus.emit('delete', id);
  }

  return {
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
