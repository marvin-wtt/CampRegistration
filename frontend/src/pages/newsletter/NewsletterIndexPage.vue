<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-9 col-lg-8 col-12">
      <div class="row justify-between items-center q-mb-lg">
        <div class="text-h5 text-weight-medium page-title">
          {{ t('title') }}
        </div>
        <q-btn
          color="primary"
          icon="add"
          :label="t('action.create')"
          rounded
          unelevated
          no-caps
          :disable="!isAdmin"
          @click="showCreateDialog"
        >
          <q-tooltip v-if="!isAdmin">
            {{ t('adminOnly') }}
          </q-tooltip>
        </q-btn>
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
            class="newsletter-card cursor-pointer full-height"
            @click="
              router.push({
                name: 'management.newsletter',
                params: { newsletterId: newsletter.id },
              })
            "
          >
            <q-card-section class="q-pa-md">
              <div class="row items-start no-wrap">
                <div class="col">
                  <div class="text-subtitle1 text-weight-medium ellipsis">
                    {{ newsletter.name }}
                  </div>
                  <div
                    v-if="newsletter.description"
                    class="text-body2 text-grey-6 q-mt-xs description-clamp"
                  >
                    {{ newsletter.description }}
                  </div>
                </div>
                <q-btn
                  flat
                  round
                  icon="more_vert"
                  color="grey-6"
                  size="sm"
                  class="q-ml-xs"
                  @click.stop
                >
                  <q-menu
                    anchor="bottom right"
                    self="top right"
                  >
                    <q-list style="min-width: 140px">
                      <q-item
                        v-close-popup
                        clickable
                        @click="showEditDialog(newsletter)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="edit"
                            size="xs"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.edit') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-close-popup
                        clickable
                        @click="showDeleteDialog(newsletter)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="delete_outline"
                            color="negative"
                            size="xs"
                          />
                        </q-item-section>
                        <q-item-section class="text-negative">
                          {{ t('action.delete') }}
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </q-card-section>
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
        <div class="text-subtitle1 text-grey-6 text-center">
          {{ t('empty') }}
        </div>
        <template v-if="isAdmin">
          <q-btn
            color="primary"
            icon="add"
            :label="t('action.create')"
            rounded
            unelevated
            no-caps
            @click="showCreateDialog"
          />
        </template>
        <template v-else>
          <div class="text-body2 text-grey-6 text-center">
            {{ t('adminOnly') }}
          </div>
        </template>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import { useNewsletterStore } from 'stores/newsletter-store';
import { useProfileStore } from 'stores/profile-store';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import type {
  Newsletter,
  NewsletterCreateData,
  NewsletterUpdateData,
} from '@camp-registration/common/entities';
import NewsletterCreateDialog from 'components/newsletter/NewsletterCreateDialog.vue';
import NewsletterEditDialog from 'components/newsletter/NewsletterEditDialog.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const quasar = useQuasar();
const newsletterStore = useNewsletterStore();
const profileStore = useProfileStore();

onMounted(async () => {
  await newsletterStore.fetchData();
});

const newsletters = computed<Newsletter[]>(() => newsletterStore.data ?? []);
const isLoading = computed<boolean>(() => newsletterStore.isLoading);
const error = computed<string | null>(() => newsletterStore.error);
const isAdmin = computed<boolean>(() => profileStore.user?.role === 'ADMIN');

function showCreateDialog() {
  quasar
    .dialog({ component: NewsletterCreateDialog })
    .onOk((data: NewsletterCreateData) => {
      void newsletterStore.createData(data);
    });
}

function showEditDialog(newsletter: Newsletter) {
  quasar
    .dialog({
      component: NewsletterEditDialog,
      componentProps: { newsletter },
    })
    .onOk((data: NewsletterUpdateData) => {
      void newsletterStore.updateData(newsletter.id, data);
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
adminOnly: 'Only administrators can create newsletters.'
action:
  create: 'New Newsletter'
  edit: 'Edit'
  delete: 'Delete'
dialog:
  delete:
    title: 'Delete Newsletter'
    message: 'Are you sure you want to delete this newsletter? All subscribers will be removed.'
    label: 'Newsletter Name'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
empty: 'Noch keine Newsletter. Erstellen Sie einen, um loszulegen.'
adminOnly: 'Nur Administratoren können Newsletter erstellen.'
action:
  create: 'Neuer Newsletter'
  edit: 'Bearbeiten'
  delete: 'Löschen'
dialog:
  delete:
    title: 'Newsletter löschen'
    message: 'Möchten Sie diesen Newsletter wirklich löschen? Alle Abonnenten werden entfernt.'
    label: 'Newsletter-Name'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
empty: 'Aucune newsletter pour le moment. Créez-en une pour commencer.'
adminOnly: 'Seuls les administrateurs peuvent créer des newsletters.'
action:
  create: 'Nouvelle newsletter'
  edit: 'Modifier'
  delete: 'Supprimer'
dialog:
  delete:
    title: 'Supprimer la newsletter'
    message: 'Voulez-vous vraiment supprimer cette newsletter ? Tous les abonnés seront supprimés.'
    label: 'Nom de la newsletter'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
empty: 'Brak newsletterów. Utwórz pierwszy, aby zacząć.'
adminOnly: 'Tylko administratorzy mogą tworzyć newslettery.'
action:
  create: 'Nowy newsletter'
  edit: 'Edytuj'
  delete: 'Usuń'
dialog:
  delete:
    title: 'Usuń newsletter'
    message: 'Czy na pewno chcesz usunąć ten newsletter? Wszyscy subskrybenci zostaną usunięci.'
    label: 'Nazwa newslettera'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
empty: 'Zatím žádné newslettery. Vytvořte první a začněte.'
adminOnly: 'Newslettery mohou vytvářet pouze správci.'
action:
  create: 'Nový newsletter'
  edit: 'Upravit'
  delete: 'Smazat'
dialog:
  delete:
    title: 'Smazat newsletter'
    message: 'Opravdu chcete smazat tento newsletter? Všichni odběratelé budou odstraněni.'
    label: 'Název newsletteru'
</i18n>

<style scoped>
.newsletter-card {
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.newsletter-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-2px);
}

.description-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
