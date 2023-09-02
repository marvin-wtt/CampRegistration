<template>
  <q-page class="row">
    <!-- Menu -->
    <q-list
      bordered
      padding
      class="col-12 col-sm-3 col-lg-2 col-xl-1"
    >
      <q-item
        v-ripple
        clickable
        :to="{ name: 'settings-access' }"
      >
        <q-item-section avatar>
          <q-icon name="key" />
        </q-item-section>

        <q-item-section>
          {{ t('access') }}
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Options -->
    <div class="col-12 col-sm-9 col-lg-10 col-xl-11">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
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
