<template>
  <span
    v-if="viewedPhase"
    class="phase-group"
  >
    <button
      type="button"
      class="phase-pill"
      :class="{ 'phase-pill--preview': previewing }"
      :aria-label="t('phase.switch')"
      data-test="dashboard-phase"
    >
      <q-icon
        :name="previewing ? 'visibility' : PHASE_ICONS[viewedPhase]"
        size="16px"
      />
      {{
        previewing
          ? t('phase.preview', { phase: t(`phase.${viewedPhase}`) })
          : t(`phase.${viewedPhase}`)
      }}
      <q-icon
        name="arrow_drop_down"
        size="18px"
      />
      <q-menu
        anchor="bottom left"
        self="top left"
        class="rounded-md"
      >
        <q-list class="phase-menu">
          <q-item-label header>{{ t('phase.switch') }}</q-item-label>
          <q-item
            v-for="phase in EVENT_PHASES"
            :key="phase"
            v-close-popup
            clickable
            @click="viewedPhase = phase"
          >
            <q-item-section avatar>
              <q-icon :name="PHASE_ICONS[phase]" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t(`phase.${phase}`) }}</q-item-label>
              <q-item-label
                v-if="phase === actualPhase"
                caption
              >
                {{ t('phase.current') }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="phase === viewedPhase"
              side
            >
              <q-icon
                name="check"
                color="primary"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </button>
    <m-btn
      v-if="previewing"
      :aria-label="t('phase.back')"
      icon="close"
      size="sm"
      round
      flat
      dense
      color="primary"
      data-test="dashboard-phase-back"
      @click="viewedPhase = actualPhase"
    >
      <q-tooltip>{{ t('phase.back') }}</q-tooltip>
    </m-btn>
  </span>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  EVENT_PHASES,
  type EventPhase,
  useEventPhase,
} from '@/composables/eventPhase';

// The dashboard's phase, with a menu to preview another one.
const PHASE_ICONS: Record<EventPhase, string> = {
  setup: 'construction',
  registration: 'how_to_reg',
  preparation: 'inventory_2',
  running: 'play_circle',
  wrapUp: 'flag',
};

const { t } = useI18n();
const { actualPhase, viewedPhase, previewing } = useEventPhase();
</script>

<style scoped>
.phase-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.phase-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 3px 4px 3px 10px;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  color: var(--md3-on-primary);
  cursor: pointer;
  background: var(--md3-primary);
}

.phase-pill--preview {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.phase-pill:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.phase-menu {
  min-width: 220px;
}
</style>

<i18n lang="yaml" locale="en">
phase:
  setup: 'Setup'
  registration: 'Registration'
  preparation: 'Preparation'
  running: 'Running'
  wrapUp: 'Wrap-up'
  switch: 'View dashboard for phase'
  current: 'Current phase'
  preview: 'Preview: {phase}'
  back: 'Back to current phase'
</i18n>

<i18n lang="yaml" locale="de">
phase:
  setup: 'Einrichtung'
  registration: 'Anmeldung'
  preparation: 'Vorbereitung'
  running: 'Läuft'
  wrapUp: 'Nachbereitung'
  switch: 'Übersicht für Phase anzeigen'
  current: 'Aktuelle Phase'
  preview: 'Vorschau: {phase}'
  back: 'Zurück zur aktuellen Phase'
</i18n>

<i18n lang="yaml" locale="fr">
phase:
  setup: 'Configuration'
  registration: 'Inscriptions'
  preparation: 'Préparation'
  running: 'En cours'
  wrapUp: 'Clôture'
  switch: 'Afficher le tableau de bord pour la phase'
  current: 'Phase actuelle'
  preview: 'Aperçu : {phase}'
  back: 'Revenir à la phase actuelle'
</i18n>

<i18n lang="yaml" locale="pl">
phase:
  setup: 'Konfiguracja'
  registration: 'Rejestracja'
  preparation: 'Przygotowanie'
  running: 'W trakcie'
  wrapUp: 'Podsumowanie'
  switch: 'Pokaż pulpit dla fazy'
  current: 'Bieżąca faza'
  preview: 'Podgląd: {phase}'
  back: 'Wróć do bieżącej fazy'
</i18n>

<i18n lang="yaml" locale="cs">
phase:
  setup: 'Nastavení'
  registration: 'Registrace'
  preparation: 'Příprava'
  running: 'Probíhá'
  wrapUp: 'Uzavření'
  switch: 'Zobrazit přehled pro fázi'
  current: 'Aktuální fáze'
  preview: 'Náhled: {phase}'
  back: 'Zpět na aktuální fázi'
</i18n>
