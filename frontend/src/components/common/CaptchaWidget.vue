<template>
  <!-- Takes no space unless the provider needs the visitor to interact. -->
  <div
    class="captcha-widget column"
    :class="{
      'items-end': align === 'end',
      'items-center': align === 'center',
      'captcha-widget--collapsed': !interactive,
    }"
    data-test="captcha"
  >
    <p
      v-if="interactive"
      class="text-body2 text-on-surface-variant q-mb-sm"
    >
      {{ t('hint') }}
    </p>
    <turnstile-challenge
      v-if="config?.driver === 'turnstile'"
      ref="challenge"
      v-model:interactive="interactive"
      :action
      :site-key="config.siteKey"
    />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  CaptchaAction,
  CaptchaClientConfig,
} from '@camp-registration/common/captcha';
import { type CaptchaChallenge, registerCaptcha } from '@/lib/captcha';
import { useCaptchaService } from '@/services/CaptchaService';
import TurnstileChallenge from '@/components/common/captcha/TurnstileChallenge.vue';

// Requests marked with `withCaptcha(action)` solve their token here.
const props = withDefaults(
  defineProps<{
    action: CaptchaAction;
    // Line up with the form's submit button.
    align?: 'center' | 'end';
  }>(),
  { align: 'center' },
);

const { t } = useI18n();
const { fetchCaptchaConfig } = useCaptchaService();
const challenge = useTemplateRef<CaptchaChallenge>('challenge');
const config = ref<CaptchaClientConfig>();
const interactive = ref<boolean>(false);

async function loadConfig(): Promise<CaptchaClientConfig> {
  try {
    config.value ??= await fetchCaptchaConfig();
  } catch (error) {
    throw new Error(t('unavailable'), { cause: error });
  }
  return config.value;
}

async function getToken(): Promise<string | undefined> {
  const { driver } = await loadConfig();
  if (!driver) {
    return undefined;
  }

  // The challenge renders once the config arrived.
  await nextTick();
  if (!challenge.value) {
    throw new Error(t('unavailable'));
  }
  return challenge.value.getToken();
}

let unregister: (() => void) | undefined;

onMounted(() => {
  unregister = registerCaptcha(props.action, getToken);
  // Warm up, so the first submit doesn't wait for it.
  loadConfig().catch(() => undefined);
});

onBeforeUnmount(() => unregister?.());
</script>

<style scoped>
/* Collapsed, not removed: the provider keeps running inside. */
.captcha-widget--collapsed {
  height: 0;
  overflow: hidden;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>

<i18n lang="yaml" locale="en">
hint: 'Please confirm you are human to continue.'
unavailable: 'The bot check could not be loaded. Please reload the page and try again.'
</i18n>

<i18n lang="yaml" locale="de">
hint: 'Bitte bestätige kurz, dass du kein Bot bist.'
unavailable: 'Die Bot-Prüfung konnte nicht geladen werden. Bitte lade die Seite neu und versuche es erneut.'
</i18n>

<i18n lang="yaml" locale="fr">
hint: 'Confirme rapidement que tu n’es pas un robot.'
unavailable: "La vérification anti-robot n'a pas pu être chargée. Recharge la page et réessaie."
</i18n>

<i18n lang="yaml" locale="pl">
hint: 'Potwierdź, że nie jesteś botem, aby kontynuować.'
unavailable: 'Nie udało się załadować weryfikacji antybotowej. Odśwież stronę i spróbuj ponownie.'
</i18n>

<i18n lang="yaml" locale="cs">
hint: 'Potvrď prosím, že nejsi robot.'
unavailable: 'Ochranu proti robotům se nepodařilo načíst. Obnov prosím stránku a zkus to znovu.'
</i18n>
