<template>
  <q-layout
    view="hHh Lpr fFf"
    class="auth-layout"
  >
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth-store';
import { onMounted } from 'vue';

const authStore = useAuthStore();

onMounted(async () => {
  // TODO Why force?
  await authStore.init(true);
});
</script>

<style>
.auth-layout {
  background:
    radial-gradient(
      ellipse at 12% 88%,
      rgba(51, 141, 142, 0.35) 0%,
      transparent 52%
    ),
    radial-gradient(
      ellipse at 88% 12%,
      rgba(51, 95, 142, 0.28) 0%,
      transparent 52%
    ),
    linear-gradient(155deg, #1c6869 0%, #226982 35%, #2a4d7e 100%);
}

.body--dark .auth-layout {
  background:
    radial-gradient(
      ellipse at 12% 88%,
      rgba(51, 141, 142, 0.15) 0%,
      transparent 52%
    ),
    radial-gradient(
      ellipse at 88% 12%,
      rgba(51, 95, 142, 0.12) 0%,
      transparent 52%
    ),
    linear-gradient(155deg, #0c3132 0%, #0e2c3b 35%, #0d1d35 100%);
}

/* Shared card animation and elevation */
.auth-card {
  overflow: hidden;
  animation: authCardIn 0.48s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.auth-card:not(.q-card--flat) {
  box-shadow:
    0 20px 72px rgba(0, 0, 0, 0.32),
    0 6px 20px rgba(0, 0, 0, 0.18) !important;
}

/* On phones the card goes full-bleed: it fills the whole viewport so the
   gradient backdrop isn't visible as bands around a floating card. Larger
   screens keep the floating, rounded card centred on the gradient. */
@media (max-width: 599.98px) {
  .auth-card {
    min-height: 100dvh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }

  /* The card already fills the height, so no extra vertical centring band. */
  .auth-layout .q-page.content-center {
    align-content: stretch;
  }

  /* The gradient header grows to fill the top of the screen (reaching the very
     top edge), carrying the avatar down to just above the form. A matching
     flexible spacer at the bottom balances it, so the content sits vertically
     centred between equal gradient (top) and surface (bottom) areas. */
  .auth-card-header {
    flex: 1 1 0;
    min-height: 100px;
  }

  .auth-card::after {
    content: '';
    flex: 1 1 0;
  }
}

.auth-card-header {
  height: 100px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #338d8e 0%, #2e78a0 50%, #2a5d8d 100%);
  position: relative;
}

.auth-card-avatar {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow:
    0 0 0 4px #fff,
    0 6px 24px rgba(0, 0, 0, 0.22);
  z-index: 1;
}

.body--dark .auth-card-avatar {
  box-shadow:
    0 0 0 4px #1d1d1d,
    0 6px 24px rgba(0, 0, 0, 0.4);
}

@keyframes authCardIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
