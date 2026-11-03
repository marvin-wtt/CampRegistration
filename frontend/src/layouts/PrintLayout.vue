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
/* The theme tints pages; paper is plain white. */
.print-layout,
.print-layout .q-page {
  background: white;
}

@page {
  margin: 12mm;
  /* Inherited by the margin boxes. */
  font-family: Roboto, Arial, sans-serif;
  font-size: 9pt;
  color: rgba(0, 0, 0, 0.6);

  /* Margin boxes (Chrome 131+, Safari 18.2+; Firefox ignores them). An edge
     with an author box hides the browser's own header/footer there, so both
     edges get one. Pages override the content via utils/printMarginBoxes. */
  @top-center {
    content: '';
  }

  @bottom-right {
    content: counter(page) ' / ' counter(pages);
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
  /* Everything outside the app: Quasar's notify, portals and loading bar, the
     dev checker overlay. Any box after a named-page sheet, even an empty one,
     breaks onto a trailing blank page of its own. */
  body > :not(#q-app) {
    display: none !important;
  }

  html,
  body,
  .print-layout {
    background: white !important;
  }

  /* Quasar sizes these to the print frame's viewport, which is taller than a
     page's printable area; a short document would spill onto a blank page. */
  .print-layout,
  .print-layout .q-page-container,
  .print-layout .q-page {
    min-height: 0 !important;
    height: auto !important;
    padding: 0 !important;
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
