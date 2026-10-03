<template>
  <div class="offer-strip">
    <q-icon
      :name="due ? 'block' : 'schedule'"
      :class="due ? 'offer-strip__icon--due' : 'offer-strip__icon--pending'"
      size="22px"
      class="offer-strip__icon"
    />
    <div class="offer-strip__text">
      <div
        :class="due ? 'offer-strip__icon--due' : 'offer-strip__icon--pending'"
        class="text-subtitle2"
      >
        {{ due ? t('title.due', { date }) : t('title.pending', { date }) }}
      </div>
      <div class="text-body2 text-on-surface-variant">
        {{
          canAccept
            ? due
              ? t('blocked')
              : t('notice', { date })
            : t('adminsOnly')
        }}
      </div>
    </div>
    <q-btn
      v-if="canAccept"
      :label="t('action.accept')"
      :loading="busy"
      color="primary"
      class="offer-strip__action"
      unelevated
      rounded
      no-caps
      @click="confirmAccept"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { PriceModelOffer } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useObjectTranslation } from '@/composables/objectTranslation';

/**
 * The top of the price model card while a price change awaits acceptance:
 * what is due when, and the accept action for those allowed to agree.
 */
const { offer, organizationId, organizationName, canAccept } = defineProps<{
  offer: PriceModelOffer;
  organizationId: string;
  organizationName: string;
  /** Only organization admins may agree to a change of terms. */
  canAccept: boolean;
}>();

const emit = defineEmits<{
  accepted: [];
}>();

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const api = useAPIService();
const { withProgressNotification } = useServiceNotifications('billing');

const busy = ref(false);

const due = computed(() => new Date(offer.effectiveAt) <= new Date());
const date = computed(() => d(new Date(offer.effectiveAt), 'short'));

/** Agreeing changes the contract, so it is confirmed explicitly. */
function confirmAccept() {
  quasar
    .dialog({
      title: t('confirm.title'),
      message: t('confirm.message', {
        organization: organizationName,
        model: to(offer.priceModel.name),
      }),
      cancel: {
        label: t('confirm.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
        noCaps: true,
      },
      ok: {
        label: t('confirm.ok'),
        color: 'primary',
        unelevated: true,
        rounded: true,
        noCaps: true,
      },
    })
    .onOk(accept);
}

function accept() {
  busy.value = true;
  void withProgressNotification('acceptOffer', () =>
    api.acceptPriceModelOffer(organizationId, offer.id),
  )
    .then(
      () => emit('accepted'),
      // Already reported by the progress notification.
      () => undefined,
    )
    .finally(() => {
      busy.value = false;
    });
}
</script>

<style scoped lang="scss">
.offer-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 16px;
  background: var(--md3-surface-container-high);
  border-bottom: 1px solid var(--md3-outline-variant);
}

.offer-strip__text {
  flex: 1 1 240px;
  min-width: 0;
}

.offer-strip__icon {
  align-self: flex-start;
  margin-top: 2px;

  &--pending {
    color: var(--md3-warning);
  }

  &--due {
    color: var(--md3-error);
  }
}

.offer-strip__action {
  margin-left: auto;
}
</style>

<i18n lang="yaml" locale="en">
title:
  pending: 'New prices from {date} – your agreement is needed'
  due: 'New prices since {date} – no new events until you agree'
notice: "Until you agree, you can't create new events from {date} on. Events you already created keep their prices."
blocked: 'Agree to the new prices to create events again. Events you already created keep their prices.'
adminsOnly: 'An administrator of the organization has to agree to the new prices.'
action:
  accept: 'Agree to new prices'
confirm:
  title: 'Agree to new prices'
  message: '{organization} agrees to the price model {model}. It applies to all events created from now on.'
  cancel: 'Cancel'
  ok: 'Agree'
</i18n>

<i18n lang="yaml" locale="de">
title:
  pending: 'Neue Preise ab {date} – deine Zustimmung ist nötig'
  due: 'Neue Preise seit {date} – keine neuen Veranstaltungen bis zur Zustimmung'
notice: 'Solange du nicht zustimmst, kannst du ab dem {date} keine neuen Veranstaltungen anlegen. Bereits angelegte Veranstaltungen behalten ihre Preise.'
blocked: 'Stimme den neuen Preisen zu, um wieder Veranstaltungen anzulegen. Bereits angelegte Veranstaltungen behalten ihre Preise.'
adminsOnly: 'Ein Administrator der Organisation muss den neuen Preisen zustimmen.'
action:
  accept: 'Neuen Preisen zustimmen'
confirm:
  title: 'Neuen Preisen zustimmen'
  message: '{organization} stimmt dem Preismodell {model} zu. Es gilt für alle ab jetzt angelegten Veranstaltungen.'
  cancel: 'Abbrechen'
  ok: 'Zustimmen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  pending: 'Nouveaux tarifs à partir du {date} – ton accord est nécessaire'
  due: 'Nouveaux tarifs depuis le {date} – aucun nouvel événement sans ton accord'
notice: "Tant que tu n'as pas donné ton accord, tu ne pourras plus créer d'événements à partir du {date}. Les événements déjà créés conservent leurs tarifs."
blocked: 'Accepte les nouveaux tarifs pour créer à nouveau des événements. Les événements déjà créés conservent leurs tarifs.'
adminsOnly: "Un administrateur de l'organisation doit accepter les nouveaux tarifs."
action:
  accept: 'Accepter les nouveaux tarifs'
confirm:
  title: 'Accepter les nouveaux tarifs'
  message: "{organization} accepte le modèle tarifaire {model}. Il s'applique à tous les événements créés à partir de maintenant."
  cancel: 'Annuler'
  ok: 'Accepter'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  pending: 'Nowe ceny od {date} – potrzebna jest twoja zgoda'
  due: 'Nowe ceny od {date} – bez zgody nie można tworzyć wydarzeń'
notice: 'Dopóki nie wyrazisz zgody, od {date} nie możesz tworzyć nowych wydarzeń. Utworzone już wydarzenia zachowują swoje ceny.'
blocked: 'Zaakceptuj nowe ceny, aby znów tworzyć wydarzenia. Utworzone już wydarzenia zachowują swoje ceny.'
adminsOnly: 'Nowe ceny musi zaakceptować administrator organizacji.'
action:
  accept: 'Zaakceptuj nowe ceny'
confirm:
  title: 'Zaakceptuj nowe ceny'
  message: '{organization} akceptuje model cenowy {model}. Obowiązuje on dla wszystkich wydarzeń tworzonych od teraz.'
  cancel: 'Anuluj'
  ok: 'Zaakceptuj'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  pending: 'Nové ceny od {date} – je potřeba tvůj souhlas'
  due: 'Nové ceny od {date} – bez souhlasu nelze vytvářet akce'
notice: 'Dokud nesouhlasíš, nemůžeš od {date} vytvářet nové akce. Již vytvořené akce si ponechají své ceny.'
blocked: 'Přijmi nové ceny, abys mohl znovu vytvářet akce. Již vytvořené akce si ponechají své ceny.'
adminsOnly: 'Nové ceny musí přijmout správce organizace.'
action:
  accept: 'Přijmout nové ceny'
confirm:
  title: 'Přijmout nové ceny'
  message: '{organization} přijímá cenový model {model}. Platí pro všechny akce vytvořené od teď.'
  cancel: 'Zrušit'
  ok: 'Přijmout'
</i18n>
