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
              v-if="newsletter"
              class="row items-center q-gutter-x-xs q-mt-xs text-body2 text-grey-6"
            >
              <q-icon
                name="apartment"
                size="xs"
              />
              <span>{{ newsletter.organizationName }}</span>
              <q-tooltip>{{ t('header.organization') }}</q-tooltip>
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
            v-if="canNewsletter('newsletter.edit')"
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

        <!-- Set-up is allowed before verification, sending is not — so say so
             here rather than let the send button look available. -->
        <q-card
          v-if="newsletter && blockedReason"
          flat
          bordered
          class="blocked-card q-mb-md"
        >
          <q-card-section class="row items-center no-wrap q-gutter-md">
            <q-icon
              :name="blockedReason === 'rejected' ? 'gpp_bad' : 'gpp_maybe'"
              color="negative"
              size="22px"
            />
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">
                {{ t(`unverified.${blockedReason}.title`) }}
              </div>
              <div class="text-body2 text-grey-7">
                {{
                  t(`unverified.${blockedReason}.message`, {
                    organization: newsletter.organizationName,
                  })
                }}
              </div>
            </div>
            <q-btn
              v-if="canOrgFor(newsletter.organizationId, 'organization.view')"
              :label="t('unverified.action')"
              outline
              rounded
              no-caps
              color="negative"
              :to="{
                name: 'management.organization.verification',
                params: { organizationId: newsletter.organizationId },
              }"
            />
          </q-card-section>
        </q-card>

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
              v-if="visibleTabs.includes('compose')"
              name="compose"
              :label="t('tab.compose')"
              icon="edit_note"
            />
            <q-tab
              v-if="visibleTabs.includes('history')"
              name="history"
              :label="t('tab.history')"
              icon="history"
            />
            <q-tab
              v-if="visibleTabs.includes('subscribers')"
              name="subscribers"
              :label="t('tab.subscribers')"
              icon="people"
            />
            <q-tab
              v-if="visibleTabs.includes('managers')"
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
              v-if="visibleTabs.includes('compose')"
              name="compose"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <div class="column no-wrap q-gutter-y-md full-height">
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

                <div class="compose-body">
                  <email-editor
                    v-model="sendBody"
                    :label="t('compose.body')"
                    :placeholder="t('compose.bodyPlaceholder')"
                    outlined
                    rounded
                    class="compose-body__editor"
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
                  <div
                    class="text-body2"
                    :class="blockedReason ? 'text-negative' : 'text-grey-6'"
                  >
                    <q-icon
                      :name="blockedReason ? 'block' : 'info_outline'"
                      size="xs"
                      class="q-mr-xs"
                    />
                    {{
                      blockedReason
                        ? t('compose.blocked')
                        : t('compose.recipientInfo', {
                            count: subscribers.length,
                          })
                    }}
                  </div>
                  <q-btn
                    color="primary"
                    icon="send"
                    :label="t('compose.send')"
                    :disable="
                      !sendSubject ||
                      !sendBody ||
                      subscribers.length === 0 ||
                      blockedReason !== null
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
              v-if="visibleTabs.includes('history')"
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
                          v-if="visibleTabs.includes('compose')"
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
                          v-if="canNewsletter('newsletter.messages.delete')"
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
              v-if="visibleTabs.includes('subscribers')"
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
                  v-if="canNewsletter('newsletter.subscribers.create')"
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
                  v-if="canNewsletter('newsletter.subscribers.create')"
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
                  v-for="i in 6"
                  :key="i"
                  height="36px"
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
                  v-if="canNewsletter('newsletter.subscribers.create')"
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
                  dense
                  class="subscriber-item"
                >
                  <q-item-section avatar>
                    <q-avatar
                      color="primary"
                      text-color="white"
                      size="24px"
                      class="text-caption"
                    >
                      {{
                        (subscriber.name ?? subscriber.email)
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      lines="1"
                      class="text-body2"
                    >
                      {{ subscriber.email }}
                      <span
                        v-if="subscriber.name"
                        class="text-grey-6"
                      >
                        &middot; {{ subscriber.name }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    v-if="quasar.screen.gt.xs"
                    side
                    class="text-caption text-grey-6"
                  >
                    {{ d(subscriber.subscribedAt, 'date') }}
                  </q-item-section>
                  <q-item-section
                    v-if="canNewsletter('newsletter.subscribers.delete')"
                    side
                  >
                    <q-btn
                      flat
                      round
                      dense
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
              v-if="visibleTabs.includes('managers')"
              name="managers"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <div
                v-if="canNewsletter('newsletter.managers.create')"
                class="row items-center justify-between q-gutter-sm q-mb-md"
              >
                <!-- Organization admins hold this list without appearing on it. -->
                <div class="col row items-center no-wrap q-gutter-xs">
                  <q-icon
                    name="info_outline"
                    size="xs"
                    color="grey-6"
                  />
                  <div class="col text-body2 text-grey-6">
                    {{ t('managers.organizationInfo') }}
                  </div>
                </div>
                <q-btn
                  :label="t('managers.action.add')"
                  color="primary"
                  icon="person_add"
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
                  <q-item-section side>
                    <q-chip
                      dense
                      :color="roleColor(manager.role)"
                      text-color="white"
                      size="sm"
                    >
                      {{ t(`managers.role.${manager.role}`) }}
                    </q-chip>
                  </q-item-section>
                  <q-item-section
                    v-if="
                      manager.email !== userEmail &&
                      canNewsletter('newsletter.managers.delete')
                    "
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useNewsletterManagerStore } from '@/stores/newsletter-manager-store';
import { useNewsletterSubscriberStore } from '@/stores/newsletter-subscriber-store';
import { useNewsletterMessageStore } from '@/stores/newsletter-message-store';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EmailEditor from '@/components/campManagement/contact/EmailEditor.vue';
import FileInput, {
  type FileInputModel,
} from '@/components/common/inputs/FileInput.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import type {
  NewsletterManager,
  NewsletterManagerCreateData,
  NewsletterMessage,
  NewsletterSubscriber,
  NewsletterUpdateData,
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
} from '@camp-registration/common/entities';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';
import NewsletterEditDialog from '@/components/newsletter/NewsletterEditDialog.vue';
import NewsletterSubscriberAddDialog from '@/components/newsletter/NewsletterSubscriberAddDialog.vue';
import NewsletterSubscriberImportDialog from '@/components/newsletter/NewsletterSubscriberImportDialog.vue';
import NewsletterManagerAddDialog from '@/components/newsletter/NewsletterManagerAddDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import { useNewsletterPermissions } from '@/composables/newsletterPermissions';
import { useProfileStore } from '@/stores/profile-store';
import { useRouteTab } from '@/composables/routeTab';
import DOMPurify from 'dompurify';

/** Each tab, and the permission that makes it worth showing. */
const TAB_PERMISSION = {
  compose: 'newsletter.messages.create',
  history: 'newsletter.messages.view',
  subscribers: 'newsletter.subscribers.view',
  managers: 'newsletter.managers.view',
} as const satisfies Record<string, NewsletterPermission>;

type Tab = keyof typeof TAB_PERMISSION;

const TABS = Object.keys(TAB_PERMISSION) as Tab[];

const { t, d } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const api = useAPIService();

// Only members of the owning organization get the verification link.
const { canOrgFor } = useOrganizationPermissions();
const { canNewsletter } = useNewsletterPermissions();

const profileStore = useProfileStore();
const newsletterStore = useNewsletterStore();
const managerStore = useNewsletterManagerStore();
const subscriberStore = useNewsletterSubscriberStore();
const messageStore = useNewsletterMessageStore();

/**
 * An organization ADMIN reaches this page with only `newsletter.view` and
 * `newsletter.managers.view`, so most tabs must not render at all — an empty
 * subscriber list is indistinguishable from a forbidden one.
 */
const visibleTabs = computed<Tab[]>(() =>
  TABS.filter((name) => canNewsletter(TAB_PERMISSION[name])),
);

const tab = useRouteTab(visibleTabs);
const sendSubject = ref('');
const sendBody = ref('');
const sendAttachments = ref<FileInputModel[]>([]);
const subscriberFilter = ref('');

const newsletterId = computed(() => route.params.newsletterId as string);

onMounted(async () => {
  await loadNewsletter();
});

// Fetch only what the user may read. Re-runs when the profile lands, since the
// auth guard lets a page through while the profile is still loading.
watch(
  visibleTabs,
  (tabs) => {
    if (tabs.includes('managers')) {
      void managerStore.fetchData(newsletterId.value);
    }
    if (tabs.includes('subscribers')) {
      void subscriberStore.fetchData(newsletterId.value);
    }
    if (tabs.includes('history')) {
      void messageStore.fetchData(newsletterId.value);
    }
  },
  { immediate: true },
);

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

/** `null` while the organization is verified and the newsletter can send. */
const blockedReason = computed<'pending' | 'rejected' | null>(() => {
  const status = newsletter.value?.organizationVerificationStatus;
  if (status === 'PENDING') {
    return 'pending';
  }
  if (status === 'REJECTED') {
    return 'rejected';
  }
  return null;
});

const managers = computed<NewsletterManager[]>(() => managerStore.data ?? []);
const subscribers = computed<NewsletterSubscriber[]>(
  () => subscriberStore.data ?? [],
);
const messages = computed<NewsletterMessage[]>(() => messageStore.data ?? []);

/**
 * Only the newsletter itself can fail the whole page. The per-tab stores are
 * deliberately excluded: their failures belong to their tab, and folding them
 * in here replaced the entire page with an error for anyone holding a partial
 * permission set.
 */
const error = computed<string | null>(() => newsletterStore.error ?? null);

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

function roleColor(role: NewsletterManagerRole): string {
  switch (role) {
    case 'OWNER':
      return 'primary';
    case 'EDITOR':
      return 'secondary';
    default:
      return 'grey-6';
  }
}

function showAddManagerDialog() {
  quasar
    .dialog({ component: NewsletterManagerAddDialog })
    .onOk((data: NewsletterManagerCreateData) => {
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
  organization: 'Owning organization'

unverified:
  pending:
    title: 'This newsletter cannot send yet'
    message: '{organization} is awaiting verification. Set everything up now — only sending is disabled.'
  rejected:
    title: 'This newsletter cannot send'
    message: '{organization} was not verified. Correct its details and submit them again.'
  action: 'View verification'

compose:
  subject: 'Subject'
  body: 'Message'
  bodyPlaceholder: 'Write your newsletter content here...'
  attachments: 'Attachments (optional)'
  recipientInfo: 'Will be sent to {count} subscribers'
  blocked: 'Sending is disabled until the owning organization is verified.'
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
  organizationInfo: 'Organization administrators can also see this list.'
  removeDisabledHint: 'At least one owner is required'
  role:
    OWNER: 'Owner'
    EDITOR: 'Editor'
    VIEWER: 'Viewer'
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
  organization: 'Besitzende Organisation'

unverified:
  pending:
    title: 'Dieser Newsletter kann noch nicht senden'
    message: '{organization} wartet auf die Verifizierung. Sie können alles vorbereiten — nur das Senden ist deaktiviert.'
  rejected:
    title: 'Dieser Newsletter kann nicht senden'
    message: '{organization} wurde nicht verifiziert. Korrigieren Sie die Angaben und reichen Sie sie erneut ein.'
  action: 'Verifizierung ansehen'

compose:
  subject: 'Betreff'
  body: 'Nachricht'
  bodyPlaceholder: 'Schreiben Sie hier Ihren Newsletter-Inhalt...'
  attachments: 'Anhänge (optional)'
  recipientInfo: 'Wird an {count} Abonnenten gesendet'
  blocked: 'Das Senden ist deaktiviert, bis die besitzende Organisation verifiziert ist.'
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
  organizationInfo: 'Organisations-Administratoren sehen diese Liste ebenfalls.'
  removeDisabledHint: 'Mindestens ein Eigentümer ist erforderlich'
  role:
    OWNER: 'Eigentümer'
    EDITOR: 'Redakteur'
    VIEWER: 'Betrachter'
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
  organization: 'Organisation propriétaire'

unverified:
  pending:
    title: 'Cette newsletter ne peut pas encore être envoyée'
    message: "{organization} attend sa vérification. Préparez tout dès maintenant : seul l'envoi est désactivé."
  rejected:
    title: 'Cette newsletter ne peut pas être envoyée'
    message: "{organization} n'a pas été vérifiée. Corrigez ses informations et soumettez-les à nouveau."
  action: 'Voir la vérification'

compose:
  subject: 'Sujet'
  body: 'Message'
  bodyPlaceholder: 'Rédigez ici le contenu de votre newsletter...'
  attachments: 'Pièces jointes (optionnel)'
  recipientInfo: 'Sera envoyé à {count} abonnés'
  blocked: "L'envoi est désactivé tant que l'organisation propriétaire n'est pas vérifiée."
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
  organizationInfo: "Les administrateurs de l'organisation voient aussi cette liste."
  removeDisabledHint: 'Au moins un propriétaire est requis'
  role:
    OWNER: 'Propriétaire'
    EDITOR: 'Éditeur'
    VIEWER: 'Lecteur'
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
  organization: 'Organizacja właścicielska'

unverified:
  pending:
    title: 'Tego newslettera nie można jeszcze wysłać'
    message: '{organization} oczekuje na weryfikację. Możesz wszystko przygotować — wyłączona jest tylko wysyłka.'
  rejected:
    title: 'Tego newslettera nie można wysłać'
    message: '{organization} nie została zweryfikowana. Popraw jej dane i zgłoś je ponownie.'
  action: 'Zobacz weryfikację'

compose:
  subject: 'Temat'
  body: 'Wiadomość'
  bodyPlaceholder: 'Napisz tutaj treść swojego newslettera...'
  attachments: 'Załączniki (opcjonalnie)'
  recipientInfo: 'Zostanie wysłany do {count} subskrybentów'
  blocked: 'Wysyłanie jest wyłączone, dopóki organizacja właścicielska nie zostanie zweryfikowana.'
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
  organizationInfo: 'Administratorzy organizacji również widzą tę listę.'
  removeDisabledHint: 'Wymagany jest co najmniej jeden właściciel'
  role:
    OWNER: 'Właściciel'
    EDITOR: 'Redaktor'
    VIEWER: 'Obserwator'
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
  organization: 'Vlastnící organizace'

unverified:
  pending:
    title: 'Tento newsletter zatím nelze odeslat'
    message: '{organization} čeká na ověření. Vše si můžete připravit — vypnuté je jen odesílání.'
  rejected:
    title: 'Tento newsletter nelze odeslat'
    message: '{organization} nebyla ověřena. Uprav její údaje a odešli je znovu.'
  action: 'Zobrazit ověření'

compose:
  subject: 'Předmět'
  body: 'Zpráva'
  bodyPlaceholder: 'Napište zde obsah svého newsletteru...'
  attachments: 'Přílohy (volitelné)'
  recipientInfo: 'Bude odesláno {count} odběratelům'
  blocked: 'Odesílání je vypnuté, dokud nebude vlastnící organizace ověřena.'
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
  organizationInfo: 'Tento seznam vidí i správci organizace.'
  removeDisabledHint: 'Je vyžadován alespoň jeden vlastník'
  role:
    OWNER: 'Vlastník'
    EDITOR: 'Editor'
    VIEWER: 'Pozorovatel'
  dialog:
    delete:
      title: 'Odstranit správce'
      message: 'Opravdu chcete odstranit tohoto správce?'
</i18n>

<style scoped>
.blocked-card {
  border-radius: 16px;
  border-left: 4px solid var(--md3-error);
  background: color-mix(in srgb, var(--md3-error) 7%, var(--md3-surface));
}

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

.compose-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.compose-body__editor {
  flex: 1 1 auto;
  min-height: 200px;
}

.list-scroll {
  overflow-y: auto;
  min-height: 0;
}

.subscriber-item {
  min-height: 36px;
  padding: 2px 8px;
}

.subscriber-item .q-item__section--avatar {
  min-width: 0;
  padding-right: 8px;
}

.subscriber-item .q-item__section--side {
  padding-left: 8px;
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
