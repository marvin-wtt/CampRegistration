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
            { label: t('menu.inactive'), value: 'inactive' },
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
                  @click="onCreateCamp()"
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
              name="inactive"
              class="q-pa-none"
            >
              <results-list
                :loading="loading"
                :camps="inactiveCamps"
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
import { computed, ref, watch } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useProfileStore } from 'stores/profile-store';
import { storeToRefs } from 'pinia';
import ResultsList from 'components/campManagement/index/ResultsList.vue';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import CampCreateDialog from 'components/campManagement/index/CampCreateDialog.vue';

const { t } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();

type MenuState = 'active' | 'inactive';

const { user, loading, error } = storeToRefs(profileStore);

const menu = ref<MenuState>(getMenuStateFromQueryParameter());

function getMenuStateFromQueryParameter(): MenuState {
  const state = route.hash?.substring(1);

  return state && isMenuState(state) ? state : 'active';
}

function isMenuState(state: string): state is MenuState {
  const allowed = ['active', 'inactive'];

  return allowed.includes(state);
}

watch(
  () => menu.value,
  (value) => {
    router.replace({
      hash: '#' + value,
    });
  },
);

function onCreateCamp() {
  quasar
    .dialog({
      component: CampCreateDialog,
    })
    .onOk(() => {
      menu.value = 'inactive';
    });
}

const activeCamps = computed<Camp[]>(() => {
  if (user.value == undefined) {
    return [];
  }

  const camps = user.value.camps;
  return camps.filter((value) => value.active).toSorted(sortCamps);
});

const inactiveCamps = computed<Camp[]>(() => {
  if (user.value == undefined) {
    return [];
  }

  const camps = user.value.camps;
  return camps.filter((value) => !value.active).toSorted(sortCamps);
});

function sortCamps(a: Camp, b: Camp) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}
</script>

<i18n lang="yaml" locale="en">
title: 'Camps'

actions:
  create: 'Create new'

menu:
  inactive: 'Inactive'
  active: 'Active'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Camps'

actions:
  create: 'Neu erstellen'

menu:
  inactive: 'Inaktiv'
  active: 'Aktiv'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Camps'

actions:
  create: 'Créer un nouveau'

menu:
  inactive: 'Inactif'
  active: 'Active'
</i18n>

<style scoped></style>
