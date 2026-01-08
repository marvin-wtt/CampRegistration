<!-- src/layouts/PrintLayout.vue -->
<template>
  <q-layout
    view="lHh Lpr lFf"
    class="print-layout"
  >
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';

const quasar = useQuasar();

quasar.dark.set(false);
</script>

<style>
.print-layout {
  background: white;
}

@media print {
  html,
  body,
  .print-layout {
    background: white !important;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin: 12mm;
  }

  @page {
    /* Remove default header and footer added by browsers */
    margin: 0;
  }
}
</style>
