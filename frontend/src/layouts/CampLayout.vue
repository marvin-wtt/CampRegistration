<template>
  <q-layout view="hHh Lpr fff">
    <!--
      Floating brand + controls instead of a full-width app bar.
      Desktop: two detached corner pills. Mobile: merged into a single bar
      (the wrapper becomes the pill, the children drop their own surfaces).
    -->
    <header class="camp-header fixed-top">
      <div class="camp-header__inner row items-center no-wrap justify-between">
        <nav class="camp-nav row items-center no-wrap">
          <q-btn
            v-if="showBackToCamps"
            :to="{ name: 'camps' }"
            class="camp-back"
            icon="arrow_back"
            round
            unelevated
            :aria-label="t('back_to_camps')"
          >
            <q-tooltip>{{ t('back_to_camps') }}</q-tooltip>
          </q-btn>
          <router-link
            to="/"
            class="camp-brand row items-center no-wrap"
            :aria-label="t('app_name')"
          >
            <q-avatar
              size="36px"
              class="camp-brand__logo"
            >
              <!-- TODO: replace with the brand logo once available -->
              <q-icon name="cabin" />
            </q-avatar>
            <span class="camp-brand__name text-weight-medium q-ml-sm">
              {{ t('app_name') }}
            </span>
          </router-link>
        </nav>

        <m-toolbar
          floating
          class="camp-toolbar"
        >
          <locale-switch
            flat
            round
            dense
          />
          <profile-menu />
        </m-toolbar>
      </div>
    </header>

    <q-page-container class="camp-page-container">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer class="camp-footer bg-surface-container text-on-surface-variant">
      <nav
        class="row items-center justify-center q-gutter-x-md q-py-sm q-px-md text-caption"
        :aria-label="t('footer.label')"
      >
        <span>© {{ year }} {{ t('app_name') }}</span>
        <router-link
          class="camp-footer__link"
          :to="{ name: 'imprint' }"
        >
          {{ t('footer.imprint') }}
        </router-link>
        <router-link
          class="camp-footer__link"
          :to="{ name: 'privacy-policy' }"
        >
          {{ t('footer.privacy_policy') }}
        </router-link>
      </nav>
    </q-footer>

    <help-fab />
  </q-layout>
</template>

<script lang="ts" setup>
import LocaleSwitch from '@/components/common/localization/LocaleSwitch.vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import ProfileMenu from '@/components/common/ProfileMenu.vue';
import HelpFab from '@/components/FeedbackFab.vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth-store';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';

const { t } = useI18n();
const { to } = useObjectTranslation();
const route = useRoute();
const authStore = useAuthStore();
const campDetailStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailStore);

const year = new Date().getFullYear();

const showBackToCamps = computed<boolean>(() => route.name === 'camp');

onMounted(async () => {
  await Promise.allSettled([authStore.init()]);
});

useMeta(() => {
  return {
    title: camp.value ? to(camp.value.name) : t('camps'),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});
</script>

<style scoped>
.camp-header {
  z-index: 2000;
  padding: 1rem;
  /* Let clicks pass through the empty strip between the two pills */
  pointer-events: none;
}

.camp-header__inner {
  gap: 0.5rem;
}

.camp-nav {
  gap: 0.5rem;
  pointer-events: auto;
}

.camp-toolbar {
  pointer-events: auto;
}

/* The header padding owns the outer spacing, not the floating toolbar */
.camp-toolbar.q-toolbar--floating {
  margin: 0;
}

.camp-brand {
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 1.5rem;
  text-decoration: none;
  color: var(--md3-on-surface);
  background: var(--md3-surface-container);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.18),
    0 1px 3px 1px rgba(0, 0, 0, 0.12);
}

.camp-back {
  color: var(--md3-on-surface);
  background: var(--md3-surface-container);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.18),
    0 1px 3px 1px rgba(0, 0, 0, 0.12);
}

.camp-brand__logo {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.camp-brand__name {
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}

/*
 * Page content would otherwise slide under the floating brand/controls — even on
 * wide viewports the content columns leave less side margin than the pills are
 * wide. Reserve clearance on the page itself so the (full-bleed) background
 * colour still fills behind the pills without a seam.
 */
.camp-page-container :deep(.q-page) {
  padding-top: 4rem;
}

/*
 * When the survey renders an advanced header, let its coloured background bleed
 * all the way to the top behind the floating controls instead of leaving a
 * page-coloured strip above it. The toolbar clearance moves from the page onto
 * the header itself, so the header content (title/logo) still clears the pills.
 */
.camp-page-container :deep(.q-page:has(.sv-header)) {
  padding-top: 0;
}

.camp-page-container :deep(.sv-header) {
  padding-top: 4rem;
}

/* Mobile: merge brand and controls into a single floating app bar */
@media (max-width: 599.98px) {
  .camp-header {
    padding: 0.5rem 0.75rem;
  }

  .camp-header__inner {
    pointer-events: auto;
    background: var(--md3-surface-container);
    border-radius: 999px;
    padding: 0.25rem 0.5rem 0.25rem 0.25rem;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.18),
      0 1px 3px 1px rgba(0, 0, 0, 0.12);
  }

  .camp-nav {
    gap: 0;
  }

  .camp-brand,
  .camp-back {
    background: transparent;
    box-shadow: none;
  }

  .camp-toolbar.q-toolbar--floating {
    background: transparent;
    box-shadow: none;
    min-height: 0;
    padding: 0;
  }
}

.camp-footer__link {
  color: inherit;
  text-decoration: none;
}

.camp-footer__link:hover,
.camp-footer__link:focus-visible {
  text-decoration: underline;
}
</style>

<style>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0.125rem grey;
  border-radius: 0.25rem;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #656565;
  border-radius: 0.25rem;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #4b4b4b;
}

::-webkit-scrollbar-corner {
}
</style>

<i18n lang="yaml" locale="en">
camps: 'Camps'
back_to_camps: 'Back to all camps'
footer:
  label: 'Legal'
  imprint: 'Imprint'
  privacy_policy: 'Privacy Policy'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
back_to_camps: 'Zurück zu allen Camps'
footer:
  label: 'Rechtliches'
  imprint: 'Impressum'
  privacy_policy: 'Datenschutzerklärung'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
back_to_camps: 'Retour à tous les camps'
footer:
  label: 'Mentions légales'
  imprint: 'Mentions légales'
  privacy_policy: 'Politique de confidentialité'
</i18n>

<i18n lang="yaml" locale="pl">
camps: 'Obozy'
back_to_camps: 'Powrót do wszystkich obozów'
footer:
  label: 'Informacje prawne'
  imprint: 'Nota prawna'
  privacy_policy: 'Polityka prywatności'
</i18n>

<i18n lang="yaml" locale="cs">
camps: 'Tábory'
back_to_camps: 'Zpět na všechny tábory'
footer:
  label: 'Právní informace'
  imprint: 'Tiráž'
  privacy_policy: 'Zásady ochrany osobních údajů'
</i18n>
