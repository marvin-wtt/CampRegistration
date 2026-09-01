<template>
  <!-- Admins get an actionable prompt to fill in the missing legal content,
       so an unconfigured page is never left as a silent compliance gap. -->
  <q-banner
    v-if="isAdmin"
    rounded
    class="bg-primary-container text-on-primary-container"
  >
    <template #avatar>
      <q-icon name="edit_note" />
    </template>
    {{ t('admin.message') }}
    <template #action>
      <m-btn
        :label="t('admin.action')"
        icon="arrow_forward"
        :to="{ name: 'administration.legal' }"
      />
    </template>
  </q-banner>

  <!-- Visitors just see a neutral notice; the operator-facing instructions are
       never shown to them. -->
  <q-banner
    v-else
    rounded
    class="bg-surface-container-low text-on-surface-variant"
  >
    <template #avatar>
      <q-icon name="info" />
    </template>
    {{ t('visitor.message') }}
  </q-banner>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile-store';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();
const { user } = storeToRefs(useProfileStore());

const isAdmin = computed<boolean>(() => user.value?.role === 'ADMIN');
</script>

<i18n lang="yaml" locale="en">
admin:
  message: 'This page has not been set up yet. As an administrator, add the required legal information so it is shown to visitors.'
  action: 'Set up now'
visitor:
  message: 'This information has not been provided yet.'
</i18n>

<i18n lang="yaml" locale="de">
admin:
  message: 'Diese Seite wurde noch nicht eingerichtet. Füge als Administrator die erforderlichen rechtlichen Angaben hinzu, damit sie Besuchern angezeigt werden.'
  action: 'Jetzt einrichten'
visitor:
  message: 'Diese Angaben wurden noch nicht bereitgestellt.'
</i18n>

<i18n lang="yaml" locale="fr">
admin:
  message: "Cette page n'a pas encore été configurée. En tant qu'administrateur, ajoutez les informations légales requises pour qu'elles soient affichées aux visiteurs."
  action: 'Configurer maintenant'
visitor:
  message: "Ces informations n'ont pas encore été fournies."
</i18n>

<i18n lang="yaml" locale="pl">
admin:
  message: 'Ta strona nie została jeszcze skonfigurowana. Jako administrator dodaj wymagane informacje prawne, aby były widoczne dla odwiedzających.'
  action: 'Skonfiguruj teraz'
visitor:
  message: 'Te informacje nie zostały jeszcze podane.'
</i18n>

<i18n lang="yaml" locale="cs">
admin:
  message: 'Tato stránka zatím nebyla nastavena. Jako správce doplňte požadované právní informace, aby se zobrazovaly návštěvníkům.'
  action: 'Nastavit nyní'
visitor:
  message: 'Tyto informace zatím nebyly poskytnuty.'
</i18n>
