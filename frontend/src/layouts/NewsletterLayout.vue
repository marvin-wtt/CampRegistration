<template>
  <general-layout :title="t('title')" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import { useAuthStore } from '@/stores/auth-store';

const { t } = useI18n();

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.init();
});
</script>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
back: 'Wstecz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
back: 'Zpět'
</i18n>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;
}

::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0.125rem grey;
  border-radius: 0.25rem;
}

::-webkit-scrollbar-thumb {
  background: #656565;
  border-radius: 0.25rem;
}

::-webkit-scrollbar-thumb:hover {
  background: #4b4b4b;
}

::-webkit-scrollbar-corner {
}
</style>
