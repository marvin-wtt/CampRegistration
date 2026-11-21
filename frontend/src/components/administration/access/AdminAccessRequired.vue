<template>
  <q-page
    class="column flex-center q-pa-lg text-center"
    data-test="admin-access-required"
  >
    <q-icon
      name="o_shield"
      size="64px"
      color="on-surface-variant"
    />
    <div class="text-h6 q-mt-md">{{ t(`title.${subject.scope}`) }}</div>
    <div
      class="text-body2 text-on-surface-variant q-mt-sm"
      style="max-width: 420px"
    >
      {{ t('message') }}
    </div>
    <m-btn
      :label="t('request')"
      icon="shield"
      error
      class="q-mt-lg"
      no-caps
      @click="requestAccess()"
    />
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  type AdminAccessSubject,
  useAdminAccess,
} from '@/composables/adminAccess';

const { subject } = defineProps<{
  subject: AdminAccessSubject;
}>();

const { t } = useI18n();
const { requestAccess } = useAdminAccess(() => subject);
</script>

<i18n lang="yaml" locale="en">
title:
  event: "You don't manage this event"
  newsletter: "You don't manage this newsletter"
  organization: "You aren't a member of this organization"
message: 'As an administrator, you can request access for a limited time. You need to give a reason.'
request: 'Request administrator access'
</i18n>

<i18n lang="yaml" locale="de">
title:
  event: 'Du verwaltest diese Veranstaltung nicht'
  newsletter: 'Du verwaltest diesen Newsletter nicht'
  organization: 'Du bist kein Mitglied dieser Organisation'
message: 'Als Administrator kannst du zeitlich begrenzten Zugriff anfordern. Du musst dafür einen Grund angeben.'
request: 'Administratorzugriff anfordern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  event: 'Vous ne gérez pas cet événement'
  newsletter: 'Vous ne gérez pas cette newsletter'
  organization: "Vous n'êtes pas membre de cette organisation"
message: "En tant qu'administrateur, vous pouvez demander un accès limité dans le temps. Il vous faut indiquer un motif."
request: "Demander l'accès administrateur"
</i18n>

<i18n lang="yaml" locale="pl">
title:
  event: 'Nie zarządzasz tym wydarzeniem'
  newsletter: 'Nie zarządzasz tym newsletterem'
  organization: 'Nie jesteś członkiem tej organizacji'
message: 'Jako administrator możesz poprosić o dostęp na ograniczony czas. Musisz podać powód.'
request: 'Poproś o dostęp administratora'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  event: 'Tuto akci nespravujete'
  newsletter: 'Tento newsletter nespravujete'
  organization: 'Nejste členem této organizace'
message: 'Jako administrátor můžete požádat o časově omezený přístup. Musíte uvést důvod.'
request: 'Požádat o přístup administrátora'
</i18n>
