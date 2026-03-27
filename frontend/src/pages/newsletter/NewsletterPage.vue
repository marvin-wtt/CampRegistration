<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="column col-sm-11 col-md-10 col-lg-9 col-12">
      <!-- Header -->
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h5">{{ newsletter?.name }}</div>
        <q-btn
          flat
          round
          icon="settings"
          @click="showEditDialog"
        />
      </div>

      <!-- Tabs -->
      <q-tabs
        v-model="tab"
        align="left"
        class="q-mb-md"
      >
        <q-tab
          name="subscribers"
          :label="t('tab.subscribers')"
          icon="people"
        />
        <q-tab
          name="send"
          :label="t('tab.send')"
          icon="send"
        />
        <q-tab
          name="managers"
          :label="t('tab.managers')"
          icon="manage_accounts"
        />
      </q-tabs>

      <q-tab-panels
        v-model="tab"
        animated
      >
        <!-- Subscribers Tab -->
        <q-tab-panel name="subscribers">
          <div class="row justify-between items-center q-mb-sm">
            <div class="text-subtitle1">
              {{ t('subscribers.title') }}
              <q-badge
                v-if="subscribers.length > 0"
                color="primary"
                :label="subscribers.length"
                class="q-ml-sm"
              />
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                outline
                color="primary"
                icon="file_upload"
                :label="t('subscribers.action.import')"
                @click="showImportDialog"
              />
              <q-btn
                color="primary"
                icon="person_add"
                :label="t('subscribers.action.add')"
                @click="showAddSubscriberDialog"
              />
            </div>
          </div>

          <q-table
            :columns="subscriberColumns"
            :rows="subscribers"
            :loading="subscriberStore.isLoading"
            flat
            bordered
          >
            <template #body-cell-action="props">
              <q-td :props>
                <q-btn
                  flat
                  round
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click="showDeleteSubscriberDialog(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Send Tab -->
        <q-tab-panel name="send">
          <div class="text-subtitle1 q-mb-md">{{ t('send.title') }}</div>
          <q-banner
            class="bg-blue-1 q-mb-md"
            rounded
          >
            <template #avatar>
              <q-icon
                name="info"
                color="info"
              />
            </template>
            {{ t('send.gdprNotice') }}
          </q-banner>

          <q-input
            v-model="sendSubject"
            :label="t('send.subject')"
            outlined
            class="q-mb-md"
          />
          <q-input
            v-model="sendBody"
            :label="t('send.body')"
            outlined
            type="textarea"
            rows="10"
            class="q-mb-md"
          />
          <div class="row justify-end">
            <q-btn
              color="primary"
              icon="send"
              :label="t('send.action', { count: subscribers.length })"
              :disable="!sendSubject || !sendBody || subscribers.length === 0"
              @click="confirmSend"
            />
          </div>
        </q-tab-panel>

        <!-- Managers Tab -->
        <q-tab-panel name="managers">
          <div class="row justify-between items-center q-mb-sm">
            <div class="text-subtitle1">{{ t('managers.title') }}</div>
            <q-btn
              color="primary"
              icon="person_add"
              :label="t('managers.action.add')"
              @click="showAddManagerDialog"
            />
          </div>

          <q-list
            bordered
            separator
            class="rounded-borders"
          >
            <q-item
              v-for="manager in managers"
              :key="manager.id"
            >
              <q-item-section avatar>
                <q-avatar
                  color="primary"
                  text-color="white"
                >
                  {{ manager.name?.charAt(0) ?? manager.email.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ manager.name ?? manager.email }}</q-item-label>
                <q-item-label
                  v-if="manager.name"
                  caption
                >
                  {{ manager.email }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="remove_circle"
                  color="negative"
                  size="sm"
                  :disable="managers.length <= 1"
                  @click="showDeleteManagerDialog(manager)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useNewsletterStore } from 'stores/newsletter-store';
import { useNewsletterManagerStore } from 'stores/newsletter-manager-store';
import { useNewsletterSubscriberStore } from 'stores/newsletter-subscriber-store';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar, type QTableColumn } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import type {
  NewsletterManager,
  NewsletterSubscriber,
  NewsletterUpdateData,
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
} from '@camp-registration/common/entities';
import NewsletterEditDialog from 'components/newsletter/NewsletterEditDialog.vue';
import NewsletterSubscriberAddDialog from 'components/newsletter/NewsletterSubscriberAddDialog.vue';
import NewsletterSubscriberImportDialog from 'components/newsletter/NewsletterSubscriberImportDialog.vue';
import NewsletterManagerAddDialog from 'components/newsletter/NewsletterManagerAddDialog.vue';
import { useAPIService } from 'src/services/APIService';

