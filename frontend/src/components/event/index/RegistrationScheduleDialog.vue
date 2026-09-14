<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="registration-dialog">
      <q-card-section class="row items-start no-wrap q-gutter-x-sm">
        <div class="col">
          <div class="text-h6">
            {{ t('title') }}
          </div>
          <div class="registration-dialog__subtitle text-body2 ellipsis">
            {{ name }}
          </div>
        </div>
        <q-btn
          icon="close"
          flat
          dense
          round
          :aria-label="t('action.cancel')"
          @click="onDialogCancel"
        />
      </q-card-section>

      <!-- Live status -->
      <q-card-section class="q-pt-none">
        <div
          class="registration-dialog__status"
          :class="`registration-dialog__status--${preview.kind}`"
        >
          <q-icon
            :name="preview.icon"
            size="18px"
          />
          <span>{{ preview.label }}</span>
        </div>
      </q-card-section>

      <!-- Opens / closes boundaries -->
      <q-card-section class="column q-gutter-y-sm">
        <div class="row items-center q-gutter-x-sm no-wrap">
          <date-time-input
            v-model="opensAt"
            class="col"
            :label="t('field.opens')"
            clearable
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon
                name="lock_open"
                color="primary"
              />
            </template>
          </date-time-input>
          <q-btn
            v-if="canOpenNow"
            :label="t('quick.now')"
            :aria-label="t('quick.open_now')"
            color="primary"
            glossy
            no-caps
            rounded
            @click="openNow"
          />
        </div>

        <div class="row items-center q-gutter-x-sm no-wrap">
          <date-time-input
            v-model="closesAt"
            class="col"
            :label="t('field.closes')"
            :error="hasOrderError"
            :error-message="t('validation.order')"
            clearable
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon
                name="lock"
                color="warning"
              />
            </template>
          </date-time-input>
          <q-btn
            v-if="canCloseNow"
            :label="t('quick.now')"
            :aria-label="t('quick.close_now')"
            color="warning"
            glossy
            no-caps
            rounded
            @click="closeNow"
          />
        </div>

        <div class="registration-dialog__section-hint">
          {{ t('schedule.hint') }}
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="text-primary"
      >
        <q-btn
          :label="t('action.cancel')"
          flat
          rounded
          no-caps
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.save')"
          color="primary"
          unelevated
          rounded
          no-caps
          :disable="hasOrderError"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
export interface RegistrationScheduleResult {
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
}
</script>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import DateTimeInput from '@/components/common/inputs/DateTimeInput.vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, d } = useI18n();

