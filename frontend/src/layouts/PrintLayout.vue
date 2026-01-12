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

@page upright {
  size: A4 portrait;
  page-orientation: upright;
}

@page left {
  size: A4 landscape;
  page-orientation: rotate-left;
}

@media print {
  /* Remove Quasar UI */
  #q-notify,
  div[id^="q-portal--"],
  /* Dev only */
  vite-plugin-checker-error-overlay {
    display: none;
  }

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

  .print-sheet.print-sheet--upright {
    page: upright;
  }

  .print-sheet.print-sheet--left {
    page: left;
  }
}
</style>
