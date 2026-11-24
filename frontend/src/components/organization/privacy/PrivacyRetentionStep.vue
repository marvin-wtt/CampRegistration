<template>
  <div>
    <!-- Each period reads as a sentence: the number with its unit in the
       field, "after the event ends" beside it. Inside the field as a suffix
       the long phrase squeezed the number out of sight. -->
    <div class="retention-period">
      <div class="text-body2 text-weight-medium">
        {{ t('retention.baseline.title') }}
      </div>
      <div class="text-caption text-on-surface-variant q-mb-sm">
        {{ t('retention.baseline.hint') }}
      </div>
      <div class="retention-period__line">
        <q-input
          v-model.number="retentionMonths"
          type="number"
          :aria-label="t('retention.baseline.title')"
          :min="1"
          :max="240"
          :suffix="t('unit.months')"
          dense
          outlined
          rounded
          hide-bottom-space
          :disable="!canEdit"
          :rules="[atLeastOneMonth]"
          lazy-rules
          class="retention-period__input"
        />
        <span class="retention-period__text">{{ t('field.afterEvent') }}</span>
      </div>
    </div>

    <!-- Health and similar answers are only needed around the event, so they
       get a shorter period of their own and their own deletion deadline. -->
    <div class="retention-period q-mt-lg">
      <div class="text-body2 text-weight-medium">
        {{ t('retention.special.title') }}
      </div>
      <div class="text-caption text-on-surface-variant q-mb-sm">
        {{ t('retention.special.hint') }}
      </div>
      <div class="retention-period__line">
        <q-input
          v-model.number="specialWeeks"
          type="number"
          :aria-label="t('retention.special.title')"
          :min="1"
          :max="maxSpecialWeeks"
          :suffix="t('unit.weeks')"
          dense
          outlined
          rounded
          hide-bottom-space
          :disable="!canEdit"
          :error="specialWeeksInvalid"
          :error-message="
            t('retention.special.tooLong', { max: maxSpecialWeeks })
          "
          class="retention-period__input"
        />
        <span class="retention-period__text">{{ t('field.afterEvent') }}</span>
      </div>
    </div>

    <!-- Optional by design: a event with one period never opens this. -->
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
                rounded
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
                rounded
                hide-bottom-space
                :disable="!canEdit"
                class="col-12 col-sm-6"
                @update:model-value="(v) => setExceptionUntil(index, v)"
              />
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

          <!-- For consent-bound data the period is the upper limit, for
             consent that is never withdrawn. -->
          <div class="retention-period__line">
            <span
              v-if="isConsentBoundException(exception)"
              class="retention-period__text"
            >
              {{ t('retention.exceptions.atMost') }}
            </span>
            <q-input
              v-model.number="exception.months"
              type="number"
              :aria-label="t('retention.exceptions.until')"
              :min="1"
              :max="600"
              :suffix="t('unit.months')"
              dense
              outlined
              rounded
              hide-bottom-space
              :disable="!canEdit"
              :rules="[atLeastOneMonth]"
              lazy-rules
              class="retention-period__input"
            />
            <span class="retention-period__text">
              {{ t('field.afterEvent') }}
            </span>
          </div>

          <translated-input
            v-if="isCustomKey(exception.scope)"
            :model-value="exception.label"
            :label="t('retention.exceptions.label')"
            :locales
            default-untranslated
            dense
            outlined
            rounded
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
            rounded
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
          <!-- Codes are stored lowercase, like every country code; shown in
               upper case, as written. -->
          <q-select
            :model-value="content.thirdCountryTransfers.countries"
            :label="t('field.transferCountries')"
            :hint="t('field.transferCountriesHint')"
            use-input
            use-chips
            multiple
            new-value-mode="add-unique"
            hide-dropdown-icon
            dense
            outlined
            rounded
            :disable="!canEdit"
            :rules="[
              (countries: string[]) =>
                countries.length > 0 || t('missing.countries'),
            ]"
            lazy-rules
            hide-bottom-space
            @update:model-value="
              (countries: string[]) =>
                (content.thirdCountryTransfers.countries = [
                  ...new Set(
                    countries.map((code) => code.trim().toLowerCase()),
                  ),
                ])
            "
          >
            <template #selected-item="scope">
              <q-chip
                :tabindex="scope.tabindex"
                :removable="canEdit"
                dense
                @remove="scope.removeAtIndex(scope.index)"
              >
                {{ String(scope.opt).toUpperCase() }}
              </q-chip>
            </template>
          </q-select>
          <q-select
            v-model="content.thirdCountryTransfers.safeguard"
            :options="safeguardOptions"
            :label="t('field.transferSafeguard')"
            emit-value
            map-options
            dense
            outlined
            rounded
            :disable="!canEdit"
            :rules="[
              (safeguard: unknown) => !!safeguard || t('missing.safeguard'),
            ]"
            lazy-rules
            hide-bottom-space
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
            :hint="
              t('field.automatedDetailsHint', {
                citation: cite('automatedInformation'),
              })
            "
            :locales
            always
            type="textarea"
            dense
            outlined
            rounded
            :disable="!canEdit"
            :rules="[
              () => hasAutomatedDetails || t('missing.automatedDetails'),
            ]"
            lazy-rules
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
  DEFAULT_SPECIAL_CATEGORY_WEEKS,
  RETENTION_UNTIL,
  TRANSFER_SAFEGUARDS,
  customKey,
  isConsentBoundException,
  isCustomKey,
  maxSpecialCategoryWeeks,
  nextCustomKey,
  privacyNoticeCompleteness,
  retentionExceptions,
  type PrivacyNoticeContent,
  type PrivacyRetentionException,
  type RetentionUntil,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrivacyLabels } from '@/composables/privacyLabels';
