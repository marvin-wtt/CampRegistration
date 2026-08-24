<template>
  <!--
    A rail of outlined pills rather than a panel of form fields: it speaks the
    same chip language as the landing page, stays one line deep, and each pill
    reads as a sentence ("Anytime", "Germany", "Age 12") instead of an empty
    input waiting to be filled in.

    It scrolls away with the results on purpose — pinned, it reads as a band
    hovering over the middle of the page, since the content column is narrower
    than the viewport.
  -->
  <div class="event-filters">
    <!-- The search box lives in the hero, so once it scrolls away this is the
         only thing telling the visitor their results are narrowed. -->
    <div
      v-if="search"
      class="filter-chip filter-chip--active"
      data-test="events-active-search"
    >
      <span class="filter-chip__body filter-chip__body--static">
        <q-icon
          name="search"
          size="16px"
        />
        <span class="filter-chip__label">{{ search }}</span>
      </span>

      <button
        type="button"
        class="filter-chip__clear"
        :aria-label="t('clear_one', { filter: t('search') })"
        data-test="events-clear-search"
        @click="search = ''"
      >
        <q-icon
          name="close"
          size="16px"
        />
      </button>
    </div>

    <!-- Dates -->
    <div
      class="filter-chip"
      :class="{ 'filter-chip--active': hasDates }"
    >
      <button
        type="button"
        class="filter-chip__body"
        aria-haspopup="true"
        data-test="events-filter-dates"
      >
        <q-icon
          name="event"
          size="16px"
        />
        <span class="filter-chip__label">{{ dateLabel }}</span>
        <q-icon
          v-if="!hasDates"
          name="expand_more"
          size="16px"
          class="filter-chip__caret"
        />

        <!--
          Presets sit above the calendar rather than in QDate's own footer
          slot: most visitors pick a season and are done, so the picker is the
          fallback rather than the main act — and the slot renders below the
          calendar, which buried them.
        -->
        <q-popup-proxy
          class="filter-menu filter-menu--date"
          transition-show="jump-down"
          transition-hide="jump-up"
          :offset="[0, 8]"
          no-route-dismiss
        >
          <div class="filter-pop filter-pop--date">
            <div class="filter-pop__title">{{ t('dates') }}</div>

            <div class="filter-pop__presets">
              <button
                v-for="preset in EVENT_DATE_PRESETS"
                :key="preset"
                type="button"
                class="preset-chip"
                :class="{ 'preset-chip--active': preset === activePreset }"
                :aria-pressed="preset === activePreset"
                :data-test="`events-preset-${preset}`"
                @click="togglePreset(preset)"
              >
                {{ t(`preset.${preset}`) }}
              </button>
            </div>

            <!-- `minimal` drops the picker's headline: the chip already
                 spells the range out, and the header repeats it in 32px. -->
            <q-date
              v-model="dayRange"
              mask="YYYY-MM-DD"
              range
              minimal
            />

            <div class="filter-pop__actions">
              <m-btn
                text
                no-caps
                :label="t('any_dates')"
                :disable="!hasDates"
                @click="clearDates"
              />
              <m-btn
                v-close-popup
                text
                primary
                no-caps
                :label="t('done')"
              />
            </div>
          </div>
        </q-popup-proxy>
      </button>

      <button
        v-if="hasDates"
        type="button"
        class="filter-chip__clear"
        :aria-label="t('clear_one', { filter: t('dates') })"
        data-test="events-clear-dates"
        @click="clearDates"
      >
        <q-icon
          name="close"
          size="16px"
        />
      </button>
    </div>

    <!-- Countries -->
    <div
      class="filter-chip"
      :class="{ 'filter-chip--active': selectedCountries.length > 0 }"
    >
      <button
        type="button"
        class="filter-chip__body"
        aria-haspopup="true"
        data-test="events-filter-countries"
      >
        <q-icon
          name="public"
          size="16px"
        />
        <span class="filter-chip__label">{{ countriesLabel }}</span>
        <q-icon
          v-if="selectedCountries.length === 0"
          name="expand_more"
          size="16px"
          class="filter-chip__caret"
        />

        <q-menu
          class="filter-menu"
          :offset="[0, 8]"
          no-route-dismiss
        >
          <div class="filter-pop">
            <div class="filter-pop__title">{{ t('countries') }}</div>

            <q-list class="filter-pop__list">
              <q-item
                v-for="code in EVENT_COUNTRIES"
                :key="code"
                clickable
                class="filter-item"
                :class="{
                  'filter-item--selected': selectedCountries.includes(code),
                }"
                role="menuitemcheckbox"
                :aria-checked="selectedCountries.includes(code)"
                :data-test="`events-country-${code}`"
                @click="toggleCountry(code)"
              >
                <q-item-section avatar>
                  <country-icon :country="code" />
                </q-item-section>
                <q-item-section>{{ countryName(code, locale) }}</q-item-section>
                <!-- A checkbox rather than a lone tick: it is the only
                     marker on the row, so the unselected state has to show. -->
                <q-item-section side>
                  <q-icon
                    :name="
                      selectedCountries.includes(code)
                        ? 'check_box'
                        : 'check_box_outline_blank'
                    "
                    size="20px"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="filter-pop__actions">
              <m-btn
                text
                no-caps
                :label="t('anywhere')"
                :disable="selectedCountries.length === 0"
                @click="countries = undefined"
              />
              <m-btn
                v-close-popup
                text
                primary
                no-caps
                :label="t('done')"
              />
            </div>
          </div>
        </q-menu>
      </button>

      <button
        v-if="selectedCountries.length > 0"
        type="button"
        class="filter-chip__clear"
        :aria-label="t('clear_one', { filter: t('countries') })"
        data-test="events-clear-countries"
        @click="countries = undefined"
      >
        <q-icon
          name="close"
          size="16px"
        />
      </button>
    </div>

    <!-- Age -->
    <div
      class="filter-chip"
      :class="{ 'filter-chip--active': age != null }"
    >
      <button
        type="button"
        class="filter-chip__body"
        aria-haspopup="true"
        data-test="events-filter-age"
      >
        <q-icon
          name="cake"
          size="16px"
        />
        <span class="filter-chip__label">{{ ageLabel }}</span>
        <q-icon
          v-if="age == null"
          name="expand_more"
          size="16px"
          class="filter-chip__caret"
        />

        <q-menu
          class="filter-menu"
          :offset="[0, 8]"
          no-route-dismiss
        >
          <div class="filter-pop">
            <div class="filter-pop__title">{{ t('age_title') }}</div>

            <!--
              A stepper rather than a bare number field: an age is picked one
              year at a time, and `type=number` alone offers nothing but the
              browser's own spin buttons, which are a few pixels tall and
              cannot be themed. The field stays typeable for everything else;
              clearing lives on the chip and in the footer, not here.
            -->
            <div class="filter-pop__body">
              <div class="age-stepper">
                <button
                  type="button"
                  class="age-step"
                  :disabled="age != null && age <= MIN_AGE"
                  :aria-label="t('age_decrease')"
                  @click="stepAge(-1)"
                >
                  <q-icon
                    name="remove"
                    size="20px"
                  />
                </button>

                <q-input
                  :model-value="ageInput"
                  class="age-stepper__field"
                  type="number"
                  inputmode="numeric"
                  :min="MIN_AGE"
                  :max="MAX_AGE"
                  :placeholder="t('any_age')"
                  :aria-label="t('age_title')"
                  input-class="text-center"
                  borderless
                  dense
                  hide-bottom-space
                  autofocus
                  @update:model-value="onAgeInput"
                />

                <button
                  type="button"
                  class="age-step"
                  :disabled="age != null && age >= MAX_AGE"
                  :aria-label="t('age_increase')"
                  @click="stepAge(1)"
                >
                  <q-icon
                    name="add"
                    size="20px"
                  />
                </button>
              </div>

              <p class="filter-pop__hint">{{ t('age_hint') }}</p>
            </div>

            <div class="filter-pop__actions">
              <m-btn
                text
                no-caps
                :label="t('any_age')"
                :disable="age == null"
                @click="age = undefined"
              />
              <m-btn
                v-close-popup
                text
                primary
                no-caps
                :label="t('done')"
              />
            </div>
          </div>
        </q-menu>
      </button>

      <button
        v-if="age != null"
        type="button"
        class="filter-chip__clear"
        :aria-label="t('clear_one', { filter: t('age_title') })"
        data-test="events-clear-age"
        @click="age = undefined"
      >
        <q-icon
          name="close"
          size="16px"
        />
      </button>
    </div>

    <button
      v-if="activeCount > 0"
      type="button"
      class="filter-clear"
      data-test="events-filter-clear"
      @click="emit('clear')"
    >
      {{ t('clear') }}
    </button>

    <span class="event-filters__count">
      <slot name="status" />
    </span>

    <!-- Sorting is not a filter, so it sits apart from the rail — and it can
         never be cleared, so it is the one chip without a ✕. -->
    <div class="filter-chip filter-chip--sort">
      <button
        type="button"
        class="filter-chip__body"
        aria-haspopup="true"
        :aria-label="t('sort_label')"
        data-test="events-filter-sort"
      >
        <q-icon
          name="swap_vert"
          size="16px"
        />
        <span class="filter-chip__label">{{ t(`sort.${sort}`) }}</span>
        <q-icon
          name="expand_more"
          size="16px"
          class="filter-chip__caret"
        />

        <!-- Right-aligned under its chip, which is the last thing on the
             rail: a start-anchored menu would hang off the content column. -->
        <q-menu
          class="filter-menu"
          anchor="bottom end"
          self="top end"
          :offset="[0, 8]"
          no-route-dismiss
        >
          <div class="filter-pop">
            <div class="filter-pop__title">{{ t('sort_label') }}</div>

            <q-list class="filter-pop__list filter-pop__list--flush">
              <q-item
                v-for="option in EVENT_SORT_OPTIONS"
                :key="option"
                v-close-popup
                clickable
                class="filter-item"
                :class="{ 'filter-item--selected': option === sort }"
                role="menuitemradio"
                :aria-checked="option === sort"
                :data-test="`events-sort-${option}`"
                @click="sort = option"
              >
                <q-item-section>{{ t(`sort.${option}`) }}</q-item-section>
                <q-item-section side>
                  <q-icon
                    v-if="option === sort"
                    name="check"
                    size="20px"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-menu>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { date as dateUtil } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { countryName } from '@/utils/countries';
