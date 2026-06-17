<template>
  <page-state-handler
    :error
    :loading
    class="column"
  >
    <!-- Empty state -->
    <div
      v-if="registrations.length === 0"
      class="empty-state col column items-center justify-center"
    >
      <q-icon
        name="mail"
        size="64px"
        class="empty-icon"
      />
      <div class="text-h6 q-mt-md">
        {{ t('empty.title') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-xs text-center">
        {{ t('empty.message') }}
      </div>
    </div>

    <contact-form
      v-else
      class="col"
      :registrations
      standalone
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Registration } from '@camp-registration/common/entities';
import { useCampDetailsStore } from 'stores/camp-details-store';
import ContactForm from 'components/campManagement/contact/ContactForm.vue';

const { t } = useI18n();
const registrationStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();

onMounted(async () => {
  await Promise.all([
    campDetailsStore.fetchData(),
    registrationStore.fetchData(),
  ]);
});

const error = computed<string | null>(() => {
  return registrationStore.error ?? campDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading || campDetailsStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
});
</script>

<style scoped>
.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);

  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
empty:
  title: 'No registrations yet'
  message: 'Once people register, you can send them a message from here.'
</i18n>

<i18n lang="yaml" locale="de">
empty:
  title: 'Noch keine Anmeldungen'
  message: 'Sobald sich Personen anmelden, können Sie ihnen von hier aus eine Nachricht senden.'
</i18n>

<i18n lang="yaml" locale="fr">
empty:
  title: 'Aucune inscription pour le moment'
  message: 'Dès que des personnes s’inscrivent, vous pourrez leur envoyer un message d’ici.'
</i18n>

<i18n lang="yaml" locale="pl">
empty:
  title: 'Brak zgłoszeń'
  message: 'Gdy ktoś się zarejestruje, będziesz mógł stąd wysłać mu wiadomość.'
</i18n>

<i18n lang="yaml" locale="cs">
empty:
  title: 'Zatím žádné registrace'
  message: 'Jakmile se někdo zaregistruje, můžete mu odsud poslat zprávu.'
</i18n>
