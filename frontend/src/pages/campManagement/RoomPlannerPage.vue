<template>
  <page-state-handler
    :error
    :prevent-leave="updateInProgress"
    padding
    class="room-planner row justify-center"
  >
    <div class="planner-content col-12 col-md-11 col-lg-10 column no-wrap">
      <!-- Header -->
      <div class="header row items-start justify-between no-wrap">
        <div class="header-text col">
          <div class="row items-center no-wrap q-gutter-x-sm">
            <div class="text-h5 text-weight-medium ellipsis">
              {{ t('title') }}
            </div>
            <q-badge
              v-if="!loading"
              rounded
              class="count-badge"
              :label="rooms.length"
            />
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <!-- Page actions -->
        <div class="header-actions row items-center no-wrap q-gutter-x-xs">
          <m-btn
            v-if="can('camp.rooms.beds.edit')"
            icon="tune"
            square
            round
            text
            :aria-label="t('action.settings')"
          >
            <q-tooltip>{{ t('action.settings') }}</q-tooltip>

            <q-menu
              anchor="bottom right"
              self="top right"
            >
              <q-list class="settings-list">
                <q-item-label header>
                  {{ t('settings.title') }}
                </q-item-label>

                <div class="settings-warning">
                  <q-icon
                    name="warning_amber"
                    size="18px"
                  />
                  <span>{{ t('settings.warning') }}</span>
                </div>

                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      {{ t('settings.skipGenderFilter.label') }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('settings.skipGenderFilter.caption') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle v-model="settings.skipGenderFilter" />
                  </q-item-section>
                </q-item>

                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      {{ t('settings.skipRoleFilter.label') }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('settings.skipRoleFilter.caption') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle v-model="settings.skipRoleFilter" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </m-btn>

          <m-btn
            v-if="can('camp.rooms.edit')"
            icon="swap_vert"
            square
            round
            text
            :disable="rooms.length < 2"
            :aria-label="t('action.reorder')"
            @click="orderRooms"
          >
            <q-tooltip>{{ t('action.reorder') }}</q-tooltip>
          </m-btn>

          <m-btn
            v-if="can('camp.rooms.edit')"
            :label="t('action.add')"
            color="primary"
            icon="add"
            :disabled="loading"
            @click="addRoom"
          />
        </div>
      </div>

      <!-- Occupancy stats -->
      <div
        v-if="!loading && rooms.length > 0"
        class="stats-row row items-center"
      >
        <div class="stat-chip">
          <q-icon
            name="hotel"
            size="16px"
          />
          {{ t('stats.beds', { occupied: occupiedBeds, total: totalBeds }) }}
        </div>

        <div
          v-if="missingBeds > 0"
          class="stat-chip stat-chip--negative"
        >
          <q-icon
            name="warning_amber"
            size="16px"
          />
          {{ t('stats.missingBeds', { count: missingBeds }) }}
        </div>

        <div
          v-if="availablePeople.length > 0"
          class="stat-chip stat-chip--attention"
          role="button"
          tabindex="0"
        >
          <q-icon
            name="person_search"
            size="16px"
          />
          {{ t('stats.unassigned', { count: availablePeople.length }) }}

          <q-menu
            anchor="bottom left"
            self="top left"
          >
            <q-list class="unassigned-list">
              <q-item
                v-for="person in availablePeople"
                :key="person.id"
              >
                <q-item-section
                  v-if="person.country"
                  avatar
                >
                  <country-icon :country="person.country" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="ellipsis">
                    {{ person.name }}
                  </q-item-label>
                </q-item-section>
                <q-item-section
                  v-if="person.age !== undefined"
                  side
                >
                  {{ person.age }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>

        <div
          v-else
          class="stat-chip stat-chip--positive"
        >
          <q-icon
            name="check_circle"
            size="16px"
          />
          {{ t('stats.allAssigned') }}
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && rooms.length === 0"
        class="empty-state col column items-center justify-center"
      >
        <q-icon
          name="meeting_room"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('empty.title') }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs text-center">
          {{ t('empty.message') }}
        </div>
        <m-btn
          v-if="can('camp.rooms.edit')"
          class="q-mt-lg"
          :label="t('action.add')"
          color="primary"
          icon="add"
          @click="addRoom"
        />
      </div>

      <!-- Loading skeletons -->
      <div
        v-else-if="loading"
        class="room-grid"
      >
        <room-list-skeleton
          v-for="(capacity, index) in [4, 6, 3, 5]"
          :key="index"
          :capacity
        />
      </div>

      <!-- Room grid -->
      <transition-group
        v-else
        tag="div"
        name="room"
        class="room-grid"
      >
        <room-list
          v-for="room in rooms"
          :key="room.id"
          :room
          :name="room.name"
          :people="availablePeople"
          :editable="can('camp.rooms.edit')"
          :deletable="can('camp.rooms.delete')"
          :assignable="can('camp.rooms.beds.edit')"
          :skip-gender-filter="settings.skipGenderFilter"
          :skip-role-filter="settings.skipRoleFilter"
          @edit="editRoom(room)"
          @delete="deleteRoom(room.id)"
          @update="(position, val) => onBedUpdate(room, position, val)"
        />

        <!-- Room adder skeleton -->
        <room-list-skeleton
          v-if="addLoading"
          key="__add-skeleton"
          :capacity="4"
        />
      </transition-group>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import type { Roommate, RoomWithRoommates } from 'src/types/Room';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import RoomList from 'components/campManagement/roomPlanner/RoomList.vue';
import RoomListSkeleton from 'components/campManagement/roomPlanner/RoomListSkeleton.vue';
import RoomOrderDialog from 'components/campManagement/roomPlanner/dialogs/RoomOrderDialog.vue';
import RoomCreateDialog from 'components/campManagement/roomPlanner/dialogs/RoomCreateDialog.vue';
import RoomEditDialog from 'components/campManagement/roomPlanner/dialogs/RoomEditDialog.vue';
import type {
  Room,
  RoomCreateData,
  RoomUpdateData,
  Registration,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { usePermissions } from 'src/composables/permissions';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { formatPersonName } from 'src/utils/formatters';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { useAPIService } from 'src/services/APIService';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const { t } = useI18n();
const apiService = useAPIService();
const campDetailsStore = useCampDetailsStore();
const registrationsStore = useRegistrationsStore();
const registrationHelper = useRegistrationHelper();
const { can } = usePermissions();

const addLoading = ref(false);

interface PlannerSettings {
  skipGenderFilter: boolean;
  skipRoleFilter: boolean;
}

const SETTINGS_KEY = 'room-planner-settings';

function loadSettings(): PlannerSettings {
  const defaults: PlannerSettings = {
    skipGenderFilter: false,
    skipRoleFilter: false,
  };

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return {
        ...defaults,
        ...JSON.parse(stored),
      };
    }
  } catch {
    // Ignore invalid stored settings and fall back to defaults
  }

  return defaults;
}

const settings = reactive<PlannerSettings>(loadSettings());

watch(
  settings,
  () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings }));
  },
  { deep: true },
);

