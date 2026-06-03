import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type {
  ServiceFileCreateData,
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
    withProgressNotification,
    withErrorNotification,
    checkNotNullWithNotification,
    queryParam,
    lazyFetch,
  } = useServiceHandler<ServiceFile[]>('campFiles');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', (_camp, oldCamp) => {
    // Prevent reset when this is the initial page load
    if (!oldCamp) {
      return;
    }

    reset();
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

  async function fetchData() {
    const campId = queryParam('campId');

    await lazyFetch(async () => {
      return await apiService.fetchCampFiles(campId);
    });
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
      await apiService.deleteCampFile(campId, oldFile.id);
      data.value = data.value?.filter((f) => f.id !== oldFile.id);

      const newFile = await apiService.createCampFile(campId, createData);
      data.value?.push(newFile);

      return newFile;
    });
  }

  async function deleteEntry(id: string) {
    const campId = queryParam('campId');

    await withProgressNotification('delete', async () => {
      await apiService.deleteCampFile(campId, id);

      data.value = data.value?.filter((file) => file.id !== id);

      if (campStore.data?.id === id) {
        campStore.reset();
      }
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
    downloadFile,
    getUrl,
    fetchData,
    createEntry,
    replaceFile,
    deleteEntry,
  };
});
