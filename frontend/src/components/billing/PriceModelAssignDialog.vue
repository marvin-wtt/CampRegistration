<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="price-model-assign-card">
      <q-form @submit="onSubmit">
        <q-card-section>
          <div class="text-h6">{{ t('title') }}</div>
          <div class="text-caption text-on-surface-variant">{{ subject }}</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="selected"
            :options
            :loading="loading"
            :label="t('field.priceModel')"
            :hint="t(`hint.${scope}`)"
            options-selected-class=""
            emit-value
            map-options
            color="primary"
            outlined
            rounded
          >
            <template #option="option">
              <q-item v-bind="option.itemProps">
                <q-item-section>
                  <q-item-label>{{ option.opt.label }}</q-item-label>
                  <q-item-label
                    v-if="option.opt.caption"
                    caption
                  >
                    {{ option.opt.caption }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-toggle
            v-if="scope === 'organization'"
            v-model="applyToUpcomingEvents"
            :label="t('applyToUpcomingEvents')"
            :disable="selected === current"
            color="primary"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            flat
            rounded
            no-caps
            color="primary"
            @click="onDialogCancel"
          />
          <q-btn
            :label="t('action.save')"
            :disable="loading || selected === null"
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
import { formatMoney } from '@/utils/money';
import { useObjectTranslation } from '@/composables/objectTranslation';

export interface PriceModelAssignResult {
  priceModelId: string;
  /** Organizations only: move upcoming events still on the old model too. */
  applyToUpcomingEvents: boolean;
}

const {
  subject,
  scope,
  current = null,
} = defineProps<{
  /** What the model is assigned to, shown under the title. */
  subject: string;
  scope: 'organization' | 'event';
  current?: string | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const { withErrorNotification } = useServiceNotifications('billing');

const selected = ref<string | null>(current);
const applyToUpcomingEvents = ref(false);
const priceModels = ref<PriceModel[]>([]);
const loading = ref(true);

void withErrorNotification('fetch', () => api.fetchPriceModels())
  .then((models) => {
    priceModels.value = models ?? [];
  })
  .finally(() => {
    loading.value = false;
  });

function describe(model: PriceModel): string {
  const price = formatMoney(
    model.pricePerRegistration,
    model.currency,
    locale.value,
  );
  const baseFee = formatMoney(model.baseFee, model.currency, locale.value);

  return t('caption', { price, baseFee, taxRate: model.taxRate });
}

// Archived models cannot be assigned, but the current one stays listed so the
// select does not show a bare id.
const options = computed(() =>
  priceModels.value
    .filter((model) => !model.archivedAt || model.id === current)
    .map((model) => ({
      label: to(model.name),
      value: model.id,
      caption: describe(model),
      disable: !!model.archivedAt,
    })),
);

function onSubmit() {
  if (selected.value === null) {
    return;
  }

  onDialogOK({
    priceModelId: selected.value,
    applyToUpcomingEvents:
      scope === 'organization' &&
      selected.value !== current &&
      applyToUpcomingEvents.value,
  } satisfies PriceModelAssignResult);
}
</script>

<style scoped lang="scss">
.price-model-assign-card {
  width: 440px;
  max-width: 90vw;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Price model'
caption: '{price} per registration · {baseFee} base fee · {taxRate} % tax'
field:
  priceModel: 'Price model'
hint:
  organization: 'New events are priced with it. Existing events keep the model they were created with.'
  event: 'Replaces the model this event was created with.'
applyToUpcomingEvents: "Also apply to events that haven't started yet"
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Preismodell'
caption: '{price} pro Anmeldung · {baseFee} Grundgebühr · {taxRate} % Steuer'
field:
  priceModel: 'Preismodell'
hint:
  organization: 'Neue Veranstaltungen werden damit abgerechnet. Bestehende behalten das Modell, mit dem sie erstellt wurden.'
  event: 'Ersetzt das Modell, mit dem diese Veranstaltung erstellt wurde.'
applyToUpcomingEvents: 'Auch auf Veranstaltungen anwenden, die noch nicht begonnen haben'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modèle tarifaire'
caption: '{price} par inscription · {baseFee} de frais de base · {taxRate} % de taxe'
field:
  priceModel: 'Modèle tarifaire'
hint:
  organization: 'Les nouveaux événements sont facturés avec ce modèle. Les événements existants gardent celui avec lequel ils ont été créés.'
  event: 'Remplace le modèle avec lequel cet événement a été créé.'
applyToUpcomingEvents: "Appliquer aussi aux événements qui n'ont pas encore commencé"
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Model cenowy'
caption: '{price} za zgłoszenie · {baseFee} opłaty podstawowej · {taxRate} % podatku'
field:
  priceModel: 'Model cenowy'
hint:
  organization: 'Nowe wydarzenia są rozliczane według tego modelu. Istniejące zachowują model, z którym zostały utworzone.'
  event: 'Zastępuje model, z którym to wydarzenie zostało utworzone.'
applyToUpcomingEvents: 'Zastosuj także do wydarzeń, które jeszcze się nie rozpoczęły'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Cenový model'
caption: '{price} za přihlášku · {baseFee} základní poplatek · {taxRate} % daň'
field:
  priceModel: 'Cenový model'
hint:
  organization: 'Nové akce se účtují podle tohoto modelu. Stávající akce si ponechají model, se kterým byly vytvořeny.'
  event: 'Nahrazuje model, se kterým byla tato akce vytvořena.'
applyToUpcomingEvents: 'Použít také na akce, které ještě nezačaly'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