const {
  data,
  isLoading,
  error: roomError,
  withProgressNotification,
  withErrorNotification,
  lazyFetch,
  queryParam,
  asyncUpdate,
  requestPending,
  checkNotNullWithError,
} = useServiceHandler<Room[]>();

onMounted(async () => {
  await registrationsStore.fetchData();
  await fetchRooms();
});

const loading = computed<boolean>(() => {
  return registrationsStore.isLoading || isLoading.value;
});

const error = computed<string | null>(() => {
  return registrationsStore.error ?? roomError.value;
});

const updateInProgress = computed<boolean>(() => {
  return requestPending.value;
});

const locales = computed<string[] | undefined>(() => {
  return campDetailsStore.data?.locales;
});

const rooms = computed<RoomWithRoommates[]>(() => {
  if (!data.value) {
    return [];
  }

  return data.value
    .map(mapResponseRoom)
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

const totalBeds = computed<number>(() => {
  return rooms.value.reduce((sum, room) => sum + room.beds.length, 0);
});

const occupiedBeds = computed<number>(() => {
  return rooms.value.reduce(
    (sum, room) => sum + room.beds.filter((bed) => !!bed.person).length,
    0,
  );
});

const missingBeds = computed<number>(() => {
  const required = occupiedBeds.value + availablePeople.value.length;

  return Math.max(0, required - totalBeds.value);
});

const availablePeople = computed<Roommate[]>(() => {
  const localRooms = rooms.value;
  const registrations: Registration[] | undefined = registrationsStore.data;

  if (localRooms === undefined || registrations === undefined) {
    return [];
  }

  const filterStatusAccepted = (registration: Registration): boolean => {
    return registration.status === 'ACCEPTED';
  };

  // Filter out people who are already in a group
  const filterUnassigned = (registration: Registration): boolean => {
    return !localRooms.some((room) => {
      return room.beds.some((value) => value?.person?.id === registration.id);
    });
  };

  // Map to roommate type and sort by age
  return registrations
    .filter(filterStatusAccepted)
    .filter(filterUnassigned)
    .map(mapRegistrationRoommate)
    .sort((a, b) => (a.age ?? 999) - (b.age ?? 999));
});

async function fetchRooms() {
  const campId = queryParam('campId');

  const cid = checkNotNullWithError(campId);
  await lazyFetch(() => apiService.fetchRooms(cid));
}

function addRoom() {
  quasar
    .dialog({
      component: RoomCreateDialog,
      componentProps: {
        locales: locales.value,
      },
    })
    .onOk((payload: RoomCreateData) => {
      void createRoom(payload);
    });
}

function editRoom(room: RoomWithRoommates): void {
  const roomUpdate: RoomUpdateData = {
    name: room.name,
  };

  quasar
    .dialog({
      component: RoomEditDialog,
      componentProps: {
        room: roomUpdate,
        capacity: room.beds.length,
        minCapacity: Math.max(
          room.beds.filter((bed) => bed.person != null).length,
          1,
        ),
        locales,
      },
    })
    .onOk((payload: RoomUpdateData & { capacity: number }) => {
      void updateRoom(room, payload);
    });
}

function orderRooms() {
  quasar
    .dialog({
      component: RoomOrderDialog,
      componentProps: {
        rooms: rooms.value,
      },
      persistent: true,
    })
    .onOk((payload: RoomWithRoommates[]) => {
      void bulkUpdateRooms(payload);
    });
}

function onBedUpdate(
  room: RoomWithRoommates,
  position: number,
  roommate: Roommate | null,
) {
  void updateBed(room, position, roommate);
}

async function createRoom(
  createData: RoomCreateData,
): Promise<Room | undefined> {
  const campId = queryParam('campId');

  return withProgressNotification('create', async () => {
    const room = await apiService.createRoom(campId, createData);

    data.value?.push(room);

    return room;
  });
}

async function updateRoom(
  room: RoomWithRoommates,
  { capacity, ...updateData }: RoomUpdateData & { capacity: number },
): Promise<Room | undefined> {
  const campId = queryParam('campId');

  return withProgressNotification('update', async () => {
    let updatedRoom = await apiService.updateRoom(campId, room.id, updateData);

    const diff = capacity - room.beds.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        await apiService.createBed(campId, room.id);
      }
    } else if (diff < 0) {
      // Remove empty beds only, starting from the last one
      const removableBeds = room.beds.filter((bed) => !bed.person).slice(diff);
      for (const bed of removableBeds) {
        await apiService.deleteBed(campId, room.id, bed.id);
      }
    }

    if (diff !== 0) {
      updatedRoom = await apiService.fetchRoom(campId, room.id);
    }

    const index = data.value?.findIndex((value) => value.id === room.id);
    if (index !== undefined && index != -1) {
      data.value?.splice(index, 1, updatedRoom);
    }

    return updatedRoom;
  });
}

