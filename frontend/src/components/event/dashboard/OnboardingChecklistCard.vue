<template>
  <q-card
    v-if="isLoading || (!settings.hidden && items.length > 0)"
    flat
    bordered
    class="onboarding-card"
    data-test="dashboard-onboarding"
  >
    <!-- Until every item is known, so finished ones don't flash up. -->
    <q-card-section
      v-if="pending"
      class="column q-gutter-y-md"
    >
      <q-skeleton
        type="text"
        width="60%"
      />
      <q-skeleton
        v-for="n in 3"
        :key="n"
        type="rect"
        height="40px"
        class="rounded-md"
      />
    </q-card-section>

    <!-- Done or skipped throughout: one line, until someone hides it. -->
    <q-card-section
      v-else-if="complete"
      data-test="dashboard-onboarding-complete"
    >
      <dashboard-card-header
        icon="task_alt"
        tone="positive"
        :title="t('complete.title')"
        :caption="t('complete.caption')"
      >
        <template #action>
          <m-btn
            :label="t('complete.hide')"
            secondary
            text
            rounded
            no-caps
            data-test="dashboard-onboarding-hide"
            @click="hide()"
          />
        </template>
      </dashboard-card-header>
    </q-card-section>

    <template v-else>
      <q-card-section>
        <dashboard-card-header
          icon="construction"
          :title="t('title')"
          :caption="t('left', { count: openCount }, openCount)"
        />
      </q-card-section>

      <transition-group
        name="onboarding-collapse"
        tag="div"
      >
        <div
          v-for="group in groups"
          :key="group.name"
          class="onboarding-group"
        >
          <div class="group-label">
            {{ t(`group.${group.name}`) }}
          </div>

          <transition-group
            name="onboarding-collapse"
            tag="div"
            role="list"
            class="q-list onboarding-list"
          >
            <q-item
              v-for="item in group.items"
              :key="item.key"
              clickable
              class="onboarding-item rounded-md"
              :class="{
                'onboarding-item--skipped': item.status === 'skipped',
                'bg-secondary-container': item.key === nextKey,
              }"
              :data-test="`dashboard-onboarding-${item.key}`"
              :data-status="item.status"
              @click="open(item)"
            >
              <q-item-section avatar>
                <q-skeleton
                  v-if="item.status === 'loading'"
                  type="circle"
                  size="24px"
                />
                <q-checkbox
                  v-else-if="item.manual && item.status !== 'skipped'"
                  :model-value="item.status === 'done'"
                  :aria-label="t(`item.${item.key}.label`)"
                  color="positive"
                  :data-test="`dashboard-onboarding-${item.key}-check`"
                  @click.stop
                  @update:model-value="(value) => toggle(item.key, value)"
                />
                <q-icon
                  v-else
                  :name="statusIcon(item)"
                  :color="item.status === 'done' ? 'positive' : 'outline'"
                  size="24px"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="item-label">
                  {{ t(`item.${item.key}.label`) }}
                </q-item-label>
                <q-item-label caption>
                  {{
                    item.status === 'skipped'
                      ? t('skipped')
                      : t(`item.${item.key}.hint`)
                  }}
                </q-item-label>
              </q-item-section>

              <q-item-section
                v-if="item.key === nextKey"
                side
                class="gt-xs"
              >
                <q-badge
                  color="secondary"
                  text-color="on-secondary"
                  :label="t('next')"
                  rounded
                />
              </q-item-section>

              <q-item-section side>
                <m-btn
                  v-if="actionsOf(item).length > 0"
                  icon="more_vert"
                  :aria-label="t('actions')"
                  text
                  round
                  dense
                  :data-test="`dashboard-onboarding-${item.key}-menu`"
                  @click.stop
                >
                  <q-menu>
                    <q-list style="min-width: 160px">
                      <q-item
                        v-for="action in actionsOf(item)"
                        :key="action"
                        v-close-popup
                        clickable
                        :data-test="`dashboard-onboarding-${item.key}-${action}`"
                        @click="
                          action === 'skip'
                            ? markSkipped(item.key)
                            : undo(item.key)
                        "
                      >
                        <q-item-section avatar>
                          <q-icon :name="action === 'skip' ? 'redo' : 'undo'" />
                        </q-item-section>
                        <q-item-section>{{ t(action) }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </m-btn>
                <q-icon
                  v-else
                  name="chevron_right"
                  size="18px"
                />
              </q-item-section>
            </q-item>
          </transition-group>
        </div>
      </transition-group>

      <div
        v-if="moreCount > 0"
        class="q-px-md q-pb-sm"
      >
        <m-btn
          :label="
            revealed ? t('more.hide') : t('more.show', { count: moreCount })
          "
          :icon="revealed ? 'expand_less' : 'expand_more'"
          secondary
          text
          rounded
          no-caps
          data-test="dashboard-onboarding-more"
          @click="revealed = !revealed"
        />
      </div>
    </template>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import {
  useOnboardingChecklist,
  type OnboardingGroup,
  type OnboardingItem,
} from '@/composables/onboardingChecklist';
import type { EventPhase } from '@/composables/eventPhase';

const { phase } = defineProps<{
  phase: EventPhase;
}>();

const { t } = useI18n();
const router = useRouter();

const { settings, isLoading, items, check, skip, undo, hide } =
  useOnboardingChecklist(toRef(() => phase));

const pending = computed<boolean>(
  () =>
    isLoading.value || items.value.some((item) => item.status === 'loading'),
);

// Only open items of the viewed phase are listed; the rest stay one tap away,
// e.g. to undo.
const revealed = ref<boolean>(false);

// A ticked or skipped row stays a moment in its new state before it leaves,
// or it would animate out as it was before the tap.
const LINGER_MS = 500;
const lingering = ref<string[]>([]);
const timers = new Set<ReturnType<typeof setTimeout>>();

function linger(key: string): void {
  lingering.value = [...lingering.value, key];
  const timer = setTimeout(() => {
    timers.delete(timer);
    lingering.value = lingering.value.filter((entry) => entry !== key);
  }, LINGER_MS);
  timers.add(timer);
}

onBeforeUnmount(() => timers.forEach((timer) => clearTimeout(timer)));

const currentItems = computed<OnboardingItem[]>(() =>
  items.value.filter((item) => item.current),
);

function isListed(item: OnboardingItem): boolean {
  return (
    item.current &&
    (item.status === 'open' || lingering.value.includes(item.key))
  );
}

const moreCount = computed<number>(
  () => items.value.filter((item) => !isListed(item)).length,
);

const groups = computed<{ name: OnboardingGroup; items: OnboardingItem[] }[]>(
  () =>
    (['registration', 'event'] as const)
      .map((name) => ({
        name,
        items: items.value.filter(
          (item) => item.group === name && (revealed.value || isListed(item)),
        ),
      }))
      .filter((group) => group.items.length > 0),
);

const openCount = computed<number>(
  () =>
    currentItems.value.filter(
      (item) => item.status !== 'done' && item.status !== 'skipped',
    ).length,
);

const complete = computed<boolean>(
  () =>
    lingering.value.length === 0 &&
    currentItems.value.every(
      (item) => item.status === 'done' || item.status === 'skipped',
    ),
);

const nextKey = computed<string | undefined>(
  () => currentItems.value.find((item) => item.status === 'open')?.key,
);

function open(item: OnboardingItem): void {
  void router.push({ name: item.route });
}

function toggle(key: string, value: boolean): void {
  if (value) {
    linger(key);
    check(key);
  } else {
    undo(key);
  }
}

function markSkipped(key: string): void {
  linger(key);
  skip(key);
}

// Detected items can't be reopened once done: their data decides.
function actionsOf(item: OnboardingItem): ('skip' | 'undo')[] {
  if (item.status === 'skipped' || (item.manual && item.status === 'done')) {
    return ['undo'];
  }

  return item.status === 'done' ? [] : ['skip'];
}

function statusIcon(item: OnboardingItem): string {
  switch (item.status) {
    case 'done':
      return 'check_circle';
    case 'skipped':
      return 'do_not_disturb_on';
    default:
      return 'radio_button_unchecked';
  }
}
</script>

<style scoped>
.onboarding-card {
  border-radius: 16px;
}

.onboarding-list {
  display: grid;
  gap: 2px;
  padding: 0 8px 8px;
}

.onboarding-item {
  min-height: 56px;
}

.item-label {
  font-weight: 500;
}

.onboarding-item--skipped {
  opacity: 0.6;
}

/* Rows fade, then fold so the ones below slide up. */
.onboarding-collapse-enter-active,
.onboarding-collapse-leave-active {
  overflow: hidden;
  transition:
    opacity 200ms cubic-bezier(0.2, 0, 0, 1),
    max-height 300ms cubic-bezier(0.2, 0, 0, 1),
    min-height 300ms cubic-bezier(0.2, 0, 0, 1),
    padding 300ms cubic-bezier(0.2, 0, 0, 1);
}

.onboarding-collapse-enter-from,
.onboarding-collapse-leave-to {
  max-height: 0;
  min-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

.onboarding-collapse-enter-to,
.onboarding-collapse-leave-from {
  max-height: 160px;
}

.onboarding-group.onboarding-collapse-enter-to,
.onboarding-group.onboarding-collapse-leave-from {
  max-height: 800px;
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-collapse-enter-active,
  .onboarding-collapse-leave-active {
    transition: none;
  }
}

.group-label {
  margin: 0 24px 4px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>

<i18n lang="yaml" locale="en">
more:
  show: 'Show {count} more'
  hide: 'Show less'
title: 'Get your event ready'
left: '{count} step left | {count} steps left'
next: 'Next step'
skipped: 'Skipped'
actions: 'Actions'
skip: 'Skip'
undo: 'Undo'
complete:
  title: 'Setup complete'
  caption: 'Every step is done or skipped'
  hide: 'Hide'
group:
  registration: 'Before opening registration'
  event: 'Before the event'
item:
  tools:
    label: 'Choose your tools'
    hint: 'Show only the features this event needs'
  team:
    label: 'Invite your team'
    hint: 'Give co-organizers access to the event'
  form:
    label: 'Review the form'
    hint: 'It was copied from a preset or an earlier event — adjust it to this one'
  emails:
    label: 'Review automated emails'
    hint: 'Confirmations and other emails sent on your behalf'
  files:
    label: 'Upload files'
    hint: 'Files the form and emails refer to'
  privacy:
    label: 'Review privacy information'
    hint: 'What this event adds to the privacy information of its organisation'
  window:
    label: 'Set the registration window'
    hint: 'When people can sign up'
  program:
    label: 'Plan the program'
    hint: 'Activities for each day of the event'
  finances:
    label: 'Set up finances'
    hint: 'Expenses, payouts and balances'
  rooms:
    label: 'Set up rooms'
    hint: 'Rooms and beds to assign participants to'
  chores:
    label: 'Define chores'
    hint: 'Kitchen duty, cleaning and other chores to share out'
</i18n>

<i18n lang="yaml" locale="de">
more:
  show: '{count} weitere anzeigen'
  hide: 'Weniger anzeigen'
title: 'Mach deine Veranstaltung startklar'
left: '{count} Schritt offen | {count} Schritte offen'
next: 'Nächster Schritt'
skipped: 'Übersprungen'
actions: 'Aktionen'
skip: 'Überspringen'
undo: 'Rückgängig'
complete:
  title: 'Einrichtung abgeschlossen'
  caption: 'Alle Schritte sind erledigt oder übersprungen'
  hide: 'Ausblenden'
group:
  registration: 'Vor dem Öffnen der Anmeldung'
  event: 'Vor der Veranstaltung'
item:
  tools:
    label: 'Werkzeuge auswählen'
    hint: 'Zeige nur die Funktionen, die diese Veranstaltung braucht'
  team:
    label: 'Team einladen'
    hint: 'Gib Mitorganisierenden Zugriff auf die Veranstaltung'
  form:
    label: 'Formular prüfen'
    hint: 'Es stammt aus einer Vorlage oder einer früheren Veranstaltung – passe es an diese an'
  emails:
    label: 'Automatische E-Mails prüfen'
    hint: 'Bestätigungen und weitere E-Mails, die in deinem Namen verschickt werden'
  files:
    label: 'Dateien hochladen'
    hint: 'Dateien, auf die Formular und E-Mails verweisen'
  privacy:
    label: 'Datenschutzinformationen prüfen'
    hint: 'Was diese Veranstaltung den Datenschutzinformationen ihrer Organisation hinzufügt'
  window:
    label: 'Anmeldezeitraum festlegen'
    hint: 'Wann man sich anmelden kann'
  program:
    label: 'Programm planen'
    hint: 'Aktivitäten für jeden Tag der Veranstaltung'
  finances:
    label: 'Finanzen einrichten'
    hint: 'Ausgaben, Auszahlungen und Salden'
  rooms:
    label: 'Räume einrichten'
    hint: 'Räume und Betten, denen du Teilnehmende zuteilst'
  chores:
    label: 'Dienste festlegen'
    hint: 'Küchendienst, Putzen und andere Dienste zum Verteilen'
</i18n>

<i18n lang="yaml" locale="fr">
more:
  show: 'Afficher {count} de plus'
  hide: 'Afficher moins'
title: 'Prépare ton événement'
left: '{count} étape restante | {count} étapes restantes'
next: 'Prochaine étape'
skipped: 'Ignorée'
actions: 'Actions'
skip: 'Ignorer'
undo: 'Annuler'
complete:
  title: 'Configuration terminée'
  caption: 'Toutes les étapes sont terminées ou ignorées'
  hide: 'Masquer'
group:
  registration: "Avant d'ouvrir les inscriptions"
  event: "Avant l'événement"
item:
  tools:
    label: 'Choisir tes outils'
    hint: 'Affiche seulement les fonctionnalités dont cet événement a besoin'
  team:
    label: 'Inviter ton équipe'
    hint: "Donne accès à l'événement à des co-organisateurs"
  form:
    label: 'Vérifier le formulaire'
    hint: "Il provient d'un modèle ou d'un événement précédent — adapte-le à celui-ci"
  emails:
    label: 'Vérifier les e-mails automatiques'
    hint: 'Confirmations et autres e-mails envoyés en ton nom'
  files:
    label: 'Téléverser les fichiers'
    hint: 'Fichiers auxquels renvoient le formulaire et les e-mails'
  privacy:
    label: 'Vérifier les informations sur la protection des données'
    hint: 'Ce que cet événement ajoute aux informations de son organisation'
  window:
    label: "Définir la période d'inscription"
    hint: "Quand on peut s'inscrire"
  program:
    label: 'Planifier le programme'
    hint: "Les activités de chaque jour de l'événement"
  finances:
    label: 'Configurer les finances'
    hint: 'Dépenses, versements et soldes'
  rooms:
    label: 'Configurer les chambres'
    hint: 'Chambres et lits à attribuer aux participants'
  chores:
    label: 'Définir les corvées'
    hint: 'Cuisine, ménage et autres corvées à répartir'
</i18n>

<i18n lang="yaml" locale="pl">
more:
  show: 'Pokaż więcej ({count})'
  hide: 'Pokaż mniej'
title: 'Przygotuj swoje wydarzenie'
left: 'Pozostało: {count}'
next: 'Następny krok'
skipped: 'Pominięto'
actions: 'Akcje'
skip: 'Pomiń'
undo: 'Cofnij'
complete:
  title: 'Konfiguracja zakończona'
  caption: 'Wszystkie kroki są ukończone lub pominięte'
  hide: 'Ukryj'
group:
  registration: 'Przed otwarciem rejestracji'
  event: 'Przed wydarzeniem'
item:
  tools:
    label: 'Wybierz narzędzia'
    hint: 'Pokaż tylko funkcje potrzebne temu wydarzeniu'
  team:
    label: 'Zaproś zespół'
    hint: 'Daj współorganizatorom dostęp do wydarzenia'
  form:
    label: 'Sprawdź formularz'
    hint: 'Pochodzi z szablonu lub wcześniejszego wydarzenia — dostosuj go do tego'
  emails:
    label: 'Sprawdź automatyczne e-maile'
    hint: 'Potwierdzenia i inne e-maile wysyłane w twoim imieniu'
  files:
    label: 'Prześlij pliki'
    hint: 'Pliki, do których odwołują się formularz i e-maile'
  privacy:
    label: 'Sprawdź informacje o ochronie danych'
    hint: 'Co to wydarzenie dodaje do informacji swojej organizacji'
  window:
    label: 'Ustal okres rejestracji'
    hint: 'Kiedy można się zapisać'
  program:
    label: 'Zaplanuj program'
    hint: 'Zajęcia na każdy dzień wydarzenia'
  finances:
    label: 'Skonfiguruj finanse'
    hint: 'Wydatki, wypłaty i salda'
  rooms:
    label: 'Skonfiguruj pokoje'
    hint: 'Pokoje i łóżka, do których przydzielasz uczestników'
  chores:
    label: 'Określ dyżury'
    hint: 'Dyżur w kuchni, sprzątanie i inne obowiązki do podziału'
</i18n>

<i18n lang="yaml" locale="cs">
more:
  show: 'Zobrazit další ({count})'
  hide: 'Zobrazit méně'
title: 'Připravte svou akci'
left: 'Zbývá: {count}'
next: 'Další krok'
skipped: 'Přeskočeno'
actions: 'Akce'
skip: 'Přeskočit'
undo: 'Vrátit'
complete:
  title: 'Nastavení dokončeno'
  caption: 'Všechny kroky jsou hotové nebo přeskočené'
  hide: 'Skrýt'
group:
  registration: 'Před otevřením registrace'
  event: 'Před akcí'
item:
  tools:
    label: 'Vybrat nástroje'
    hint: 'Zobrazte jen funkce, které tato akce potřebuje'
  team:
    label: 'Pozvat tým'
    hint: 'Dejte spoluorganizátorům přístup k akci'
  form:
    label: 'Zkontrolovat formulář'
    hint: 'Pochází ze šablony nebo dřívější akce — upravte ho pro tuto'
  emails:
    label: 'Zkontrolovat automatické e-maily'
    hint: 'Potvrzení a další e-maily odesílané vaším jménem'
  files:
    label: 'Nahrát soubory'
    hint: 'Soubory, na které odkazuje formulář a e-maily'
  privacy:
    label: 'Zkontrolovat informace o ochraně osobních údajů'
    hint: 'Co tato akce doplňuje k informacím své organizace'
  window:
    label: 'Nastavit období registrace'
    hint: 'Kdy se lze přihlásit'
  program:
    label: 'Naplánovat program'
    hint: 'Aktivity na každý den akce'
  finances:
    label: 'Nastavit finance'
    hint: 'Výdaje, výplaty a zůstatky'
  rooms:
    label: 'Nastavit pokoje'
    hint: 'Pokoje a lůžka, do kterých přidělujete účastníky'
  chores:
    label: 'Určit služby'
    hint: 'Služba v kuchyni, úklid a další služby k rozdělení'
</i18n>
