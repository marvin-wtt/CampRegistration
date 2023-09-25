<template>
  <!-- Loading is handles by the list itself -->
  <page-state-handler
    padding
    :error="error"
  >
    <!-- content -->
    <div class="column fit">
      <div class="row justify-center">
        <q-btn-toggle
          v-model="menu"
          :options="[
            { label: t('menu.public'), value: 'public' },
            { label: t('menu.draft'), value: 'draft' },
          ]"
          class="my-custom-toggle"
          no-caps
          rounded
          spread
          toggle-color="primary"
        />
      </div>

      <div class="row justify-center">
        <q-list
          class="rounded-borders vertical-middle column col-sm-10 col-md-9 col-lg-7 col-xl-6 col-12"
          padding
          separator
        >
          <q-item>
            <q-item-section>
              <q-item-label>
                <a class="text-h6">
                  {{ t('title') }}
                </a>
              </q-item-label>
            </q-item-section>

            <q-item-section
              side
              top
            >
              <q-item-label caption>
                <q-btn
                  :label="t('actions.create')"
                  icon="add"
                  outline
                  rounded
                  @click="addAction()"
                />
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-tab-panels
            v-model="menu"
            animated
            style="background-color: inherit"
          >
            <q-tab-panel
              name="public"
              class="q-pa-none"
            >
              <results-list
                :camps="publicCamps"
                :loading="loading"
                public
              />
            </q-tab-panel>

            <q-tab-panel
              name="draft"
              class="q-pa-none"
            >
              <results-list
                :loading="loading"
                :camps="draftCamps"
              />
            </q-tab-panel>
          </q-tab-panels>
        </q-list>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { Camp } from 'src/types/Camp';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import ResultsList from 'components/campManagement/index/ResultsList.vue';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

type MenuState = 'public' | 'draft';

const { user, loading, error } = storeToRefs(authStore);

const menu = ref<MenuState>(getMenuStateFromQueryParameter());

function getMenuStateFromQueryParameter(): MenuState {
  if ('public' in route.query) {
    return route.query.public === '0' ? 'draft' : 'public';
  }

  return 'public';
}

function addAction() {
  router.push({
    name: 'create-camp',
  });
}

const publicCamps = computed<Camp[]>(() => {
  if (user.value == undefined) {
    return [];
  }

  const camps = user.value.camps as Camp[];
  return camps.filter((value) => value.public).sort(sortCamps);
});

const draftCamps = computed<Camp[]>(() => {
  if (user.value == undefined) {
    return [];
  }

  const camps = user.value.camps as Camp[];
  return camps.filter((value) => !value.public).sort(sortCamps);
});

function sortCamps(a: Camp, b: Camp) {
  return (
    new Date(b.startAt).getUTCMilliseconds() -
    new Date(a.startAt).getUTCMilliseconds()
  );
}
</script>

<i18n lang="yaml" locale="en">
title: 'Camps'

actions:
  create: 'Create new'

menu:
  draft: 'Draft'
  public: 'Public'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Camps'

actions:
  create: 'Neu erstellen'

menu:
  draft: 'Entwurf'
  public: 'Öffentlich'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Camps'

actions:
  create: 'Créer un nouveau'

menu:
  draft: 'Brouillon'
  public: 'Public'
</i18n>

<style scoped></style>
