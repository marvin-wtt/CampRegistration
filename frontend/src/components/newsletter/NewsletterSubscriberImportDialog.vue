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
            v-model="campId"
            :label="t('input.camp.label')"
            :hint="t('input.camp.hint')"
            :options="campOptions"
            :rules="[(val?: string) => !!val || t('input.camp.rule.required')]"
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
            v-if="selectedCampCountries.length > 0"
            v-model="country"
            :label="t('input.country.label')"
            :hint="t('input.country.hint')"
            :options="selectedCampCountries"
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
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
const { to } = useObjectTranslation();
const assignedCampsStore = useAssignedCampsStore();

defineEmits([...useDialogPluginComponent.emits]);

onMounted(async () => {
  await assignedCampsStore.fetchData();
});

const campId = ref<string>('');
const country = ref<string | null>(null);
const requireConsent = ref(true);
const consentConfirmed = ref(false);

const campOptions = computed(() => {
  return (assignedCampsStore.data ?? []).map((camp) => ({
    label: to(camp.name),
    value: camp.id,
  }));
});

const selectedCampCountries = computed<string[]>(() => {
  if (!campId.value) {
    return [];
  }

  return (
    assignedCampsStore.data?.find((c) => c.id === campId.value)?.countries ?? []
  );
});

watch(campId, () => {
  country.value = null;
  requireConsent.value = true;
});

watch(requireConsent, () => {
  consentConfirmed.value = false;
});

function onSubmit() {
  const data: NewsletterSubscriberImportData = {
    campId: campId.value,
    country: country.value ?? null,
    requireConsent: requireConsent.value,
    consentConfirmed: consentConfirmed.value,
  };
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Import Subscribers from Camp'
input:
  camp:
    label: 'Camp'
    hint: 'Select the camp to import subscribers from'
    rule:
      required: 'Camp is required'
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
title: 'Abonnenten aus Camp importieren'
input:
  camp:
    label: 'Camp'
    hint: 'Wählen Sie das Camp aus, aus dem Abonnenten importiert werden sollen'
    rule:
      required: 'Camp ist erforderlich'
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
title: 'Importer des abonnés depuis un camp'
input:
  camp:
    label: 'Camp'
    hint: 'Sélectionnez le camp depuis lequel importer les abonnés'
    rule:
      required: 'Le camp est requis'
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
title: 'Importuj subskrybentów z obozu'
input:
  camp:
    label: 'Obóz'
    hint: 'Wybierz obóz, z którego mają być importowani subskrybenci'
    rule:
      required: 'Obóz jest wymagany'
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
title: 'Importovat odběratele z tábora'
input:
  camp:
    label: 'Tábor'
    hint: 'Vyberte tábor, ze kterého se mají importovat odběratelé'
    rule:
      required: 'Tábor je povinný'
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
