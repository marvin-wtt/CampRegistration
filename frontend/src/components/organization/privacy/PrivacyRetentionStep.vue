<template>
  <div>
    <div class="row q-col-gutter-md retention-baseline">
      <q-input
        v-model.number="retentionMonths"
        type="number"
        :label="t('field.retentionMonths')"
        :min="1"
        :max="240"
        dense
        outlined
        :disable="!canEdit"
        class="col-12 col-sm-4"
      />
      <q-select
        v-model="retentionAnchor"
        :options="retentionAnchorOptions"
        :label="t('field.retentionAnchor')"
        emit-value
        map-options
        dense
        outlined
        :disable="!canEdit"
        class="col-12 col-sm-8"
      />
    </div>

    <!-- Optional by design: a camp with one period never opens this. -->
    <div class="q-mt-lg retention-exceptions">
      <div class="text-body2 text-weight-medium">
        {{ t('retention.exceptions.title') }}
      </div>
      <div class="text-caption text-on-surface-variant q-mb-sm">
        {{ t('retention.exceptions.hint') }}
      </div>

      <q-card
        v-for="(exception, index) in exceptions"
        :key="index"
        flat
        bordered
        class="inset-card retention-exception q-mb-sm"
      >
        <q-card-section class="q-pa-sm column q-gutter-y-xs">
          <!-- Scope, period and anchor read as one sentence, so they sit
             on one line and the delete button aligns with them. -->
          <div class="row q-col-gutter-sm items-start no-wrap">
            <div class="col row q-col-gutter-sm items-start">
              <q-select
                v-model="exception.scope"
                :options="exceptionScopeOptions"
                :label="t('retention.exceptions.scope')"
                emit-value
                map-options
                dense
                outlined
                hide-bottom-space
                :disable="!canEdit"
                :error="consentScopeInvalid(exception)"
                :error-message="t('retention.exceptions.consentScopeError')"
                class="col-12 col-sm-6"
              />
              <q-select
                :model-value="exceptionUntil(exception)"
                :options="untilOptions"
                :label="t('retention.exceptions.until')"
                emit-value
                map-options
                dense
                outlined
                hide-bottom-space
                :disable="!canEdit"
                class="col-12 col-sm-6"
                @update:model-value="(v) => setExceptionUntil(index, v)"
              />
              <!-- Consent-bound data has no period to state: the withdrawal is
                 what ends it, so offering a number here would only invite one
                 the notice cannot keep. -->
              <template v-if="!isConsentBoundException(exception)">
                <q-input
                  v-model.number="exception.months"
                  type="number"
                  :label="t('field.retentionMonths')"
                  :min="1"
                  :max="600"
                  dense
                  outlined
                  hide-bottom-space
                  :disable="!canEdit"
                  :error="exception.months <= 0"
                  class="col-5 col-sm-4"
                />
                <q-select
                  v-model="exception.anchor"
                  :options="retentionAnchorOptions"
                  :label="t('field.retentionAnchor')"
                  emit-value
                  map-options
                  dense
                  outlined
                  hide-bottom-space
                  :disable="!canEdit"
                  class="col-7 col-sm-8"
                />
              </template>
            </div>
            <m-btn
              flat
              round
              dense
              icon="delete"
              :aria-label="t('action.remove')"
              :disable="!canEdit"
              class="col-auto retention-exception__remove"
              @click="removeException(index)"
            />
          </div>

          <translated-input
            v-if="isCustomKey(exception.scope)"
            :model-value="exception.label"
            :label="t('retention.exceptions.label')"
            :locales
            default-untranslated
            dense
            outlined
            hide-bottom-space
            :disable="!canEdit"
            class="retention-exception__field"
            @update:model-value="(v) => (exception.label = asTranslatable(v))"
          />

          <translated-input
            :model-value="exception.reason"
            :label="t('retention.exceptions.reason')"
            :locales
            default-untranslated
            dense
            outlined
            hide-bottom-space
            :disable="!canEdit"
            class="retention-exception__field"
            @update:model-value="(v) => (exception.reason = asTranslatable(v))"
          />
        </q-card-section>
      </q-card>

      <m-btn
        :label="t('retention.exceptions.add')"
        icon="add"
        outline
        color="primary"
        :disable="!canEdit"
        @click="addException"
      />
    </div>

    <!-- The three switches stack as one group, each with its own fields
       indented beneath it, rather than being interleaved with rows of
       inputs — otherwise it is not obvious which field belongs to
       which switch. -->
    <div class="column q-gutter-y-md q-mt-lg">
      <div>
        <q-toggle
          v-model="content.thirdCountryTransfers.enabled"
          :label="t('field.transfersEnabled')"
          :disable="!canEdit"
        />
        <div
          v-if="content.thirdCountryTransfers.enabled"
          class="column q-gutter-y-sm toggle-fields"
        >
          <q-select
            v-model="content.thirdCountryTransfers.countries"
            :label="t('field.transferCountries')"
            :hint="t('field.transferCountriesHint')"
            use-input
            use-chips
            multiple
            new-value-mode="add-unique"
            hide-dropdown-icon
            dense
            outlined
            :disable="!canEdit"
            :error="content.thirdCountryTransfers.countries.length === 0"
          />
          <q-select
            v-model="content.thirdCountryTransfers.safeguard"
            :options="safeguardOptions"
            :label="t('field.transferSafeguard')"
            emit-value
            map-options
            dense
            outlined
            :disable="!canEdit"
            :error="!content.thirdCountryTransfers.safeguard"
          />
        </div>
      </div>

      <div>
        <q-toggle
          v-model="hasDpo"
          :label="t('field.hasDpo')"
          :disable="!canEdit"
        />
        <div
          v-if="content.dpo"
          class="column q-gutter-y-sm toggle-fields"
        >
          <q-input
            v-model="content.dpo.name"
            :label="t('field.dpoName')"
            dense
            outlined
            :disable="!canEdit"
            :error="content.dpo.name.trim() === ''"
          />
          <q-input
            v-model="content.dpo.email"
            type="email"
            :label="t('field.dpoEmail')"
            dense
            outlined
            :disable="!canEdit"
            :error="content.dpo.email.trim() === ''"
          />
        </div>
      </div>

      <div>
        <q-toggle
          v-model="content.automatedDecisionMaking"
          :label="t('field.automated')"
          :disable="!canEdit"
        />
        <!-- Declaring it obliges the notice to explain the logic,
           significance and consequences; the switch alone is not the
           disclosure Art. 13(2)(f) asks for. -->
        <div
          v-if="content.automatedDecisionMaking"
          class="toggle-fields"
        >
          <translated-input
            :model-value="content.automatedDecisionMakingDetails"
            :label="t('field.automatedDetails')"
            :hint="t('field.automatedDetailsHint')"
            :locales
            always
            type="textarea"
            dense
            outlined
            :disable="!canEdit"
            :error="!hasAutomatedDetails"
            @update:model-value="
              (v) =>
                (content.automatedDecisionMakingDetails = asTranslatable(v))
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  RETENTION_ANCHORS,
  RETENTION_UNTIL,
  TRANSFER_SAFEGUARDS,
  customKey,
  isConsentBoundException,
  isCustomKey,
  nextCustomKey,
  privacyNoticeCompleteness,
  retentionExceptions,
  type PrivacyNoticeContent,
  type PrivacyRetentionException,
  type RetentionAnchor,
  type RetentionUntil,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { APP_LOCALES as locales } from '@/i18n/locales';