import { APP_LOCALES as locales } from '@/i18n/locales';

const content = defineModel<PrivacyNoticeContent>({ required: true });

defineProps<{ canEdit: boolean }>();

const { t } = useI18n();
// The catalogue vocabulary is global: the same words appear in the notice a
// registrant reads.
const { t: gt } = useI18n({ useScope: 'global' });
const { cite, safeguardLabel } = usePrivacyLabels();
const { to } = useObjectTranslation();

function asTranslatable(value: unknown): Translatable | null {
  return (value ?? null) as Translatable | null;
}

const safeguardOptions = computed(() =>
  TRANSFER_SAFEGUARDS.map((key) => ({
    value: key,
    label: safeguardLabel(key),
  })),
);

const retentionMonths = computed({
  get: () => content.value.retention?.months ?? 24,
  // A cleared number field yields '', which must not reach the stored notice.
  set: (months: number | string) => {
    ensureRetention().months = Number(months) || 0;
  },
});

const maxSpecialWeeks = computed(() =>
  maxSpecialCategoryWeeks(retentionMonths.value),
);

function ensureSpecial() {
  const retention = ensureRetention();
  retention.specialCategories ??= { weeks: DEFAULT_SPECIAL_CATEGORY_WEEKS };
  return retention.specialCategories;
}

const specialWeeks = computed({
  get: () => content.value.retention?.specialCategories?.weeks ?? 0,
  set: (weeks: number | string) => {
    ensureSpecial().weeks = Number(weeks) || 0;
  },
});

const specialWeeksInvalid = computed(() =>
  privacyNoticeCompleteness(content.value).gaps.includes(
    'special_category_retention',
  ),
);

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
  content.value.retention ??= { months: 24, exceptions: [] };
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
  });
}

const untilOptions = computed(() =>
  RETENTION_UNTIL.map((key) => ({
    value: key,
    label: gt(`privacy.retentionUntil.${key}`),
  })),
);

function exceptionUntil(exception: PrivacyRetentionException): RetentionUntil {
  return isConsentBoundException(exception) ? 'consent_withdrawn' : 'period';
}