const { t, d } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const api = useAPIService();

const newsletterStore = useNewsletterStore();
const managerStore = useNewsletterManagerStore();
const subscriberStore = useNewsletterSubscriberStore();

const tab = ref('subscribers');
const sendSubject = ref('');
const sendBody = ref('');

const newsletterId = computed(() => route.params.newsletterId as string);

onMounted(async () => {
  await Promise.allSettled([
    newsletterStore.fetchData(),
    managerStore.fetchData(newsletterId.value),
    subscriberStore.fetchData(newsletterId.value),
  ]);
});

const newsletter = computed(() => {
  return newsletterStore.data?.find((n) => n.id === newsletterId.value);
});

const managers = computed<NewsletterManager[]>(() => managerStore.data ?? []);
const subscribers = computed<NewsletterSubscriber[]>(
  () => subscriberStore.data ?? [],
);

const error = computed<string | null>(
  () =>
    newsletterStore.error ?? managerStore.error ?? subscriberStore.error ?? null,
);

const subscriberColumns: QTableColumn[] = [
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'country', label: 'Country', field: 'country', align: 'center', sortable: true },
  {
    name: 'subscribedAt',
    label: 'Subscribed',
    field: (row: NewsletterSubscriber) => d(row.subscribedAt, 'dateTime'),
    align: 'center',
    sortable: true,
  },
  { name: 'action', label: '', field: '', align: 'center' },
];

function showEditDialog() {
  quasar
    .dialog({
      component: NewsletterEditDialog,
      componentProps: {
        newsletter: newsletter.value,
      },
    })
    .onOk((data: NewsletterUpdateData) => {
      void newsletterStore.updateData(newsletterId.value, data);
    });
}

function showAddSubscriberDialog() {
  quasar
    .dialog({ component: NewsletterSubscriberAddDialog })
    .onOk((data: NewsletterSubscriberCreateData) => {
      void subscriberStore.createData(newsletterId.value, data);
    });
}

function showImportDialog() {
  quasar
    .dialog({ component: NewsletterSubscriberImportDialog })
    .onOk((data: NewsletterSubscriberImportData) => {
      void (async () => {
        const result = await subscriberStore.importFromCamp(
          newsletterId.value,
          data,
        );
        await subscriberStore.fetchData(newsletterId.value);
        quasar.notify({
          type: 'positive',
          message: t('subscribers.importResult', result),
        });
      })();
    });
}

function showDeleteSubscriberDialog(subscriber: NewsletterSubscriber) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('subscribers.dialog.delete.title'),
        message: t('subscribers.dialog.delete.message'),
        label: 'Email',
        value: subscriber.email,
      },
    })
    .onOk(() => {
      void subscriberStore.deleteData(newsletterId.value, subscriber.id);
    });
}

function showAddManagerDialog() {
  quasar
    .dialog({ component: NewsletterManagerAddDialog })
    .onOk((data: { email: string }) => {
      void managerStore.createData(newsletterId.value, data);
    });
}

function showDeleteManagerDialog(manager: NewsletterManager) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('managers.dialog.delete.title'),
        message: t('managers.dialog.delete.message'),
        label: 'Email',
        value: manager.email,
      },
    })
    .onOk(() => {
      void managerStore.deleteData(newsletterId.value, manager.id);
    });
}