import {
  EVENT_COUNTRIES,
  EVENT_DATE_PRESETS,
  EVENT_SORT_OPTIONS,
  datePresetRange,
  dayRangeToIso,
  isoToDay,
  matchingDatePreset,
  type EventDatePreset,
  type EventSortOption,
} from '@/components/events/filters';

const emit = defineEmits<{
  clear: [];
}>();

// Nullable: the hero's clearable search input emits null when cleared.
const search = defineModel<string | null>('search', { default: '' });
const countries = defineModel<string[] | undefined>('countries');
const age = defineModel<number | undefined>('age');
// ISO datetime strings, which is what EventQuery.startAt/endAt expect.
const startAt = defineModel<string | undefined>('startAt');
const endAt = defineModel<string | undefined>('endAt');
const sort = defineModel<EventSortOption>('sort', { required: true });

const { t, locale } = useI18n();

/* ------------------------------------------------------------------ dates */

const hasDates = computed<boolean>(
  () => startAt.value !== undefined || endAt.value !== undefined,
);

const activePreset = computed<EventDatePreset | undefined>(() =>
  matchingDatePreset(startAt.value, endAt.value),
);

/**
 * QDate speaks plain days; the query speaks instants. The setter also has to
 * take a bare string — that is what QDate emits when a range starts and ends
 * on the same day.
 */
