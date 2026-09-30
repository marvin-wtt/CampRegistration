<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="event-bill-card">
      <q-form @submit="onSubmit">
        <q-card-section class="q-pb-none">
          <div class="text-h6">{{ t(`title.${mode}`) }}</div>
          <div class="text-caption text-on-surface-variant">{{ subject }}</div>
        </q-card-section>

        <q-card-section class="event-bill-fields">
          <q-select
            v-if="mode !== 'correct'"
            v-model="priceModelId"
            :options="priceModelOptions"
            :loading="loadingModels"
            :label="t('field.priceModel')"
            class="span-2"
            color="primary"
            options-selected-class=""
            emit-value
            map-options
            hide-bottom-space
            outlined
            rounded
          />

          <q-input
            v-model.number="count"
            :label="t('field.count')"
            :placeholder="measured === null ? undefined : String(measured)"
            :rules="[nonNegativeInteger]"
            color="primary"
            type="number"
            min="0"
            step="1"
            stack-label
            hide-bottom-space
            outlined
            rounded
          />

          <div class="measured text-caption text-on-surface-variant">
            <template v-if="measured !== null">
              {{ t('measured', { count: measured }) }}
            </template>
            <template v-else>
              {{ t('countedNow') }}
            </template>
          </div>

          <q-input
            v-model="note"
            :label="t('field.note')"
            class="span-2"
            color="primary"
            type="textarea"
            rows="3"
            hide-bottom-space
            outlined
            rounded
          />

          <div class="span-2 text-caption text-on-surface-variant">
            {{ t(`hint.${mode}`) }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            color="primary"
            flat
            rounded
            no-caps
            @click="onDialogCancel"
          />
          <q-btn
            :label="mode === 'correct' ? t('action.save') : t('action.create')"
            :disable="mode !== 'correct' && loadingModels"
            type="submit"
            color="primary"
            unelevated
            rounded
            no-caps
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { PriceModel } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useObjectTranslation } from '@/composables/objectTranslation';

export interface EventBillDialogResult {
  /** `undefined`: the event's price model (else the organization's). */
  priceModelId?: string;
  /** `null`: no correction — the measured count is billed. */
  adjustedRegistrationCount: number | null;
  note: string | null;
}

const {
  mode,
  subject,
  measured = null,
  adjusted = null,
  note: initialNote = null,
} = defineProps<{
  /**
   * `correct` an open bill's count, `rebill` after a bill was voided, or
   * `bill` an ended event that has no bill.
   */
  mode: 'correct' | 'rebill' | 'bill';
  subject: string;
  /** The measured count, when there is one to show. */
  measured?: number | null;
  /** An existing correction to start from. */
  adjusted?: number | null;
  note?: string | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const { withErrorNotification } = useServiceNotifications('billing');

/**
 * The "use the event's model" option. QSelect treats a `null` value as
 * nothing selected, so it is `''` — never a ULID — and is dropped on submit.
 */
const EVENT_MODEL = '';

const priceModelId = ref<string>(EVENT_MODEL);
const count = ref<number | string>(adjusted ?? '');
const note = ref<string>(initialNote ?? '');

const priceModels = ref<PriceModel[]>([]);
const loadingModels = ref(mode !== 'correct');

if (mode !== 'correct') {
  void withErrorNotification('fetch', () => api.fetchPriceModels())
    .then((models) => {
      priceModels.value = models ?? [];
    })
    .finally(() => {
      loadingModels.value = false;
    });
}

const priceModelOptions = computed(() => [
  { label: t('eventModel'), value: EVENT_MODEL },
  ...priceModels.value
    .filter((model) => !model.archivedAt)
    .map((model) => ({ label: to(model.name), value: model.id })),
]);

const nonNegativeInteger = (value: number | string) =>
  value === '' ||
  (Number.isInteger(Number(value)) && Number(value) >= 0) ||
  t('validation.count');

function onSubmit() {
  onDialogOK({
    ...(priceModelId.value !== EVENT_MODEL
      ? { priceModelId: priceModelId.value }
      : {}),
    adjustedRegistrationCount: count.value === '' ? null : Number(count.value),
    note: note.value.trim() || null,
  } satisfies EventBillDialogResult);
}
</script>

<style scoped lang="scss">
.event-bill-card {
  width: 520px;
  max-width: 90vw;
}

.event-bill-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: center;

  .span-2 {
    grid-column: span 2;
  }

  @media (max-width: 599px) {
    grid-template-columns: 1fr;

    .span-2 {
      grid-column: auto;
    }
  }
}
</style>

<i18n lang="yaml" locale="en">
title:
  correct: 'Correct registrations'
  rebill: 'Bill again'
  bill: 'Bill event'
