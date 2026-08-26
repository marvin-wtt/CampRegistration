<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onSubmit"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h6">
          {{ t('title') }}
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-select
            v-model="eventId"
            :label="t('input.event.label')"
            :hint="t('input.event.hint')"
            :options="eventOptions"
            :rules="[(val?: string) => !!val || t('input.event.rule.required')]"
            emit-value
            map-options
            hide-bottom-space
            autofocus
            rounded
            outlined
          >
            <template #before>
              <q-icon name="home" />
            </template>
          </q-select>
          <q-select
            v-if="selectedEventCountries.length > 0"
            v-model="country"
            :label="t('input.country.label')"
            :hint="t('input.country.hint')"
            :options="selectedEventCountries"
            clearable
            rounded
            outlined
          >
            <template #before>
              <q-icon name="group" />
            </template>
          </q-select>
          <div>
            <q-toggle
              v-model="requireConsent"
              :label="t('input.consent.label')"
            />
            <div class="text-caption text-on-surface-variant q-ml-sm">
              {{ t('input.consent.hint') }}
            </div>
          </div>

          <div v-if="!requireConsent">
            <q-checkbox
              v-model="consentConfirmed"
              :label="t('input.consentConfirmation.label')"
            />
            <div class="text-caption text-on-surface-variant q-ml-sm">
              {{ t('input.consentConfirmation.hint') }}
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none text-caption text-on-surface-variant">
          {{ t('notice') }}
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            flat
            outline
            rounded
          />
          <q-btn
            :label="t('action.import')"
            type="submit"
            color="primary"
            :disable="!requireConsent && !consentConfirmed"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import type { NewsletterSubscriberImportData } from '@camp-registration/common/entities';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
const { to } = useObjectTranslation();
const assignedEventsStore = useAssignedEventsStore();

defineEmits([...useDialogPluginComponent.emits]);

onMounted(async () => {
  await assignedEventsStore.fetchData();
});

const eventId = ref<string>('');
const country = ref<string | null>(null);
const requireConsent = ref(true);
const consentConfirmed = ref(false);

const eventOptions = computed(() => {
  return (assignedEventsStore.data ?? []).map((event) => ({
    label: to(event.name),
    value: event.id,
  }));
});

const selectedEventCountries = computed<string[]>(() => {
  if (!eventId.value) {
    return [];
  }

  return (
    assignedEventsStore.data?.find((c) => c.id === eventId.value)?.countries ??
    []
  );
});

watch(eventId, () => {
  country.value = null;
  requireConsent.value = true;
});

watch(requireConsent, () => {
  consentConfirmed.value = false;
});

function onSubmit() {
  const data: NewsletterSubscriberImportData = {
    eventId: eventId.value,
    country: country.value ?? null,
    requireConsent: requireConsent.value,
    consentConfirmed: consentConfirmed.value,
  };
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Import Subscribers from Event'
input:
  event:
    label: 'Event'
    hint: 'Select the event to import subscribers from'
    rule:
      required: 'Event is required'
  country:
    label: 'Filter by Country (optional)'
    hint: 'Leave empty to import all countries'
  consent:
    label: 'Require explicit newsletter consent'
    hint: 'Registrations that declined are always excluded.'
  consentConfirmation:
    label: 'I confirm that these people agreed to receive this newsletter'
    hint: 'Required when importing registrations that did not explicitly consent.'
notice: 'Registrations without an email address and existing subscribers are skipped.'
action:
  import: 'Import'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Abonnenten aus einer Veranstaltung importieren'
input:
  event:
    label: 'Veranstaltung'
    hint: 'Wählen Sie die Veranstaltung aus, aus dem Abonnenten importiert werden sollen'
    rule:
      required: 'Veranstaltung ist erforderlich'
  country:
    label: 'Nach Land filtern (optional)'
    hint: 'Leer lassen, um alle Länder zu importieren'
  consent:
    label: 'Ausdrückliche Newsletter-Einwilligung erforderlich'
    hint: 'Anmeldungen, die abgelehnt haben, werden immer ausgeschlossen.'
  consentConfirmation:
    label: 'Ich bestätige, dass diese Personen dem Erhalt dieses Newsletters zugestimmt haben'
    hint: 'Erforderlich beim Import von Anmeldungen ohne ausdrückliche Einwilligung.'
notice: 'Anmeldungen ohne E-Mail-Adresse und bereits vorhandene Abonnenten werden übersprungen.'
action:
  import: 'Importieren'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Importer des abonnés depuis un événement'
input:
  event:
    label: 'Événement'
    hint: "Sélectionnez l'événement depuis lequel importer les abonnés"

    rule:
      required: "L'événement est requis"

  country:
    label: 'Filtrer par pays (optionnel)'
    hint: 'Laisser vide pour importer tous les pays'
  consent:
    label: 'Exiger un consentement explicite à la newsletter'
    hint: 'Les inscriptions ayant refusé sont toujours exclues.'
  consentConfirmation:
    label: 'Je confirme que ces personnes ont accepté de recevoir cette newsletter'
    hint: "Requis lors de l'import d'inscriptions sans consentement explicite."
notice: 'Les inscriptions sans adresse e-mail et les abonnés existants sont ignorés.'
action:
  import: 'Importer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Importuj subskrybentów z wydarzenia'
input:
  event:
    label: 'Wydarzenie'
    hint: 'Wybierz wydarzenie, z którego mają być importowani subskrybenci'
    rule:
      required: 'Wydarzenie jest wymagany'
  country:
    label: 'Filtruj według kraju (opcjonalnie)'
    hint: 'Pozostaw puste, aby importować wszystkie kraje'
  consent:
    label: 'Wymagaj wyraźnej zgody na newsletter'
    hint: 'Zgłoszenia, które odmówiły, są zawsze wykluczone.'
  consentConfirmation:
    label: 'Potwierdzam, że te osoby wyraziły zgodę na otrzymywanie tego newslettera'
    hint: 'Wymagane przy imporcie zgłoszeń bez wyraźnej zgody.'
notice: 'Zgłoszenia bez adresu e-mail oraz istniejący subskrybenci są pomijani.'
action:
  import: 'Importuj'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Importovat odběratele z akce'
input:
  event:
    label: 'Akce'
    hint: 'Vyberte akci, ze které se mají importovat odběratelé'
    rule:
      required: 'Akce je povinná'
  country:
    label: 'Filtrovat podle země (volitelné)'
    hint: 'Nechte prázdné pro import všech zemí'
  consent:
    label: 'Vyžadovat výslovný souhlas s newsletterem'
    hint: 'Registrace, které odmítly, jsou vždy vyloučeny.'
  consentConfirmation:
    label: 'Potvrzuji, že tyto osoby souhlasily se zasíláním tohoto newsletteru'
    hint: 'Vyžadováno při importu registrací bez výslovného souhlasu.'
notice: 'Registrace bez e-mailové adresy a stávající odběratelé budou přeskočeni.'
action:
  import: 'Importovat'
  cancel: 'Zrušit'
</i18n>

<style scoped></style>
