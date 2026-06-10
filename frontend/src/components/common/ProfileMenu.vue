<template>
  <m-btn
    v-if="authenticated"
    round
    text
    :aria-label="t('account')"
  >
    <q-avatar
      size="34px"
      class="profile-avatar"
    >
      <span v-if="initials">{{ initials }}</span>
      <q-icon
        v-else
        name="account_circle"
      />
    </q-avatar>

    <q-menu
      anchor="bottom end"
      self="top end"
    >
      <q-list style="min-width: 240px">
        <q-item class="profile-header">
          <q-item-section avatar>
            <q-avatar
              size="40px"
              class="profile-avatar"
            >
              <span v-if="initials">{{ initials }}</span>
              <q-icon
                v-else
                name="account_circle"
              />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ profile?.name }}
            </q-item-label>
            <q-item-label caption>
              {{ profile?.email }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item
          v-close-popup
          clickable
          :to="{ name: 'management.camps' }"
          active-class=""
          exact-active-class=""
        >
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            {{ t('camps') }}
          </q-item-section>
        </q-item>

        <q-item
          v-close-popup
          clickable
          :to="{ name: 'management.newsletters' }"
          active-class=""
          exact-active-class=""
        >
          <q-item-section avatar>
            <q-icon name="mail" />
          </q-item-section>
          <q-item-section>
            {{ t('newsletters') }}
          </q-item-section>
        </q-item>

        <q-item
          v-if="administrator"
          v-close-popup
          clickable
          :to="{ name: 'administration' }"
          active-class=""
          exact-active-class=""
        >
          <q-item-section avatar>
            <q-icon name="manage_accounts" />
          </q-item-section>
          <q-item-section>
            {{ t('administration') }}
          </q-item-section>
        </q-item>

        <q-item
          v-close-popup
          clickable
          :to="{ name: 'settings' }"
          active-class=""
          exact-active-class=""
        >
          <q-item-section avatar>
            <q-icon name="account_circle" />
          </q-item-section>
          <q-item-section>
            {{ t('account') }}
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item
          v-close-popup
          clickable
          @click="toggleDarkMode"
        >
          <q-item-section avatar>
            <q-icon :name="darkMode ? 'light_mode' : 'dark_mode'" />
          </q-item-section>
          <q-item-section>
            {{ t(darkMode ? 'light_mode' : 'dark_mode') }}
          </q-item-section>
        </q-item>

        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="language" />
          </q-item-section>
          <q-item-section>
            {{ t('language') }}
          </q-item-section>
          <q-item-section side>
            <country-icon :locale="locale" />
          </q-item-section>

          <q-menu
            anchor="top start"
            auto-close
            self="top end"
          >
            <q-list>
              <q-item
                v-for="localeOption in locales"
                :key="localeOption.value"
                clickable
                :active="locale === localeOption.value"
                @click="updateLocale(localeOption.value)"
              >
                <q-item-section avatar>
                  <country-icon :locale="localeOption.value" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ localeOption.label }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>

        <q-separator spaced />

        <q-item
          v-close-popup
          clickable
          @click="logout"
        >
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            {{ t('logout') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </m-btn>

  <m-btn
    v-else
    :to="{ name: 'login' }"
    :label="t('login')"
    :loading
    text
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import { useQuasar } from 'quasar';
import type { Profile } from '@camp-registration/common/entities';
import { useProfileStore } from 'stores/profile-store';
import { useAuthStore } from 'stores/auth-store';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const profileStore = useProfileStore();
const authStore = useAuthStore();

const quasar = useQuasar();
const { t } = useI18n();
const { locale } = useI18n({
  useScope: 'global',
});

// TODO Read from config
const locales = computed(() => [
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'English', value: 'en-US' },
  { label: 'Polski', value: 'pl-PL' },
  { label: 'Česky', value: 'cs-CZ' },
]);

const profile = computed<Profile | undefined>(() => {
  return profileStore.user;
});

const initials = computed<string>(() => {
  const name = profile.value?.name?.trim();
  if (!name) {
    return '';
  }

  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';

  return (first + last).toUpperCase();
});

const loading = computed<boolean>(() => {
  return authStore.loading || profileStore.loading;
});

const authenticated = computed<boolean>(() => {
  return profile.value !== undefined;
});

const administrator = computed<boolean>(() => {
  return profile.value?.role === 'ADMIN';
});

const darkMode = computed<boolean>(() => {
  return quasar.dark.isActive;
});

function updateLocale(value: string) {
  locale.value = value;
}

function toggleDarkMode() {
  quasar.dark.toggle();
}

function logout() {
  void authStore.logout();
}
</script>

<style scoped>
.profile-avatar {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  font-size: 0.875rem;
  font-weight: 500;
}

.profile-header {
  pointer-events: none;
}
</style>

<i18n lang="yaml" locale="en">
account: 'Account'
username: 'Signed in as'
camps: 'My camps'
newsletters: 'Newsletters'
administration: 'Administration'
light_mode: 'Light Mode'
login: 'Login'
logout: 'Sing out'
language: 'Language'
dark_mode: 'Dark Mode'
</i18n>

<i18n lang="yaml" locale="de">
account: 'Konto'
username: 'Angemeldet als'
camps: 'Meine Camps'
newsletters: 'Newsletter'
administration: 'Verwaltung'
light_mode: 'Hellmodus'
login: 'Anmelden'
logout: 'Abmelden'
language: 'Sprache'
dark_mode: 'Dunkelmodus'
</i18n>

<i18n lang="yaml" locale="fr">
account: 'Compte'
username: 'Connecté en tant que'
camps: 'Mes camps'
newsletters: 'Newsletters'
administration: 'Administration'
light_mode: 'Mode lumineux'
login: 'Connexion'
logout: 'Déconnexion'
language: 'Langue'
dark_mode: 'Mode sombre'
</i18n>

<i18n lang="yaml" locale="pl">
account: 'Konto'
username: 'Zalogowany jako'
camps: 'Moje obozy'
newsletters: 'Newslettery'
administration: 'Administracja'
light_mode: 'Tryb jasny'
login: 'Zaloguj się'
logout: 'Wyloguj się'
language: 'Język'
dark_mode: 'Tryb ciemny'
</i18n>

<i18n lang="yaml" locale="cs">
account: 'Účet'
username: 'Přihlášen jako'
camps: 'Moje tábory'
newsletters: 'Newslettery'
administration: 'Administrace'
light_mode: 'Světlý režim'
login: 'Přihlásit se'
logout: 'Odhlásit se'
language: 'Jazyk'
dark_mode: 'Tmavý režim'
</i18n>