const dayRange = computed<{ from: string; to: string } | string | null>({
  get: () =>
    startAt.value && endAt.value
      ? { from: isoToDay(startAt.value), to: isoToDay(endAt.value) }
      : null,
  set: (value) => {
    if (value === null) {
      clearDates();
      return;
    }

    // QDate hands back a bare day when the range starts and ends on one day.
    const range =
      typeof value === 'string'
        ? dayRangeToIso(value, value)
        : dayRangeToIso(value.from, value.to);

    startAt.value = range.startAt;
    endAt.value = range.endAt;
  },
});

function togglePreset(preset: EventDatePreset): void {
  if (preset === activePreset.value) {
    clearDates();
    return;
  }

  const range = datePresetRange(preset);
  startAt.value = range.startAt;
  endAt.value = range.endAt;
}

function clearDates(): void {
  startAt.value = undefined;
  endAt.value = undefined;
}

const dateLabel = computed<string>(() => {
  if (activePreset.value) {
    return t(`preset.${activePreset.value}`);
  }

  const from = formatDay(startAt.value);
  const to = formatDay(endAt.value);

  if (from && to) {
    return from === to ? from : `${from} – ${to}`;
  }

  return from ?? to ?? t('any_dates');
});

function formatDay(iso?: string): string | undefined {
  return iso ? dateUtil.formatDate(new Date(iso), 'D MMM') : undefined;
}

