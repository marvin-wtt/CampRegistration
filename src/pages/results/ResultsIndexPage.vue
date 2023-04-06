<template>
  <q-page padding>
    <!-- content -->
    <div class="column">
      <div class="row justify-center">
        <q-btn-toggle
          v-model="menu"
          :options="[
            { label: t('menu.public'), value: 'public' },
            { label: t('menu.private'), value: 'private' },
          ]"
          class="my-custom-toggle"
          no-caps
          rounded
          spread
          toggle-color="primary"
        />
      </div>

      <div class="row justify-center">
        <!-- TODO Style no data -->
        <p
          v-if="camps.length === 0"
          class="text-center vertical-middle"
        >
          {{ t('no_data') }}
        </p>

        <q-list
          v-else
          class="rounded-borders vertical-middle column col-sm-10 col-md-9 col-lg-7 col-xl-6 col-12"
          padding
          separator
        >
          <q-item>
            <q-item-section>
              <q-item-label>
                <a class="text-h6">{{ t('title') }}</a>
              </q-item-label>
            </q-item-section>

            <q-item-section
              side
              top
            >
              <q-item-label caption>
                <q-btn
                  :label="t('action.create')"
                  icon="add"
                  outline
                  rounded
                  @click="addAction()"
                />
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            v-for="camp in camps"
            :key="camp.id"
          >
            <q-item-section>
              <q-item-label>
                {{ to(camp.name) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="q-gutter-xs">
                <q-btn
                  v-if="showPublic"
                  :label="t('action.share')"
                  class="gt-xs"
                  dense
                  flat
                  icon="share"
                  rounded
                  @click="shareAction(camp.id)"
                />

                <q-btn
                  v-if="!showPublic"
                  :label="t('action.publish')"
                  class="gt-sm"
                  color="warning"
                  dense
                  flat
                  icon="publish"
                  rounded
                  @click="publishAction(camp.id)"
                />

                <q-btn
                  :label="t('action.results')"
                  class="gt-xs"
                  dense
                  flat
                  icon="view_list"
                  rounded
                  @click="resultsAction(camp.id)"
                />

                <q-btn
                  :label="t('action.edit')"
                  class="gt-sm"
                  dense
                  flat
                  icon="edit"
                  rounded
                  @click="editAction(camp.id)"
                />

                <q-btn
                  v-if="showPublic"
                  :label="t('action.unpublish')"
                  class="gt-sm"
                  color="warning"
                  dense
                  flat
                  icon="unpublished"
                  rounded
                  @click="unpublishAction(camp.id)"
                />

                <q-btn
                  v-if="!showPublic"
                  :label="t('action.delete')"
                  class="gt-sm"
                  color="negative"
                  dense
                  flat
                  icon="delete"
                  rounded
                  @click="deleteAction(camp.id)"
                />

                <q-btn
                  class="lt-md"
                  dense
                  flat
                  icon="more_vert"
                  round
                >
                  <q-menu>
                    <q-list style="min-width: 100px">
                      <q-item
                        v-if="showPublic"
                        v-close-popup
                        clickable
                        @click="shareAction(camp.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="share" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('action.share') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item
                        v-close-popup
                        clickable
                        @click="resultsAction(camp.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="view_list" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('action.results') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item
                        v-close-popup
                        clickable
                        @click="editAction(camp.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('action.edit') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item
                        v-if="showPublic"
                        v-close-popup
                        v-ripple
                        class="text-warning"
                        clickable
                        @click="unpublishAction(camp.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="unpublished" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('action.unpublish') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item
                        v-if="!showPublic"
                        v-close-popup
                        v-ripple
                        class="text-warning"
                        clickable
                        @click="publishAction(camp.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="publish" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('action.publish') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item
                        v-close-popup
                        class="text-negative"
                        clickable
                        @click="deleteAction(camp.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="delete" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('action.delete') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { Camp } from 'src/types/Camp';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useRouter } from 'vue-router';
import { copyToClipboard, useQuasar } from 'quasar';
import { useCampsStore } from 'stores/camp/camps-store';

const { t } = useI18n();
const { to } = useObjectTranslation();
const router = useRouter();
const quasar = useQuasar();
const capsStore = useCampsStore();

const showPublic = computed<boolean>(() => {
  return menu.value === 'public';
});

const menu = ref<'public' | 'private'>('public');

function resultsAction(campId: string) {
  router.push({
    name: 'results-participants',
    params: {
      camp: campId,
    },
  });
}

function shareAction(campId: string) {
  // TODO Can I get the link from router?
  copyToClipboard(`https://camps.ballaeron.de/camps/${campId}`)
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

function addAction() {
  router.push({
    name: 'create-c',
  });
}

function editAction(campId: string) {
  router.push({
    name: 'edit-camp',
    params: {
      camp: campId,
    },
  });
}

function deleteAction(campId: string) {
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
      capsStore.deleteEntry(campId);
    });
}

async function publishAction(id: string) {
  await capsStore.updateEntry(id, {
    public: true,
  });
}

async function unpublishAction(id: string) {
  await capsStore.updateEntry(id, {
    public: false,
  });
}

const camps = computed<Camp[]>(() => {
  // TODO Fetch from store
  const camps: Camp[] = [
    {
      name: 'DFJW Sommercamp 2023',
      id: '98daa32a-f6dd-41bd-b723-af10071459ad',
      public: true,
    },
    { name: 'test 2', id: '2', public: true },
    { name: 'test 3', id: '3', public: true },
    { name: 'test 4', id: '3', public: false },
  ];

  return camps.filter((value) =>
    showPublic.value ? value.public === true : value.public !== true
  );
});
</script>

<i18n lang="yaml" locale="en">
title: 'Camps'
no_data: 'No data found'

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

menu:
  private: 'Private'
  public: 'Public'

notification:
  share_success: 'Link copied to clipboard'
  share_fail: 'Failed to copy link to clipboard'
</i18n>

<style scoped></style>
