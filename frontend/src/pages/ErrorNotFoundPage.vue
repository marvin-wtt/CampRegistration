<template>
  <!-- The catch-all route sits outside every layout, so this page brings its
       own full-height frame instead of a <q-page>. -->
  <div class="notfound">
    <div
      class="notfound__glow"
      aria-hidden="true"
    />

    <main class="notfound__card">
      <span
        class="notfound__code"
        aria-hidden="true"
      >
        404
      </span>

      <h1 class="notfound__title">{{ t('title') }}</h1>
      <p class="notfound__text">{{ t('text') }}</p>

      <!-- Two equal exits, one per audience — an error page has no reason to
           push either. The auth guard sends signed-out visitors to login. -->
      <div class="notfound__actions">
        <m-btn
          :label="t('action.events')"
          :to="{ name: 'events' }"
          tonal
          tertiary
          icon="search"
          no-caps
          data-test="notfound-events"
        />
        <m-btn
          :label="t('action.management')"
          :to="{ name: 'management.events' }"
          tonal
          primary
          icon="dashboard"
          no-caps
          data-test="notfound-management"
        />
      </div>

      <button
        v-if="canGoBack"
        type="button"
        class="notfound__back"
        data-test="notfound-back"
        @click="router.back()"
      >
        <q-icon
          name="arrow_back"
          size="16px"
        />
        {{ t('action.back') }}
      </button>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();
const router = useRouter();

useMeta(() => ({
  title: t('meta_title'),
}));

// Nothing to go back to when the 404 is the first page of the session.
const canGoBack = window.history.length > 1;
</script>

<style lang="scss" scoped>
.notfound {
  /* The theme ships shape and motion as Sass variables only, so mirror the
   * ones used here as custom properties. Values from its variables.scss. */
  --md3-corner-extra-large: 28px;
  --md3-corner-full: 9999px;
  --md3-easing-emphasized-decel: cubic-bezier(0.05, 0.7, 0.1, 1);

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  overflow-x: clip;
  color: var(--md3-on-surface);
  background: var(--md3-background);
}

.notfound__glow {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(
      46% 46% at 50% 32%,
      rgba(var(--md3-primary-rgb), 0.16),
      transparent 70%
    ),
    radial-gradient(
      38% 38% at 78% 78%,
      rgba(var(--md3-primary-rgb), 0.08),
      transparent 70%
    );
}

.notfound__card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
  padding: clamp(32px, 6vw, 56px) clamp(24px, 5vw, 48px);
  text-align: center;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-extra-large);
  background: var(--md3-surface-container-low);
}

@media (prefers-reduced-motion: no-preference) {
  .notfound__card {
    animation: notfound-rise 0.6s var(--md3-easing-emphasized-decel) both;
  }
}

.notfound__code {
  font-size: clamp(4rem, 16vw, 7rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1;
  color: var(--md3-primary);
}

.notfound__title {
  margin: 20px 0 0;
  font-size: clamp(1.4rem, 3.4vw, 1.9rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--md3-on-surface);
}

.notfound__text {
  max-width: 44ch;
  margin: 12px 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--md3-on-surface-variant);
}

.notfound__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
}

.notfound__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 6px 12px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: var(--md3-corner-full);
  color: var(--md3-on-surface-variant);
  background: transparent;
  transition: background-color 0.2s ease;
}

.notfound__back:hover,
.notfound__back:focus-visible {
  background: var(--md3-surface-container-high);
}

@keyframes notfound-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 700px) {
  .notfound__actions {
    flex-direction: column;
    align-self: stretch;
  }
}
</style>

<i18n lang="yaml" locale="en">
meta_title: 'Page not found'
title: 'We can’t find that page'
text: 'The address may be mistyped, or the page may have been moved or deleted.'
action:
  events: 'Browse open events'
  management: 'Event management'
  back: 'Go back'
</i18n>

<i18n lang="yaml" locale="de">
meta_title: 'Seite nicht gefunden'
title: 'Diese Seite finden wir nicht'
text: 'Vielleicht hat sich ein Tippfehler in die Adresse eingeschlichen, oder die Seite wurde verschoben oder gelöscht.'
action:
  events: 'Offene Veranstaltungen ansehen'
  management: 'Zur Verwaltung'
  back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
meta_title: 'Page introuvable'
title: 'Nous ne trouvons pas cette page'
text: 'L’adresse contient peut-être une faute de frappe, ou la page a été déplacée ou supprimée.'
action:
  events: 'Voir les événements ouverts'
  management: 'Gestion des événements'
  back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
meta_title: 'Nie znaleziono strony'
title: 'Nie możemy znaleźć tej strony'
text: 'W adresie może być literówka albo strona została przeniesiona lub usunięta.'
action:
  events: 'Przeglądaj otwarte wydarzenia'
  management: 'Zarządzanie wydarzeniami'
  back: 'Wróć'
</i18n>

<i18n lang="yaml" locale="cs">
meta_title: 'Stránka nenalezena'
title: 'Tuto stránku nemůžeme najít'
text: 'V adrese může být překlep, nebo byla stránka přesunuta či smazána.'
action:
  events: 'Procházet otevřené akce'
  management: 'Správa akcí'
  back: 'Zpět'
</i18n>
