<template>
  <q-popup-proxy
    ref="popupProxyRef"
    :no-parent-event="noParentEvent"
    transition-show="scale"
    transition-hide="fade"
    :offset="[10, 10]"
    class="event-popup-menu"
  >
    <q-card
      flat
      class="event-popup"
    >
      <q-card-actions
        v-if="hasActions"
        align="right"
      >
        <q-btn
          v-if="!item.date && editable"
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
          v-if="item.date && editable"
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
          v-if="creatable"
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
          v-if="editable"
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
          v-if="deletable"
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
                :style="{ color: item.color }"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6">
                {{ to(item.title) }}
              </q-item-label>
              <q-item-label caption>
                {{ dateTime }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="!hasActions"
              class="gt-xs"
              side
              top
            >
              <q-btn
                v-close-popup
                icon="close"
                size="sm"
                flat
                rounded
              />
            </q-item-section>
          </q-item>

          <!-- plan (only shown when not 'both') -->
          <q-item v-if="item.plan !== 'both'">
            <q-item-section avatar>
              <plan-letter-icon
                :plan="item.plan === 'a' ? 'a' : 'b'"
                size="1.5em"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ item.plan === 'a' ? t('plan.a') : t('plan.b') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="item.location">
            <q-item-section avatar>
              <q-icon name="place" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ to(item.location) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="item.details">
            <q-item-section avatar>
              <q-icon name="description" />
            </q-item-section>
            <q-item-section style="white-space: pre-line">
              {{ to(item.details) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions
        v-if="plannerLink"
        class="q-pt-none"
        align="right"
      >
        <m-btn
          v-close-popup
          :label="t('action.openPlanner')"
          :to="plannerLink"
          icon-right="chevron_right"
          primary
          text
          no-caps
        />
      </q-card-actions>
    </q-card>
  </q-popup-proxy>
</template>

<script lang="ts" setup>
import type { ProgramItem } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QPopupProxy } from 'quasar';
import type { RouteLocationRaw } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PlanLetterIcon from '@/components/event/programPlanner/PlanLetterIcon.vue';

const { locale, t } = useI18n();
const { to } = useObjectTranslation();

const {
  item,
  editable = false,
  deletable = false,
  creatable = false,
  noParentEvent = false,
  plannerLink,
} = defineProps<{
  item: ProgramItem;
  editable?: boolean;
  deletable?: boolean;
  creatable?: boolean;
  // Disables the popup's default open-on-parent-click behavior so a caller
  // can decide itself (e.g. via `show()`) when the popup should open.
  noParentEvent?: boolean;
  // Read-only callers (e.g. the dashboard) link to the planner instead.
  plannerLink?: RouteLocationRaw;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'schedule'): void;
  (e: 'move-to-backlog'): void;
}>();

// Without any action, the top bar would only hold the close button, so that
// moves into the title row instead.
const hasActions = computed<boolean>(() => editable || deletable || creatable);

const popupProxyRef = useTemplateRef<QPopupProxy>('popupProxyRef');

defineExpose({
  show: (evt?: Event) => popupProxyRef.value?.show(evt),
  hide: (evt?: Event) => popupProxyRef.value?.hide(evt),
});

const dateTime = computed<string>(() => {
  if (!item.date) {
    return '';
  }

  const start = item.time
    ? new Date(`${item.date}T${item.time}`)
    : new Date(item.date);
  const end = item.duration
    ? new Date(start.getTime() + item.duration * 60000)
    : start;

  const fullDay = !item.time && !item.duration;

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
  openPlanner: 'Open in planner'
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
  openPlanner: 'Im Planer öffnen'
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
  openPlanner: 'Ouvrir dans le planificateur'
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
  openPlanner: 'Otwórz w planerze'
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
  openPlanner: 'Otevřít v plánovači'
</i18n>
