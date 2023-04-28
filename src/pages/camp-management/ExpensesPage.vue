<template>
  <q-page
    :class="tabBarBottom ? 'reverse' : ''"
    class="column"
  >
    <div class="col-shrink">
      <!-- Desktop navigation -->
      <q-separator v-if="tabBarBottom" />
      <q-tabs
        v-model="tab"
        :inline-label="!tabBarBottom"
        :switch-indicator="tabBarBottom"
        align="justify"
      >
        <q-tab
          :label="t('list')"
          icon="overview"
          name="overview"
        />
        <q-tab
          :label="t('list')"
          icon="list"
          name="list"
        />
        <q-tab
          :label="t('person')"
          icon="person"
          name="person"
        />
      </q-tabs>
      <q-separator v-if="!tabBarBottom" />
    </div>

    <q-tab-panels
      v-model="tab"
      :swipeable="tabBarBottom"
      animated
      class="col bg-green"
    >
      <q-tab-panel name="overview"></q-tab-panel>

      <q-tab-panel
        class="bg-red"
        name="list"
      >
        <q-scroll-area class="fit">
          <div
            v-for="n in 100"
            :key="n"
            class="q-py-xs"
          >
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </div>
        </q-scroll-area>

        <!--        <q-scroll-area style="height: 200px; max-width: 300px;">-->
        <!--          <div class="text-h6">-->
        <!--            {{ t('list.title') }}-->
        <!--          </div>-->
        <!--        </q-scroll-area>-->

        <!-- FIXME FAB is falling from top when switching tabs -->
        <q-btn
          class="absolute-bottom-right q-ma-md"
          color="primary"
          fab
          icon="add"
          style="z-index: 10"
        />
      </q-tab-panel>

      <q-tab-panel name="person"> Test3</q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

const { t } = useI18n();
const quasar = useQuasar();

const tab = ref<string>('list');

const tabBarBottom = computed<boolean>(() => {
  return quasar.screen.xs;
});
</script>
