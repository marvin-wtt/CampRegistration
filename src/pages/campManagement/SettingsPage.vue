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
      class="col-12 col-md-3"
    >
      <q-item
        v-ripple
        :active="page === 'access'"
        clickable
        @click="page = 'access'"
      >
        <q-item-section>
          {{ t('access') }}
        </q-item-section>
      </q-item>

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
      class="col-12 col-md-9"
    >
      <q-tab-panel name="access"></q-tab-panel>
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
access: 'Access'
features: 'Features'
</i18n>

<i18n locale="de">
access: 'Zugriff'
features: 'Features'
</i18n>

<i18n locale="fr">
access: 'Accès'
features: 'features'
</i18n>
