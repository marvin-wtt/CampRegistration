<template>
  <general-layout :title="title">
    <template #toolbar>
      <workspace-switcher />
    </template>

    <template #navigation>
      <workspace-switcher rail />
    </template>
  </general-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const newsletterStore = useNewsletterStore();

const newsletterId = computed<string | undefined>(() => {
  const value = route.params.newsletterId;
  return Array.isArray(value) ? value[0] : value;
});

const title = computed<string>(() => {
  const id = newsletterId.value;
  if (!id) {
    return t('title');
  }

  return (
    newsletterStore.data?.find((newsletter) => newsletter.id === id)?.name ??
    t('title')
  );
});

onMounted(async () => {
  await authStore.init();
  await newsletterStore.fetchData();
});
</script>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
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
