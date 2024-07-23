<template>
  <q-page padding>
    <div class="q-pa-md row items-start q-gutter-md">
      <q-card>
        <q-card-section>
          {{ t('camps') }}
        </q-card-section>
      </q-card>
    </div>

    <!-- TODO Add content -->
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped></style>
