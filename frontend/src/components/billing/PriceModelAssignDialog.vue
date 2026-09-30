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
            :hint="inherit ? t('hint.event') : t('hint.organization')"
            options-selected-class=""
            emit-value
            map-options
            color="primary"
            outlined
            rounded
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label
                    v-if="scope.opt.caption"
                    caption
                  >
                    {{ scope.opt.caption }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
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
            :disable="loading || (!inherit && selected === null)"
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

const {
  subject,
  current = null,
  inherit = false,
} = defineProps<{
  /** What the model is assigned to, shown under the title. */
  subject: string;
  current?: string | null;
  /** Offer "use the organization's model" (`null`) — for events. */
  inherit?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const { withErrorNotification } = useServiceNotifications('billing');

/**
 * The inherit option's value. QSelect treats a `null` option value as "nothing
 * selected", so it is `''` here — never a ULID — and becomes `null` on submit.
 */
const INHERIT = '';

const selected = ref<string | null>(current ?? (inherit ? INHERIT : null));
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
const options = computed(() => [
  ...(inherit
    ? [{ label: t('inherit'), value: INHERIT, caption: t('inheritCaption') }]
    : []),
  ...priceModels.value
    .filter((model) => !model.archivedAt || model.id === current)
    .map((model) => ({
      label: to(model.name),
      value: model.id,
      caption: describe(model),
      disable: !!model.archivedAt,
    })),
]);

function onSubmit() {
  onDialogOK(selected.value === INHERIT ? null : selected.value);
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
inherit: "Use the organization's model"
inheritCaption: 'No override for this event'
field:
  priceModel: 'Price model'
hint:
  organization: 'Applies to all events of the organization without an override'
  event: "Overrides the organization's model for this event only"
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Preismodell'
caption: '{price} pro Anmeldung · {baseFee} Grundgebühr · {taxRate} % Steuer'
inherit: 'Modell der Organisation verwenden'
inheritCaption: 'Keine Abweichung für diese Veranstaltung'
field:
  priceModel: 'Preismodell'
hint:
  organization: 'Gilt für alle Veranstaltungen der Organisation ohne eigenes Modell'
  event: 'Ersetzt das Modell der Organisation nur für diese Veranstaltung'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modèle tarifaire'
caption: '{price} par inscription · {baseFee} de frais de base · {taxRate} % de taxe'
inherit: "Utiliser le modèle de l'organisation"
inheritCaption: 'Aucune dérogation pour cet événement'
field:
  priceModel: 'Modèle tarifaire'
hint:
  organization: "S'applique à tous les événements de l'organisation sans dérogation"
  event: "Remplace le modèle de l'organisation pour cet événement uniquement"
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Model cenowy'
caption: '{price} za zgłoszenie · {baseFee} opłaty podstawowej · {taxRate} % podatku'
inherit: 'Użyj modelu organizacji'
inheritCaption: 'Brak odstępstwa dla tego wydarzenia'
field:
  priceModel: 'Model cenowy'
hint:
  organization: 'Dotyczy wszystkich wydarzeń organizacji bez własnego modelu'
  event: 'Zastępuje model organizacji tylko dla tego wydarzenia'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Cenový model'
caption: '{price} za přihlášku · {baseFee} základní poplatek · {taxRate} % daň'
inherit: 'Použít model organizace'
inheritCaption: 'Bez výjimky pro tuto akci'
field:
  priceModel: 'Cenový model'
hint:
  organization: 'Platí pro všechny akce organizace bez vlastního modelu'
  event: 'Nahrazuje model organizace pouze pro tuto akci'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
