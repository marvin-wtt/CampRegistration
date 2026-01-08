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

@page {
  margin: 12mm;

  @top-left {
    content: '';
  }

  @bottom-center {
    content: counter(page) ' / ' counter(pages);
    font-family: Roboto, Arial, sans-serif;
    font-size: 12px;
  }

  @bottom-left {
    content: '';
  }
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
    margin: 0 !important; /* IMPORTANT: do not fight @page */
  }
}
</style>
