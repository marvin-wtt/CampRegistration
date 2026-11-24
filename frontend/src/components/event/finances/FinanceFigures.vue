<template>
  <!-- The figures of a totals strip, wrapping onto a second line on phones. -->
  <div class="finance-figures row items-end">
    <slot />
  </div>
</template>

<style scoped>
.finance-figures {
  gap: 8px 32px;
}
</style>
