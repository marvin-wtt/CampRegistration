<template>
  <q-skeleton
    v-if="loading"
    type="rect"
    :height="rail ? '32px' : '40px'"
    :width="rail ? '60px' : 'min(180px, 100%)'"
    :class="rail ? 'rounded-lg' : 'q-ml-xs'"
  />

  <!-- Rail: compact pill with a chevron + the current context name beneath,
       so it clearly reads as "you are here, tap to go elsewhere". -->
  <div
    v-else-if="rail"
    class="workspace-switcher-rail column items-center"
  >
    <m-btn
      tonal
      no-morph
      :aria-label="t('switch')"
      class="workspace-switcher-rail__btn rounded-lg"
    >
      <q-icon
        :name="icon"
        size="20px"
      />
      <q-icon
        name="arrow_drop_down"
        size="18px"
      />

      <q-tooltip
        anchor="center right"
        self="center left"
      >
        {{ t('switch') }}
      </q-tooltip>

      <q-menu
        anchor="bottom start"
        self="top start"
      >
        <workspace-switcher-menu />
      </q-menu>
    </m-btn>

    <div class="workspace-switcher-rail__name ellipsis">
      {{ label }}
      <q-tooltip>
        {{ label }}
      </q-tooltip>
    </div>
  </div>

  <!-- Bar: width-constrained toolbar control with a truncating label + caret. -->
  <template v-else>
    <m-btn
      tonal
      no-caps
      no-morph
      :aria-label="label"
      class="workspace-switcher"
      @click="openSheet"
    >
      <q-icon
        :name="icon"
        size="20px"
        class="on-left"
      />
      <span class="workspace-switcher__label">
        {{ label }}
      </span>
      <q-icon
        name="arrow_drop_down"
        size="20px"
        class="workspace-switcher__chevron on-right"
      />

      <!-- Touch has no hover, so a tooltip cannot be what discloses the
           truncated name — on phones the sheet header carries it in full. -->
      <q-tooltip v-if="!sheetMode">
        {{ label }}
      </q-tooltip>

      <q-menu
        v-if="!sheetMode"
        anchor="bottom start"
        self="top start"
      >
        <workspace-switcher-menu />
      </q-menu>
    </m-btn>

    <!-- Phones get a bottom sheet instead of an anchored menu: the menu opens
         at the top edge, away from the thumb, and caps itself at a width the
         nested lists cannot work in. -->
    <q-dialog
      v-if="sheetMode"
      v-model="sheet"
      position="bottom"
      @hide="resetDrag"
    >
      <q-card
        class="workspace-switcher-sheet"
        :class="{ 'workspace-switcher-sheet--dragging': dragging }"
        :style="{ transform: `translateY(${dragOffset}px)` }"
      >
        <!-- The handle drags unconditionally: it is the part of a sheet that
             is not the content, so nothing else competes for the gesture. -->
        <div
          v-touch-pan.vertical.mouse.prevent="drag"
          class="workspace-switcher-sheet__header"
        >
          <div class="workspace-switcher-sheet__grip" />

          <div class="row items-center no-wrap">
            <q-icon
              :name="icon"
              size="24px"
              class="q-mr-md"
            />
            <div class="col">
              <div class="workspace-switcher-sheet__name">
                {{ label }}
              </div>
              <div
                v-if="sheetCaption"
                class="workspace-switcher-sheet__area"
              >
                {{ sheetCaption }}
              </div>
            </div>
          </div>
        </div>

        <q-separator />

        <!-- No `prevent` here: the list has to keep scrolling normally, and
             `dragFromContent` only takes the gesture when there is nothing
             left to scroll. -->
        <div
          ref="scrollEl"
          v-touch-pan.vertical.mouse="dragFromContent"
          class="workspace-switcher-sheet__scroll"
        >
          <workspace-switcher-menu />
        </div>
      </q-card>
    </q-dialog>
  </template>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TouchPan, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useSheetDrag } from '@/composables/sheetDrag';
import WorkspaceSwitcherMenu from '@/components/layout/WorkspaceSwitcherMenu.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  areaFromRouteName,
  useWorkspacePrefetch,
} from '@/components/layout/workspaceArea';

defineProps<{
  rail?: boolean;
}>();

const vTouchPan = TouchPan;

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const eventDetailsStore = useEventDetailsStore();
const organizationDetailsStore = useOrganizationDetailsStore();
const newsletterStore = useNewsletterStore();

const area = computed(() => areaFromRouteName(route.name));

// The panel is a sheet below `sm`; the rail variant is desktop-only, so only
// the bar ever reaches it.
const sheetMode = computed<boolean>(() => quasar.screen.lt.sm);

const sheet = ref<boolean>(false);

// The sheet is left where the finger let go, so the dialog's own slide-out
// carries on from there instead of snapping back first.
const {
  dragging,
  offset: dragOffset,
  scrollEl,
  drag,
  dragFromContent,
  reset: resetDrag,
} = useSheetDrag(() => {
  sheet.value = false;
});

function openSheet() {
  if (sheetMode.value) {
    sheet.value = true;
  }
}

// The panel lists what the user can switch to, so it wants its data ready
// before it opens rather than while it is being read.
useWorkspacePrefetch();

function param(key: string): string | undefined {
  const value = route.params[key];
  return Array.isArray(value) ? value[0] : value;
}

const icon = computed<string>(() => {
  switch (area.value) {
    case 'events':
      return 'cabin';
    case 'newsletters':
      return 'mail';
    case 'organizations':
      return 'apartment';
    default:
      return 'manage_accounts';
  }
});

