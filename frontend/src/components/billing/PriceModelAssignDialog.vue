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

          <template v-if="scope === 'organization'">
            <q-option-group
              v-model="mode"
              :options="modeOptions"
              color="primary"
              class="q-mt-md"
            />
            <q-input
              v-if="mode === 'offer'"
              v-model="effectiveOn"
              :label="t('field.effectiveOn')"
              :hint="t('hint.effectiveOn', { days: MIN_NOTICE_DAYS })"
              :rules="[
                (value: string) =>
                  value >= earliest ||
                  t('rule.effectiveOn', { days: MIN_NOTICE_DAYS }),
              ]"
              :min="earliest"
              type="date"
              color="primary"
              outlined
              rounded
              class="q-mt-sm"
            />
          </template>
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
import {
  PRICE_MODEL_OFFER_MIN_NOTICE_DAYS,
  type PriceModel,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { formatMoney } from '@/utils/money';
import { useObjectTranslation } from '@/composables/objectTranslation';

export interface PriceModelAssignResult {
  priceModelId: string;
  /**
   * Organizations only. `offer`: the organization has to accept, unless
   * nothing gets more expensive. `direct`: assigned at once, for changes
   * agreed outside the app.
   */
  mode: 'offer' | 'direct';
  /** `offer` only: `YYYY-MM-DD`. */
  effectiveOn: string;
}

const MIN_NOTICE_DAYS = PRICE_MODEL_OFFER_MIN_NOTICE_DAYS;

/** `YYYY-MM-DD`, `days` from today in the viewer's time zone. */
function dayFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
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
const mode = ref<'offer' | 'direct'>('offer');
const earliest = dayFromToday(MIN_NOTICE_DAYS);
const effectiveOn = ref(dayFromToday(30));

const modeOptions = computed(() => [
  { label: t('mode.offer'), value: 'offer' },
  { label: t('mode.direct'), value: 'direct' },
]);
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
    mode: scope === 'organization' ? mode.value : 'direct',
    effectiveOn: effectiveOn.value,
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
  effectiveOn: 'Effective from'
mode:
  offer: 'Send as an offer: the organization has to accept a price increase'
  direct: 'Assign directly: already agreed outside the app'
rule:
  effectiveOn: 'At least {days} days ahead'
hint:
  effectiveOn: "At least {days} days ahead. From then on, the organization can't create events until it accepts."
  organization: 'New events are priced with it. Existing events keep the model they were created with.'
  event: 'Replaces the model this event was created with.'
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Preismodell'
caption: '{price} pro Anmeldung · {baseFee} Grundgebühr · {taxRate} % Steuer'
field:
  priceModel: 'Preismodell'
  effectiveOn: 'Gültig ab'
mode:
  offer: 'Als Angebot senden: Eine Preiserhöhung muss die Organisation annehmen'
  direct: 'Direkt zuweisen: bereits außerhalb der App vereinbart'
rule:
  effectiveOn: 'Mindestens {days} Tage im Voraus'
hint:
  effectiveOn: 'Mindestens {days} Tage im Voraus. Ab dann kann die Organisation keine Veranstaltungen anlegen, bis sie zustimmt.'
  organization: 'Neue Veranstaltungen werden damit abgerechnet. Bestehende behalten das Modell, mit dem sie erstellt wurden.'
  event: 'Ersetzt das Modell, mit dem diese Veranstaltung erstellt wurde.'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modèle tarifaire'
caption: '{price} par inscription · {baseFee} de frais de base · {taxRate} % de taxe'
field:
  priceModel: 'Modèle tarifaire'
  effectiveOn: 'En vigueur à partir du'
mode:
  offer: "Envoyer comme offre : l'organisation doit accepter une hausse de prix"
  direct: "Attribuer directement : déjà convenu en dehors de l'application"
rule:
  effectiveOn: "Au moins {days} jours à l'avance"
hint:
  effectiveOn: "Au moins {days} jours à l'avance. Ensuite, l'organisation ne peut plus créer d'événements tant qu'elle n'a pas accepté."
  organization: 'Les nouveaux événements sont facturés avec ce modèle. Les événements existants gardent celui avec lequel ils ont été créés.'
  event: 'Remplace le modèle avec lequel cet événement a été créé.'
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Model cenowy'
caption: '{price} za zgłoszenie · {baseFee} opłaty podstawowej · {taxRate} % podatku'
field:
  priceModel: 'Model cenowy'
  effectiveOn: 'Obowiązuje od'
mode:
  offer: 'Wyślij jako ofertę: organizacja musi zaakceptować podwyżkę'
  direct: 'Przypisz bezpośrednio: uzgodnione już poza aplikacją'
rule:
  effectiveOn: 'Co najmniej {days} dni wcześniej'
hint:
  effectiveOn: 'Co najmniej {days} dni wcześniej. Od tego dnia organizacja nie może tworzyć wydarzeń, dopóki nie zaakceptuje.'
  organization: 'Nowe wydarzenia są rozliczane według tego modelu. Istniejące zachowują model, z którym zostały utworzone.'
  event: 'Zastępuje model, z którym to wydarzenie zostało utworzone.'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Cenový model'
caption: '{price} za přihlášku · {baseFee} základní poplatek · {taxRate} % daň'
field:
  priceModel: 'Cenový model'
  effectiveOn: 'Platné od'
mode:
  offer: 'Odeslat jako nabídku: zdražení musí organizace přijmout'
  direct: 'Přiřadit přímo: již dohodnuto mimo aplikaci'
rule:
  effectiveOn: 'Nejméně {days} dní předem'
hint:
  effectiveOn: 'Nejméně {days} dní předem. Od té doby nemůže organizace vytvářet akce, dokud nový model nepřijme.'
  organization: 'Nové akce se účtují podle tohoto modelu. Stávající akce si ponechají model, se kterým byly vytvořeny.'
  event: 'Nahrazuje model, se kterým byla tato akce vytvořena.'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