async function bulkUpdateRooms(
  rooms: RoomWithRoommates[],
): Promise<Room[] | undefined> {
  const campId = queryParam('campId');

  return withProgressNotification('update', async () => {
    const updatedRooms = await apiService.bulkUpdateRooms(campId, rooms);

    data.value = data.value?.map((room) => {
      return updatedRooms.find((r) => r.id === room.id) ?? room;
    });

    return updatedRooms;
  });
}

async function deleteRoom(roomId: string) {
  const campId = queryParam('campId');

  await withProgressNotification('delete', async () => {
    await apiService.deleteRoom(campId, roomId);

    // Remove the room from the list
    const index = data.value?.findIndex((value) => value.id === roomId);
    if (index !== undefined && index != -1) {
      data.value?.splice(index, 1);
    }
  });
}

async function updateBed(
  room: RoomWithRoommates,
  position: number,
  person: Roommate | null,
) {
  const campId = queryParam('campId');
  const roomId = room.id;
  const bedId = room.beds[position]?.id;
  const registrationId = person?.id ?? null;

  if (bedId === undefined) {
    return;
  }

  await asyncUpdate(() => {
    return withErrorNotification('update-bed', () => {
      const updatedBed = apiService.updateBed(
        campId,
        roomId,
        bedId,
        registrationId,
      );

      // Invalidate the registration store to ensure the data is fresh
      // The registration store will contains the room as well
      registrationsStore.invalidate();

      return updatedBed;
    });
  });

  // Optimistic update
  data.value = data.value!.map((r) => {
    if (r.id !== roomId) {
      return r;
    }

    const updatedRoom = { ...r };
    updatedRoom.beds[position] = { id: bedId, registrationId };

    return updatedRoom;
  });
}

