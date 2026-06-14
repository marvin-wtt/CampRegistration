<template>
  <div
    class="lang-cell"
    :class="{ 'lang-cell--dense': cellProps.dense }"
  >
    <div
      v-for="skill in skills"
      :key="skill.name"
      class="lang-cell__item"
    >
      <country-icon
        :locale="skill.name"
        class="lang-cell__flag"
      />

      <span
        class="lang-cell__level"
        :style="{ color: skill.color }"
      >
        {{ skill.code }}
      </span>

      <q-tooltip> {{ skill.language }} — {{ skill.levelName }} </q-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

interface Skill {
  name: string;
  language: string;
  tier: number;
  code: string;
  levelName: string;
  color: string;
}

const { props: cellProps } = defineProps<TableCellProps>();
const { locale } = useI18n();

// CEFR scale, highest first. tier 6 = best, tier 0 = none.
const TIER_CODE: Record<number, string> = {
  6: 'C2',
  5: 'C1',
  4: 'B2',
  3: 'B1',
  2: 'A2',
  1: 'A1',
  0: '–',
};

const languageNames = computed<Intl.DisplayNames | null>(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'language' });
  } catch {
    return null;
  }
});

const skills = computed<Skill[]>(() => {
  const value = cellProps.value;

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  return Object.entries(value)
    .map(([name, raw]) => {
      const tier = levelToTier(raw);

      return {
        name,
        language: languageName(name),
        tier,
        code: levelCode(raw, tier),
        levelName: levelName(raw, tier),
        color: tierColor(tier),
      };
    })
    .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
});

function languageName(code: string): string {
  const tag = code.replace('_', '-').split('-')[0] ?? code;
  return languageNames.value?.of(tag) ?? code.toUpperCase();
}

// Maps a stored skill value (CEFR code, descriptive word, legacy number, or
// nested { level }) onto a 0–6 tier on the CEFR scale.
function levelToTier(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (typeof value === 'object' && 'level' in value) {
    return levelToTier(value.level);
  }

  // Legacy support: a 0–100 number where higher means more proficient.
  if (typeof value === 'number') {
    return Math.max(0, Math.min(6, Math.round((value / 100) * 6)));
  }

  if (typeof value !== 'string') {
    return 0;
  }

  switch (value.toUpperCase()) {
    case 'C2':
    case 'NATIVE':
    case 'FLUENT':
    case 'MASTERY':
    case 'PROFICIENCY':
      return 6;
    case 'C1':
    case 'ADVANCED':
      return 5;
    case 'B2':
    case 'VANTAGE':
    case 'UPPER-INTERMEDIATE':
      return 4;
    case 'B1':
    case 'THRESHOLD':
    case 'INTERMEDIATE':
      return 3;
    case 'A2':
    case 'PRE-INTERMEDIATE':
    case 'WASTAGE':
    case 'BASIC':
      return 2;
    case 'A1':
    case 'BEGINNER':
    case 'BREAKTHROUGH':
      return 1;
    case 'NONE':
    default:
      return 0;
  }
}

const CEFR = /^[abc][12]$/i;

// Compact badge text: keep the original CEFR code when given one, otherwise
// fall back to the tier's CEFR equivalent so the badge stays narrow.
function levelCode(value: unknown, tier: number): string {
  if (typeof value === 'string' && CEFR.test(value.trim())) {
    return value.trim().toUpperCase();
  }
  return TIER_CODE[tier] ?? '–';
}

// Richer text for the tooltip: prefer the human-readable descriptive word,
// otherwise the CEFR code.
function levelName(value: unknown, tier: number): string {
  if (typeof value === 'object' && value !== null && 'level' in value) {
    return levelName(value.level, tier);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && !CEFR.test(trimmed)) {
      return trimmed
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase())
        .replace(/-/g, ' ');
    }
  }

  return TIER_CODE[tier] ?? '–';
}

function tierColor(tier: number): string {
  if (tier >= 5) {
    return 'var(--md3-positive)';
  }
  if (tier >= 3) {
    return 'var(--md3-info)';
  }
  if (tier >= 1) {
    return 'var(--md3-warning)';
  }
  return 'var(--md3-on-surface-variant)';
}
</script>

<style scoped lang="scss">
.lang-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;

  &__item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    cursor: default;
  }

  &__flag {
    line-height: 1;
    // CountryIcon renders the flag at 1.5em, so font-size controls its size.
    font-size: 1rem;
  }

  &__level {
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.02em;
  }

  &--dense {
    gap: 6px;

    .lang-cell__flag {
      font-size: 0.8rem;
    }

    .lang-cell__level {
      font-size: 0.6rem;
    }
  }
}
</style>