/* -------------------------------------------------------------- countries */

const selectedCountries = computed<string[]>(() => countries.value ?? []);

function toggleCountry(code: string): void {
  const next = selectedCountries.value.includes(code)
    ? selectedCountries.value.filter((value) => value !== code)
    : [...selectedCountries.value, code];

  countries.value = next.length > 0 ? next : undefined;
}

const countriesLabel = computed<string>(() => {
  const [first] = selectedCountries.value;

  if (first === undefined) {
    return t('anywhere');
  }

  return selectedCountries.value.length === 1
    ? countryName(first, locale.value)
    : t('countries_selected', { count: selectedCountries.value.length });
});

/* -------------------------------------------------------------------- age */

const MIN_AGE = 0;
const MAX_AGE = 99;
/** Where the stepper starts from when no age has been picked yet. */
const DEFAULT_AGE = 12;

const ageInput = computed<string>(() =>
  age.value == null ? '' : String(age.value),
);

/**
 * Deliberately undebounced. A debounced `v-model` on a controlled number field
 * cannot be typed into two digits at a time: the first keystroke's delayed
 * write lands back on the input and overwrites the second one, so "12" snaps
 * back to "1". Committing every keystroke straight away keeps the field and
 * the model in step.
 */
function onAgeInput(value: string | number | null): void {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value ?? ''), 10);

  age.value = Number.isFinite(parsed)
    ? Math.min(MAX_AGE, Math.max(MIN_AGE, parsed))
    : undefined;
}

/** Stepping out of "any age" lands on a plausible event age, not on zero. */
function stepAge(delta: number): void {
  const base = age.value ?? DEFAULT_AGE - delta;

  age.value = Math.min(MAX_AGE, Math.max(MIN_AGE, base + delta));
}

const ageLabel = computed<string>(() =>
  age.value == null ? t('any_age') : t('age_value', { value: age.value }),
);

/* ----------------------------------------------------------------- active */

const activeCount = computed<number>(
  () =>
    (search.value ? 1 : 0) +
    selectedCountries.value.length +
    (age.value == null ? 0 : 1) +
    (hasDates.value ? 1 : 0),
);
</script>

<style scoped>
.event-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.event-filters__count {
  margin-left: auto;

  color: var(--md3-on-surface-variant);

  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

/*
 * Chips
 *
 * The pill is the wrapper, not the button, because an applied filter carries
 * two targets: the body reopens the popup and the trailing ✕ drops the filter
 * outright. Two sibling buttons keep that honest for the keyboard and for
 * screen readers — a ✕ nested inside the body button would be invalid markup
 * and would still have to fight the popup's own click handler.
 */
.filter-chip {
  display: inline-flex;
  align-items: center;

  max-width: 100%;
  height: 38px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-full, 9999px);

  background: transparent;
  color: var(--md3-on-surface);

  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;

  transition:
    background-color 0.2s
      var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1)),
    border-color 0.2s var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1)),
    color 0.2s var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
}

