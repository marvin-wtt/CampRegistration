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

  /* Page numbers in the margin box: Chrome 131+ and Safari 18.2+ only, Firefox
     ignores the rule. Purely additive — the sheet footer carries the table
     index, so nothing is lost where it is unsupported. */
  @bottom-center {
    content: counter(page) ' / ' counter(pages);
    font-family: Roboto, Arial, sans-serif;
    font-size: 12px;
  }
}

/* Per-sheet orientation. Named pages are supported everywhere; deliberately no
   `page-orientation`, which Safari ignores and which would otherwise rotate the
   landscape sheets onto portrait paper in Chrome and Firefox only. */
@page sheet-portrait {
  size: A4 portrait;
}

@page sheet-landscape {
  size: A4 landscape;
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

  .print-sheet.print-sheet--portrait {
    page: sheet-portrait;
  }

  .print-sheet.print-sheet--landscape {
    page: sheet-landscape;
  }
}
</style>