const props = defineProps<{
  name: string;
  opensAt: string | null;
  closesAt: string | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const opensAt = ref<string | null>(props.opensAt);
const closesAt = ref<string | null>(props.closesAt);

const hasOrderError = computed<boolean>(() => {
  if (!opensAt.value || !closesAt.value) {
    return false;
  }
  return new Date(opensAt.value) >= new Date(closesAt.value);
});

const currentlyOpen = computed<boolean>(() => {
  const opens = opensAt.value ? new Date(opensAt.value) : null;
  const closes = closesAt.value ? new Date(closesAt.value) : null;
  // No dates at all means registration is closed
  if (!opens && !closes) {
    return false;
  }
  const now = new Date();
  // Open within [opensAt, closesAt): inclusive start, exclusive end so a event
  // closed "now" reads as closed immediately.
  return (opens === null || now >= opens) && (closes === null || now < closes);
});

function openNow() {
  const now = new Date();
  opensAt.value = now.toISOString();
  // Drop a closing date that would otherwise conflict with opening now
  if (closesAt.value && new Date(closesAt.value) <= now) {
    closesAt.value = null;
  }
}

function closeNow() {
  const now = new Date();
  // Drop an opening date that would otherwise conflict with closing now
  if (opensAt.value && new Date(opensAt.value) >= now) {
    opensAt.value = null;
  }

  closesAt.value = now.toISOString();
}

interface Preview {
  kind: 'open' | 'closes' | 'opens' | 'closed';
  icon: string;
  label: string;
}

const preview = computed<Preview>(() => {
  const now = new Date();
  const opens = opensAt.value ? new Date(opensAt.value) : null;
  const closes = closesAt.value ? new Date(closesAt.value) : null;

  if (currentlyOpen.value) {
    return closes
      ? {
          kind: 'closes',
          icon: 'schedule',
          label: t('preview.open_until', { date: d(closes, 'dateTime') }),
        }
      : { kind: 'open', icon: 'check_circle', label: t('preview.open') };
  }
  if (opens && now < opens) {
    return {
      kind: 'opens',
      icon: 'upcoming',
      label: t('preview.opens', { date: d(opens, 'dateTime') }),
    };
  }
  return { kind: 'closed', icon: 'lock', label: t('preview.closed') };
});

// "Open now" is a no-op once registration is already open; "Close now" is a
// no-op once it's already closed with nothing scheduled — hide whichever
// action wouldn't change anything.
const canOpenNow = computed<boolean>(() => !currentlyOpen.value);
const canCloseNow = computed<boolean>(() => preview.value.kind !== 'closed');

function onSave() {
  if (hasOrderError.value) {
    return;
  }
  onDialogOK({
    registrationOpensAt: opensAt.value || null,
    registrationClosesAt: closesAt.value || null,
  } satisfies RegistrationScheduleResult);
}
</script>

<style scoped>
.registration-dialog {
  width: 420px;
  max-width: 100%;
  border-radius: 28px;
}

.registration-dialog__subtitle {
  color: var(--md3-on-surface-variant);
}

.registration-dialog__section-hint {
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.registration-dialog__status {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 10px 14px;
  border-radius: 12px;

  font-size: 13px;
  font-weight: 500;
}

.registration-dialog__status--open {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.registration-dialog__status--closes {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.registration-dialog__status--opens,
.registration-dialog__status--closed {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Registration'
quick:
  now: 'Now'
  open_now: 'Open now'
  close_now: 'Close now'
schedule:
  hint: 'Leave a field empty to leave that side open-ended.'
field:
  opens: 'Opens at'
  closes: 'Closes at'
validation:
  order: 'Closing time must be after opening time'
preview:
  open: 'Registration is open'
  open_until: 'Open until {date}'
  opens: 'Opens {date}'
  closed: 'Registration is closed'
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldung'
quick:
  now: 'Jetzt'
  open_now: 'Jetzt öffnen'
  close_now: 'Jetzt schließen'
schedule:
  hint: 'Feld leer lassen, um diese Seite offen zu lassen.'
field:
  opens: 'Öffnet am'
  closes: 'Schließt am'
validation:
  order: 'Der Schließzeitpunkt muss nach dem Öffnungszeitpunkt liegen'
preview:
  open: 'Anmeldung ist offen'
  open_until: 'Offen bis {date}'
  opens: 'Öffnet {date}'
  closed: 'Anmeldung ist geschlossen'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Inscription'
quick:
  now: 'Maintenant'
  open_now: 'Ouvrir maintenant'
  close_now: 'Fermer maintenant'
schedule:
  hint: 'Laissez un champ vide pour ne pas limiter ce côté.'
field:
  opens: 'Ouvre le'
  closes: 'Ferme le'
validation:
  order: "L'heure de fermeture doit être postérieure à l'heure d'ouverture"
preview:
  open: 'Les inscriptions sont ouvertes'
  open_until: "Ouvert jusqu'au {date}"
  opens: 'Ouvre le {date}'
  closed: 'Les inscriptions sont fermées'
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rejestracja'
quick:
  now: 'Teraz'
  open_now: 'Otwórz teraz'
  close_now: 'Zamknij teraz'
schedule:
  hint: 'Pozostaw pole puste, aby nie ograniczać tej strony.'
field:
  opens: 'Otwiera się'
  closes: 'Zamyka się'
validation:
  order: 'Czas zamknięcia musi być późniejszy niż czas otwarcia'
preview:
  open: 'Rejestracja jest otwarta'
  open_until: 'Otwarte do {date}'
  opens: 'Otwiera się {date}'
  closed: 'Rejestracja jest zamknięta'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Registrace'
quick:
  now: 'Nyní'
  open_now: 'Otevřít nyní'
  close_now: 'Zavřít nyní'
schedule:
  hint: 'Ponechte pole prázdné, pokud tuto stranu nechcete omezit.'
field:
  opens: 'Otevírá se'
  closes: 'Uzavírá se'
validation:
  order: 'Čas uzavření musí být po čase otevření'
preview:
  open: 'Registrace je otevřená'
  open_until: 'Otevřeno do {date}'
  opens: 'Otevírá se {date}'
  closed: 'Registrace je uzavřená'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
