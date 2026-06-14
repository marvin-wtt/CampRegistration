<template>
  <!-- Floating controls for layouts without a navigation rail. Keeps the
       profile menu in the same bottom-left spot as the rail layouts, and adds
       an optional back affordance top-left. Fixed-positioned so they don't
       depend on a QPage being present. -->
  <div class="layout-floating layout-floating--top">
    <m-btn
      icon="arrow_back"
      :disable="!backTo"
      round
      elevated
      :aria-label="t('back')"
      :to="backTo"
    >
      <q-tooltip
        anchor="center right"
        self="center left"
      >
        {{ t('back') }}
      </q-tooltip>
    </m-btn>
  </div>

  <div class="layout-floating layout-floating--bottom">
    <profile-menu class="elevation-2" />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { backTo } = defineProps<{
  // When set, a back button is shown top-left linking to this route.
  backTo?: RouteLocationRaw | undefined;
}>();

const { t } = useI18n();
</script>

<style scoped>
.layout-floating {
  position: fixed;
  left: 16px;
  z-index: 2000;
}

.layout-floating--top {
  top: 16px;
}

.layout-floating--bottom {
  bottom: 16px;
}
</style>

<i18n lang="yaml" locale="en">
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
back: 'Wstecz'
</i18n>

<i18n lang="yaml" locale="cs">
back: 'Zpět'
</i18n>
