<template>
  <page-state-handler
    padding
    :error
    :loading
    class="row justify-center"
  >
    <div class="payments-shell column col-12 col-sm-10 col-md-8 q-gutter-md">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <q-banner
        v-if="options && !options.available"
        rounded
        class="bg-error-container text-on-error-container"
      >
        <template #avatar>
          <q-icon name="key_off" />
        </template>
        {{ t('unavailable') }}
      </q-banner>

      <!-- Connected account -->
      <q-card
        v-if="account"
        flat
        bordered
        class="rounded-lg"
        data-test="payment-account"
      >
        <q-card-section class="row items-center no-wrap q-gutter-md">
          <q-avatar
            color="positive-container"
            text-color="on-positive-container"
            icon="account_balance"
          />
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">
              {{ account.displayName ?? providerLabel(account.provider) }}
            </div>
            <div class="text-body2 text-on-surface-variant">
              {{ providerLabel(account.provider) }} ·
              {{ t('connectedAt', { date: formatDate(account.connectedAt) }) }}
            </div>
          </div>
          <q-badge
            :color="account.mode === 'live' ? 'positive' : 'warning'"
            :label="t(`mode.${account.mode}`)"
            class="q-pa-sm"
          />
        </q-card-section>

        <q-card-section
          v-if="account.mode === 'test'"
          class="q-pt-none"
        >
          <div class="text-body2 text-on-surface-variant">
            {{ t('testHint') }}
          </div>
        </q-card-section>

        <q-card-actions
          v-if="canEdit"
          align="right"
        >
          <m-btn
            text
            primary
            :label="t('action.replace')"
            @click="replacing = true"
          />
          <m-btn
            text
            error
            :label="t('action.disconnect')"
            :loading="busy"
            data-test="payment-account-disconnect"
            @click="confirmDisconnect"
          />
        </q-card-actions>
      </q-card>

      <!-- Connect form -->
      <q-card
        v-if="canEdit && (!account || replacing) && options?.available"
        flat
        bordered
        class="rounded-lg"
      >
        <q-card-section class="q-pb-none">
          <div class="text-subtitle2 text-weight-bold">
            {{ t('connect.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ t('connect.hint') }}
          </div>
        </q-card-section>

        <q-form @submit="connect">
          <q-card-section class="column q-gutter-md">
            <q-select
              v-model="provider"
              :label="t('connect.provider')"
              :options="providerOptions"
              emit-value
              map-options
              outlined
              rounded
              data-test="payment-account-provider"
            />

            <div
              class="text-body2 text-on-surface-variant row items-start no-wrap q-gutter-x-sm"
            >
              <q-icon
                name="info"
                size="20px"
                class="q-mt-xs"
              />
              <span>{{ t('connect.feeHint') }}</span>
            </div>

            <q-input
              v-model="apiKey"
              :label="t('connect.apiKey')"
              :hint="t(`connect.keyHint.${provider}`)"
              :rules="[(val: string) => !!val.trim() || t('connect.required')]"
              type="password"
              autocomplete="off"
              outlined
              rounded
              data-test="payment-account-api-key"
            >
              <template #prepend>
                <q-icon name="key" />
              </template>
            </q-input>

            <q-banner
              v-if="connectError"
              dense
              rounded
              class="bg-error-container text-on-error-container text-body2"
            >
              {{ connectError }}
            </q-banner>
          </q-card-section>

          <q-card-actions align="right">
            <m-btn
              v-if="account"
              text
              :label="t('action.cancel')"
              @click="replacing = false"
            />
            <m-btn
              type="submit"
              primary
              icon="link"
              :label="t('action.connect')"
              :loading="busy"
              data-test="payment-account-connect"
            />
          </q-card-actions>
        </q-form>
      </q-card>

      <q-card
        v-if="!account && !canEdit"
        flat
        bordered
        class="rounded-lg"
      >
        <q-card-section class="text-body2 text-on-surface-variant">
          {{ t('notConnected') }}
        </q-card-section>
      </q-card>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  PaymentAccount,
  PaymentProviderName,
  PaymentProviderOptions,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';

const { t, locale } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();
const { canOrg } = useOrganizationPermissions();

const PROVIDER_LABELS: Record<PaymentProviderName, string> = {
  mollie: 'Mollie',
  stripe: 'Stripe',
  fake: 'Fake (test)',
};

const organizationId = computed(() => route.params.organizationId as string);
const canEdit = computed(() => canOrg('organization.payments.edit'));

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const busy = ref<boolean>(false);
const account = ref<PaymentAccount | null>(null);
const options = ref<PaymentProviderOptions | null>(null);
const replacing = ref<boolean>(false);

const provider = ref<PaymentProviderName>('mollie');
const apiKey = ref<string>('');
const connectError = ref<string | null>(null);

const providerOptions = computed(() =>
  (options.value?.providers ?? []).map((value) => ({
    value,
    label: PROVIDER_LABELS[value],
  })),
);

function providerLabel(name: PaymentProviderName): string {
  return PROVIDER_LABELS[name];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(locale.value, {
    dateStyle: 'medium',
  });
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    [account.value, options.value] = await Promise.all([
      api.fetchPaymentAccount(organizationId.value),
      api.fetchPaymentProviders(organizationId.value),
    ]);
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
}

watch(organizationId, load, { immediate: true });

async function connect(): Promise<void> {
  busy.value = true;
  connectError.value = null;
  try {
    account.value = await api.connectPaymentAccount(organizationId.value, {
      provider: provider.value,
      apiKey: apiKey.value.trim(),
    });
    apiKey.value = '';
    replacing.value = false;
    quasar.notify({ type: 'positive', message: t('notify.connected') });
  } catch (err) {
    connectError.value = extractErrorText(err);
  } finally {
    busy.value = false;
  }
}

function confirmDisconnect(): void {
  quasar
    .dialog({
      title: t('disconnect.title'),
      message: t('disconnect.message'),
      cancel: true,
      ok: { label: t('action.disconnect'), color: 'negative', flat: true },
    })
    .onOk(() => void disconnect());
}

async function disconnect(): Promise<void> {
  busy.value = true;
  try {
    await api.disconnectPaymentAccount(organizationId.value);
    account.value = null;
    quasar.notify({ type: 'positive', message: t('notify.disconnected') });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.payments-shell {
  max-width: 800px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Payments'
subtitle: "Connect the organization's payment provider account. Participation fees of all your events are paid into it."
unavailable: 'Online payments are not available on this installation: the server has no encryption keys configured to store provider credentials safely.'
notConnected: 'No payment provider is connected. An organization administrator can connect one.'
connectedAt: 'connected on {date}'
testHint: 'Test mode: checkouts work, but no real money is moved. Connect a live key to accept real payments.'
mode:
  live: 'Live'
  test: 'Test mode'
connect:
  title: 'Connect a payment provider'
  hint: 'Paste an API key from your provider dashboard. It is stored encrypted and never shown again.'
  provider: 'Payment provider'
  feeHint: 'Payment providers are not free — Mollie and Stripe each deduct their own processing fees from every payment. Check their pricing pages before connecting.'
  apiKey: 'API key'
  required: 'Please enter an API key'
  keyHint:
    mollie: 'Found under Developers → API keys; starts with "live_" or "test_".'
    stripe: 'A secret or restricted key from Developers → API keys; starts with "sk_" or "rk_".'
    fake: 'Any key starting with "fake_".'
action:
  connect: 'Connect'
  replace: 'Replace key'
  disconnect: 'Disconnect'
  cancel: 'Cancel'
disconnect:
  title: 'Disconnect payment provider?'
  message: 'Participants will no longer be able to pay online, and online payments made so far can no longer be refunded from here. Recorded payments are kept.'
notify:
  connected: 'Payment provider connected'
  disconnected: 'Payment provider disconnected'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlungen'
subtitle: 'Verbinde das Konto des Zahlungsanbieters der Organisation. Die Teilnahmebeiträge aller deiner Veranstaltungen werden darauf eingezahlt.'
unavailable: 'Online-Zahlungen sind auf dieser Installation nicht verfügbar: Der Server hat keine Verschlüsselungsschlüssel, um Zugangsdaten sicher zu speichern.'
notConnected: 'Es ist kein Zahlungsanbieter verbunden. Eine Administratorin oder ein Administrator der Organisation kann einen verbinden.'
connectedAt: 'verbunden am {date}'
testHint: 'Testmodus: Zahlungen funktionieren, es wird aber kein echtes Geld bewegt. Verbinde einen Live-Schlüssel, um echte Zahlungen anzunehmen.'
mode:
  live: 'Live'
  test: 'Testmodus'
connect:
  title: 'Zahlungsanbieter verbinden'
  hint: 'Füge einen API-Schlüssel aus dem Dashboard deines Anbieters ein. Er wird verschlüsselt gespeichert und nie wieder angezeigt.'
  provider: 'Zahlungsanbieter'
  feeHint: 'Zahlungsanbieter sind nicht kostenlos — Mollie und Stripe ziehen jeweils eigene Bearbeitungsgebühren von jeder Zahlung ab. Prüfe die Preisseiten, bevor du dich verbindest.'
  apiKey: 'API-Schlüssel'
  required: 'Bitte gib einen API-Schlüssel ein'
  keyHint:
    mollie: 'Zu finden unter Entwickler → API-Schlüssel; beginnt mit „live_“ oder „test_“.'
    stripe: 'Ein geheimer oder eingeschränkter Schlüssel unter Entwickler → API-Schlüssel; beginnt mit „sk_“ oder „rk_“.'
    fake: 'Ein beliebiger Schlüssel, der mit „fake_“ beginnt.'
action:
  connect: 'Verbinden'
  replace: 'Schlüssel ersetzen'
  disconnect: 'Trennen'
  cancel: 'Abbrechen'
disconnect:
  title: 'Zahlungsanbieter trennen?'
  message: 'Teilnehmende können dann nicht mehr online bezahlen, und bisherige Online-Zahlungen können hier nicht mehr erstattet werden. Erfasste Zahlungen bleiben erhalten.'
notify:
  connected: 'Zahlungsanbieter verbunden'
  disconnected: 'Zahlungsanbieter getrennt'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paiements'
subtitle: "Connectez le compte du prestataire de paiement de l'organisation. Les frais de participation de tous vos événements y sont versés."
unavailable: "Les paiements en ligne ne sont pas disponibles sur cette installation : le serveur n'a pas de clés de chiffrement pour stocker les identifiants en toute sécurité."
notConnected: "Aucun prestataire de paiement n'est connecté. Un administrateur de l'organisation peut en connecter un."
connectedAt: 'connecté le {date}'
testHint: "Mode test : les paiements fonctionnent, mais aucun argent réel n'est transféré. Connectez une clé live pour accepter de vrais paiements."
mode:
  live: 'Live'
  test: 'Mode test'
connect:
  title: 'Connecter un prestataire de paiement'
  hint: "Collez une clé API depuis le tableau de bord de votre prestataire. Elle est stockée chiffrée et n'est plus jamais affichée."
  provider: 'Prestataire de paiement'
  feeHint: 'Les prestataires de paiement ne sont pas gratuits — Mollie et Stripe prélèvent chacun leurs propres frais de traitement sur chaque paiement. Consultez leurs grilles tarifaires avant de vous connecter.'
  apiKey: 'Clé API'
  required: 'Veuillez saisir une clé API'
  keyHint:
    mollie: 'Disponible sous Développeurs → Clés API ; commence par « live_ » ou « test_ ».'
    stripe: 'Une clé secrète ou restreinte sous Développeurs → Clés API ; commence par « sk_ » ou « rk_ ».'
    fake: "N'importe quelle clé commençant par « fake_ »."
action:
  connect: 'Connecter'
  replace: 'Remplacer la clé'
  disconnect: 'Déconnecter'
  cancel: 'Annuler'
disconnect:
  title: 'Déconnecter le prestataire de paiement ?'
  message: 'Les participants ne pourront plus payer en ligne, et les paiements en ligne déjà effectués ne pourront plus être remboursés ici. Les paiements enregistrés sont conservés.'
notify:
  connected: 'Prestataire de paiement connecté'
  disconnected: 'Prestataire de paiement déconnecté'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Płatności'
subtitle: 'Połącz konto operatora płatności organizacji. Opłaty za udział we wszystkich Twoich wydarzeniach trafiają na to konto.'
unavailable: 'Płatności online nie są dostępne w tej instalacji: serwer nie ma skonfigurowanych kluczy szyfrowania do bezpiecznego przechowywania danych dostępowych.'
notConnected: 'Nie połączono żadnego operatora płatności. Może to zrobić administrator organizacji.'
connectedAt: 'połączono {date}'
testHint: 'Tryb testowy: płatności działają, ale nie są przekazywane prawdziwe pieniądze. Połącz klucz produkcyjny, aby przyjmować prawdziwe płatności.'
mode:
  live: 'Produkcyjny'
  test: 'Tryb testowy'
connect:
  title: 'Połącz operatora płatności'
  hint: 'Wklej klucz API z panelu swojego operatora. Jest przechowywany w postaci zaszyfrowanej i nigdy więcej nie jest wyświetlany.'
  provider: 'Operator płatności'
  feeHint: 'Operatorzy płatności nie są bezpłatni — Mollie i Stripe pobierają własne opłaty za przetwarzanie każdej płatności. Sprawdź ich cenniki przed połączeniem.'
  apiKey: 'Klucz API'
  required: 'Wpisz klucz API'
  keyHint:
    mollie: 'Znajdziesz go w sekcji Developers → API keys; zaczyna się od „live_” lub „test_”.'
    stripe: 'Klucz tajny lub ograniczony z sekcji Developers → API keys; zaczyna się od „sk_” lub „rk_”.'
    fake: 'Dowolny klucz zaczynający się od „fake_”.'
action:
  connect: 'Połącz'
  replace: 'Zmień klucz'
  disconnect: 'Odłącz'
  cancel: 'Anuluj'
disconnect:
  title: 'Odłączyć operatora płatności?'
  message: 'Uczestnicy nie będą już mogli płacić online, a dotychczasowych płatności online nie będzie można tu zwrócić. Zapisane płatności zostaną zachowane.'
notify:
  connected: 'Operator płatności połączony'
  disconnected: 'Operator płatności odłączony'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Platby'
subtitle: 'Propojte účet platebního poskytovatele organizace. Účastnické poplatky všech vašich akcí se platí na něj.'
unavailable: 'Online platby nejsou v této instalaci dostupné: server nemá nastavené šifrovací klíče pro bezpečné uložení přístupových údajů.'
notConnected: 'Není propojen žádný platební poskytovatel. Administrátor organizace ho může propojit.'
connectedAt: 'propojeno {date}'
testHint: 'Testovací režim: platby fungují, ale nepřevádějí se skutečné peníze. Pro přijímání skutečných plateb propojte ostrý klíč.'
mode:
  live: 'Ostrý provoz'
  test: 'Testovací režim'
connect:
  title: 'Propojit platebního poskytovatele'
  hint: 'Vložte API klíč z nástěnky svého poskytovatele. Uloží se šifrovaně a už se nikdy nezobrazí.'
  provider: 'Platební poskytovatel'
  feeHint: 'Platební poskytovatelé nejsou zdarma — Mollie i Stripe si z každé platby strhávají vlastní poplatky za zpracování. Před propojením zkontroluj jejich ceníky.'
  apiKey: 'API klíč'
  required: 'Zadejte prosím API klíč'
  keyHint:
    mollie: 'Najdete ho v Developers → API keys; začíná „live_“ nebo „test_“.'
    stripe: 'Tajný nebo omezený klíč z Developers → API keys; začíná „sk_“ nebo „rk_“.'
    fake: 'Libovolný klíč začínající „fake_“.'
action:
  connect: 'Propojit'
  replace: 'Vyměnit klíč'
  disconnect: 'Odpojit'
  cancel: 'Zrušit'
disconnect:
  title: 'Odpojit platebního poskytovatele?'
  message: 'Účastníci pak nebudou moci platit online a dosavadní online platby zde již nebude možné vrátit. Zaznamenané platby zůstanou zachovány.'
notify:
  connected: 'Platební poskytovatel propojen'
  disconnected: 'Platební poskytovatel odpojen'
</i18n>