/**
 * Switching mode replaces the entry rather than editing it: the two shapes are
 * a union, and a `months` left behind on a consent-bound exception is a number
 * nothing reads and the next author believes.
 */
function setExceptionUntil(index: number, until: RetentionUntil) {
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
      ? { scope, label, reason, until, months: 60 }
      : { scope, label, reason, months: 120 };
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
// Empty fields are checked once left, not the moment a switch or a new row
// reveals them; invalid values (too many weeks, a wrong scope) show at once.
function atLeastOneMonth(months: number | null | undefined) {
  return (months ?? 0) > 0 || t('missing.months');
}

function consentScopeInvalid(exception: PrivacyRetentionException): boolean {
  return (
    isConsentBoundException(exception) &&
    !consentPurposeKeys.value.has(exception.scope)
  );
}

function removeException(index: number) {
  ensureRetention().exceptions.splice(index, 1);
}

const hasAutomatedDetails = computed(
  () =>
    !privacyNoticeCompleteness(content.value).gaps.includes(
      'automated_details',
    ),
);
</script>

<i18n lang="yaml" locale="en">
unit:
  months: 'months'
  weeks: 'weeks'
field:
  afterEvent: 'after the event ends'
  transfersEnabled: 'Data is transferred outside the EEA'
  transferCountries: 'Destination countries'
  transferCountriesHint: 'Type a country code and press Enter'
  transferSafeguard: 'Safeguard'
  automated: 'We use automated decision-making or profiling'
  automatedDetails: 'Explain the logic and its consequences'
  automatedDetailsHint: 'Meaningful information about the logic involved and what it means for the person is required ({citation}).'
retention:
  baseline:
    title: 'Registration data'
    hint: 'Kept this long after each event, unless something below says otherwise.'
  special:
    title: 'Health and other sensitive details'
    hint: 'Only needed around the event, so deleted well before the rest. Applies whenever an event collects them.'
    tooLong: 'At most {max} weeks, and not longer than the period above.'
  exceptions:
    title: 'Anything you keep longer?'
    hint: 'Most events keep everything for the one period above and can skip this. Add an entry only where the law or a real need says otherwise.'
    scope: 'What it covers'
    until: 'How long'
    atMost: 'at most'
    consentScopeError: 'Pick a purpose whose legal basis is consent, or choose a fixed period.'
    own: 'Something else…'
    label: 'What it covers'
    reason: 'Why (optional)'
    add: 'Add an exception'
action:
  remove: 'Remove'
missing:
  months: 'At least one month'
  countries: 'Add at least one country'
  safeguard: 'Choose a safeguard'
  automatedDetails: 'Explain the logic and its consequences'
</i18n>

<i18n lang="yaml" locale="de">
unit:
  months: 'Monate'
  weeks: 'Wochen'
field:
  afterEvent: 'nach Ende der Veranstaltung'
  transfersEnabled: 'Daten werden außerhalb des EWR übermittelt'
  transferCountries: 'Zielländer'
  transferCountriesHint: 'Ländercode eingeben und Enter drücken'
  transferSafeguard: 'Garantie'
  automated: 'Automatisierte Entscheidungsfindung oder Profiling findet statt'
  automatedDetails: 'Logik und Folgen erläutern'
  automatedDetailsHint: 'Erforderlich sind aussagekräftige Informationen über die Logik und darüber, was sie für die betroffene Person bedeutet ({citation}).'
retention:
  baseline:
    title: 'Anmeldedaten'
    hint: 'So lange nach jeder Veranstaltung gespeichert, sofern unten nichts anderes steht.'
  special:
    title: 'Gesundheitsangaben und andere sensible Daten'
    hint: 'Werden nur rund um die Veranstaltung gebraucht und deshalb deutlich früher gelöscht als der Rest. Gilt, sobald eine Veranstaltung sie erhebt.'
    tooLong: 'Höchstens {max} Wochen und nicht länger als der Zeitraum oben.'
  exceptions:
    title: 'Wird etwas länger gespeichert?'
    hint: 'Die meisten Veranstaltungen speichern alles für die eine Frist oben und können das hier überspringen. Ergänze nur, wo das Gesetz oder ein echter Bedarf etwas anderes verlangt.'
    scope: 'Wofür es gilt'
    until: 'Wie lange'
    atMost: 'höchstens'
    consentScopeError: 'Wähle einen Zweck, der auf einer Einwilligung beruht, oder eine feste Dauer.'
    own: 'Etwas anderes…'
    label: 'Wofür es gilt'
    reason: 'Warum (optional)'
    add: 'Ausnahme hinzufügen'
action:
  remove: 'Entfernen'
missing:
  months: 'Mindestens ein Monat'
  countries: 'Gib mindestens ein Land an'
  safeguard: 'Wähle eine Garantie'
  automatedDetails: 'Erläutere Logik und Folgen'
</i18n>

<i18n lang="yaml" locale="fr">
unit:
  months: 'mois'
  weeks: 'semaines'
field:
  afterEvent: 'après la fin de l’événement'
  transfersEnabled: "Les données sont transférées hors de l'EEE"
  transferCountries: 'Pays de destination'
  transferCountriesHint: 'Saisissez un code pays puis appuyez sur Entrée'
  transferSafeguard: 'Garantie'
  automated: 'Nous utilisons la décision automatisée ou le profilage'
  automatedDetails: 'Expliquer la logique et ses conséquences'
  automatedDetailsHint: "Des informations utiles sur la logique sous-jacente et sur ce qu'elle implique pour la personne sont exigées ({citation})."
retention:
  baseline:
    title: 'Données d’inscription'
    hint: 'Conservées aussi longtemps après chaque événement, sauf indication contraire ci-dessous.'
  special:
    title: 'Données de santé et autres données sensibles'
    hint: 'Nécessaires uniquement autour de l’événement, elles sont donc supprimées bien avant le reste. S’applique dès qu’un événement les collecte.'
    tooLong: 'Au plus {max} semaines, et pas plus longtemps que la durée ci-dessus.'
  exceptions:
    title: 'Conservez-vous quelque chose plus longtemps ?'
    hint: "La plupart des événements conservent tout pendant la durée unique ci-dessus et peuvent passer cette étape. N'ajoutez une entrée que si la loi ou un besoin réel l'impose."
    scope: 'Ce que cela couvre'
    until: 'Combien de temps'
    atMost: 'au plus'
    consentScopeError: 'Choisissez une finalité fondée sur le consentement, ou une durée déterminée.'
    own: 'Autre chose…'
    label: 'Ce que cela couvre'
    reason: 'Pourquoi (facultatif)'
    add: 'Ajouter une exception'
action:
  remove: 'Supprimer'
missing:
  months: 'Au moins un mois'
  countries: 'Ajoute au moins un pays'
  safeguard: 'Choisis une garantie'
  automatedDetails: 'Explique la logique et ses conséquences'
</i18n>

<i18n lang="yaml" locale="cs">
unit:
  months: 'měsíců'
  weeks: 'týdnů'
field:
  afterEvent: 'po skončení akce'
  transfersEnabled: 'Údaje se předávají mimo EHP'
  transferCountries: 'Cílové země'
  transferCountriesHint: 'Zadej kód země a stiskni Enter'
  transferSafeguard: 'Záruka'
  automated: 'Používáme automatizované rozhodování nebo profilování'
  automatedDetails: 'Vysvětli logiku a její důsledky'
  automatedDetailsHint: 'Vyžadují se smysluplné informace o použitém postupu a o tom, co znamená pro danou osobu ({citation}).'
retention:
  baseline:
    title: 'Údaje z přihlášek'
    hint: 'Uchovávají se po tuto dobu po každé akci, pokud níže není uvedeno jinak.'
  special:
    title: 'Zdravotní a další citlivé údaje'
    hint: 'Jsou potřeba jen kolem akce, proto se mažou mnohem dříve než zbytek. Platí, jakmile je akce shromažďuje.'
    tooLong: 'Nejvýše {max} týdnů a ne déle než doba uvedená výše.'
  exceptions:
    title: 'Uchováváte něco déle?'
    hint: 'Většina akcí uchovává vše po jednu dobu uvedenou výše a tohle může přeskočit. Přidej záznam jen tam, kde to vyžaduje zákon nebo skutečná potřeba.'
    scope: 'Čeho se týká'
    until: 'Jak dlouho'
    atMost: 'nejvýše'
    consentScopeError: 'Vyber účel, který stojí na souhlasu, nebo zvol pevně danou dobu.'
    own: 'Něco jiného…'
    label: 'Čeho se týká'
    reason: 'Proč (volitelné)'
    add: 'Přidat výjimku'
action:
  remove: 'Odebrat'
missing:
  months: 'Alespoň jeden měsíc'
  countries: 'Přidej alespoň jednu zemi'
  safeguard: 'Vyber záruku'
  automatedDetails: 'Vysvětli logiku a její důsledky'
</i18n>

<i18n lang="yaml" locale="pl">
unit:
  months: 'miesięcy'
  weeks: 'tygodni'
field:
  afterEvent: 'po zakończeniu wydarzenia'
  transfersEnabled: 'Dane są przekazywane poza EOG'
  transferCountries: 'Kraje docelowe'
  transferCountriesHint: 'Wpisz kod kraju i naciśnij Enter'
  transferSafeguard: 'Zabezpieczenie'
  automated: 'Stosujemy zautomatyzowane podejmowanie decyzji lub profilowanie'
  automatedDetails: 'Wyjaśnij logikę i jej konsekwencje'
  automatedDetailsHint: 'Wymagane są istotne informacje o zasadach podejmowania decyzji i o tym, co oznaczają dla danej osoby ({citation}).'
retention:
  baseline:
    title: 'Dane zgłoszeń'
    hint: 'Przechowywane przez ten czas po każdym wydarzeniu, chyba że poniżej podano inaczej.'
  special:
    title: 'Dane o zdrowiu i inne dane wrażliwe'
    hint: 'Potrzebne tylko w związku z wydarzeniem, dlatego usuwane znacznie wcześniej niż reszta. Obowiązuje, gdy wydarzenie je zbiera.'
    tooLong: 'Najwyżej {max} tygodni i nie dłużej niż okres powyżej.'
  exceptions:
    title: 'Czy coś przechowujecie dłużej?'
    hint: 'Większość wydarzeń przechowuje wszystko przez jeden okres podany wyżej i może to pominąć. Dodaj wpis tylko tam, gdzie wymaga tego prawo lub realna potrzeba.'
    scope: 'Czego dotyczy'
    until: 'Jak długo'
    atMost: 'najwyżej'
    consentScopeError: 'Wybierz cel oparty na zgodzie albo określony czas.'
    own: 'Coś innego…'
    label: 'Czego dotyczy'
    reason: 'Dlaczego (opcjonalnie)'
    add: 'Dodaj wyjątek'
action:
  remove: 'Usuń'
missing:
  months: 'Co najmniej jeden miesiąc'
  countries: 'Dodaj co najmniej jeden kraj'
  safeguard: 'Wybierz zabezpieczenie'
  automatedDetails: 'Wyjaśnij logikę i jej konsekwencje'
</i18n>

<style lang="scss" scoped>
$field-max: 32rem;
$field-max-narrow: 28rem;
$indent-toggle: 2.75rem;

.retention-period {
  max-width: $field-max;

  &__line {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;
  }

  &__input {
    width: 9rem;
  }

  // Centred on a dense field's 40px height, and kept there when an error
  // message grows the field below it.
  &__text {
    line-height: 40px;
  }
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
