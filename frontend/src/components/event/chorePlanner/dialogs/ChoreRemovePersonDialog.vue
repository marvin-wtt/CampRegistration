<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="t('title')"
      :subtitle="t('description')"
      :width="480"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-md column no-wrap">
        <q-select
          v-model="registrationId"
          :label="t('field.person')"
          :options="personOptions"
          :rules="[(val) => !!val || t('rule.person')]"
          map-options
          emit-value
          use-input
          input-debounce="0"
          hide-bottom-space
          outlined
          rounded
          @filter="filterPeople"
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-select>

        <div class="field-grid field-grid--2">
          <chore-date-input
            v-model="from"
            :label="t('field.from')"
          />
          <chore-date-input
            v-model="to"
            :label="t('field.to')"
            :min="from ?? undefined"
            clearable
          />
        </div>

        <q-item
          tag="label"
          class="q-px-none"
        >
          <q-item-section>
            <q-item-label>{{ t('field.replace.label') }}</q-item-label>
            <q-item-label caption>
              {{ t('field.replace.hint') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="replace" />
          </q-item-section>
        </q-item>
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
          :label="t('action.remove')"
        />
      </template>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  ChoreRemovePersonData,
  Registration,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';
import { formatLocalDate } from '@/utils/date';
import ChoreDateInput from '@/components/event/chorePlanner/ChoreDateInput.vue';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const registrationHelper = useRegistrationHelper();

const props = defineProps<{
  registrations: Registration[];
  registrationId?: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const registrationId = ref<string | null>(props.registrationId ?? null);
const from = ref<string | null>(formatLocalDate(new Date()));
const to = ref<string | null>(null);
const replace = ref<boolean>(true);
const needle = ref<string>('');

const personOptions = computed<QSelectOption[]>(() =>
  props.registrations
    .filter((registration) => registration.status === 'ACCEPTED')
    .map((registration) => ({
      label: formatPersonName(registrationHelper.uniqueName(registration)),
      value: registration.id,
    }))
    .filter((option) => option.label.toLowerCase().includes(needle.value))
    .sort((a, b) => a.label.localeCompare(b.label)),
);

function filterPeople(value: string, update: (fn: () => void) => void) {
  update(() => {
    needle.value = value.trim().toLowerCase();
  });
}

function onOKClick() {
  if (!registrationId.value || !from.value) {
    return;
  }
  const payload: ChoreRemovePersonData = {
    registrationId: registrationId.value,
    from: from.value,
    ...(to.value ? { to: to.value } : {}),
    replace: replace.value,
  };
  onDialogOK(payload);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Remove from duties'
description: 'For illness, an excursion or leaving early: takes the person off every planned duty in this period.'
field:
  person: 'Person'
  from: 'From'
  to: 'Until (optional)'
  replace:
    label: 'Find replacements'
    hint: 'Fill each spot with the next person whose turn it fairly is.'
rule:
  person: 'Choose a person'
action:
  cancel: 'Cancel'
  remove: 'Remove'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aus Diensten nehmen'
description: 'Bei Krankheit, Ausflug oder früher Abreise: nimmt die Person aus allen geplanten Diensten in diesem Zeitraum.'
field:
  person: 'Person'
  from: 'Ab'
  to: 'Bis (optional)'
  replace:
    label: 'Ersatz finden'
    hint: 'Jeden Platz mit der Person besetzen, die fairerweise als Nächstes dran ist.'
rule:
  person: 'Wähle eine Person'
action:
  cancel: 'Abbrechen'
  remove: 'Entfernen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Retirer des corvées'
description: 'En cas de maladie, de sortie ou de départ anticipé : retire la personne de toutes les corvées prévues sur cette période.'
field:
  person: 'Personne'
  from: 'À partir du'
  to: "Jusqu'au (facultatif)"
  replace:
    label: 'Trouver des remplaçants'
    hint: 'Attribuer chaque place à la personne dont c’est équitablement le tour.'
rule:
  person: 'Choisis une personne'
action:
  cancel: 'Annuler'
  remove: 'Retirer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Usuń z dyżurów'
description: 'W razie choroby, wycieczki lub wcześniejszego wyjazdu: usuwa osobę ze wszystkich zaplanowanych dyżurów w tym okresie.'
field:
  person: 'Osoba'
  from: 'Od'
  to: 'Do (opcjonalnie)'
  replace:
    label: 'Znajdź zastępstwo'
    hint: 'Obsadź każde miejsce osobą, na którą sprawiedliwie przypada kolej.'
rule:
  person: 'Wybierz osobę'
action:
  cancel: 'Anuluj'
  remove: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odebrat ze služeb'
description: 'Při nemoci, výletu nebo dřívějším odjezdu: odebere osobu ze všech naplánovaných služeb v tomto období.'
field:
  person: 'Osoba'
  from: 'Od'
  to: 'Do (volitelné)'
  replace:
    label: 'Najít náhradu'
    hint: 'Obsadit každé místo osobou, která je spravedlivě na řadě.'
rule:
  person: 'Vyber osobu'
action:
  cancel: 'Zrušit'
  remove: 'Odebrat'
</i18n>
