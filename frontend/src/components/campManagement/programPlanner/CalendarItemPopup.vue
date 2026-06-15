<template>
  <q-popup-proxy
    transition-show="scale"
    transition-hide="fade"
    :offset="[10, 10]"
    class="event-popup-menu"
  >
    <q-card
      flat
      class="event-popup"
    >
      <q-card-actions align="right">
        <q-btn
          v-if="!event.date"
          v-close-popup
          icon="event"
          size="sm"
          flat
          rounded
          @click="emit('schedule')"
        >
          <q-tooltip>{{ t('action.schedule') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="event.date"
          v-close-popup
          icon="inbox"
          size="sm"
          flat
          rounded
          @click="emit('move-to-backlog')"
        >
          <q-tooltip>{{ t('action.moveToBacklog') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-close-popup
          icon="content_copy"
          size="sm"
          flat
          rounded
          @click="onDuplicate"
        >
          <q-tooltip>{{ t('action.duplicate') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-close-popup
          icon="edit"
          size="sm"
          flat
          rounded
          @click="onEdit"
        >
          <q-tooltip>{{ t('action.edit') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-close-popup
          icon="delete"
          size="sm"
          flat
          rounded
          color="negative"
          @click="onDelete"
        >
          <q-tooltip>{{ t('action.delete') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-close-popup
          class="gt-xs"
          icon="close"
          size="sm"
          flat
          rounded
        />
      </q-card-actions>

      <q-card-section>
        <q-list>
          <!-- title -->
          <q-item>
            <q-item-section avatar>
              <q-icon
                name="circle"
                :style="{ color: event.color }"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6">
                {{ to(event.title) }}
              </q-item-label>
              <q-item-label caption>
                {{ dateTime }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <!-- plan (only shown when not 'both') -->
          <q-item v-if="event.plan !== 'both'">
            <q-item-section avatar>
              <q-icon :name="event.plan === 'a' ? 'wb_sunny' : 'water_drop'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ event.plan === 'a' ? t('plan.a') : t('plan.b') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="event.location">
            <q-item-section avatar>
              <q-icon name="place" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ to(event.location) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="event.details">
            <q-item-section avatar>
              <q-icon name="description" />
            </q-item-section>
            <q-item-section style="white-space: pre-line">
              {{ to(event.details) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-popup-proxy>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();
const { to } = useObjectTranslation();

const { event } = defineProps<{
  event: ProgramEvent;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'schedule'): void;
  (e: 'move-to-backlog'): void;
}>();

const dateTime = computed<string>(() => {
  if (!event.date) {
    return '';
  }

  const start = event.time
    ? new Date(`${event.date}T${event.time}`)
    : new Date(event.date);
  const end = event.duration
    ? new Date(start.getTime() + event.duration * 60000)
    : start;

  const fullDay = !event.time && !event.duration;

  return new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    day: '2-digit',
    weekday: 'long',
    hour: fullDay ? undefined : 'numeric',
    minute: fullDay ? undefined : 'numeric',
  }).formatRange(start, end);
});

function onDelete() {
  emit('delete');
}

function onEdit() {
  emit('edit');
}

function onDuplicate() {
  emit('duplicate');
}
</script>

<style>
/* The QMenu container clips its content at the default 4px radius;
   round it to match the card inside. Unscoped because the menu is
   teleported outside this component. */
.q-menu.event-popup-menu {
  border-radius: 16px;
}
</style>

<style scoped>
.event-popup {
  min-width: 300px;
  max-width: 380px;

  border: 1px solid var(--md3-outline-variant);
  border-radius: 16px;

  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}
</style>

<i18n lang="yaml" locale="en">
plan:
  a: 'Plan A (good weather)'
  b: 'Plan B (bad weather)'
action:
  schedule: 'Schedule'
  moveToBacklog: 'Move to backlog'
  duplicate: 'Duplicate'
  edit: 'Edit'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
plan:
  a: 'Plan A (gutes Wetter)'
  b: 'Plan B (schlechtes Wetter)'
action:
  schedule: 'Einplanen'
  moveToBacklog: 'In Backlog verschieben'
  duplicate: 'Duplizieren'
  edit: 'Bearbeiten'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
plan:
  a: 'Plan A (beau temps)'
  b: 'Plan B (mauvais temps)'
action:
  schedule: 'Planifier'
  moveToBacklog: 'Déplacer vers le backlog'
  duplicate: 'Dupliquer'
  edit: 'Modifier'
  delete: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
plan:
  a: 'Plan A (dobra pogoda)'
  b: 'Plan B (zła pogoda)'
action:
  schedule: 'Zaplanuj'
  moveToBacklog: 'Przenieś do backlogu'
  duplicate: 'Duplikuj'
  edit: 'Edytuj'
  delete: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
plan:
  a: 'Plán A (dobré počasí)'
  b: 'Plán B (špatné počasí)'
action:
  schedule: 'Naplánovat'
  moveToBacklog: 'Přesunout do backlogu'
  duplicate: 'Duplikovat'
  edit: 'Upravit'
  delete: 'Smazat'
</i18n>
