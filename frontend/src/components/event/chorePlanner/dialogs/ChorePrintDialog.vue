<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :width="400"
      @submit="onDialogOK({ pages, choreIds })"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-md column no-wrap">
        <date-range-input
          v-model:from="from"
          v-model:to="until"
          date-only
          :event-days="eventDays"
          :selectable="selectable"
          :label="t('field.range')"
        >
          <template #prepend>
            <q-icon name="date_range" />
          </template>
        </date-range-input>

        <div v-if="chores.length > 1">
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.chores') }}
          </div>
          <div class="chip-row row">
            <q-chip
              v-for="chore in chores"
              :key="chore.id"
              clickable
              class="filter-chip"
              :class="{ 'filter-chip--active': choreIds.includes(chore.id) }"
              @click="toggleChore(chore.id)"
            >
              {{ translate(chore.name) }}
            </q-chip>
          </div>
        </div>

        <div
          v-if="pages.length > 0"
          class="text-body2 text-grey-7"
        >
          {{ summary }}
        </div>
      </div>

      <template #actions>
        <q-btn
          type="reset"
          outline
          rounded
          color="primary"
          :label="t('action.cancel')"
        />
        <q-btn
          type="submit"
          rounded
          color="primary"
          icon="print"
          :disable="pages.length === 0 || choreIds.length === 0"
          :label="t('action.print')"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DateRangeInput from '@/components/common/inputs/DateRangeInput.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import type { Chore } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { rosterPages } from '@/components/event/chorePlanner/printChoreRoster';

// The days and chores to print; resolves to the pages and the chores kept.
const props = defineProps<{
  from: string;
  to: string;
  chores: Chore[];
  eventDays?: { from: string; to: string } | undefined;
  // The event's days and every day with a duty, whichever reach further.
  selectable?: { from: string; to: string } | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
// `to` is the range's end here.
const { to: translate } = useObjectTranslation();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const from = ref<string | undefined>(props.from);
const until = ref<string | undefined>(props.to);
// Everything is printed unless taken off.
const choreIds = ref<string[]>(props.chores.map((chore) => chore.id));

function toggleChore(id: string) {
  choreIds.value = choreIds.value.includes(id)
    ? choreIds.value.filter((choreId) => choreId !== id)
    : [...choreIds.value, id];
}

const pages = computed(() =>
  from.value && until.value ? rosterPages(from.value, until.value) : [],
);

const summary = computed<string>(() => {
  const days = pages.value.reduce((sum, page) => sum + page.days, 0);
  return `${t('days', days)} · ${t('pages', pages.value.length)}`;
});
</script>

<style scoped>
.chip-row {
  gap: 8px;
}

.filter-chip {
  margin: 0;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  background: transparent;
  color: var(--md3-on-surface-variant);
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Print duty roster'
field:
  range: 'Period'
  chores: 'Chores'
days: '1 day | {n} days'
pages: '1 page | {n} pages'
action:
  cancel: 'Cancel'
  print: 'Print'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienstplan drucken'
field:
  range: 'Zeitraum'
  chores: 'Diensttypen'
days: '1 Tag | {n} Tage'
pages: '1 Seite | {n} Seiten'
action:
  cancel: 'Abbrechen'
  print: 'Drucken'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Imprimer le planning des corvées'
field:
  range: 'Période'
  chores: 'Corvées'
days: '1 jour | {n} jours'
pages: '1 page | {n} pages'
action:
  cancel: 'Annuler'
  print: 'Imprimer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Drukuj grafik dyżurów'
field:
  range: 'Okres'
  chores: 'Obowiązki'
days: '1 dzień | {n} dni'
pages: '1 strona | {n} stron'
action:
  cancel: 'Anuluj'
  print: 'Drukuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vytisknout rozpis služeb'
field:
  range: 'Období'
  chores: 'Povinnosti'
days: '1 den | {n} dní'
pages: '1 strana | {n} stran'
action:
  cancel: 'Zrušit'
  print: 'Tisk'
</i18n>
