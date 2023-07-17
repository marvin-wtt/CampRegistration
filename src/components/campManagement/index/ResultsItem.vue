<template>
  <q-item>
    <q-item-section>
      <q-item-label>
        {{ to(props.camp.name) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="q-gutter-xs">
        <q-btn
          v-if="props.public"
          :label="t('action.share')"
          class="gt-xs"
          dense
          flat
          icon="share"
          rounded
          :disable="actionLoading"
          @click="shareAction"
        />

        <q-btn
          v-if="!props.public"
          :label="t('action.publish')"
          class="gt-sm"
          color="warning"
          dense
          flat
          icon="publish"
          rounded
          :loading="publishLoading"
          :disable="actionLoading && !unpublishLoading"
          @click="publishAction"
        />

        <q-btn
          :label="t('action.results')"
          class="gt-xs"
          dense
          flat
          icon="view_list"
          rounded
          :loading="resultLoading"
          :disable="actionLoading && !resultLoading"
          @click="resultsAction"
        />

        <q-btn
          :label="t('action.edit')"
          class="gt-sm"
          dense
          flat
          icon="edit"
          rounded
          :disable="actionLoading"
          @click="editAction"
        />

        <q-btn
          v-if="props.public"
          :label="t('action.unpublish')"
          class="gt-sm"
          color="warning"
          dense
          flat
          icon="unpublished"
          rounded
          :loading="unpublishLoading"
          :disable="actionLoading && !unpublishLoading"
          @click="unpublishAction"
        />

        <q-btn
          v-if="!props.public"
          :label="t('action.delete')"
          class="gt-sm"
          color="negative"
          dense
          flat
          icon="delete"
          rounded
          :loading="deleteLoading"
          :disable="actionLoading && !deleteLoading"
          @click="deleteAction"
        />

        <q-btn
          class="lt-md"
          dense
          flat
          icon="more_vert"
          round
          :disable="actionLoading"
        >
          <results-item-menu
            :camp="props.camp"
            :public="props.public"
            @edit="editAction"
            @delete="deleteAction"
            @share="shareAction"
            @results="resultsAction"
            @publish="publishAction"
            @unpublish="unpublishAction"
          />
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import ResultsItemMenu from 'components/campManagement/index/ResultsItemMenu.vue';
import { useCampsStore } from 'stores/camps-store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { copyToClipboard, useQuasar } from 'quasar';
import { Camp } from 'src/types/Camp';
import { computed, Ref, ref } from 'vue';
import { useAuthStore } from 'stores/auth-store';

const capsStore = useCampsStore();
const authStore = useAuthStore();
const router = useRouter();
const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();

interface Props {
  camp: Camp;
  public?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  public: false,
});

const resultLoading = ref<boolean>(false);
const publishLoading = ref<boolean>(false);
const unpublishLoading = ref<boolean>(false);
const editLoading = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

const actionLoading = computed<boolean>(() => {
  return publishLoading.value || unpublishLoading.value || deleteLoading.value;
});

function resultsAction() {
  withLoading(resultLoading, async () => {
    await router.push({
      name: 'participants',
      params: {
        camp: props.camp.id,
      },
    });
  });
}

function shareAction() {
  const url =
    window.location.origin +
    router.resolve({
      name: 'participants',
      params: {
        camp: props.camp.id,
      },
    }).href;

  copyToClipboard(url)
    .then(() => {
      quasar.notify({
        type: 'positive',
        message: t('notification.share_success'),
        position: 'top',
        icon: 'assignment_turned_in',
      });
    })
    .catch(() => {
      quasar.notify({
        type: 'negative',
        message: t('notification.share_fail'),
        position: 'top',
      });
    });
}

function editAction() {
  withLoading(editLoading, async () => {
    await router.push({
      name: 'edit-camp',
      params: {
        camp: props.camp.id,
      },
    });
  });
}

function deleteAction() {
  // TODO Maybe use explicit confirm with camp name
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message'),
      ok: {
        color: 'negative',
        flat: true,
      },
      cancel: {
        color: 'primary',
        flat: true,
      },
      persistent: true,
    })
    .onOk(() => {
      withLoading(deleteLoading, async () => {
        await capsStore.deleteEntry(props.camp.id);
      });
    });
}

function publishAction() {
  withLoading(publishLoading, async () => {
    await capsStore.updateEntry(props.camp.id, {
      public: true,
    });
    await authStore.fetchUser();
  });
}

function unpublishAction() {
  withLoading(unpublishLoading, async () => {
    await capsStore.updateEntry(props.camp.id, {
      public: false,
    });
    await authStore.fetchUser();
  });
}

async function withLoading(flag: Ref<boolean>, fn: () => Promise<void>) {
  flag.value = true;
  await fn();
  flag.value = false;
}
</script>

<style scoped></style>

<!-- TODO Translate -->
<i18n lang="yaml" locale="en">
action:
  create: 'Create new'
  delete: 'Delete'
  edit: 'Edit'
  publish: 'Publish'
  results: 'Results'
  share: 'Share'
  unpublish: 'Unpublish'

dialog:
  delete:
    title: 'Delete camp'
    message: 'Are you sure you want to delete this camp? All registrations will be lost. This camp cannot be used as a template fir future camps'

notification:
  share_success: 'Link copied to clipboard'
  share_fail: 'Failed to copy link to clipboard'
</i18n>
