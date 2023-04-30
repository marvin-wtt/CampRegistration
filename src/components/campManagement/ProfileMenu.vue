<template>
  <q-menu>
    <q-list style="min-width: 100px">
      <q-item>
        <q-item-section>
          <q-item-label>
            {{ t('username') }}
          </q-item-label>
          <q-item-label caption>
            {{ data?.name }}
          </q-item-label>
          <q-item-label caption>
            {{ data?.email }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-close-popup
        clickable
      >
        <q-item-section avatar>
          <q-icon name="account_circle" />
        </q-item-section>
        <q-item-section>
          {{ t('profile') }}
        </q-item-section>
      </q-item>

      <q-item
        v-close-popup
        clickable
        @click="goToCamps"
      >
        <q-item-section avatar>
          <q-icon name="home" />
        </q-item-section>
        <q-item-section>
          {{ t('camps') }}
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-close-popup
        clickable
        @click="toggleDarkMode"
      >
        <q-item-section avatar>
          <q-icon name="dark_mode" />
        </q-item-section>
        <q-item-section>
          {{ t('dark_mode') }}
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
                <country-icon :locale="localeOption.country" />
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
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import CountryIcon from 'components/localization/CountryIcon.vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const router = useRouter();
const quasar = useQuasar();
const { t } = useI18n();
const { locale } = useI18n({
  useScope: 'global',
});

const authStore = useAuthStore();
const { data } = storeToRefs(authStore);

const locales = computed(() => [
  { label: 'Deutsch', value: 'de-DE', country: 'de' },
  { label: 'Français', value: 'fr-FR', country: 'fr' },
  { label: 'English', value: 'en-US', country: 'us' },
]);

function goToCamps() {
  router.push({
    name: 'campManagement',
  });
}

function updateLocale(value: string) {
  locale.value = value;
}

function toggleDarkMode() {
  quasar.dark.toggle();
}

function logout() {
  authStore.logout();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
username: 'Signed in as'
camps: 'My camps'
logout: 'Sing out'
profile: 'Profile'
language: 'Language'
dark_mode: 'Dark Mode'
</i18n>

<!-- TODO Add translations -->
