<template>
  <section
    v-if="entries.length > 0"
    class="undelivered rounded-lg"
    data-test="message-undelivered"
  >
    <div class="undelivered__header">
      <q-icon
        name="error_outline"
        size="20px"
        class="undelivered__icon"
      />
      <div class="undelivered__title">
        {{ t('title', entries.length) }}
      </div>
    </div>
    <div class="undelivered__hint">{{ t('hint') }}</div>

    <q-list class="undelivered__list">
      <q-item
        v-for="entry in entries"
        :key="entry.registrationId"
        :clickable="!!entry.registration"
        class="undelivered__item rounded-lg"
        @click="openRegistration(entry)"
      >
        <q-item-section>
          <q-item-label class="text-weight-medium">{{
            entry.name
          }}</q-item-label>
          <q-item-label
            v-for="failure in entry.failures"
            :key="failure.address"
            caption
            lines="2"
          >
            {{ failure.address }}
            <template v-if="failure.reason">· {{ failure.reason }}</template>
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="entry.registration"
          side
        >
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <div
      v-if="canRetry && retryable.length > 0"
      class="undelivered__actions"
    >
      <m-btn
        tonal
        primary
        no-caps
        icon="forward_to_inbox"
        :label="t('action.retry', retryable.length)"
        data-test="message-undelivered-retry"
        @click="emit('retry', retryable)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Message, Registration } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';
import { undeliveredRecipients } from '@/components/event/contact/contactHelpers';

const {
  message,
  registrations,
  canRetry = false,
} = defineProps<{
  message: Message;
  registrations: Registration[];
  canRetry?: boolean;
}>();

const emit = defineEmits<{
  retry: [registrations: Registration[]];
}>();

const { t } = useI18n();
const quasar = useQuasar();
const { fullName } = useRegistrationHelper();

interface UndeliveredEntry {
  registrationId: string;
  // Absent once the registration has been deleted.
  registration: Registration | undefined;
  name: string;
  failures: { address: string; reason: string | null }[];
}

const entries = computed<UndeliveredEntry[]>(() => {
  const byId = new Map(registrations.map((r) => [r.id, r]));

  return undeliveredRecipients(message).map((recipient) => {
    const failures = recipient.deliveries
      .filter((delivery) => delivery.bouncedAt)
      .map((delivery) => ({
        address: delivery.to ?? '—',
        reason: delivery.bounceReason,
      }));
    const registration = byId.get(recipient.registrationId);

    return {
      registrationId: recipient.registrationId,
      registration,
      name: registration
        ? formatPersonName(fullName(registration))
        : (failures[0]?.address ?? recipient.registrationId),
      failures,
    };
  });
});

const retryable = computed<Registration[]>(() =>
  entries.value.flatMap((entry) =>
    entry.registration ? [entry.registration] : [],
  ),
);

function openRegistration(entry: UndeliveredEntry) {
  if (!entry.registration) {
    return;
  }
  quasar.dialog({
    component: RegistrationDetailsDialog,
    componentProps: { registrationId: entry.registration.id },
  });
}
</script>

<style scoped>
.undelivered {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 12px 16px;
  border: 1px solid color-mix(in srgb, var(--md3-error) 40%, transparent);
  background: color-mix(in srgb, var(--md3-error-container) 35%, transparent);
}

.undelivered__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.undelivered__icon {
  color: var(--md3-error);
}

.undelivered__title {
  color: var(--md3-on-surface);
  font-weight: 600;
}

.undelivered__hint {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.undelivered__list {
  margin: 0 -4px;
}

.undelivered__item {
  padding: 6px 8px;
  min-height: 48px;
}

.undelivered__actions {
  display: flex;
  justify-content: flex-end;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Not delivered to {n} recipient | Not delivered to {n} recipients'
hint: 'Fix the email address in the registration, then send the message again.'
action:
  retry: 'Send again to {n} | Send again to {n} | Send again to {n}'
</i18n>

<i18n lang="yaml" locale="de">
title: 'An {n} Empfänger nicht zugestellt | An {n} Empfänger nicht zugestellt'
hint: 'Korrigiere die E-Mail-Adresse in der Anmeldung und sende die Nachricht dann erneut.'
action:
  retry: 'Erneut an {n} senden | Erneut an {n} senden | Erneut an {n} senden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Non distribué à {n} destinataire | Non distribué à {n} destinataires'
hint: 'Corrigez l’adresse e-mail dans l’inscription, puis renvoyez le message.'
action:
  retry: 'Renvoyer à {n} | Renvoyer à {n} | Renvoyer à {n}'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Nie dostarczono do odbiorców: {n} | Nie dostarczono do odbiorców: {n}'
hint: 'Popraw adres e-mail w rejestracji, a następnie wyślij wiadomość ponownie.'
action:
  retry: 'Wyślij ponownie ({n}) | Wyślij ponownie ({n}) | Wyślij ponownie ({n})'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nedoručeno příjemcům: {n} | Nedoručeno příjemcům: {n}'
hint: 'Oprav e-mailovou adresu v registraci a pak zprávu odešli znovu.'
action:
  retry: 'Odeslat znovu ({n}) | Odeslat znovu ({n}) | Odeslat znovu ({n})'
</i18n>
