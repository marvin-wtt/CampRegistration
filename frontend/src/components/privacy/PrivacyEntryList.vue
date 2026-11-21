<template>
  <!-- Rows as separate tiles with a little air between them, rather than a
       ruled table: lighter to scan, and each entry reads as one thing. -->
  <div class="privacy-entry-list">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.privacy-entry-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
