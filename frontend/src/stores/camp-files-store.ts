import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus, useCampBus } from '@/composables/bus';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import type {
  ServiceFileCreateData,
  ServiceFileUpdateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { exportFile } from 'quasar';
import { computed } from 'vue';

// Matches {_file.slotName} placeholders used in SurveyJS form definitions.
const FILE_SLOT_REGEX = /\{\s?_file\.([a-z0-9_-]+)\s?}/g;

export const useCampFilesStore = defineStore('campFiles', () => {
  const apiService = useAPIService();
  const campStore = useCampDetailsStore();
  const campBus = useCampBus();
  const authBus = useAuthBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    withErrorNotification,
    checkNotNullWithNotification,
    queryParam,
    lazyFetch,
    backgroundFetch,
  } = useServiceHandler<ServiceFile[]>('campFiles');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients. List mode (no per-id
  // metadata endpoint). Note: the async upload-completion (READY) status flip
  // does not emit — the list refreshes on the next created/updated/deleted
  // event or page load.
  useRealtimeCollection<ServiceFile>('file', {
    data,
    invalidate,
    reload: () => fetchData({ background: true }),
  });

  // Slots declared in the form via {_file.slotName} that have no uploaded file yet.
  const pendingSlots = computed<string[]>(() => {
    const form = campStore.data?.form;
    if (!form) {
      return [];
    }

    const uploadedFields = new Set(
      (data.value ?? []).map((f) => f.field).filter(Boolean),
    );

    const json = JSON.stringify(form);
    const declared = new Set<string>();
    const regex = new RegExp(FILE_SLOT_REGEX.source, 'g');
    let match;
    while ((match = regex.exec(json)) !== null) {
      const value = match[1];
      if (value) {
        declared.add(value);
      }
    }

    return [...declared].filter((slot) => !uploadedFields.has(slot));
  });

  // Slots that have at least one file but are missing a locale-specific file for one or more
  // of the camp's configured locales (only when no null-locale fallback covers all locales).
  const slotsWithMissingLocales = computed<
    { slot: string; missingLocales: string[] }[]
  >(() => {
    const locales = campStore.data?.locales;
    if (!locales?.length) {
      return [];
    }

    const filesByField = new Map<string, ServiceFile[]>();
    for (const file of data.value ?? []) {
      if (!file.field) {
        continue;
      }
      const existing = filesByField.get(file.field);
      if (existing) {
        existing.push(file);
      } else {
        filesByField.set(file.field, [file]);
      }
    }

    return [...filesByField.entries()].flatMap(([slot, files]) => {
      if (files.some((f) => f.locale === null)) {
        return [];
      }
      const covered = new Set(files.map((f) => f.locale));
      const missing = locales.filter((l) => !covered.has(l));

      return missing.length ? [{ slot, missingLocales: missing }] : [];
    });
  });

  // Number of files that need attention: one per declared-but-not-uploaded slot,
  // plus one per missing locale on slots that already have files. A pending slot
  // has no files at all, so the two sets are disjoint and can be summed.
  const missingFilesCount = computed<number>(
    () =>
      pendingSlots.value.length +
      slotsWithMissingLocales.value.reduce(
        (sum, { missingLocales }) => sum + missingLocales.length,
        0,
      ),
  );

  async function fetchData(opts?: { background?: boolean }) {
    const campId = queryParam('campId');

    const fetcher = () => apiService.fetchCampFiles(campId);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  async function createEntry(
    createData: ServiceFileCreateData,
    options?: { withoutNotifications: boolean },
  ): Promise<ServiceFile> {
    const campId = queryParam('campId');

    const createFn = async () => {
      const file = await apiService.createCampFile(campId, createData);

      data.value?.push(file);

      return file;
    };

    return options?.withoutNotifications
      ? createFn()
      : withProgressNotification('create', createFn);
  }

  async function replaceFile(
    oldFile: ServiceFile,
    createData: ServiceFileCreateData,
  ): Promise<ServiceFile> {
    const campId = queryParam('campId');

    return withProgressNotification('replace', async () => {
      const newFile = await apiService.createCampFile(campId, createData);
      data.value?.push(newFile);

      await apiService.deleteFile(oldFile.id);
      data.value = data.value?.filter((f) => f.id !== oldFile.id);

      return newFile;
    });
  }

  async function updateEntry(
    id: string,
    updateData: ServiceFileUpdateData,
  ): Promise<ServiceFile> {
    return withProgressNotification('update', async () => {
      const file = await apiService.updateFile(id, updateData);

      data.value = data.value?.map((entry) => (entry.id === id ? file : entry));

      return file;
    });
  }

  async function deleteEntry(id: string) {
    await withProgressNotification('delete', async () => {
      await apiService.deleteFile(id);

      data.value = data.value?.filter((file) => file.id !== id);
    });
  }

  async function downloadFile(file: ServiceFile) {
    await withErrorNotification('download', async () => {
      const blob = await apiService.downloadFile(file.id);

      exportFile(file.name, blob, {
        mimeType: file.type,
      });
    });
  }

  function getUrl(id: string) {
    checkNotNullWithNotification(id);

    return apiService.getFileUrl(id);
  }

  return {
    reset,
    data,
    isLoading,
    error,
    pendingSlots,
    slotsWithMissingLocales,
    missingFilesCount,
    downloadFile,
    getUrl,
    fetchData,
    createEntry,
    replaceFile,
    updateEntry,
    deleteEntry,
  };
});
