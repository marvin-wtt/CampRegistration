<template>
  <q-skeleton
    v-if="loading"
    type="rect"
    :height="rail ? '32px' : '2.5em'"
    :width="rail ? '60px' : '12em'"
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
  <m-btn
    v-else
    tonal
    no-caps
    no-morph
    :aria-label="label"
    class="workspace-switcher"
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

    <q-tooltip>
      {{ label }}
    </q-tooltip>

    <q-menu
      anchor="bottom start"
      self="top start"
    >
      <workspace-switcher-menu />
    </q-menu>
  </m-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import WorkspaceSwitcherMenu from '@/components/layout/WorkspaceSwitcherMenu.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { areaFromRouteName } from '@/components/layout/workspaceArea';

defineProps<{
  rail?: boolean;
}>();

const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const campDetailsStore = useCampDetailsStore();
const organizationDetailsStore = useOrganizationDetailsStore();
const newsletterStore = useNewsletterStore();

const area = computed(() => areaFromRouteName(route.name));

function param(key: string): string | undefined {
  const value = route.params[key];
  return Array.isArray(value) ? value[0] : value;
}

const icon = computed<string>(() => {
  switch (area.value) {
    case 'camps':
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
    case 'camps':
      return param('campId') ? to(campDetailsStore.data?.name) : undefined;
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
    case 'camps':
      return t('area.camps');
    case 'newsletters':
      return t('area.newsletters');
    case 'organizations':
      return t('area.organizations');
    default:
      return t('area.administration');
  }
});

const label = computed<string>(() => entityName.value || areaName.value);

const loading = computed<boolean>(() => {
  switch (area.value) {
    case 'camps':
      return !!param('campId') && campDetailsStore.isLoading;
    case 'organizations':
      return !!param('organizationId') && organizationDetailsStore.isLoading;
    default:
      return false;
  }
});
</script>

<style scoped>
.workspace-switcher {
  min-width: 0;
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
}

.workspace-switcher__chevron {
  flex: 0 0 auto;
  margin-left: 6px;
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
  camps: 'Camps'
  newsletters: 'Newsletters'
  organizations: 'Organizations'
  administration: 'Administration'
</i18n>

<i18n lang="yaml" locale="de">
switch: 'Wechseln zu'
area:
  camps: 'Camps'
  newsletters: 'Newsletter'
  organizations: 'Organisationen'
  administration: 'Verwaltung'
</i18n>

<i18n lang="yaml" locale="fr">
switch: 'Aller à'
area:
  camps: 'Camps'
  newsletters: 'Newsletters'
  organizations: 'Organisations'
  administration: 'Administration'
</i18n>

<i18n lang="yaml" locale="pl">
switch: 'Przejdź do'
area:
  camps: 'Obozy'
  newsletters: 'Newslettery'
  organizations: 'Organizacje'
  administration: 'Administracja'
</i18n>

<i18n lang="yaml" locale="cs">
switch: 'Přejít na'
area:
  camps: 'Tábory'
  newsletters: 'Newslettery'
  organizations: 'Organizace'
  administration: 'Administrace'
</i18n>