function mapRegistrationRoommate(registration: Registration): Roommate {
  const name = formatPersonName(registrationHelper.uniqueName(registration));
  const age = registrationHelper.age(registration);
  const gender = registrationHelper.gender(registration);
  const country = registrationHelper.country(registration);
  const participant = registrationHelper.participant(registration);

  return {
    id: registration.id,
    name,
    age,
    gender,
    country,
    participant,
  };
}

function mapResponseRoom(room: Room): RoomWithRoommates {
  return {
    id: room.id,
    name: room.name,
    sortOrder: room.sortOrder,
    beds: room.beds.map((bed) => {
      return {
        id: bed.id,
        person: findRegistrationById(bed.registrationId),
      };
    }),
  };
}

function findRegistrationById(registrationId: string | null) {
  if (!registrationId) {
    return null;
  }

  const registrations = registrationsStore.data;
  if (!registrations) {
    return null;
  }

  const registration = registrations.find(
    (value) => value.id === registrationId,
  );
  if (!registration) {
    return null;
  }

  return mapRegistrationRoommate(registration);
}
</script>

<style scoped>
.planner-content {
  min-width: 0;
}

.header {
  gap: 12px 16px;
}

.header-text {
  min-width: 0;
}

.header-actions {
  flex-shrink: 0;
}

/* Let actions wrap beneath the title on narrow screens */
@media (max-width: 599px) {
  .header {
    flex-wrap: wrap;
  }

  .header-actions {
    margin-left: auto;
  }
}

.count-badge {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
}

.stats-row {
  gap: 8px;

  margin-top: 16px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;

  background: transparent;
  color: var(--md3-on-surface-variant);

  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.stat-chip--attention {
  border-color: transparent;

  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);

  cursor: pointer;
}

.stat-chip--positive {
  color: var(--md3-positive);
}

.stat-chip--negative {
  border-color: transparent;

  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.settings-list {
  min-width: 300px;
  max-width: 360px;
}

.settings-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  margin: 0 16px 8px;
  padding: 10px 12px;
  border-radius: 8px;

  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);

  font-size: 12px;
  line-height: 1.4;
}

.settings-warning .q-icon {
  flex-shrink: 0;

  margin-top: 1px;
}

.unassigned-list {
  min-width: 220px;
  max-height: 320px;
  overflow: auto;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  align-items: start;

  margin-top: 16px;
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);

  opacity: 0.6;
}

.room-enter-active,
.room-leave-active {
  transition: opacity 0.3s ease;
}

