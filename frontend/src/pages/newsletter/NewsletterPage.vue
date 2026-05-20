<template>
  <page-state-handler
    :error
    style="height: 1px"
  >
    <div class="absolute fit row no-wrap justify-center q-pa-md">
      <div class="column no-wrap col-sm-11 col-md-10 col-lg-9 col-12">
        <!-- Header -->
        <div class="row items-start justify-between no-wrap q-mb-lg">
          <div class="col">
            <div
              class="text-overline text-grey-6 text-uppercase letter-spacing-1"
            >
              {{ t('header.label') }}
            </div>
            <div class="text-h5 text-weight-medium">{{ newsletter?.name }}</div>
            <div
              v-if="newsletter?.description"
              class="text-body2 text-grey-6 q-mt-xs"
            >
              {{ newsletter.description }}
            </div>
            <div
              v-if="newsletter?.replyTo"
              class="row items-center q-gutter-x-xs q-mt-xs text-body2 text-grey-6"
            >
              <q-icon
                name="reply"
                size="xs"
              />
              <span>{{ newsletter.replyTo }}</span>
            </div>
            <div
              class="row items-center q-gutter-x-md q-mt-sm text-body2 text-grey-6"
            >
              <div class="row items-center q-gutter-x-xs">
                <q-icon
                  name="people"
                  size="xs"
                />
                <span>
                  {{ t('header.subscribers', { count: subscribers.length }) }}
                </span>
              </div>
              <div class="row items-center q-gutter-x-xs">
                <q-icon
                  name="send"
                  size="xs"
                />
                <span>{{ t('header.sent', { count: messages.length }) }}</span>
              </div>
            </div>
          </div>
          <q-btn
            flat
            round
            icon="edit"
            color="grey-7"
            class="q-mt-sm"
            @click="showEditDialog"
          >
            <q-tooltip>{{ t('header.edit') }}</q-tooltip>
          </q-btn>
        </div>

        <!-- Tabs -->
        <div class="column no-wrap col newsletter-tabs">
          <q-tabs
            v-model="tab"
            align="left"
            no-caps
            indicator-color="primary"
            class="q-mb-none"
          >
            <q-tab
              name="compose"
              :label="t('tab.compose')"
              icon="edit_note"
            />
            <q-tab
              name="history"
              :label="t('tab.history')"
              icon="history"
            />
            <q-tab
              name="subscribers"
              :label="t('tab.subscribers')"
              icon="people"
            />
            <q-tab
              name="managers"
              :label="t('tab.managers')"
              icon="manage_accounts"
            />
          </q-tabs>
          <q-separator />

          <q-tab-panels
            v-model="tab"
            animated
            class="col bg-transparent newsletter-panels"
          >
            <!-- Compose Tab -->
            <q-tab-panel
              name="compose"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <div class="q-gutter-y-md">
                <q-input
                  v-model="sendSubject"
                  :label="t('compose.subject')"
                  outlined
                  rounded
                  clearable
                >
                  <template #before>
                    <q-icon name="subject" />
                  </template>
                </q-input>

                <div>
                  <div class="text-caption text-grey-7 q-mb-xs q-ml-sm">
                    {{ t('compose.body') }}
                  </div>
                  <email-editor
                    v-model="sendBody"
                    :placeholder="t('compose.bodyPlaceholder')"
                    outlined
                    rounded
                    style="min-height: 200px"
                  />
                </div>

                <file-input
                  v-model="sendAttachments"
                  :label="t('compose.attachments')"
                  outlined
                  rounded
                >
                  <template #before>
                    <q-icon name="attach_file" />
                  </template>
                </file-input>

                <div class="row justify-between items-center q-pt-sm">
                  <div class="text-body2 text-grey-6">
                    <q-icon
                      name="info_outline"
                      size="xs"
                      class="q-mr-xs"
                    />
                    {{
                      t('compose.recipientInfo', { count: subscribers.length })
                    }}
                  </div>
                  <q-btn
                    color="primary"
                    icon="send"
                    :label="t('compose.send')"
                    :disable="
                      !sendSubject || !sendBody || subscribers.length === 0
                    "
                    rounded
                    unelevated
                    no-caps
                    @click="confirmSend"
                  />
                </div>
              </div>
            </q-tab-panel>

            <!-- History Tab -->
            <q-tab-panel
              name="history"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <div
                v-if="messageStore.isLoading"
                class="q-gutter-y-sm"
              >
                <q-skeleton
                  v-for="i in 3"
                  :key="i"
                  height="60px"
                  class="rounded-borders"
                />
              </div>

              <div
                v-else-if="messages.length === 0"
                class="column items-center q-pa-xl q-gutter-sm"
              >
                <q-icon
                  name="mark_email_unread"
                  size="4rem"
                  color="grey-4"
                />
                <div class="text-subtitle2 text-grey-6">
                  {{ t('history.empty') }}
                </div>
                <div class="text-body2 text-grey-5 text-center">
                  {{ t('history.emptyHint') }}
                </div>
              </div>

              <q-list
                v-else
                bordered
                separator
                class="rounded-borders list-scroll"
              >
                <q-expansion-item
                  v-for="message in messages"
                  :key="message.id"
                  expand-separator
                >
                  <template #header>
                    <q-item-section avatar>
                      <q-avatar
                        color="primary"
                        text-color="white"
                        size="36px"
                        icon="email"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ message.subject }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ d(message.sentAt, 'dateTime') }}
                        <span v-if="message.sentBy">
                          &middot; {{ message.sentBy.name }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center q-gutter-xs no-wrap">
                        <q-chip
                          dense
                          outline
                          icon="people"
                          :label="String(message.recipientCount)"
                          color="grey-6"
                        />
                        <q-btn
                          flat
                          round
                          dense
                          icon="forward"
                          size="sm"
                          @click.stop="useAsTemplate(message)"
                        >
                          <q-tooltip>
                            {{ t('history.useAsTemplate') }}
                          </q-tooltip>
                        </q-btn>
                        <q-btn
                          flat
                          round
                          dense
                          icon="delete_outline"
                          color="negative"
                          size="sm"
                          @click.stop="deleteMessage(message)"
                        >
                          <q-tooltip>{{ t('history.delete') }}</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </template>

                  <q-separator />
                  <div
                    class="q-pa-md newsletter-preview"
                    v-html="sanitizedBodies[message.id]"
                  />
                </q-expansion-item>
              </q-list>
            </q-tab-panel>

            <!-- Subscribers Tab -->
            <q-tab-panel
              name="subscribers"
              class="q-pa-none column no-wrap"
              style="overflow: hidden"
            >
              <!-- Toolbar + Search -->
              <div class="row items-center q-gutter-sm q-mb-md q-mt-lg">
                <q-input
                  v-model="subscriberFilter"
                  :placeholder="t('subscribers.search')"
                  dense
                  outlined
                  rounded
                  clearable
                  class="col"
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <q-btn
                  outline
                  color="primary"
                  icon="file_upload"
                  :label="
                    quasar.screen.gt.sm
                      ? t('subscribers.action.import')
                      : undefined
                  "
                  rounded
                  no-caps
                  @click="showImportDialog"
                >
                  <q-tooltip v-if="quasar.screen.lt.md">
                    {{ t('subscribers.action.import') }}
                  </q-tooltip>
                </q-btn>
                <q-btn
                  color="primary"
                  icon="person_add"
                  :label="
                    quasar.screen.gt.sm
                      ? t('subscribers.action.add')
                      : undefined
                  "
                  rounded
                  unelevated
                  no-caps
                  @click="showAddSubscriberDialog"
                >
                  <q-tooltip v-if="quasar.screen.lt.md">
                    {{ t('subscribers.action.add') }}
                  </q-tooltip>
                </q-btn>
              </div>

              <!-- Loading skeletons -->
              <div
                v-if="subscriberStore.isLoading"
                class="q-gutter-y-sm"
              >
                <q-skeleton
                  v-for="i in 4"
                  :key="i"
                  height="56px"
                  class="rounded-borders"
                />
              </div>

              <!-- Empty: no subscribers at all -->
              <div
                v-else-if="subscribers.length === 0"
                class="column items-center q-pa-xl q-gutter-sm"
              >
                <q-icon
                  name="group_off"
                  size="4rem"
                  color="grey-4"
                />
                <div class="text-subtitle2 text-grey-6">
                  {{ t('subscribers.empty') }}
                </div>
                <div class="text-body2 text-grey-5 text-center">
                  {{ t('subscribers.emptyHint') }}
                </div>
                <q-btn
                  color="primary"
                  icon="person_add"
                  :label="t('subscribers.action.add')"
                  rounded
                  unelevated
                  no-caps
                  class="q-mt-sm"
                  @click="showAddSubscriberDialog"
                />
              </div>

              <!-- Empty: search yielded no results -->
              <div
                v-else-if="filteredSubscribers.length === 0"
                class="column items-center q-pa-lg q-gutter-xs"
              >
                <q-icon
                  name="search_off"
                  size="3rem"
                  color="grey-4"
                />
                <div class="text-body2 text-grey-6">
                  {{ t('subscribers.noResults') }}
                </div>
              </div>

              <!-- Subscriber list -->
              <q-list
                v-else
                bordered
                separator
                class="col rounded-borders list-scroll"
              >
                <q-item
                  v-for="subscriber in filteredSubscribers"
                  :key="subscriber.id"
                >
                  <q-item-section avatar>
                    <q-avatar
                      color="primary"
                      text-color="white"
                      size="36px"
                    >
                      {{
                        (subscriber.name ?? subscriber.email)
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ subscriber.email }}
                    </q-item-label>
                    <q-item-label
                      v-if="subscriber.name"
                      caption
                    >
                      {{ subscriber.name }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ d(subscriber.subscribedAt, 'date') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      icon="person_remove"
                      color="negative"
                      size="sm"
                      @click="showDeleteSubscriberDialog(subscriber)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>

            <!-- Managers Tab -->
            <q-tab-panel
              name="managers"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <div class="row justify-end q-mb-md">
                <q-btn
                  color="primary"
                  icon="person_add"
                  :label="t('managers.action.add')"
                  rounded
                  unelevated
                  no-caps
                  @click="showAddManagerDialog"
                />
              </div>

              <q-list
                bordered
                separator
                class="rounded-borders list-scroll"
              >
                <q-item
                  v-for="manager in managers"
                  :key="manager.id"
                >
                  <q-item-section avatar>
                    <q-avatar
                      color="primary"
                      text-color="white"
                      size="36px"
                    >
                      {{
                        manager.name?.charAt(0).toUpperCase() ??
                        manager.email.charAt(0).toUpperCase()
                      }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ manager.name ?? manager.email }}
                    </q-item-label>
                    <q-item-label
                      v-if="manager.name"
                      caption
                    >
                      {{ manager.email }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    v-if="manager.email !== userEmail"
                    side
                  >
                    <q-btn
                      flat
                      round
                      icon="person_remove"
                      color="negative"
                      size="sm"
                      @click="showDeleteManagerDialog(manager)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
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
import { useNewsletterMessageStore } from 'stores/newsletter-message-store';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import EmailEditor from 'components/campManagement/contact/EmailEditor.vue';
import FileInput, {
  type FileInputModel,
} from 'components/common/inputs/FileInput.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import type {
  NewsletterManager,
  NewsletterMessage,
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
import { useProfileStore } from 'stores/profile-store';
import DOMPurify from 'dompurify';

const { t, d } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const api = useAPIService();

const profileStore = useProfileStore();
const newsletterStore = useNewsletterStore();
const managerStore = useNewsletterManagerStore();
const subscriberStore = useNewsletterSubscriberStore();
const messageStore = useNewsletterMessageStore();

const tab = ref('compose');
const sendSubject = ref('');
const sendBody = ref('');
const sendAttachments = ref<FileInputModel[]>([]);
const subscriberFilter = ref('');

const newsletterId = computed(() => route.params.newsletterId as string);

onMounted(async () => {
  await Promise.allSettled([
    loadNewsletter(),
    managerStore.fetchData(newsletterId.value),
    subscriberStore.fetchData(newsletterId.value),
    messageStore.fetchData(newsletterId.value),
  ]);
});

async function loadNewsletter() {
  await newsletterStore.fetchData();
  if (!newsletter.value) {
    await newsletterStore.fetchById(newsletterId.value);
  }
}

const userEmail = computed<string | undefined>(() => {
  return profileStore.user?.email;
});

const newsletter = computed(() =>
  newsletterStore.data?.find((n) => n.id === newsletterId.value),
);

const managers = computed<NewsletterManager[]>(() => managerStore.data ?? []);
const subscribers = computed<NewsletterSubscriber[]>(
  () => subscriberStore.data ?? [],
);
const messages = computed<NewsletterMessage[]>(() => messageStore.data ?? []);

const error = computed<string | null>(
  () =>
    newsletterStore.error ??
    managerStore.error ??
    subscriberStore.error ??
    messageStore.error ??
    null,
);

const sanitizedBodies = computed<Record<string, string>>(() =>
  Object.fromEntries(
    messages.value.map((m) => [m.id, DOMPurify.sanitize(m.body)]),
  ),
);

const filteredSubscribers = computed<NewsletterSubscriber[]>(() => {
  const query = subscriberFilter.value?.trim().toLowerCase();
  if (!query) {
    return subscribers.value;
  }

  return subscribers.value.filter(
    (s) =>
      s.email.toLowerCase().includes(query) ||
      (s.name?.toLowerCase().includes(query) ?? false),
  );
});

function showEditDialog() {
  quasar
    .dialog({
      component: NewsletterEditDialog,
      componentProps: { newsletter: newsletter.value },
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

function useAsTemplate(message: NewsletterMessage) {
  sendSubject.value = message.subject;
  sendBody.value = message.body;
  sendAttachments.value = [];
  tab.value = 'compose';
}

function deleteMessage(message: NewsletterMessage) {
  quasar
    .dialog({
      title: t('history.dialog.delete.title'),
      message: t('history.dialog.delete.message'),
      ok: {
        label: t('history.delete'),
        color: 'negative',
        rounded: true,
      },
      cancel: {
        color: 'primary',
        flat: true,
        rounded: true,
      },
      persistent: true,
    })
    .onOk(() => {
      void messageStore.deleteData(newsletterId.value, message.id);
    });
}

function confirmSend() {
  quasar
    .dialog({
      title: t('compose.dialog.title'),
      message: t('compose.dialog.message', { count: subscribers.value.length }),
      ok: {
        color: 'primary',
        rounded: true,
      },
      cancel: {
        color: 'primary',
        flat: true,
        rounded: true,
      },
      persistent: true,
    })
    .onOk(() => {
      void (async () => {
        try {
          const result = await api.sendNewsletterMessage(newsletterId.value, {
            subject: sendSubject.value,
            body: sendBody.value,
            attachmentIds: sendAttachments.value
              .filter((f) => f.id !== undefined)
              .map((f) => f.id!),
          });
          messageStore.invalidate();
          await messageStore.fetchData(newsletterId.value);
          quasar.notify({
            type: 'positive',
            message: t('compose.success', { count: result.recipientCount }),
          });
          sendSubject.value = '';
          sendBody.value = '';
          sendAttachments.value = [];
          tab.value = 'history';
        } catch {
          quasar.notify({
            type: 'negative',
            message: t('compose.error'),
          });
        }
      })();
    });
}
</script>

<i18n lang="yaml" locale="en">
tab:
  compose: 'Compose'
  history: 'History'
  subscribers: 'Subscribers'
  managers: 'Managers'

header:
  label: 'Newsletter'
  subscribers: '{count} subscribers'
  sent: '{count} sent'
  edit: 'Edit newsletter'

compose:
  subject: 'Subject'
  body: 'Message'
  bodyPlaceholder: 'Write your newsletter content here...'
  attachments: 'Attachments (optional)'
  recipientInfo: 'Will be sent to {count} subscribers'
  send: 'Send Newsletter'
  success: 'Newsletter queued for {count} recipients.'
  error: 'Failed to send newsletter. Please try again.'
  dialog:
    title: 'Send Newsletter'
    message: 'Send this newsletter to {count} subscribers?'

history:
  empty: 'No newsletters sent yet'
  emptyHint: 'Your sent newsletters will appear here.'
  useAsTemplate: 'Use as template'
  delete: 'Delete'
  dialog:
    delete:
      title: 'Delete Message'
      message: 'Are you sure you want to delete this message? This cannot be undone.'

subscribers:
  count: '{count} subscribers'
  empty: 'No subscribers yet'
  emptyHint: 'Add subscribers manually or import them from a camp.'
  noResults: 'No subscribers match your search.'
  search: 'Search subscribers...'
  action:
    add: 'Add Subscriber'
    import: 'Import from Camp'
  importResult: 'Imported {added} new subscribers, {skipped} already subscribed.'
  dialog:
    delete:
      title: 'Remove Subscriber'
      message: 'Are you sure you want to remove this subscriber?'

managers:
  action:
    add: 'Add Manager'
  removeDisabledHint: 'At least one manager is required'
  dialog:
    delete:
      title: 'Remove Manager'
      message: 'Are you sure you want to remove this manager?'
</i18n>

<i18n lang="yaml" locale="de">
tab:
  compose: 'Verfassen'
  history: 'Verlauf'
  subscribers: 'Abonnenten'
  managers: 'Verwalter'

header:
  label: 'Newsletter'
  subscribers: '{count} Abonnenten'
  sent: '{count} gesendet'
  edit: 'Newsletter bearbeiten'

compose:
  subject: 'Betreff'
  body: 'Nachricht'
  bodyPlaceholder: 'Schreiben Sie hier Ihren Newsletter-Inhalt...'
  attachments: 'Anhänge (optional)'
  recipientInfo: 'Wird an {count} Abonnenten gesendet'
  send: 'Newsletter senden'
  success: 'Newsletter für {count} Empfänger in die Warteschlange gestellt.'
  error: 'Newsletter konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'
  dialog:
    title: 'Newsletter senden'
    message: 'Diesen Newsletter an {count} Abonnenten senden?'

history:
  empty: 'Noch keine Newsletter gesendet'
  emptyHint: 'Ihre gesendeten Newsletter erscheinen hier.'
  useAsTemplate: 'Als Vorlage verwenden'
  delete: 'Löschen'
  dialog:
    delete:
      title: 'Nachricht löschen'
      message: 'Möchten Sie diese Nachricht wirklich löschen? Dies kann nicht rückgängig gemacht werden.'

subscribers:
  count: '{count} Abonnenten'
  empty: 'Noch keine Abonnenten'
  emptyHint: 'Abonnenten manuell hinzufügen oder aus einem Camp importieren.'
  noResults: 'Keine Abonnenten entsprechen Ihrer Suche.'
  search: 'Abonnenten suchen...'
  action:
    add: 'Abonnent hinzufügen'
    import: 'Aus Camp importieren'
  importResult: '{added} neue Abonnenten importiert, {skipped} bereits abonniert.'
  dialog:
    delete:
      title: 'Abonnent entfernen'
      message: 'Möchten Sie diesen Abonnenten wirklich entfernen?'

managers:
  action:
    add: 'Verwalter hinzufügen'
  removeDisabledHint: 'Mindestens ein Verwalter ist erforderlich'
  dialog:
    delete:
      title: 'Verwalter entfernen'
      message: 'Möchten Sie diesen Verwalter wirklich entfernen?'
</i18n>

<i18n lang="yaml" locale="fr">
tab:
  compose: 'Rédiger'
  history: 'Historique'
  subscribers: 'Abonnés'
  managers: 'Gestionnaires'

header:
  label: 'Newsletter'
  subscribers: '{count} abonnés'
  sent: '{count} envoyés'
  edit: 'Modifier la newsletter'

compose:
  subject: 'Sujet'
  body: 'Message'
  bodyPlaceholder: 'Rédigez ici le contenu de votre newsletter...'
  attachments: 'Pièces jointes (optionnel)'
  recipientInfo: 'Sera envoyé à {count} abonnés'
  send: 'Envoyer la newsletter'
  success: "Newsletter mise en file d'attente pour {count} destinataires."
  error: "Échec de l'envoi de la newsletter. Veuillez réessayer."
  dialog:
    title: 'Envoyer la newsletter'
    message: 'Envoyer cette newsletter à {count} abonnés ?'

history:
  empty: 'Aucune newsletter envoyée pour le moment'
  emptyHint: 'Vos newsletters envoyées apparaîtront ici.'
  useAsTemplate: 'Utiliser comme modèle'
  delete: 'Supprimer'
  dialog:
    delete:
      title: 'Supprimer le message'
      message: 'Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.'

subscribers:
  count: '{count} abonnés'
  empty: 'Aucun abonné pour le moment'
  emptyHint: 'Ajoutez des abonnés manuellement ou importez-les depuis un camp.'
  noResults: 'Aucun abonné ne correspond à votre recherche.'
  search: 'Rechercher des abonnés...'
  action:
    add: 'Ajouter un abonné'
    import: 'Importer depuis un camp'
  importResult: '{added} nouveaux abonnés importés, {skipped} déjà abonnés.'
  dialog:
    delete:
      title: 'Supprimer un abonné'
      message: 'Voulez-vous vraiment supprimer cet abonné ?'

managers:
  action:
    add: 'Ajouter un gestionnaire'
  removeDisabledHint: 'Au moins un gestionnaire est requis'
  dialog:
    delete:
      title: 'Supprimer un gestionnaire'
      message: 'Voulez-vous vraiment supprimer ce gestionnaire ?'
</i18n>

<i18n lang="yaml" locale="pl">
tab:
  compose: 'Utwórz'
  history: 'Historia'
  subscribers: 'Subskrybenci'
  managers: 'Zarządzający'

header:
  label: 'Newsletter'
  subscribers: '{count} subskrybentów'
  sent: '{count} wysłanych'
  edit: 'Edytuj newsletter'

compose:
  subject: 'Temat'
  body: 'Wiadomość'
  bodyPlaceholder: 'Napisz tutaj treść swojego newslettera...'
  attachments: 'Załączniki (opcjonalnie)'
  recipientInfo: 'Zostanie wysłany do {count} subskrybentów'
  send: 'Wyślij newsletter'
  success: 'Newsletter dodany do kolejki dla {count} odbiorców.'
  error: 'Nie udało się wysłać newslettera. Spróbuj ponownie.'
  dialog:
    title: 'Wyślij newsletter'
    message: 'Wysłać ten newsletter do {count} subskrybentów?'

history:
  empty: 'Nie wysłano jeszcze żadnych newsletterów'
  emptyHint: 'Twoje wysłane newslettery pojawią się tutaj.'
  useAsTemplate: 'Użyj jako szablon'
  delete: 'Usuń'
  dialog:
    delete:
      title: 'Usuń wiadomość'
      message: 'Czy na pewno chcesz usunąć tę wiadomość? Tej operacji nie można cofnąć.'

subscribers:
  count: '{count} subskrybentów'
  empty: 'Brak subskrybentów'
  emptyHint: 'Dodaj subskrybentów ręcznie lub importuj z obozu.'
  noResults: 'Brak subskrybentów pasujących do wyszukiwania.'
  search: 'Szukaj subskrybentów...'
  action:
    add: 'Dodaj subskrybenta'
    import: 'Importuj z obozu'
  importResult: 'Zaimportowano {added} nowych subskrybentów, {skipped} już zapisanych.'
  dialog:
    delete:
      title: 'Usuń subskrybenta'
      message: 'Czy na pewno chcesz usunąć tego subskrybenta?'

managers:
  action:
    add: 'Dodaj zarządzającego'
  removeDisabledHint: 'Wymagany jest co najmniej jeden zarządzający'
  dialog:
    delete:
      title: 'Usuń zarządzającego'
      message: 'Czy na pewno chcesz usunąć tego zarządzającego?'
</i18n>

<i18n lang="yaml" locale="cs">
tab:
  compose: 'Napsat'
  history: 'Historie'
  subscribers: 'Odběratelé'
  managers: 'Správci'

header:
  label: 'Newsletter'
  subscribers: '{count} odběratelů'
  sent: '{count} odesláno'
  edit: 'Upravit newsletter'

compose:
  subject: 'Předmět'
  body: 'Zpráva'
  bodyPlaceholder: 'Napište zde obsah svého newsletteru...'
  attachments: 'Přílohy (volitelné)'
  recipientInfo: 'Bude odesláno {count} odběratelům'
  send: 'Odeslat newsletter'
  success: 'Newsletter zařazen do fronty pro {count} příjemců.'
  error: 'Odeslání newsletteru se nezdařilo. Zkuste to prosím znovu.'
  dialog:
    title: 'Odeslat newsletter'
    message: 'Odeslat tento newsletter {count} odběratelům?'

history:
  empty: 'Zatím nebyl odeslán žádný newsletter'
  emptyHint: 'Vaše odeslané newslettery se zobrazí zde.'
  useAsTemplate: 'Použít jako šablonu'
  delete: 'Smazat'
  dialog:
    delete:
      title: 'Smazat zprávu'
      message: 'Opravdu chcete smazat tuto zprávu? Tuto akci nelze vrátit zpět.'

subscribers:
  count: '{count} odběratelů'
  empty: 'Zatím žádní odběratelé'
  emptyHint: 'Přidejte odběratele ručně nebo je importujte z tábora.'
  noResults: 'Žádní odběratelé neodpovídají vašemu hledání.'
  search: 'Hledat odběratele...'
  action:
    add: 'Přidat odběratele'
    import: 'Importovat z tábora'
  importResult: 'Importováno {added} nových odběratelů, {skipped} již přihlášených.'
  dialog:
    delete:
      title: 'Odstranit odběratele'
      message: 'Opravdu chcete odstranit tohoto odběratele?'

managers:
  action:
    add: 'Přidat správce'
  removeDisabledHint: 'Je vyžadován alespoň jeden správce'
  dialog:
    delete:
      title: 'Odstranit správce'
      message: 'Opravdu chcete odstranit tohoto správce?'
</i18n>

<style scoped>
.newsletter-tabs {
  min-height: 0;
}

.newsletter-panels {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.newsletter-panels :deep(.q-tab-panel) {
  flex: 1;
  min-height: 0;
}

.list-scroll {
  overflow-y: auto;
  min-height: 0;
}

.newsletter-preview {
  font-family: inherit;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}

.newsletter-preview :deep(p) {
  margin: 0 0 0.75em;
}

.newsletter-preview :deep(ul),
.newsletter-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 0.75em;
}

.newsletter-preview :deep(a) {
  color: var(--q-primary);
}
</style>