const content = defineModel<PrivacyNoticeContent>({ required: true });

defineProps<{ canEdit: boolean }>();

const { t } = useI18n();
// The catalogue vocabulary is global: the same words appear in the notice a
// registrant reads.
const { t: gt } = useI18n({ useScope: 'global' });
const { to } = useObjectTranslation();

function asTranslatable(value: unknown): Translatable | null {
  return (value ?? null) as Translatable | null;
}

const retentionAnchorOptions = computed(() =>
  RETENTION_ANCHORS.map((key) => ({
    value: key,
    label: gt(`privacy.retentionAnchor.${key}`),
  })),
);

const safeguardOptions = computed(() =>
  TRANSFER_SAFEGUARDS.map((key) => ({
    value: key,
    label: gt(`privacy.transferSafeguard.${key}`),
  })),
);

const retentionMonths = computed({
  get: () => content.value.retention?.months ?? 24,
  set: (months: number) => {
    content.value.retention = {
      months,
      anchor: content.value.retention?.anchor ?? 'camp_end',
      exceptions: retentionExceptions(content.value.retention),
    };
  },
});

const retentionAnchor = computed({
  get: () => content.value.retention?.anchor ?? 'camp_end',
  set: (anchor: RetentionAnchor) => {
    content.value.retention = {
      months: content.value.retention?.months ?? 24,
      anchor,
      exceptions: retentionExceptions(content.value.retention),
    };
  },
});

