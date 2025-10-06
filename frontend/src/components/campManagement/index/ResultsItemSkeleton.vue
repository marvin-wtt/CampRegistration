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
      <div class="q-gutter-xs">
        <q-skeleton
          v-if="!props.public"
          type="QBtn"
          class="gt-xs"
        />

        <q-skeleton
          v-if="!props.public"
          type="QBtn"
          class="gt-sm"
        />

        <q-skeleton
          type="QBtn"
          class="gt-xs"
        />

        <q-skeleton
          type="QBtn"
          class="gt-sm"
        />

        <q-skeleton
          v-if="!props.public"
          type="QBtn"
          class="gt-sm"
        />

        <q-skeleton
          v-if="!props.public"
          type="QBtn"
          class="gt-sm"
        />

        <q-skeleton
          type="QBtn"
          class="lt-md"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup></script>

<style scoped></style>
