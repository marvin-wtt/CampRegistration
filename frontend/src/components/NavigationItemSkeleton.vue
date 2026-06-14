<template>
  <q-separator
    v-if="separated && !first"
    spaced
  />

  <q-item>
    <q-item-section avatar>
      <q-skeleton
        type="QAvatar"
        size="24px"
      />
    </q-item-section>

    <q-item-section>
      <q-skeleton
        type="text"
        :width="width"
      />
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
const {
  label,
  separated = false,
  first = false,
} = defineProps<{
  label?: string | undefined;
  separated?: boolean | undefined;
  first?: boolean | undefined;
}>();

// Approximate the rendered label width so the skeleton mirrors the real item.
const width = `${Math.min(Math.max(label?.length ?? 6, 4), 16)}ch`;
</script>

<style scoped></style>