function confirmSend() {
  quasar
    .dialog({
      title: t('send.dialog.title'),
      message: t('send.dialog.message', { count: subscribers.value.length }),
      cancel: true,
      persistent: true,
    })
    .onOk(() => {
      void (async () => {
        try {
          const result = await api.sendNewsletter(newsletterId.value, {
            subject: sendSubject.value,
            body: sendBody.value,
          });
          quasar.notify({
            type: 'positive',
            message: t('send.success', { count: result.queued }),
          });
          sendSubject.value = '';
          sendBody.value = '';
        } catch {
          quasar.notify({
            type: 'negative',
            message: t('send.error'),
          });
        }
      })();
    });
}
</script>

<i18n lang="yaml" locale="en">
tab:
  subscribers: 'Subscribers'
  send: 'Send'
  managers: 'Managers'

subscribers:
  title: 'Subscribers'
  action:
    add: 'Add Subscriber'
    import: 'Import from Camp'
  importResult: 'Imported {added} new subscribers, {skipped} already subscribed.'
  dialog:
    delete:
      title: 'Remove Subscriber'
      message: 'Are you sure you want to remove this subscriber?'

send:
  title: 'Send Newsletter'
  subject: 'Subject'
  body: 'Message Body (HTML supported)'
  action: 'Send to {count} Subscribers'
  gdprNotice: 'Every email will include an unsubscribe link as required by EU law (GDPR). Subscribers can unsubscribe at any time.'
  success: 'Newsletter queued for {count} recipients.'
  error: 'Failed to send newsletter.'
  dialog:
    title: 'Confirm Send'
    message: 'Are you sure you want to send this newsletter to {count} subscribers?'

managers:
  title: 'Managers'
  action:
    add: 'Add Manager'
  dialog:
    delete:
      title: 'Remove Manager'
      message: 'Are you sure you want to remove this manager?'
</i18n>

<i18n lang="yaml" locale="de">
tab:
  subscribers: 'Abonnenten'
  send: 'Senden'
  managers: 'Verwalter'

subscribers:
  title: 'Abonnenten'
  action:
    add: 'Abonnent hinzufügen'
    import: 'Aus Lager importieren'
  importResult: '{added} neue Abonnenten importiert, {skipped} bereits abonniert.'
  dialog:
    delete:
      title: 'Abonnent entfernen'
      message: 'Möchten Sie diesen Abonnenten wirklich entfernen?'

send:
  title: 'Newsletter versenden'
  subject: 'Betreff'
  body: 'Nachrichtentext (HTML unterstützt)'
  action: 'An {count} Abonnenten senden'
  gdprNotice: 'Jede E-Mail enthält einen Abmeldelink gemäß EU-Recht (DSGVO). Abonnenten können sich jederzeit abmelden.'
  success: 'Newsletter für {count} Empfänger in die Warteschlange gestellt.'
  error: 'Newsletter konnte nicht gesendet werden.'
  dialog:
    title: 'Versand bestätigen'
    message: 'Möchten Sie diesen Newsletter wirklich an {count} Abonnenten senden?'

managers:
  title: 'Verwalter'
  action:
    add: 'Verwalter hinzufügen'
  dialog:
    delete:
      title: 'Verwalter entfernen'
      message: 'Möchten Sie diesen Verwalter wirklich entfernen?'
</i18n>

<i18n lang="yaml" locale="fr">
tab:
  subscribers: 'Abonnés'
  send: 'Envoyer'
  managers: 'Gestionnaires'

subscribers:
  title: 'Abonnés'
  action:
    add: 'Ajouter un abonné'
    import: 'Importer depuis un camp'
  importResult: '{added} nouveaux abonnés importés, {skipped} déjà abonnés.'
  dialog:
    delete:
      title: 'Supprimer un abonné'
      message: 'Voulez-vous vraiment supprimer cet abonné ?'

