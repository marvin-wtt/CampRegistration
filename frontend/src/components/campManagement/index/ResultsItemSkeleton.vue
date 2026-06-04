<template>
  <q-item>
    <q-item-section>
      <q-item-label>
        <q-skeleton
          type="text"
          width="10rem"
        />
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="q-gutter-sm row no-wrap">
        <q-skeleton
          type="QBtn"
          width="7em"
          height="2em"
          class="gt-sm"
        />

        <q-skeleton
          type="QBtn"
          width="7em"
          height="2em"
          class="gt-sm"
          rounded
        />

        <q-skeleton
          type="QBtn"
          width="7em"
          height="2em"
          class="gt-sm"
          rounded
        />

        <q-skeleton
          type="QBtn"
          width="2em"
          height="2em"
          class="lt-md"
          rounded
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup></script>

<style scoped></style>