const exceptions = computed(() => retentionExceptions(content.value.retention));

/**
 * The purposes already selected, plus an escape hatch. Nothing here is a fixed
 * list the author has to squeeze an exception into.
 */
const exceptionScopeOptions = computed(() => [
  ...content.value.purposes.map((purpose) => ({
    value: purpose.key,
    label: isCustomKey(purpose.key)
      ? to(purpose.label ?? '')
      : gt(`privacy.purpose.${purpose.key}`),
  })),
  // From what is taken, not from the list length: deleting an entry used to let
  // this offer a key an existing exception already holds.
  {
    value: nextCustomKey(exceptions.value.map((e) => ({ key: e.scope }))),
    label: t('retention.exceptions.own'),
  },
]);

function ensureRetention() {
  content.value.retention ??= {
    months: 24,
    anchor: 'camp_end',
    exceptions: [],
  };
  content.value.retention.exceptions = retentionExceptions(
    content.value.retention,
  );
  return content.value.retention;
}

function addException() {
  const retention = ensureRetention();
  retention.exceptions.push({
    scope: content.value.purposes[0]?.key ?? customKey('1'),
    months: 120,
    anchor: retention.anchor,
  });
}

const untilOptions = computed(() =>
  RETENTION_UNTIL.map((key) => ({
    value: key,
    label: gt(`privacy.retentionUntil.${key}`),
  })),
);

function exceptionUntil(
  exception: PrivacyRetentionException,
): RetentionUntil {
  return isConsentBoundException(exception) ? 'consent_withdrawn' : 'period';
}

/**
 * Switching mode replaces the entry rather than editing it: the two shapes are
 * a union, and a `months` left behind on a consent-bound exception is a number
 * nothing reads and the next author believes.
 */
function setExceptionUntil(
  index: number,
  until: RetentionUntil,
) {
  const retention = ensureRetention();
  const current = retention.exceptions[index];
  if (!current) {
    return;
  }

  // Normalised to null rather than carried across as-is: an explicit
  // undefined is not assignable to an optional property under
  // exactOptionalPropertyTypes, and both spellings mean the same absence.
  const scope = current.scope;
  const label = current.label ?? null;
  const reason = current.reason ?? null;

  retention.exceptions[index] =
    until === 'consent_withdrawn'
      ? { scope, label, reason, until }
      : { scope, label, reason, months: 120, anchor: retention.anchor };
}

const consentPurposeKeys = computed(
  () =>
    new Set(
      content.value.purposes
        .filter((purpose) => purpose.legalBasis === 'consent')
        .map((purpose) => purpose.key),
    ),
);

/**
 * Mirrors the `retention_exception_consent_basis` gap so the author sees it on
 * the field that causes it, rather than only as a line in the summary.
 */
function consentScopeInvalid(exception: PrivacyRetentionException): boolean {
  return (
    isConsentBoundException(exception) &&
    !consentPurposeKeys.value.has(exception.scope)
  );
}

function removeException(index: number) {
  ensureRetention().exceptions.splice(index, 1);
}

const hasDpo = computed({
  get: () => content.value.dpo !== null,
  set: (on: boolean) => {
    content.value.dpo = on ? { name: '', email: '' } : null;
  },
});