/** The name of the entity being managed, once it is known. */
const entityName = computed<string | undefined>(() => {
  switch (area.value) {
    case 'events':
      return param('eventId') ? to(eventDetailsStore.data?.name) : undefined;
    case 'newsletters':
      return newsletterStore.data?.find((n) => n.id === param('newsletterId'))
        ?.name;
    case 'organizations':
      return param('organizationId')
        ? organizationDetailsStore.data?.name
        : undefined;
    default:
      return undefined;
  }
});

/** Falls back to the area name, which is what index pages show. */
const areaName = computed<string>(() => {
  switch (area.value) {
    case 'events':
      return t('area.events');
    case 'newsletters':
      return t('area.newsletters');
    case 'organizations':
      return t('area.organizations');
    default:
      return t('area.administration');
  }
});

const label = computed<string>(() => entityName.value || areaName.value);

// Names the area the entity belongs to. On an index page the label already is
// the area name, so a caption would only repeat it.
const sheetCaption = computed<string | undefined>(() =>
  entityName.value ? areaName.value : undefined,
);

const loading = computed<boolean>(() => {
  switch (area.value) {
    case 'events':
      return !!param('eventId') && eventDetailsStore.isLoading;
    case 'organizations':
      return !!param('organizationId') && organizationDetailsStore.isLoading;
    default:
      return false;
  }
});
</script>

<style scoped>
.workspace-switcher {
  /* Standing in for the toolbar title, so it holds a title's worth of room
     even when the name is short. Capped at the space the toolbar has left —
     on a 320px screen that is ~190px, after the menu and profile buttons —
     so the control can never push its neighbours out. */
  min-width: min(180px, 100%);
  /* Grow into the space the toolbar has left rather than sitting at whatever
     width the current entity's name happens to need. */
  max-width: 100%;
}

.workspace-switcher :deep(.q-btn__content) {
  flex-wrap: nowrap;
  justify-content: flex-start;
  min-width: 0;
  max-width: 100%;
}

.workspace-switcher__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* This is the page title on a phone, not a button caption — the button's own
     14px reads as fine print in a 64px toolbar. Height is unaffected: 16px at
     this line height still clears the 40px the button already had. */
  font-size: 16px;
  line-height: 1.25;
}

.workspace-switcher__chevron {
  flex: 0 0 auto;
  /* Trailing edge, so the room the min-width holds open falls between label
     and caret — the pill reads as a control rather than as a short label with
     space left over after it. */
  margin-left: auto;
  padding-left: 6px;
}

.workspace-switcher-sheet {
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 100%;
  /* Leaves the page visible above it, so the sheet reads as a layer over the
     workspace rather than as a new screen. */
  max-height: 80vh;

  border-radius: 28px 28px 0 0;
  background: var(--md3-surface-container-low);

  /* Only for the release: while a finger is on it the sheet has to track that
     finger exactly, so the transition is off. */
  transition: transform 220ms cubic-bezier(0.2, 0, 0, 1);
  will-change: transform;
}

.workspace-switcher-sheet--dragging {
  transition: none;
}

.workspace-switcher-sheet__header {
  flex: 0 0 auto;
  padding: 0 20px 12px;

  cursor: grab;
  user-select: none;
  /* The browser must not claim the gesture — scrolling and pull-to-refresh
     would both fight the drag. */
  touch-action: none;
}

.workspace-switcher-sheet--dragging .workspace-switcher-sheet__header {
  cursor: grabbing;
}

/* Drag handle: both the affordance and the target. */
.workspace-switcher-sheet__grip {
  width: 32px;
  height: 4px;
  margin: 12px auto 16px;

  border-radius: 2px;
  background: var(--md3-outline-variant);
}

/* Wraps rather than truncates: this is the one place the full name of the
   current workspace is readable on a phone. */
.workspace-switcher-sheet__name {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--md3-on-surface);
  overflow-wrap: anywhere;
}

.workspace-switcher-sheet__area {
  font-size: 12px;
  line-height: 1.3;
  color: var(--md3-on-surface-variant);
}

.workspace-switcher-sheet__scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  /* Reaching the end of the list must not start scrolling the page behind. */
  overscroll-behavior: contain;
  padding-bottom: env(safe-area-inset-bottom);
}

.workspace-switcher-rail__btn {
  min-height: 32px;
  padding: 0 6px;
}

.workspace-switcher-rail__name {
  max-width: 84px;
  margin-top: 4px;

  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
switch: 'Switch to'
area:
  events: 'Events'
  newsletters: 'Newsletters'
  organizations: 'Organizations'
  administration: 'Administration'
</i18n>

<i18n lang="yaml" locale="de">
switch: 'Wechseln zu'
area:
  events: 'Veranstaltungen'
  newsletters: 'Newsletter'
  organizations: 'Organisationen'
  administration: 'Verwaltung'
</i18n>

<i18n lang="yaml" locale="fr">
switch: 'Aller à'
area:
  events: 'Événements'
  newsletters: 'Newsletters'
  organizations: 'Organisations'
  administration: 'Administration'
</i18n>

<i18n lang="yaml" locale="pl">
switch: 'Przejdź do'
area:
  events: 'Wydarzenia'
  newsletters: 'Newslettery'
  organizations: 'Organizacje'
  administration: 'Administracja'
</i18n>

<i18n lang="yaml" locale="cs">
switch: 'Přejít na'
area:
  events: 'Akce'
  newsletters: 'Newslettery'
  organizations: 'Organizace'
  administration: 'Administrace'
</i18n>
