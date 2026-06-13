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

      <!-- Quick actions -->
      <q-card-section class="q-pt-none">
        <div class="registration-dialog__quick row q-gutter-sm no-wrap">
          <q-btn
            class="col"
            icon="lock_open"
            :label="t('quick.open_now')"
            color="primary"
            :unelevated="!currentlyOpen"
            :outline="currentlyOpen"
            no-caps
            rounded
            @click="openNow"
          />
          <q-btn
            class="col"
            icon="lock"
            :label="t('quick.close_now')"
            color="warning"
            :unelevated="currentlyOpen"
            :outline="!currentlyOpen"
            no-caps
            rounded
            @click="closeNow"
          />
        </div>
      </q-card-section>

      <q-separator inset />

      <!-- Schedule -->
      <q-card-section class="column q-gutter-y-md">
        <div class="registration-dialog__section-label">
          {{ t('schedule.label') }}
        </div>

        <date-time-input
          v-model="opensAt"
          :label="t('field.opens')"
          clearable
          hide-bottom-space
        >
          <template #before>
            <q-icon name="lock_open" />
          </template>
        </date-time-input>

        <date-time-input
          v-model="closesAt"
          :label="t('field.closes')"
          :error="hasOrderError"
          :error-message="t('validation.order')"
          clearable
          hide-bottom-space
        >
          <template #before>
            <q-icon name="lock" />
          </template>
        </date-time-input>

        <div class="registration-dialog__preview">
          <q-icon
            :name="preview.icon"
            size="16px"
          />
          <span>{{ preview.label }}</span>
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
export interface RegistrationResult {
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
}
</script>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';

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
  return (opens === null || now >= opens) && (closes === null || now <= closes);
});

function openNow() {
  opensAt.value = new Date().toISOString();
  closesAt.value = null;
}

function closeNow() {
  const now = new Date();
  // Drop a future opening date so the camp reads as closed right away
  if (opensAt.value && new Date(opensAt.value) > now) {
    opensAt.value = null;
  }
  closesAt.value = now.toISOString();
}

interface Preview {
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
          icon: 'check_circle',
          label: t('preview.open_until', { date: d(closes, 'dateTime') }),
        }
      : { icon: 'check_circle', label: t('preview.open') };
  }
  if (opens && now < opens) {
    return {
      icon: 'upcoming',
      label: t('preview.opens', { date: d(opens, 'dateTime') }),
    };
  }
  return { icon: 'lock', label: t('preview.closed') };
});

function onSave() {
  if (hasOrderError.value) {
    return;
  }
  onDialogOK({
    registrationOpensAt: opensAt.value || null,
    registrationClosesAt: closesAt.value || null,
  } satisfies RegistrationResult);
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

.registration-dialog__section-label {
  color: var(--md3-on-surface-variant);

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.registration-dialog__preview {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 10px 12px;
  border-radius: 12px;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 13px;
  font-weight: 500;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Registration'
quick:
  open_now: 'Open now'
  close_now: 'Close now'
schedule:
  label: 'Or schedule'
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
  open_now: 'Jetzt öffnen'
  close_now: 'Jetzt schließen'
schedule:
  label: 'Oder planen'
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
  open_now: 'Ouvrir maintenant'
  close_now: 'Fermer maintenant'
schedule:
  label: 'Ou planifier'
field:
  opens: "Ouvre le"
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
  open_now: 'Otwórz teraz'
  close_now: 'Zamknij teraz'
schedule:
  label: 'Lub zaplanuj'
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
  open_now: 'Otevřít nyní'
  close_now: 'Zavřít nyní'
schedule:
  label: 'Nebo naplánovat'
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