const hasAutomatedDetails = computed(
  () =>
    !privacyNoticeCompleteness(content.value).gaps.includes(
      'automated_details',
    ),
);
</script>

<i18n lang="yaml" locale="en">
field:
  retentionMonths: 'Months'
  retentionAnchor: 'Counted from'
  transfersEnabled: 'Data is transferred outside the EEA'
  transferCountries: 'Destination countries'
  transferCountriesHint: 'Type a country code and press Enter'
  transferSafeguard: 'Safeguard'
  hasDpo: 'We have a data protection officer'
  dpoName: 'Name'
  dpoEmail: 'Email'
  automated: 'We use automated decision-making or profiling'
  automatedDetails: 'Explain the logic and its consequences'
  automatedDetailsHint: 'Art. 13(2)(f) requires meaningful information about the logic involved and what it means for the person.'
retention:
  exceptions:
    title: 'Anything you keep longer?'
    hint: 'Most camps keep everything for the one period above and can skip this. Add an entry only where the law or a real need says otherwise.'
    scope: 'What it covers'
    until: 'How long'
    consentScopeError: 'Pick a purpose whose legal basis is consent, or choose a fixed period.'
    own: 'Something else…'
    label: 'What it covers'
    reason: 'Why (optional)'
    add: 'Add an exception'
action:
  remove: 'Remove'
</i18n>

<i18n lang="yaml" locale="de">
field:
  retentionMonths: 'Monate'
  retentionAnchor: 'Gerechnet ab'
  transfersEnabled: 'Daten werden außerhalb des EWR übermittelt'
  transferCountries: 'Zielländer'
  transferCountriesHint: 'Ländercode eingeben und Enter drücken'
  transferSafeguard: 'Garantie'
  hasDpo: 'Datenschutzbeauftragte Person vorhanden'
  dpoName: 'Name'
  dpoEmail: 'E-Mail'
  automated: 'Automatisierte Entscheidungsfindung oder Profiling findet statt'
  automatedDetails: 'Logik und Folgen erläutern'
  automatedDetailsHint: 'Art. 13 Abs. 2 lit. f DSGVO verlangt aussagekräftige Informationen über die Logik und darüber, was sie für die betroffene Person bedeutet.'
retention:
  exceptions:
    title: 'Wird etwas länger gespeichert?'
    hint: 'Die meisten Freizeiten speichern alles für die eine Frist oben und können das hier überspringen. Ergänze nur, wo das Gesetz oder ein echter Bedarf etwas anderes verlangt.'
    scope: 'Wofür es gilt'
    until: 'Wie lange'
    consentScopeError: 'Wähle einen Zweck, der auf einer Einwilligung beruht, oder eine feste Dauer.'
    own: 'Etwas anderes…'
    label: 'Wofür es gilt'
    reason: 'Warum (optional)'
    add: 'Ausnahme hinzufügen'
action:
  remove: 'Entfernen'
</i18n>

<i18n lang="yaml" locale="fr">
field:
  retentionMonths: 'Mois'
  retentionAnchor: 'À compter de'
  transfersEnabled: "Les données sont transférées hors de l'EEE"
  transferCountries: 'Pays de destination'
  transferCountriesHint: 'Saisissez un code pays puis appuyez sur Entrée'
  transferSafeguard: 'Garantie'
  hasDpo: 'Nous avons un délégué à la protection des données'
  dpoName: 'Nom'
  dpoEmail: 'E-mail'
  automated: 'Nous utilisons la décision automatisée ou le profilage'
  automatedDetails: 'Expliquer la logique et ses conséquences'
  automatedDetailsHint: "L'art. 13, § 2, f, RGPD exige des informations utiles sur la logique sous-jacente et sur ce qu'elle implique pour la personne."
retention:
  exceptions:
    title: 'Conservez-vous quelque chose plus longtemps ?'
    hint: "La plupart des séjours conservent tout pendant la durée unique ci-dessus et peuvent passer cette étape. N'ajoutez une entrée que si la loi ou un besoin réel l'impose."
    scope: 'Ce que cela couvre'
    until: 'Combien de temps'
    consentScopeError: 'Choisissez une finalité fondée sur le consentement, ou une durée déterminée.'
    own: 'Autre chose…'
    label: 'Ce que cela couvre'
    reason: 'Pourquoi (facultatif)'
    add: 'Ajouter une exception'
