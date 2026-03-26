<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-9 col-lg-8 col-12">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h5">{{ t('title') }}</div>
        <q-btn
          color="primary"
          icon="add"
          :label="t('action.create')"
          rounded
          @click="showCreateDialog"
        />
      </div>

      <q-list
        v-if="newsletters.length > 0"
        bordered
        separator
        class="rounded-borders"
      >
        <q-item
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          clickable
          :to="{
            name: 'newsletter',
            params: { newsletterId: newsletter.id },
          }"
        >
          <q-item-section>
            <q-item-label>{{ newsletter.name }}</q-item-label>
            <q-item-label
              v-if="newsletter.description"
              caption
            >
              {{ newsletter.description }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              icon="delete"
              color="negative"
              size="sm"
              @click.prevent="showDeleteDialog(newsletter)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-else-if="!isLoading"
        class="text-grey text-center q-pa-xl"
      >
        {{ t('empty') }}
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import { useNewsletterStore } from 'stores/newsletter-store';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import type { Newsletter, NewsletterCreateData } from '@camp-registration/common/entities';
import NewsletterCreateDialog from 'components/newsletter/NewsletterCreateDialog.vue';

const { t } = useI18n();
const quasar = useQuasar();
const newsletterStore = useNewsletterStore();

onMounted(async () => {
  await newsletterStore.fetchData();
});

const newsletters = computed<Newsletter[]>(() => {
  return newsletterStore.data ?? [];
});

const isLoading = computed<boolean>(() => newsletterStore.isLoading);
const error = computed<string | null>(() => newsletterStore.error);

function showCreateDialog() {
  quasar
    .dialog({
      component: NewsletterCreateDialog,
    })
    .onOk((data: NewsletterCreateData) => {
      void newsletterStore.createData(data);
    });
}

function showDeleteDialog(newsletter: Newsletter) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: newsletter.name,
      },
    })
    .onOk(() => {
      void newsletterStore.deleteData(newsletter.id);
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
empty: 'No newsletters yet. Create one to get started.'
action:
  create: 'Create Newsletter'
dialog:
  delete:
    title: 'Delete Newsletter'
    message: 'Are you sure you want to delete this newsletter? All subscribers will be removed.'
    label: 'Newsletter Name'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
empty: 'Noch keine Newsletter. Erstellen Sie einen, um loszulegen.'
action:
  create: 'Newsletter erstellen'
dialog:
  delete:
    title: 'Newsletter löschen'
    message: 'Möchten Sie diesen Newsletter wirklich löschen? Alle Abonnenten werden entfernt.'
    label: 'Newsletter-Name'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
empty: 'Aucune newsletter pour le moment. Créez-en une pour commencer.'
action:
  create: 'Créer une newsletter'
dialog:
  delete:
    title: 'Supprimer la newsletter'
    message: 'Voulez-vous vraiment supprimer cette newsletter ? Tous les abonnés seront supprimés.'
    label: 'Nom de la newsletter'
</i18n>

<style scoped></style>
