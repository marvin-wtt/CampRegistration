import type { Registration } from '@camp-registration/common/entities';
import type { Translatable } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';

export type Dimension = 'age' | 'gender' | 'country';

export interface CrossTabResult {
  /** Ordered category labels for the x-axis. */
  categories: string[];
  /** One series per group value (single "count" series when ungrouped). */
  series: { name: string; data: number[] }[];
  /** True when at least one record could not be classified on the x-axis. */
  hasUnknown: boolean;
}

const UNKNOWN = '__unknown__';

/**
 * If the age span is at most this many years, the age axis renders one column
 * per year. Above it, ages are collapsed into a handful of ranges instead.
 */
const PER_YEAR_AGE_SPAN = 8;

/**
 * Sums a {@link Translatable} number. Camps may define per-country values
 * (a record) or a single shared value (a plain number).
 */
function sumTranslatableNumber(
  value: Translatable<number> | null | undefined,
): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  return Object.values(value).reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

/** Reads the value of a {@link Translatable} number for a single country key. */
function translatableField(
  value: Translatable<number> | null | undefined,
  country: string,
): number | undefined {
  if (value == null || typeof value === 'number') {
    return undefined;
  }
  return value[country];
}

export interface CountryStats {
  country: string;
  accepted: number;
  pending: number;
  waitlisted: number;
  total: number;
  team: number;
  max: number | undefined;
  free: number | undefined;
}

