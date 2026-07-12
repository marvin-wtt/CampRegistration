<template>
  <q-card
    flat
    bordered
  >
    <q-card-section class="text-h6">
      {{ t('title') }}
    </q-card-section>

    <q-card-section class="text-subtitle-2 q-pt-none">
      {{ t('description') }}
    </q-card-section>

    <!-- Generated codes -->
    <template v-if="codes && codes.length">
      <q-card-section class="q-pt-none">
        <q-banner
          dense
          rounded
          class="recovery-banner q-mb-md"
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>
          {{ t('warning') }}
        </q-banner>

        <div class="recovery-grid">
          <code
            v-for="code in codes"
            :key="code"
            class="recovery-code"
          >
            {{ code }}
          </code>
        </div>
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.copy')"
          icon="content_copy"
          color="primary"
          flat
          rounded
          @click="onCopy"
        />
        <q-btn
          :label="t('action.download')"
          icon="download"
          color="primary"
          flat
          rounded
          @click="onDownload"
        />
        <q-space />
        <q-btn
          :label="t('action.done')"
          color="primary"
          rounded
          @click="emit('done')"
        />
      </q-card-actions>
    </template>

    <!-- Generation form -->
    <q-form
      v-else
      @submit="onGenerate"
    >
      <q-card-section
        class="q-gutter-sm q-pt-none"
        style="max-width: 500px"
      >
        <q-input
          v-model="password"
          :label="t('field.password.label')"
          type="password"
          autocomplete="current-password"
          :rules="[
            (val?: string) => !!val || t('field.password.rule.required'),
          ]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="password" />
          </template>
        </q-input>

        <two-factor-code-input
          v-model="code"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        />
      </q-card-section>

      <div
        v-if="error"
        class="q-px-md q-pb-sm text-negative text-body2"
      >
        <q-icon
          name="warning"
          size="xs"
          class="q-mr-xs"
        />{{ error }}
      </div>

      <q-card-actions>
        <q-btn
          :label="t('action.generate')"
          type="submit"
          color="primary"
          :loading
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { copyToClipboard, useQuasar } from 'quasar';
import { exportFile } from 'quasar';
import TwoFactorCodeInput from '@/components/settings/twoFactor/TwoFactorCodeInput.vue';

const { t } = useI18n();
const quasar = useQuasar();

const { codes, loading, error } = defineProps<{
  codes?: string[] | undefined;
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: 'generate', password: string, otp: string): void;
  (e: 'done'): void;
}>();

const password = ref<string>('');
const code = ref<string>('');

function onGenerate() {
  emit('generate', password.value, code.value.trim());
}

function codesAsText(): string {
  return (codes ?? []).join('\n');
}

function onCopy() {
  void copyToClipboard(codesAsText()).then(() => {
    quasar.notify({
      message: t('notify.copied'),
      color: 'positive',
      icon: 'check',
    });
  });
}

function onDownload() {
  exportFile('recovery-codes.txt', codesAsText(), 'text/plain');
}
</script>

<style scoped lang="scss">
.recovery-banner {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.recovery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.recovery-code {
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 1px;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Recovery Codes'
description: 'Recovery codes let you sign in if you lose access to your
  authenticator app. Each code can be used once. Store them somewhere safe.'
warning: "These codes are shown only once. Save them now — you won't be able to
  see them again. Any previously generated codes are no longer valid."
field:
  password:
    label: 'Password'
    rule:
      required: 'Password is required.'
action:
  generate: 'Generate recovery codes'
  copy: 'Copy'
  download: 'Download'
  done: 'Done'
notify:
  copied: 'Recovery codes copied to clipboard'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Wiederherstellungscodes'
description: 'Mit Wiederherstellungscodes können Sie sich anmelden, wenn Sie den
  Zugriff auf Ihre Authentifizierungs-App verlieren. Jeder Code kann einmal
  verwendet werden. Bewahren Sie sie sicher auf.'
warning: 'Diese Codes werden nur einmal angezeigt. Speichern Sie sie jetzt – Sie
  können sie später nicht mehr einsehen. Zuvor generierte Codes sind nicht mehr
  gültig.'
field:
  password:
    label: 'Passwort'
    rule:
      required: 'Passwort ist erforderlich.'
action:
  generate: 'Wiederherstellungscodes generieren'
  copy: 'Kopieren'
  download: 'Herunterladen'
  done: 'Fertig'
notify:
  copied: 'Wiederherstellungscodes in die Zwischenablage kopiert'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Codes de récupération'
description:
  "Les codes de récupération vous permettent de vous connecter si vous
  perdez l'accès à votre application d'authentification. Chaque code ne peut être
  utilisé qu'une seule fois. Conservez-les en lieu sûr."
warning: "Ces codes ne sont affichés qu'une seule fois. Enregistrez-les
  maintenant : vous ne pourrez plus les voir. Les codes générés précédemment ne
  sont plus valides."
field:
  password:
    label: 'Mot de passe'
    rule:
      required: 'Le mot de passe est requis.'
action:
  generate: 'Générer des codes de récupération'
  copy: 'Copier'
  download: 'Télécharger'
  done: 'Terminé'
notify:
  copied: 'Codes de récupération copiés dans le presse-papiers'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Kody odzyskiwania'
description: 'Kody odzyskiwania umożliwiają logowanie, jeśli utracisz dostęp do
  aplikacji uwierzytelniającej. Każdy kod można użyć tylko raz. Przechowuj je w
  bezpiecznym miejscu.'
warning: 'Te kody są wyświetlane tylko raz. Zapisz je teraz — nie będziesz mógł
  ich ponownie zobaczyć. Wcześniej wygenerowane kody nie są już ważne.'
field:
  password:
    label: 'Hasło'
    rule:
      required: 'Hasło jest wymagane.'
action:
  generate: 'Generuj kody odzyskiwania'
  copy: 'Kopiuj'
  download: 'Pobierz'
  done: 'Gotowe'
notify:
  copied: 'Kody odzyskiwania skopiowane do schowka'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Kódy pro obnovení'
description: 'Kódy pro obnovení vám umožní přihlásit se, pokud ztratíte přístup
  ke své autentizační aplikaci. Každý kód lze použít jednou. Uložte si je na
  bezpečné místo.'
warning: 'Tyto kódy se zobrazí pouze jednou. Uložte si je nyní — později je již
  neuvidíte. Dříve vygenerované kódy již nejsou platné.'
field:
  password:
    label: 'Heslo'
    rule:
      required: 'Heslo je povinné.'
action:
  generate: 'Vygenerovat kódy pro obnovení'
  copy: 'Kopírovat'
  download: 'Stáhnout'
  done: 'Hotovo'
notify:
  copied: 'Kódy pro obnovení zkopírovány do schránky'
</i18n>
