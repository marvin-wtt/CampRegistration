<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <i18n-t
          keypath="text"
          tag="p"
        >
          <template #name>
            <strong>{{ personName }}</strong>
          </template>
          <template #current>
            <strong>{{ currentName }}</strong>
          </template>
        </i18n-t>

        <q-option-group
          v-model="target"
          :options
          type="radio"
          color="primary"
          data-test="registration-move-target"
        >
          <template #label="option">
            <div class="row items-center no-wrap q-gutter-x-sm">
              <country-icon :country="option.value" />
              <div>
                <div>{{ option.label }}</div>
                <div
                  v-if="option.caption"
                  class="text-caption text-on-surface-variant"
                >
                  {{ option.caption }}
                </div>
              </div>
            </div>
          </template>
        </q-option-group>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-banner
          dense
          rounded
          class="bg-warning-container text-on-warning-container text-body2"
        >
          {{ t('warning', { current: currentName }) }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.move')"
          :disable="!target"
          color="primary"
          rounded
          data-test="registration-move-submit"
          @click="onDialogOK({ group: target })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { countryName } from '@/utils/countries';
import { groupFreePlaces } from '@/utils/eventAvailability';

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { registration, event } = defineProps<{
  registration: Registration;
  event: EventDetails;
}>();

const target = ref<string | null>(null);

const personName = computed<string>(() => {
  const firstName = registration.computedData.firstName?.trim() ?? '';
  const lastName = registration.computedData.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? fullName : '?';
});

const currentName = computed<string>(() =>
  registration.group ? countryName(registration.group, locale.value) : '—',
);

interface MoveOption {
  value: string;
  label: string;
  caption: string | null;
}

const options = computed<MoveOption[]>(() =>
  event.countries
    .filter((group) => group !== registration.group)
    .map((group) => {
      const free = groupFreePlaces(event, group);

      return {
        value: group,
        label: countryName(group, locale.value),
        caption:
          free === null
            ? null
            : free === 0
              ? t('full')
              : t('placesLeft', { count: free }, free),
      };
    }),
);
</script>

<i18n locale="en" lang="yaml">
title: 'Change group'
text: 'Move the registration of {name} from {current} to:'
warning: 'The registration was filled in and its terms accepted for {current}. The answers stay as given and are not checked against the new group. Status and waiting list stay unchanged, and no message is sent.'
full: 'No places left'
placesLeft: 'No places left | 1 place left | {count} places left'
action:
  move: 'Move'
  cancel: 'Cancel'
</i18n>

<i18n locale="de" lang="yaml">
title: 'Gruppe wechseln'
text: 'Anmeldung von {name} von {current} verschieben nach:'
warning: 'Die Anmeldung wurde für {current} ausgefüllt und deren Bedingungen akzeptiert. Die Antworten bleiben unverändert und werden nicht gegen die neue Gruppe geprüft. Status und Warteliste bleiben gleich, und es wird keine Nachricht gesendet.'
full: 'Keine Plätze frei'
placesLeft: 'Keine Plätze frei | 1 Platz frei | {count} Plätze frei'
action:
  move: 'Verschieben'
  cancel: 'Abbrechen'
</i18n>

<i18n locale="fr" lang="yaml">
title: 'Changer de groupe'
text: "Déplacer l'inscription de {name} de {current} vers :"
warning: "L'inscription a été remplie et ses conditions acceptées pour {current}. Les réponses restent telles quelles et ne sont pas vérifiées pour le nouveau groupe. Le statut et la liste d'attente ne changent pas, et aucun message n'est envoyé."
full: 'Aucune place restante'
placesLeft: 'Aucune place restante | 1 place restante | {count} places restantes'
action:
  move: 'Déplacer'
  cancel: 'Annuler'
</i18n>

<i18n locale="pl" lang="yaml">
title: 'Zmień grupę'
text: 'Przenieś zgłoszenie {name} z: {current} do:'
warning: 'Zgłoszenie zostało wypełnione, a jego warunki zaakceptowane dla: {current}. Odpowiedzi pozostają bez zmian i nie są sprawdzane pod kątem nowej grupy. Status i lista oczekujących się nie zmieniają, a żadna wiadomość nie zostanie wysłana.'
full: 'Brak wolnych miejsc'
placesLeft: 'Wolne miejsca: {count}'
action:
  move: 'Przenieś'
  cancel: 'Anuluj'
</i18n>

<i18n locale="cs" lang="yaml">
title: 'Změnit skupinu'
text: 'Přesunout registraci {name} z: {current} do:'
warning: 'Registrace byla vyplněna a její podmínky přijaty pro: {current}. Odpovědi zůstávají beze změny a nekontrolují se vůči nové skupině. Stav ani čekací listina se nemění a žádná zpráva se neodešle.'
full: 'Žádná volná místa'
placesLeft: 'Volná místa: {count}'
action:
  move: 'Přesunout'
  cancel: 'Zrušit'
</i18n>