export function useCampStatistics() {
  const campDetailsStore = useCampDetailsStore();
  const registrationStore = useRegistrationsStore();
  const helper = useRegistrationHelper();

  const registrations = computed<Registration[]>(
    () => registrationStore.data ?? [],
  );

  const participants = computed<Registration[]>(() =>
    registrations.value.filter((r) => helper.participant(r)),
  );

  const staff = computed<Registration[]>(() =>
    registrations.value.filter((r) => !helper.participant(r)),
  );

  /**
   * Accepted participants only. Demographics (age/gender/country breakdowns)
   * describe who is actually attending, so pending and waitlisted registrations
   * are excluded here even though they still count toward {@link counts}.
   */
  const acceptedParticipants = computed<Registration[]>(() =>
    participants.value.filter((r) => r.status === 'ACCEPTED'),
  );

  /** Non-participant registrations grouped by their role string. */
  const staffByRole = computed<Record<string, Registration[]>>(() => {
    const groups: Record<string, Registration[]> = {};
    for (const registration of staff.value) {
      const key = helper.role(registration) ?? 'staff';
      (groups[key] ??= []).push(registration);
    }
    return groups;
  });

  const counts = computed(() => {
    const byStatus = (status: Registration['status']) =>
      participants.value.filter((r) => r.status === status).length;

    return {
      accepted: byStatus('ACCEPTED'),
      pending: byStatus('PENDING'),
      waitlisted: byStatus('WAITLISTED'),
      total: participants.value.length,
    };
  });

  const capacity = computed(() => ({
    max: sumTranslatableNumber(campDetailsStore.data?.maxParticipants),
    free: sumTranslatableNumber(campDetailsStore.data?.freePlaces),
  }));

  /**
   * Country codes to show: the camp's configured countries plus any extra
   * country appearing in the data. Configured countries are kept even when no
   * one has registered yet, so they surface as an explicit zero rather than
   * looking absent. Camp order is preserved, data-only countries are appended.
   */
  const presentCountries = computed<string[]>(() => {
    const fromCamp = campDetailsStore.data?.countries ?? [];
    const fromData = registrations.value
      .map((r) => helper.country(r))
      .filter((c): c is string => !!c);

    const order = [...fromCamp];
    for (const country of fromData) {
      if (!order.includes(country)) {
        order.push(country);
      }
    }
    return order;
  });

  const hasMultipleCountries = computed<boolean>(
    () => presentCountries.value.length > 1,
  );

  /** True when the camp itself is configured for more than one country. */
  const multiCountryCamp = computed<boolean>(
    () => (campDetailsStore.data?.countries?.length ?? 0) > 1,
  );

  /** Per-country capacity and status counts (configured camp countries). */
  const perCountry = computed<CountryStats[]>(() => {
    const camp = campDetailsStore.data;
    if (!camp) {
      return [];
    }

    const countries = [...camp.countries].sort();
    return countries.map((country) => {
      const inCountry = participants.value.filter(
        (r) => helper.country(r) === country,
      );
      const byStatus = (status: Registration['status']) =>
        inCountry.filter((r) => r.status === status).length;
      const team = staff.value.filter(
        (r) => helper.country(r) === country,
      ).length;

      return {
        country,
        accepted: byStatus('ACCEPTED'),
        pending: byStatus('PENDING'),
        waitlisted: byStatus('WAITLISTED'),
        total: inCountry.length,
        team,
        max: translatableField(camp.maxParticipants, country),
        free: translatableField(camp.freePlaces, country),
      };
    });
  });

  /** Distinct gender values present across all registrations. */
  const presentGenders = computed<string[]>(() => {
    const values = new Set<string>(['m', 'f']);
    for (const registration of registrations.value) {
      const value = helper.gender(registration);
      if (value) {
        values.add(value);
      }
    }
    return [...values];
  });

  // --- Age banding ---------------------------------------------------------

  interface AgeBand {
    label: string;
    min: number;
    max: number; // inclusive
  }

  /** Adaptive age bands derived from the camp's configured age range. */
  const ageBands = computed<AgeBand[]>(() => {
    const camp = campDetailsStore.data;
    const ages = participants.value
      .map((r) => helper.age(r))
      .filter((a): a is number => a != null);

    let min = camp?.minAge;
    let max = camp?.maxAge;
    if (min == null || max == null || max < min) {
      if (ages.length === 0) {
        return [];
      }
      min = Math.min(...ages);
      max = Math.max(...ages);
    }

    const span = max - min;
    if (span <= PER_YEAR_AGE_SPAN) {
      const bands: AgeBand[] = [];
      for (let age = min; age <= max; age++) {
        bands.push({ label: String(age), min: age, max: age });
      }
      return bands;
    }

    // Aim for ~6 ranges of equal width.
    const bandSize = Math.max(2, Math.ceil((span + 1) / 6));
    const bands: AgeBand[] = [];
    for (let start = min; start <= max; start += bandSize) {
      const end = Math.min(start + bandSize - 1, max);
      bands.push({
        label: start === end ? String(start) : `${start}–${end}`,
        min: start,
        max: end,
      });
    }
    return bands;
  });

  function ageBandLabel(age: number | undefined): string {
    if (age == null) {
      return UNKNOWN;
    }
    const band = ageBands.value.find((b) => age >= b.min && age <= b.max);
    return band?.label ?? UNKNOWN;
  }

  // --- Cross tabulation ----------------------------------------------------

  function valueOf(registration: Registration, dimension: Dimension): string {
    switch (dimension) {
      case 'age':
        return ageBandLabel(helper.age(registration));
      case 'gender':
        return helper.gender(registration) ?? UNKNOWN;
      case 'country':
        return helper.country(registration) ?? UNKNOWN;
    }
  }

  /** Ordered list of category labels for a dimension. */
  function categoriesFor(dimension: Dimension): string[] {
    switch (dimension) {
      case 'age':
        return ageBands.value.map((b) => b.label);
      case 'gender':
        return presentGenders.value;
      case 'country':
        return presentCountries.value;
    }
  }

  /**
   * Builds a count matrix of `people` along `x`, optionally split into one
   * series per `group` value. Unknown values are folded into a trailing
   * category / series so nothing is silently dropped.
   */
  function crossTab(
    people: Registration[],
    x: Dimension,
    group?: Dimension,
  ): CrossTabResult {
    const categories = [...categoriesFor(x)];
    const categoryIndex = new Map(categories.map((c, i) => [c, i]));
    let hasUnknown = false;

    const ensureCategory = (label: string): number => {
      if (label === UNKNOWN) {
        hasUnknown = true;
      }
      let index = categoryIndex.get(label);
      if (index == null) {
        index = categories.length;
        categories.push(label);
        categoryIndex.set(label, index);
      }
      return index;
    };

    if (!group) {
      const data = new Array<number>(categories.length).fill(0);
      for (const registration of people) {
        const i = ensureCategory(valueOf(registration, x));
        data[i] = (data[i] ?? 0) + 1;
      }
      // Backfill rows added for unknown.
      while (data.length < categories.length) {
        data.push(0);
      }
      return { categories, series: [{ name: 'count', data }], hasUnknown };
    }

    const groupCategories = [...categoriesFor(group)];
    const groupIndex = new Map(groupCategories.map((g, i) => [g, i]));
    const ensureGroup = (label: string): number => {
      if (label === UNKNOWN) {
        hasUnknown = true;
      }
      let index = groupIndex.get(label);
      if (index == null) {
        index = groupCategories.length;
        groupCategories.push(label);
        groupIndex.set(label, index);
      }
      return index;
    };

    const matrix: number[][] = groupCategories.map(() =>
      new Array<number>(categories.length).fill(0),
    );

    for (const registration of people) {
      const xi = ensureCategory(valueOf(registration, x));
      const gi = ensureGroup(valueOf(registration, group));
      // Grow rows/cols that were created lazily.
      while (matrix.length < groupCategories.length) {
        matrix.push(new Array<number>(categories.length).fill(0));
      }
      const row = matrix[gi]!;
      while (row.length < categories.length) {
        row.push(0);
      }
      row[xi] = (row[xi] ?? 0) + 1;
    }

    const series = groupCategories.map((name, i) => {
      const row = matrix[i]!;
      while (row.length < categories.length) {
        row.push(0);
      }
      return { name, data: row };
    });

    return { categories, series, hasUnknown };
  }

  return {
    UNKNOWN,
    registrations,
    participants,
    acceptedParticipants,
    staff,
    staffByRole,
    counts,
    capacity,
    presentCountries,
    presentGenders,
    hasMultipleCountries,
    multiCountryCamp,
    perCountry,
    ageBands,
    crossTab,
  };
}
