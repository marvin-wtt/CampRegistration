<template>
  <m-btn
    v-if="available"
    :icon="grant ? 'shield' : 'o_shield'"
    :aria-label="grant ? t('active') : t('request')"
    :error="!!grant"
    :tonal="!!grant"
    :text="!grant && !floating"
    :elevated="!grant && floating"
    round
    data-test="admin-access-button"
    @click="grant ? undefined : requestAccess()"
  >
    <q-tooltip v-if="!grant">{{ t('request') }}</q-tooltip>
    <q-menu v-if="grant">
      <q-list style="min-width: 220px">
        <q-item>
          <q-item-section>
            <q-item-label>{{ t('active') }}</q-item-label>
            <q-item-label caption>
              {{ t('until', { time: formatTime(grant.expiresAt) }) }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item
          v-close-popup
          clickable
          @click="endAccess()"
        >
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>{{ t('end') }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </m-btn>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  type AdminAccessSubject,
  useAdminAccess,
} from '@/composables/adminAccess';

const { subject, floating = false } = defineProps<{
  subject: AdminAccessSubject;
  // Over page content rather than in a bar or rail.
  floating?: boolean;
}>();

const { t, locale } = useI18n();
const { available, grant, requestAccess, endAccess } = useAdminAccess(
  () => subject,
);

function formatTime(dateTime: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}
</script>

<i18n lang="yaml" locale="en">
request: 'Request administrator access'
active: 'Administrator access active'
until: 'Until {time}'
end: 'End access'
</i18n>

<i18n lang="yaml" locale="de">
request: 'Administratorzugriff anfordern'
active: 'Administratorzugriff aktiv'
until: 'Bis {time}'
end: 'Zugriff beenden'
</i18n>

<i18n lang="yaml" locale="fr">
request: "Demander l'accès administrateur"
active: 'Accès administrateur actif'
until: "Jusqu'à {time}"
end: "Mettre fin à l'accès"
</i18n>

<i18n lang="yaml" locale="pl">
request: 'Poproś o dostęp administratora'
active: 'Dostęp administratora aktywny'
until: 'Do {time}'
end: 'Zakończ dostęp'
</i18n>

<i18n lang="yaml" locale="cs">
request: 'Požádat o přístup administrátora'
active: 'Přístup administrátora aktivní'
until: 'Do {time}'
end: 'Ukončit přístup'
</i18n>
