<template>
  <page-state-handler
    :loading="loading"
    :error="error"
    class="row"
  >
    <!-- Menu -->
    <q-list
      bordered
      padding
      class="col-12 col-sm-3 col-lg-2 col-xl-1"
    >
      <q-item
        v-ripple
        :active="page === 'features'"
        clickable
        @click="page = 'features'"
      >
        <q-item-section>
          {{ t('features') }}
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Options -->
    <q-tab-panels
      v-model="page"
      class="col-12 col-sm-9 col-lg-10 col-xl-11"
    >
      <q-tab-panel name="features"></q-tab-panel>
    </q-tab-panels>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/PageStateHandler.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const page = ref<string>();

const loading = computed<boolean>(() => {
  return false;
});

const error = computed<string | null>(() => {
  return null;
});
</script>
<i18n locale="en">
features: 'Features'
</i18n>

<i18n locale="de">
features: 'Features'
</i18n>

<i18n locale="fr">
features: 'features'
</i18n>
