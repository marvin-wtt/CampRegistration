<template>
  <q-btn
    flat
    icon="account_circle"
    stretch
  >
    <q-menu>
      <q-list style="min-width: 100px">
        <q-item
          v-close-popup
          clickable
        >
          <q-item-section>
            {{ t('profile') }}
          </q-item-section>
        </q-item>

        <q-item clickable>
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
                v-for="locale in locales"
                :key="locale.value"
                clickable
                @click="updateLocale(locale.value)"
              >
                <q-item-section avatar>
                  <country-icon :locale="locale.country" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ locale.label }}
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
        >
          <q-item-section>
            {{ t('logout') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import CountryIcon from 'components/localization/CountryIcon.vue';

const { t, locale } = useI18n({
  useScope: 'global',
});

const locales = computed(() => [
  { label: 'Deutsch', value: 'de-DE', country: 'de' },
  { label: 'Français', value: 'fr-FR', country: 'fr' },
  { label: 'English', value: 'en-US', country: 'us' },
]);

function updateLocale(value: string) {
  locale.value = value;
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
logout: 'Logout'
profile: 'Profile'
language: 'Language'
</i18n>

<!-- TODO Add translations -->