action:
  remove: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="cs">
field:
  retentionMonths: 'Měsíců'
  retentionAnchor: 'Počítáno od'
  transfersEnabled: 'Údaje se předávají mimo EHP'
  transferCountries: 'Cílové země'
  transferCountriesHint: 'Zadej kód země a stiskni Enter'
  transferSafeguard: 'Záruka'
  hasDpo: 'Máme pověřence pro ochranu osobních údajů'
  dpoName: 'Jméno'
  dpoEmail: 'E-mail'
  automated: 'Používáme automatizované rozhodování nebo profilování'
  automatedDetails: 'Vysvětli logiku a její důsledky'
  automatedDetailsHint: 'Čl. 13 odst. 2 písm. f) GDPR vyžaduje smysluplné informace o použitém postupu a o tom, co znamená pro danou osobu.'
retention:
  exceptions:
    title: 'Uchováváte něco déle?'
    hint: 'Většina táborů uchovává vše po jednu dobu uvedenou výše a tohle může přeskočit. Přidej záznam jen tam, kde to vyžaduje zákon nebo skutečná potřeba.'
    scope: 'Čeho se týká'
    until: 'Jak dlouho'
    consentScopeError: 'Vyber účel, který stojí na souhlasu, nebo zvol pevně danou dobu.'
    own: 'Něco jiného…'
    label: 'Čeho se týká'
    reason: 'Proč (volitelné)'
    add: 'Přidat výjimku'
action:
  remove: 'Odebrat'
</i18n>

<i18n lang="yaml" locale="pl">
field:
  retentionMonths: 'Miesiące'
  retentionAnchor: 'Liczone od'
  transfersEnabled: 'Dane są przekazywane poza EOG'
  transferCountries: 'Kraje docelowe'
  transferCountriesHint: 'Wpisz kod kraju i naciśnij Enter'
  transferSafeguard: 'Zabezpieczenie'
  hasDpo: 'Mamy inspektora ochrony danych'
  dpoName: 'Imię i nazwisko'
  dpoEmail: 'E-mail'
  automated: 'Stosujemy zautomatyzowane podejmowanie decyzji lub profilowanie'
  automatedDetails: 'Wyjaśnij logikę i jej konsekwencje'
  automatedDetailsHint: 'Art. 13 ust. 2 lit. f RODO wymaga istotnych informacji o zasadach podejmowania decyzji i o tym, co oznaczają dla danej osoby.'
retention:
  exceptions:
    title: 'Czy coś przechowujecie dłużej?'
    hint: 'Większość obozów przechowuje wszystko przez jeden okres podany wyżej i może to pominąć. Dodaj wpis tylko tam, gdzie wymaga tego prawo lub realna potrzeba.'
    scope: 'Czego dotyczy'
    until: 'Jak długo'
    consentScopeError: 'Wybierz cel oparty na zgodzie albo określony czas.'
    own: 'Coś innego…'
    label: 'Czego dotyczy'
    reason: 'Dlaczego (opcjonalnie)'
    add: 'Dodaj wyjątek'
action:
  remove: 'Usuń'
</i18n>

<style lang="scss" scoped>
$field-max: 32rem;
$field-max-narrow: 28rem;
$indent-toggle: 2.75rem;

.retention-baseline {
  max-width: $field-max;
}

// Short rows of numbers: sprawling them across the page makes several of them
// hard to compare, and the delete button ends up far from what it deletes.
.retention-exceptions {
  max-width: 44rem;
}

.retention-exception {
  &__remove {
    margin-top: 0.25rem;
  }

  &__field :deep(.q-field) {
    max-width: $field-max-narrow;
  }
}

// Line a switch's own fields up under its label, so the grouping is visible.
.toggle-fields {
  margin-left: $indent-toggle;
  margin-top: 0.5rem;
}

.inset-card {
  background-color: var(--md3-surface-container-low);
  border-radius: 12px;
}
</style>