.filter-chip:hover {
  background: var(--md3-surface-container);
}

.filter-chip--active {
  border-color: transparent;

  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.filter-chip--active:hover {
  background: var(--md3-secondary-container);

  filter: brightness(0.97);
}

.filter-chip__body {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  min-width: 0;
  max-width: 100%;
  height: 100%;
  padding: 0 14px;
  border: none;
  border-radius: inherit;

  background: transparent;
  color: inherit;
  cursor: pointer;

  font: inherit;
}

/* The search chip has no popup behind it — its body is a label, not a control */
.filter-chip__body--static {
  cursor: default;
}

.filter-chip__label {
  overflow: hidden;

  max-width: 22ch;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip__caret {
  margin-right: -4px;

  color: var(--md3-on-surface-variant);
}

.filter-chip--active .filter-chip__caret {
  color: inherit;
}

/* Pulled back into the body's trailing padding so the ✕ sits inside the pill */
.filter-chip__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;

  width: 26px;
  height: 26px;
  margin: 0 5px 0 -10px;
  border: none;
  border-radius: var(--md3-corner-full, 9999px);

  background: transparent;
  color: inherit;
  cursor: pointer;

  transition: background-color 0.2s
    var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
}

.filter-chip__clear:hover {
  background: rgba(var(--md3-on-surface-rgb), 0.12);
}

.filter-chip__body:focus-visible,
.filter-chip__clear:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.filter-clear {
  padding: 0 8px;
  border: none;

  background: transparent;
  color: var(--md3-primary);
  cursor: pointer;

  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.filter-clear:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
  border-radius: var(--md3-corner-small, 8px);
}

/*
 * Popovers
 *
 * Every popup is the same three-part sheet — title, body, actions — so the
 * four chips open into one recognisable thing rather than four.
 *
 * The surface belongs to the sheet rather than to the popup around it: below
 * its 450px breakpoint QPopupProxy swaps the QMenu for a QDialog, whose only
 * pre-painted child is a QCard — an unpainted sheet would sit transparent on
 * the scrim. The menu keeps the matching radius so its elevation still falls
 * around the right shape.
 */
.filter-menu.q-menu {
  padding: 0;
  border-radius: var(--md3-corner-large, 16px);

  background: transparent;
}

.filter-pop {
  display: flex;
  flex-direction: column;

  min-width: 244px;
  border-radius: var(--md3-corner-large, 16px);

  background: var(--md3-surface-container);
}

.filter-pop__title {
  padding: 14px 16px 8px;

  color: var(--md3-on-surface-variant);

  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Rows carry their own 12px inset, so the list only needs a narrow rail —
   a full 16px leaves every hover pill floating in the middle of the sheet. */
.filter-pop__list {
  overflow-y: auto;

  max-height: min(46vh, 320px);
  padding: 0 8px;
}

/* No actions below it, so the list supplies the sheet's bottom padding. */
.filter-pop__list--flush {
  padding-bottom: 8px;
}

.filter-pop__body {
  padding: 0 16px;
}

.filter-pop__hint {
  margin: 8px 2px 0;

  color: var(--md3-on-surface-variant);

  font-size: 0.75rem;
  line-height: 1.4;
}

.filter-pop__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  margin-top: 12px;
  padding: 8px;
  border-top: 1px solid var(--md3-outline-variant);
}

.filter-item--selected {
  color: var(--md3-primary);
  font-weight: 600;
}

/* The theme paints every menu side section on-surface-variant, which outranks
   a `color` prop on the icon — so the tick has to be coloured from here. */
.filter-item--selected :deep(.q-item__section--side .q-icon) {
  color: var(--md3-primary);
}

/*
 * Date sheet. The picker ships its own 28px surface-container-high card, which
 * inside a 16px menu of a different surface showed as a mismatched ring in the
 * corners. Matching the radius and letting the picker go transparent makes the
 * popup read as one sheet.
 */
.filter-menu--date.q-menu,
.filter-pop--date {
  border-radius: var(--md3-corner-extra-large, 28px);
}

.filter-pop--date {
  /* The picker's natural width, but never wider than the dialog QPopupProxy
     falls back to on a narrow screen. */
  width: 328px;
  min-width: 0;
  max-width: 100%;
}

.filter-pop--date :deep(.q-date) {
  width: 100%;
  min-width: 0;
  border-radius: 0;

  background: transparent;
}

/*
 * The sheet already pads its edges, so the view only needs room under the
 * chips. The min-height is the theme's doing: it sizes day cells to 40px while
 * Quasar gives each of the six week rows 16.66% of a 192px-min container — at
 * the stock height the circles overflow their rows and collide. 344px leaves
 * every row 42px.
 */
.filter-pop--date :deep(.q-date__view) {
  min-height: 344px;
  padding: 0 8px 8px;
}

.filter-pop__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  padding: 0 16px 4px;
}