send:
  title: 'Envoyer la newsletter'
  subject: 'Sujet'
  body: 'Corps du message (HTML pris en charge)'
  action: 'Envoyer à {count} abonnés'
  gdprNotice: 'Chaque e-mail contiendra un lien de désinscription conformément à la législation européenne (RGPD). Les abonnés peuvent se désabonner à tout moment.'
  success: 'Newsletter mise en file d''attente pour {count} destinataires.'
  error: 'Échec de l''envoi de la newsletter.'
  dialog:
    title: 'Confirmer l''envoi'
    message: 'Voulez-vous vraiment envoyer cette newsletter à {count} abonnés ?'

managers:
  title: 'Gestionnaires'
  action:
    add: 'Ajouter un gestionnaire'
  dialog:
    delete:
      title: 'Supprimer un gestionnaire'
      message: 'Voulez-vous vraiment supprimer ce gestionnaire ?'
</i18n>

<i18n lang="yaml" locale="pl">
tab:
  subscribers: 'Subskrybenci'
  send: 'Wyślij'
  managers: 'Zarządzający'

subscribers:
  title: 'Subskrybenci'
  action:
    add: 'Dodaj subskrybenta'
    import: 'Importuj z obozu'
  importResult: 'Zaimportowano {added} nowych subskrybentów, {skipped} już zapisanych.'
  dialog:
    delete:
      title: 'Usuń subskrybenta'
      message: 'Czy na pewno chcesz usunąć tego subskrybenta?'

send:
  title: 'Wyślij newsletter'
  subject: 'Temat'
  body: 'Treść wiadomości (obsługiwany HTML)'
  action: 'Wyślij do {count} subskrybentów'
  gdprNotice: 'Każda wiadomość e-mail będzie zawierać link do rezygnacji z subskrypcji zgodnie z prawem UE (RODO). Subskrybenci mogą zrezygnować w dowolnym momencie.'
  success: 'Newsletter dodany do kolejki dla {count} odbiorców.'
  error: 'Nie udało się wysłać newslettera.'
  dialog:
    title: 'Potwierdź wysyłkę'
    message: 'Czy na pewno chcesz wysłać ten newsletter do {count} subskrybentów?'

managers:
  title: 'Zarządzający'
  action:
    add: 'Dodaj zarządzającego'
  dialog:
    delete:
      title: 'Usuń zarządzającego'
      message: 'Czy na pewno chcesz usunąć tego zarządzającego?'
</i18n>

<i18n lang="yaml" locale="cs">
tab:
  subscribers: 'Odběratelé'
  send: 'Odeslat'
  managers: 'Správci'

subscribers:
  title: 'Odběratelé'
  action:
    add: 'Přidat odběratele'
    import: 'Importovat z tábora'
  importResult: 'Importováno {added} nových odběratelů, {skipped} již přihlášených.'
  dialog:
    delete:
      title: 'Odstranit odběratele'
      message: 'Opravdu chcete odstranit tohoto odběratele?'

send:
  title: 'Odeslat newsletter'
  subject: 'Předmět'
  body: 'Tělo zprávy (podporuje HTML)'
  action: 'Odeslat {count} odběratelům'
  gdprNotice: 'Každý e-mail bude obsahovat odkaz pro odhlášení v souladu s právem EU (GDPR). Odběratelé se mohou kdykoli odhlásit.'
  success: 'Newsletter zařazen do fronty pro {count} příjemců.'
  error: 'Odeslání newsletteru se nezdařilo.'
  dialog:
    title: 'Potvrdit odeslání'
    message: 'Opravdu chcete odeslat tento newsletter {count} odběratelům?'

managers:
  title: 'Správci'
  action:
    add: 'Přidat správce'
  dialog:
    delete:
      title: 'Odstranit správce'
      message: 'Opravdu chcete odstranit tohoto správce?'
</i18n>

<style scoped></style>
