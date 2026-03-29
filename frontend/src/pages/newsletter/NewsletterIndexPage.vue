<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-9 col-lg-8 col-12">
      <div class="row justify-between items-center q-mb-lg">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <q-btn
          color="primary"
          icon="add"
          :label="t('action.create')"
          rounded
          unelevated
          @click="showCreateDialog"
        />
      </div>

      <div
        v-if="newsletters.length > 0"
        class="row q-col-gutter-md"
      >
        <div
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card
            flat
            bordered
            class="newsletter-card full-height"
          >
            <q-card-section
              class="cursor-pointer"
              @click="$router.push({ name: 'management.newsletter', params: { newsletterId: newsletter.id } })"
            >
              <div class="text-subtitle1 text-weight-medium">{{ newsletter.name }}</div>
              <div
                v-if="newsletter.description"
                class="text-body2 text-grey q-mt-xs description-clamp"
              >
                {{ newsletter.description }}
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions>
              <q-btn
                flat
                :label="t('action.manage')"
                color="primary"
                icon-right="arrow_forward"
                :to="{ name: 'management.newsletter', params: { newsletterId: newsletter.id } }"
                no-caps
              />
              <q-space />
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                size="sm"
                @click.prevent="showDeleteDialog(newsletter)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <div
        v-else-if="!isLoading"
        class="column items-center q-pa-xl q-gutter-md"
      >
        <q-icon
          name="mail_outline"
          size="5rem"
          color="grey-4"
        />
        <div class="text-subtitle1 text-grey-6 text-center">{{ t('empty') }}</div>
        <q-btn
          color="primary"
          icon="add"
          :label="t('action.create')"
          rounded
          unelevated
          @click="showCreateDialog"
        />
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
  manage: 'Manage'
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
  manage: 'Verwalten'
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
  manage: 'Gérer'
dialog:
  delete:
    title: 'Supprimer la newsletter'
    message: 'Voulez-vous vraiment supprimer cette newsletter ? Tous les abonnés seront supprimés.'
    label: 'Nom de la newsletter'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
empty: 'Brak newsletterów. Utwórz pierwszy, aby zacząć.'
action:
  create: 'Utwórz newsletter'
  manage: 'Zarządzaj'
dialog:
  delete:
    title: 'Usuń newsletter'
    message: 'Czy na pewno chcesz usunąć ten newsletter? Wszyscy subskrybenci zostaną usunięci.'
    label: 'Nazwa newslettera'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
empty: 'Zatím žádné newslettery. Vytvořte první a začněte.'
action:
  create: 'Vytvořit newsletter'
  manage: 'Spravovat'
dialog:
  delete:
    title: 'Smazat newsletter'
    message: 'Opravdu chcete smazat tento newsletter? Všichni odběratelé budou odstraněni.'
    label: 'Název newsletteru'
</i18n>

<style scoped>
.newsletter-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.newsletter-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
  transform: translateY(-2px);
}

.description-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
