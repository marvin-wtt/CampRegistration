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
            { label: t('menu.active'), value: 'active' },
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
              name="active"
              class="q-pa-none"
            >
              <results-list
                :camps="activeCamps"
                :loading="loading"
                active
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
import type { Camp } from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import ResultsList from 'components/campManagement/index/ResultsList.vue';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

type MenuState = 'active' | 'draft';

const { user, loading, error } = storeToRefs(authStore);

const menu = ref<MenuState>(getMenuStateFromQueryParameter());

function getMenuStateFromQueryParameter(): MenuState {
  if ('active' in route.query) {
    return route.query.active === '0' ? 'draft' : 'active';
  }

  return 'active';
}

function addAction() {
  router.push({
    name: 'create-camp',
  });
}

const activeCamps = computed<Camp[]>(() => {
  if (user.value == undefined) {
    return [];
  }

  const camps = user.value.camps as Camp[];
  return camps.filter((value) => value.active).sort(sortCamps);
});

const draftCamps = computed<Camp[]>(() => {
  if (user.value == undefined) {
    return [];
  }

  const camps = user.value.camps as Camp[];
  return camps.filter((value) => !value.active).sort(sortCamps);
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
  active: 'Active'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Camps'

actions:
  create: 'Neu erstellen'

menu:
  draft: 'Entwurf'
  active: 'Aktiv'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Camps'

actions:
  create: 'Créer un nouveau'

menu:
  draft: 'Brouillon'
  active: 'Active'
</i18n>

<style scoped></style>
