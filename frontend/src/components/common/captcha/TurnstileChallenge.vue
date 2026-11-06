<template>
  <!-- Empty until Turnstile needs the visitor to interact. -->
  <div
    ref="container"
    class="captcha-challenge"
  />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { loadTurnstile, type TurnstileApi } from '@/lib/captcha/turnstile';
import type { CaptchaAction } from '@camp-registration/common/captcha';
import type { CaptchaChallenge } from '@/lib/captcha';

const { action, siteKey } = defineProps<{
  action: CaptchaAction;
  siteKey: string;
}>();

const interactive = defineModel<boolean>('interactive', { default: false });

const { t, locale } = useI18n();
const container = useTemplateRef<HTMLElement>('container');

let api: TurnstileApi | undefined;
let widgetId: string | undefined;
// Turnstile fixes the language at render time.
let renderedLocale: string | undefined;
let executed = false;
let pending:
  | { resolve: (token: string) => void; reject: (error: Error) => void }
  | undefined;

function settle(result: { token: string } | { error: string }) {
  interactive.value = false;
  const current = pending;
  pending = undefined;
  if ('token' in result) {
    current?.resolve(result.token);
  } else {
    current?.reject(new Error(result.error));
  }
}

function render(turnstile: TurnstileApi, element: HTMLElement): string {
  renderedLocale = locale.value;
  executed = false;
  return turnstile.render(element, {
    sitekey: siteKey,
    action,
    execution: 'execute',
    appearance: 'interaction-only',
    retry: 'never',
    theme: 'auto',
    language: locale.value.split('-')[0] || 'auto',
    'before-interactive-callback': () => (interactive.value = true),
    'after-interactive-callback': () => (interactive.value = false),
    callback: (token) => settle({ token }),
    'error-callback': () => {
      settle({ error: t('failed') });
      return true;
    },
    'timeout-callback': () => settle({ error: t('timeout') }),
  });
}

async function getToken(): Promise<string> {
  try {
    api ??= await loadTurnstile();
  } catch (error) {
    throw new Error(t('unavailable'), { cause: error });
  }
  if (!container.value) {
    throw new Error(t('unavailable'));
  }

  if (widgetId !== undefined && renderedLocale !== locale.value) {
    api.remove(widgetId);
    widgetId = undefined;
  }
  widgetId ??= render(api, container.value);
  if (executed) {
    api.reset(widgetId);
  }

  const turnstile = api;
  const id = widgetId;
  settle({ error: t('failed') });
  return new Promise<string>((resolve, reject) => {
    pending = { resolve, reject };
    turnstile.execute(id);
    executed = true;
  });
}

onBeforeUnmount(() => {
  settle({ error: t('failed') });
  if (api && widgetId !== undefined) {
    api.remove(widgetId);
  }
});

defineExpose<CaptchaChallenge>({ getToken });
</script>

<i18n lang="yaml" locale="en">
unavailable: 'The bot check could not be loaded. Please disable any content blocker for this page and try again.'
failed: 'The bot check failed. Please try again.'
timeout: 'The bot check timed out. Please try again.'
</i18n>

<i18n lang="yaml" locale="de">
unavailable: 'Die Bot-Prüfung konnte nicht geladen werden. Bitte deaktiviere Inhaltsblocker für diese Seite und versuche es erneut.'
failed: 'Die Bot-Prüfung ist fehlgeschlagen. Bitte versuche es erneut.'
timeout: 'Die Bot-Prüfung ist abgelaufen. Bitte versuche es erneut.'
</i18n>

<i18n lang="yaml" locale="fr">
unavailable: "La vérification anti-robot n'a pas pu être chargée. Désactive les bloqueurs de contenu pour cette page et réessaie."
failed: 'La vérification anti-robot a échoué. Réessaie.'
timeout: 'La vérification anti-robot a expiré. Réessaie.'
</i18n>

<i18n lang="yaml" locale="pl">
unavailable: 'Nie udało się załadować weryfikacji antybotowej. Wyłącz blokery treści dla tej strony i spróbuj ponownie.'
failed: 'Weryfikacja antybotowa nie powiodła się. Spróbuj ponownie.'
timeout: 'Weryfikacja antybotowa wygasła. Spróbuj ponownie.'
</i18n>

<i18n lang="yaml" locale="cs">
unavailable: 'Ochranu proti robotům se nepodařilo načíst. Vypni prosím blokátory obsahu pro tuto stránku a zkus to znovu.'
failed: 'Ochrana proti robotům selhala. Zkus to prosím znovu.'
timeout: 'Platnost ochrany proti robotům vypršela. Zkus to prosím znovu.'
</i18n>