field:
  priceModel: 'Price model'
  count: 'Registrations billed'
  note: 'Note (optional)'
eventModel: "The event's price model"
measured: 'Counted: {count}. Leave empty to bill that.'
countedNow: 'Leave empty to bill the accepted registrations now.'
hint:
  correct: 'The bill is re-priced with the prices already on it. The counted registrations stay on record.'
  rebill: 'A new bill is issued at once. The voided bill stays on record, linked to it.'
  bill: 'The event is billed at once, finalized with the chosen price model.'
validation:
  count: 'A whole number, 0 or more'
action:
  cancel: 'Cancel'
  save: 'Save'
  create: 'Create bill'
</i18n>

<i18n lang="yaml" locale="de">
title:
  correct: 'Anmeldungen korrigieren'
  rebill: 'Neu abrechnen'
  bill: 'Veranstaltung abrechnen'
field:
  priceModel: 'Preismodell'
  count: 'Abgerechnete Anmeldungen'
  note: 'Notiz (optional)'
eventModel: 'Preismodell der Veranstaltung'
measured: 'Gezählt: {count}. Leer lassen, um diese Zahl abzurechnen.'
countedNow: 'Leer lassen, um die jetzt angenommenen Anmeldungen abzurechnen.'
hint:
  correct: 'Die Rechnung wird mit den bereits hinterlegten Preisen neu berechnet. Die gezählten Anmeldungen bleiben erhalten.'
  rebill: 'Es wird sofort eine neue Rechnung erstellt. Die stornierte Rechnung bleibt verknüpft erhalten.'
  bill: 'Die Veranstaltung wird sofort mit dem gewählten Preismodell abgerechnet.'
validation:
  count: 'Eine ganze Zahl, 0 oder größer'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
  create: 'Rechnung erstellen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  correct: 'Corriger les inscriptions'
  rebill: 'Facturer à nouveau'
  bill: "Facturer l'événement"
field:
  priceModel: 'Modèle tarifaire'
  count: 'Inscriptions facturées'
  note: 'Note (facultative)'
eventModel: "Le modèle tarifaire de l'événement"
measured: 'Comptées : {count}. Laissez vide pour facturer ce nombre.'
countedNow: 'Laissez vide pour facturer les inscriptions acceptées à cet instant.'
hint:
  correct: 'La facture est recalculée avec les prix déjà enregistrés. Les inscriptions comptées restent archivées.'
  rebill: 'Une nouvelle facture est émise immédiatement. La facture annulée reste archivée et liée à celle-ci.'
  bill: "L'événement est facturé immédiatement avec le modèle tarifaire choisi."
validation:
  count: 'Un nombre entier, 0 ou plus'
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
  create: 'Créer la facture'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  correct: 'Popraw liczbę zgłoszeń'
  rebill: 'Rozlicz ponownie'
  bill: 'Rozlicz wydarzenie'
field:
  priceModel: 'Model cenowy'
  count: 'Rozliczane zgłoszenia'
  note: 'Notatka (opcjonalnie)'
eventModel: 'Model cenowy wydarzenia'
measured: 'Policzono: {count}. Pozostaw puste, aby rozliczyć tę liczbę.'
countedNow: 'Pozostaw puste, aby rozliczyć obecnie zaakceptowane zgłoszenia.'
hint:
  correct: 'Rachunek zostanie przeliczony według zapisanych w nim cen. Policzone zgłoszenia pozostają w dokumentacji.'
  rebill: 'Nowy rachunek zostanie wystawiony od razu. Anulowany rachunek pozostaje w dokumentacji, powiązany z nim.'
  bill: 'Wydarzenie zostanie od razu rozliczone według wybranego modelu cenowego.'
validation:
  count: 'Liczba całkowita, 0 lub więcej'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
  create: 'Wystaw rachunek'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  correct: 'Opravit přihlášky'
  rebill: 'Vyúčtovat znovu'
  bill: 'Vyúčtovat akci'
field:
  priceModel: 'Cenový model'
  count: 'Účtované přihlášky'
  note: 'Poznámka (nepovinná)'
eventModel: 'Cenový model akce'
measured: 'Napočítáno: {count}. Ponechte prázdné pro vyúčtování tohoto počtu.'
countedNow: 'Ponechte prázdné pro vyúčtování právě přijatých přihlášek.'
hint:
  correct: 'Faktura se přepočítá podle cen, které již obsahuje. Napočítané přihlášky zůstanou zaznamenány.'
  rebill: 'Ihned se vystaví nová faktura. Stornovaná faktura zůstane zaznamenána a propojena s ní.'
  bill: 'Akce se ihned vyúčtuje podle zvoleného cenového modelu.'
validation:
  count: 'Celé číslo, 0 nebo více'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
  create: 'Vystavit fakturu'
</i18n>
