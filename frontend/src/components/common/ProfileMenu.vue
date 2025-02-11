<template>
  <q-btn
    v-if="authenticated"
    flat
    icon="account_circle"
    rounded
  >
    <q-menu>
      <q-list style="min-width: 100px">
        <q-item>
          <q-item-section>
            <q-item-label>
              {{ t('username') }}
            </q-item-label>
            <q-item-label caption>
              {{ profile?.name }}
            </q-item-label>
            <q-item-label caption>
              {{ profile?.email }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item
          v-close-popup
          clickable
          :to="{ name: 'management' }"
        >
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            {{ t('camps') }}
          </q-item-section>
        </q-item>

        <q-item
          v-if="administrator"
          v-close-popup
          clickable
          :to="{ name: 'administration' }"
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
        >
          <q-item-section avatar>
            <q-icon name="account_circle" />
          </q-item-section>
          <q-item-section>
            {{ t('account') }}
          </q-item-section>
        </q-item>

        <q-separator />

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

        <q-separator />

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
  </q-btn>

  <q-btn
    v-else
    :to="{ name: 'login' }"
    :label="t('login')"
    rounded
    flat
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import { useQuasar } from 'quasar';
import type { Profile } from '@camp-registration/common/entities';

const quasar = useQuasar();
const { t } = useI18n();
const { locale } = useI18n({
  useScope: 'global',
});

const { profile } = defineProps<{
  profile: Profile | undefined;
}>();

const emit = defineEmits<{
  (e: 'logout'): void;
}>();

// TODO Read from config
const locales = computed(() => [
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'English', value: 'en-US' },
]);

const authenticated = computed<boolean>(() => {
  return profile !== undefined;
});

const administrator = computed<boolean>(() => {
  return profile?.role === 'ADMIN';
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
  emit('logout');
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
account: 'Account'
username: 'Signed in as'
camps: 'My camps'
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
administration: 'Administration'
light_mode: 'Mode lumineux'
login: 'Connexion'
logout: 'Déconnexion'
language: 'Langue'
dark_mode: 'Mode sombre'
</i18n>
