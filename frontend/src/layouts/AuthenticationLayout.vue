<template>
  <q-layout view="hHh Lpr fFf">
    <!-- Be sure to play with the Layout demo on docs -->
    <q-page-container>
      <!-- This is where pages get injected -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { useAuthStore } from 'stores/auth-store';
import { onBeforeMount } from 'vue';

const authStore = useAuthStore();

onBeforeMount(async () => {
  await authStore.init();
});
</script>

<style scoped>
@keyframes gradient {
  0% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