.preset-chip {
  padding: 6px 12px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-full, 9999px);

  background: transparent;
  color: var(--md3-on-surface-variant);
  cursor: pointer;

  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;

  transition: background-color 0.2s
    var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
}

.preset-chip:hover {
  background: var(--md3-surface-container-high);
}

.preset-chip:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.preset-chip--active {
  border-color: transparent;

  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

/* Age stepper */
.age-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.age-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;

  width: 40px;
  height: 40px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-full, 9999px);

  background: transparent;
  color: var(--md3-on-surface-variant);
  cursor: pointer;

  transition: background-color 0.2s
    var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
}

.age-step:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
}

.age-step:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.age-step:disabled {
  cursor: default;
  opacity: 0.38;
}

.age-stepper__field {
  flex: 1 1 auto;
  min-width: 0;
}

.age-stepper__field :deep(input) {
  font-size: 1.35rem;
  font-weight: 600;
}

/* The placeholder carries the empty state, so it reads as prose, not as data */
.age-stepper__field :deep(input::placeholder) {
  font-size: 0.95rem;
  font-weight: 500;
}

/* The stepper buttons replace them, and they are unstyleable besides. */
.age-stepper__field :deep(input[type='number']) {
  appearance: textfield;
}

.age-stepper__field :deep(input::-webkit-outer-spin-button),
.age-stepper__field :deep(input::-webkit-inner-spin-button) {
  margin: 0;

  appearance: none;
}

