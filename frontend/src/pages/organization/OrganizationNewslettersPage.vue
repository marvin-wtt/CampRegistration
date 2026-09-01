<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-8 col-12 q-gutter-md">
      <div class="text-h6">{{ t('title') }}</div>

      <q-banner
        dense
        class="scope-note rounded-md"
      >
        <template #avatar>
          <q-icon name="info" />
        </template>
        {{ t('scope') }}
      </q-banner>

      <q-list
        v-if="newsletters.length > 0"
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          clickable
          :to="{
            name: 'management.newsletter',
            params: { newsletterId: newsletter.id },
          }"
        >
          <q-item-section>
            <q-item-label>{{ newsletter.name }}</q-item-label>
            <q-item-label
              v-if="newsletter.description"
              caption
              lines="1"
            >
              {{ newsletter.description }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-chip
              v-if="newsletter.organizationVerificationStatus !== 'VERIFIED'"
              dense
              square
              size="sm"
              icon="block"
            >
              {{ t('sendingBlocked') }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-else-if="!isLoading"
        class="column items-center q-pa-xl text-on-surface-variant"
      >
        <q-icon
          name="mail"
          size="3rem"
        />
        <div class="text-subtitle1 q-mt-md">{{ t('empty') }}</div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useOrganizationNewslettersStore } from '@/stores/organization-newsletters-store';
import type { Newsletter } from '@camp-registration/common/entities';

const { t } = useI18n();
const store = useOrganizationNewslettersStore();
const { data, isLoading, error } = storeToRefs(store);

const newsletters = computed<Newsletter[]>(() => data.value ?? []);

onMounted(async () => {
  await store.fetchData();
});
</script>

<style lang="scss" scoped>
.scope-note {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
scope: 'You can see every newsletter of this organization and who runs it. Reading subscribers or sending requires a separate invitation.'
sendingBlocked: 'Cannot send'
empty: 'This organization has no newsletters yet'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
scope: 'Du siehst jeden Newsletter dieser Organisation und wer ihn betreut. Für Abonnenten und den Versand ist eine separate Einladung nötig.'
sendingBlocked: 'Kein Versand'
empty: 'Diese Organisation hat noch keine Newsletter'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
scope: 'Tu vois chaque newsletter de cette organisation et qui la gère. Consulter les abonnés ou envoyer nécessite une invitation distincte.'
sendingBlocked: 'Envoi impossible'
empty: "Cette organisation n'a pas encore de newsletters"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
scope: 'Widzisz każdy newsletter tej organizacji i osoby nim zarządzające. Podgląd subskrybentów i wysyłka wymagają osobnego zaproszenia.'
sendingBlocked: 'Brak wysyłki'
empty: 'Ta organizacja nie ma jeszcze newsletterów'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
scope: 'Vidíš každý newsletter této organizace a kdo jej spravuje. Zobrazení odběratelů a odesílání vyžaduje samostatné pozvání.'
sendingBlocked: 'Nelze odeslat'
empty: 'Tato organizace zatím nemá žádné newslettery'
</i18n>
