<template>
  <!-- Title and subtitle on the left, actions on the right. On phones the
       actions drop onto their own row, starting at the title's left edge —
       unless `inlineActions` keeps a few icon buttons on the title's line. -->
  <header
    class="page-header"
    :class="{ 'page-header--inline': inlineActions }"
  >
    <div class="page-header__text">
      <div class="page-header__title-row row items-center no-wrap">
        <h1 class="text-h5 text-weight-medium q-my-none ellipsis">
          {{ title }}
        </h1>
        <slot name="title-append" />
        <div
          v-if="inlineActions && $slots.actions"
          class="page-header__actions row items-center no-wrap"
        >
          <slot name="actions" />
        </div>
      </div>
      <div
        v-if="subtitle"
        class="page-header__subtitle text-body2 q-mt-xs"
      >
        {{ subtitle }}
      </div>
      <!-- Anything that belongs to the title block, e.g. a status chip. -->
      <slot />
    </div>

    <div
      v-if="!inlineActions && $slots.actions"
      class="page-header__actions row items-center"
    >
      <slot name="actions" />
    </div>
  </header>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  subtitle?: string | undefined;
  inlineActions?: boolean;
}>();
</script>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* A small inset, so the bare title doesn't sit flush against the rail
     while the bordered cards below carry their own padding. */
  padding-left: 8px;
}

.page-header__text {
  flex: 1 1 auto;
  min-width: 0;
}

.page-header__title-row {
  gap: 8px;
}

.page-header__subtitle {
  color: var(--md3-on-surface-variant);
}

.page-header__actions {
  flex: 0 0 auto;
  gap: 8px;
}

/* On the title's line: pushed to its end, the subtitle keeps the full width. */
.page-header--inline .page-header__actions {
  margin-left: auto;
}

@media (min-width: 600px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .page-header__actions {
    flex-wrap: nowrap;
  }
}
</style>