@media (max-width: 599.98px) {
  .event-filters {
    /* One scrolling line rather than three wrapped rows of pills */
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .event-filters::-webkit-scrollbar {
    display: none;
  }

  /* `auto` cannot push in a scroll container, so the count simply trails the
     pills instead of being pinned right. */
  .event-filters__count {
    order: 1;
    margin-left: 0;
  }

  .filter-chip,
  .filter-clear {
    flex: none;
  }

  .filter-chip--sort {
    order: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-chip,
  .filter-chip__clear,
  .preset-chip,
  .age-step {
    transition: none;
  }
}
</style>

<i18n lang="yaml" locale="en">
countries: 'Countries'
countries_selected: '{count} countries'
anywhere: 'Anywhere'
age_title: 'Participant age'
age_value: 'Age {value}'
any_age: 'Any age'
age_hint: 'Events open to participants of this age.'
age_decrease: 'One year younger'
age_increase: 'One year older'
dates: 'Dates'
any_dates: 'Anytime'
done: 'Done'
sort_label: 'Sort'
sort:
  start_asc: 'Starting soonest'
  start_desc: 'Starting latest'
  price_asc: 'Lowest price'
  price_desc: 'Highest price'
preset:
  this_month: 'This month'
  next_3_months: 'Next 3 months'
  summer: 'Summer'
clear: 'Clear all'
clear_one: 'Clear {filter}'
search: 'Search'
</i18n>

<i18n lang="yaml" locale="de">
countries: 'Länder'
countries_selected: '{count} Länder'
anywhere: 'Überall'
age_title: 'Alter'
age_value: '{value} Jahre'
any_age: 'Jedes Alter'
age_hint: 'Veranstaltungen, die für dieses Alter offen sind.'
age_decrease: 'Ein Jahr jünger'
age_increase: 'Ein Jahr älter'
dates: 'Zeitraum'
any_dates: 'Jederzeit'
done: 'Fertig'
sort_label: 'Sortierung'
sort:
  start_asc: 'Beginnt am frühesten'
  start_desc: 'Beginnt am spätesten'
  price_asc: 'Niedrigster Preis'
  price_desc: 'Höchster Preis'
preset:
  this_month: 'Diesen Monat'
  next_3_months: 'Nächste 3 Monate'
  summer: 'Sommer'
clear: 'Zurücksetzen'
clear_one: '{filter} zurücksetzen'
search: 'Suche'
</i18n>

<i18n lang="yaml" locale="fr">
countries: 'Pays'
countries_selected: '{count} pays'
anywhere: 'Partout'
age_title: 'Âge'
age_value: '{value} ans'
any_age: 'Tout âge'
age_hint: 'Événements ouverts aux participants de cet âge.'
age_decrease: 'Un an de moins'
age_increase: 'Un an de plus'
dates: 'Période'
any_dates: "N'importe quand"
done: 'Terminé'
sort_label: 'Trier'
sort:
  start_asc: 'Commence le plus tôt'
  start_desc: 'Commence le plus tard'
  price_asc: 'Prix le plus bas'
  price_desc: 'Prix le plus élevé'
preset:
  this_month: 'Ce mois-ci'
  next_3_months: 'Les 3 prochains mois'
  summer: 'Été'
clear: 'Tout effacer'
clear_one: 'Effacer : {filter}'
search: 'Recherche'
</i18n>

<i18n lang="yaml" locale="pl">
countries: 'Kraje'
countries_selected: 'Kraje: {count}'
anywhere: 'Wszędzie'
age_title: 'Wiek'
age_value: 'Wiek {value}'
any_age: 'Każdy wiek'
age_hint: 'Wydarzenia otwarte dla uczestników w tym wieku.'
age_decrease: 'Rok mniej'
age_increase: 'Rok więcej'
dates: 'Termin'
any_dates: 'Kiedykolwiek'
done: 'Gotowe'
sort_label: 'Sortowanie'
sort:
  start_asc: 'Najbliższy termin'
  start_desc: 'Najpóźniejszy termin'
  price_asc: 'Najniższa cena'
  price_desc: 'Najwyższa cena'
preset:
  this_month: 'W tym miesiącu'
  next_3_months: 'Najbliższe 3 miesiące'
  summer: 'Lato'
clear: 'Wyczyść'
clear_one: 'Wyczyść: {filter}'
search: 'Wyszukiwanie'
</i18n>

<i18n lang="yaml" locale="cs">
countries: 'Země'
countries_selected: 'Země: {count}'
anywhere: 'Kdekoliv'
age_title: 'Věk'
age_value: 'Věk {value}'
any_age: 'Jakýkoliv věk'
age_hint: 'Akce otevřené pro účastníky v tomto věku.'
age_decrease: 'O rok méně'
age_increase: 'O rok více'
dates: 'Období'
any_dates: 'Kdykoliv'
done: 'Hotovo'
sort_label: 'Řazení'
sort:
  start_asc: 'Nejbližší začátek'
  start_desc: 'Nejpozdější začátek'
  price_asc: 'Nejnižší cena'
  price_desc: 'Nejvyšší cena'
preset:
  this_month: 'Tento měsíc'
  next_3_months: 'Příští 3 měsíce'
  summer: 'Léto'
clear: 'Vymazat'
clear_one: 'Zrušit: {filter}'
search: 'Hledání'
</i18n>