.room-move {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.room-enter-from,
.room-leave-to {
  opacity: 0;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Room planner'
subtitle: 'Assign participants and staff to rooms and beds.'

action:
  add: 'Add room'
  reorder: 'Reorder rooms'
  settings: 'Planner settings'

stats:
  beds: '{occupied} of {total} beds filled'
  missingBeds: '{count} beds missing'
  unassigned: '{count} waiting for a bed'
  allAssigned: 'Everyone has a bed'

settings:
  title: 'Assignment filters'
  skipGenderFilter:
    label: 'Skip gender filter'
    caption: 'Suggest people regardless of the gender of the room'
  skipRoleFilter:
    label: 'Skip role filter'
    caption: 'Allow mixing participants and staff in a room'
  warning: 'These filters prevent accidentally mixing genders or roles within a room. Skipping them is usually a bad idea — only do so in exceptional cases.'

empty:
  title: 'No rooms yet'
  message: 'Create rooms to start assigning people to beds.'

request:
  fetch:
    error: 'Failed to fetch rooms'
  create:
    progress: 'Creating room...'
    success: 'Room created successfully'
    error: 'Failed to create room'
    invalid: 'Invalid camp id'
  update:
    progress: 'Updating room...'
    success: 'Room updated successfully'
    error: 'Failed to update room'
    invalid: 'Invalid room id or camp id'
  update-bed:
    error: 'Failed to update bed'
    invalid: 'Invalid bed id or camp id'
  delete:
    progress: 'Deleting room...'
    success: 'Room deleted successfully'
    error: 'Failed to delete room'
    invalid: 'Invalid room id or camp id'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zimmerplaner'
subtitle: 'Teilnehmende und Betreuende auf Zimmer und Betten verteilen.'

action:
  add: 'Zimmer hinzufügen'
  reorder: 'Zimmer sortieren'
  settings: 'Planer-Einstellungen'

stats:
  beds: '{occupied} von {total} Betten belegt'
  missingBeds: '{count} Betten fehlen'
  unassigned: '{count} ohne Bett'
  allAssigned: 'Alle haben ein Bett'

settings:
  title: 'Zuweisungsfilter'
  skipGenderFilter:
    label: 'Geschlechterfilter überspringen'
    caption: 'Personen unabhängig vom Geschlecht des Zimmers vorschlagen'
  skipRoleFilter:
    label: 'Rollenfilter überspringen'
    caption: 'Teilnehmende und Betreuende in einem Zimmer mischen'
  warning: 'Diese Filter verhindern, dass Geschlechter oder Rollen in einem Zimmer versehentlich gemischt werden. Das Überspringen ist meist keine gute Idee — nur in Ausnahmefällen verwenden.'

empty:
  title: 'Noch keine Zimmer'
  message: 'Erstellen Sie Zimmer, um Personen Betten zuzuweisen.'

request:
  fetch:
    error: 'Fehler beim Abrufen der Zimmer'
  create:
    progress: 'Zimmer wird erstellt...'
    success: 'Zimmer erfolgreich erstellt'
    error: 'Fehler beim Erstellen des Zimmers'
    invalid: 'Ungültige Camp-ID'
  update:
    progress: 'Zimmer wird aktualisiert...'
    success: 'Zimmer erfolgreich aktualisiert'
    error: 'Fehler beim Aktualisieren des Zimmers'
    invalid: 'Ungültige Zimmer-ID oder Camp-ID'
  update-bed:
    error: 'Fehler beim Aktualisieren des Betts'
    invalid: 'Ungültige Bett-ID oder Camp-ID'
  delete:
    progress: 'Zimmer wird gelöscht...'
    success: 'Zimmer erfolgreich gelöscht'
    error: 'Fehler beim Löschen des Zimmers'
    invalid: 'Ungültige Zimmer-ID oder Camp-ID'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Planificateur de chambres'
subtitle: 'Répartissez les participants et les encadrants dans les chambres.'

action:
  add: 'Ajouter une chambre'
  reorder: 'Réorganiser les chambres'
  settings: 'Paramètres du planificateur'

stats:
  beds: '{occupied} lits occupés sur {total}'
  missingBeds: '{count} lits manquants'
  unassigned: '{count} sans lit'
  allAssigned: 'Tout le monde a un lit'

settings:
  title: "Filtres d'attribution"
  skipGenderFilter:
    label: 'Ignorer le filtre de genre'
    caption: 'Proposer des personnes quel que soit le genre de la chambre'
  skipRoleFilter:
    label: 'Ignorer le filtre de rôle'
    caption: 'Mélanger participants et encadrants dans une chambre'
  warning: "Ces filtres évitent de mélanger par erreur les genres ou les rôles dans une chambre. Les ignorer est généralement une mauvaise idée — à n'utiliser que dans des cas exceptionnels."

empty:
  title: 'Pas encore de chambres'
  message: 'Créez des chambres pour commencer à attribuer des lits.'

request:
  fetch:
    error: 'Échec de la récupération des chambres'
  create:
    progress: 'Création de la chambre en cours...'
    success: 'Chambre créée avec succès'
    error: 'Impossible de créer la chambre'
    invalid: 'ID du camp invalide'
  update:
    progress: 'Mise à jour de la chambre en cours...'
    success: 'Chambre mise à jour avec succès'
    error: 'Impossible de mettre à jour la chambre'
    invalid: 'ID de la chambre ou du camp invalide'
  update-bed:
    error: 'Impossible de mettre à jour le lit'
    invalid: 'ID du lit ou du camp invalide'
  delete:
    progress: 'Suppression de la chambre en cours...'
    success: 'Chambre supprimée avec succès'
    error: 'Impossible de supprimer la chambre'
    invalid: 'ID de la chambre ou du camp invalide'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Planer pokoi'
subtitle: 'Przydziel uczestników i kadrę do pokoi i łóżek.'

action:
  add: 'Dodaj pokój'
  reorder: 'Zmień kolejność pokoi'
  settings: 'Ustawienia planera'

stats:
  beds: 'Zajęte łóżka: {occupied} z {total}'
  missingBeds: 'Brakuje łóżek: {count}'
  unassigned: '{count} bez łóżka'
  allAssigned: 'Wszyscy mają łóżko'

settings:
  title: 'Filtry przydzielania'
  skipGenderFilter:
    label: 'Pomiń filtr płci'
    caption: 'Proponuj osoby niezależnie od płci pokoju'
  skipRoleFilter:
    label: 'Pomiń filtr roli'
    caption: 'Pozwól mieszać uczestników i kadrę w pokoju'
  warning: 'Te filtry zapobiegają przypadkowemu mieszaniu płci lub ról w pokoju. Ich pomijanie jest zwykle złym pomysłem — używaj tylko w wyjątkowych przypadkach.'

empty:
  title: 'Brak pokoi'
  message: 'Utwórz pokoje, aby zacząć przydzielać łóżka.'

request:
  fetch:
    error: 'Nie udało się pobrać pokoi'
  create:
    progress: 'Tworzenie pokoju...'
    success: 'Pokój został utworzony'
    error: 'Nie udało się utworzyć pokoju'
    invalid: 'Nieprawidłowy identyfikator obozu'
  update:
    progress: 'Aktualizowanie pokoju...'
    success: 'Pokój został zaktualizowany'
    error: 'Nie udało się zaktualizować pokoju'
    invalid: 'Nieprawidłowy identyfikator pokoju lub obozu'
  update-bed:
    error: 'Nie udało się zaktualizować łóżka'
    invalid: 'Nieprawidłowy identyfikator łóżka lub obozu'
  delete:
    progress: 'Usuwanie pokoju...'
    success: 'Pokój został usunięty'
    error: 'Nie udało się usunąć pokoju'
    invalid: 'Nieprawidłowy identyfikator pokoju lub obozu'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Plánovač pokojů'
subtitle: 'Rozdělte účastníky a vedoucí do pokojů a lůžek.'

action:
  add: 'Přidat pokoj'
  reorder: 'Změnit pořadí pokojů'
  settings: 'Nastavení plánovače'

stats:
  beds: 'Obsazeno {occupied} z {total} lůžek'
  missingBeds: 'Chybí lůžka: {count}'
  unassigned: '{count} bez lůžka'
  allAssigned: 'Všichni mají lůžko'

settings:
  title: 'Filtry přiřazování'
  skipGenderFilter:
    label: 'Přeskočit filtr pohlaví'
    caption: 'Navrhovat osoby bez ohledu na pohlaví pokoje'
  skipRoleFilter:
    label: 'Přeskočit filtr rolí'
    caption: 'Povolit míchání účastníků a vedoucích v pokoji'
  warning: 'Tyto filtry brání nechtěnému míchání pohlaví nebo rolí v pokoji. Jejich přeskočení obvykle není dobrý nápad — používejte jen ve výjimečných případech.'

empty:
  title: 'Zatím žádné pokoje'
  message: 'Vytvořte pokoje a začněte přiřazovat lůžka.'

request:
  fetch:
    error: 'Nepodařilo se načíst pokoje'
  create:
    progress: 'Vytváření pokoje...'
    success: 'Pokoj byl úspěšně vytvořen'
    error: 'Nepodařilo se vytvořit pokoj'
    invalid: 'Neplatné ID tábora'
  update:
    progress: 'Aktualizace pokoje...'
    success: 'Pokoj byl úspěšně aktualizován'
    error: 'Nepodařilo se aktualizovat pokoj'
    invalid: 'Neplatné ID pokoje nebo tábora'
  update-bed:
    error: 'Nepodařilo se aktualizovat lůžko'
    invalid: 'Neplatné ID lůžka nebo tábora'
  delete:
    progress: 'Odstraňování pokoje...'
    success: 'Pokoj byl úspěšně odstraněn'
    error: 'Nepodařilo se odstranit pokoj'
    invalid: 'Neplatné ID pokoje nebo tábora'
</i18n>
