<template>
  <q-layout view="hHh Lpr fff">
    <!-- Floating brand instead of a full-width app bar -->
    <router-link
      to="/"
      class="camp-brand fixed-top-left q-ma-md row items-center no-wrap"
      :aria-label="t('app_name')"
    >
      <q-avatar
        size="36px"
        class="camp-brand__logo"
      >
        <!-- TODO: replace with the camp organizer logo once available -->
        <q-icon name="cabin" />
      </q-avatar>
      <span class="camp-brand__name text-weight-medium q-ml-sm gt-xs">
        {{ t('app_name') }}
      </span>
    </router-link>

    <!-- Compact floating controls instead of a full-width app bar -->
    <m-toolbar
      floating
      class="camp-toolbar fixed-top-right q-ma-md"
    >
      <locale-switch
        flat
        round
        dense
      />
      <profile-menu />
    </m-toolbar>

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
import LocaleSwitch from 'components/common/localization/LocaleSwitch.vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import HelpFab from 'components/FeedbackFab.vue';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';

const { t } = useI18n();
const { to } = useObjectTranslation();
const authStore = useAuthStore();
const campDetailStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailStore);

const year = new Date().getFullYear();

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
.camp-toolbar {
  z-index: 2000;
}

.camp-brand {
  z-index: 2000;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 1.5rem;
  text-decoration: none;
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
 * Below `md` the page content spans the full width and would otherwise slide
 * under the floating brand/controls. Reserve clearance on the page itself so the
 * (full-bleed) background colour still fills behind the pills without a seam.
 */
@media (max-width: 1023.98px) {
  .camp-page-container :deep(.q-page) {
    padding-top: 4rem;
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
footer:
  label: 'Legal'
  imprint: 'Imprint'
  privacy_policy: 'Privacy Policy'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
footer:
  label: 'Rechtliches'
  imprint: 'Impressum'
  privacy_policy: 'Datenschutzerklärung'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
footer:
  label: 'Mentions légales'
  imprint: 'Mentions légales'
  privacy_policy: 'Politique de confidentialité'
</i18n>

<i18n lang="yaml" locale="pl">
camps: 'Obozy'
footer:
  label: 'Informacje prawne'
  imprint: 'Nota prawna'
  privacy_policy: 'Polityka prywatności'
</i18n>

<i18n lang="yaml" locale="cs">
camps: 'Tábory'
footer:
  label: 'Právní informace'
  imprint: 'Tiráž'
  privacy_policy: 'Zásady ochrany osobních údajů'
</i18n>
