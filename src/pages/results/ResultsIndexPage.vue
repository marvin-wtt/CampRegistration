<template>
  <q-page padding>
    <!-- content -->
    <div class="column">
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
                  :label="t('action.create')"
                  icon="add"
                  outline
                  rounded
                  @click="addAction()"
                />
              </q-item-label>
            </q-item-section>
          </q-item>

          <template v-if="isLoading">
            <results-item-skeleton
              v-for="index in 3"
              :key="index"
              :public="showPublic"
            />
          </template>

          <TransitionGroup
            v-else
            name="fade"
            mode="in-out"
          >
            <template v-if="showPublic">
              <q-item
                v-if="publicCamps.length === 0"
                class="text-center vertical-middle"
              >
                <q-item-section>
                  {{ t('no_data') }}
                </q-item-section>
              </q-item>

              <ResultsItem
                v-for="camp in publicCamps"
                :key="camp.id"
                :camp="camp"
                :public="showPublic"
              />
            </template>

            <template v-else>
              <q-item
                v-if="draftCamps.length === 0"
                class="text-center vertical-middle"
              >
                <q-item-section>
                  {{ t('no_data') }}
                </q-item-section>
              </q-item>

              <ResultsItem
                v-for="camp in draftCamps"
                :key="camp.id"
                :camp="camp"
                :public="showPublic"
              />
            </template>
          </TransitionGroup>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { Camp } from 'src/types/Camp';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import ResultsItem from 'components/results/index/ResultsItem.vue';
import { storeToRefs } from 'pinia';
import ResultsItemSkeleton from 'components/results/index/ResultsItemSkeleton.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const { data, isLoading, error } = storeToRefs(authStore);

const showPublic = computed<boolean>(() => {
  return menu.value === 'public';
});

const menu = ref<'public' | 'draft'>('public');

function addAction() {
  router.push({
    name: 'create-camp',
  });
}

const publicCamps = computed<Camp[]>(() => {
  if (data.value == undefined) {
    return [];
  }

  const camps = data.value.camps as Camp[];
  return camps
    .filter((value) => value.public)
    .sort((a, b) => {
      return new Date(b.startDate) - new Date(a.startDate);
    });
});

const draftCamps = computed<Camp[]>(() => {
  if (data.value == undefined) {
    return [];
  }

  const camps = data.value.camps as Camp[];
  return camps
    .filter((value) => !value.public)
    .sort((a, b) => {
      return new Date(b.startDate) - new Date(a.startDate);
    });
});
</script>

<i18n lang="yaml" locale="en">
title: 'Camps'
no_data: 'No data found'

menu:
  draft: 'Draft'
  public: 'Public'
</i18n>

<style scoped>
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
