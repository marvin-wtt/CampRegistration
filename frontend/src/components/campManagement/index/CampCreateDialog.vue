<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none camp-create-dialog-card">
      <q-btn
        icon="close"
        class="absolute-top-right z-top"
        style="margin: 8px"
        flat
        dense
        round
        @click="onDialogHide"
      />

      <q-stepper
        v-model="step"
        vertical
        color="primary"
        animated
        flat
        header-nav
      >
        <!-- Organization -->
        <camp-edit-step
          v-model="step"
          :name="0"
          :title="t('step.organization')"
          icon="apartment"
        >
          <q-select
            v-model="data.organizationId"
            :label="t('field.organization')"
            :options="organizationOptions"
            :rules="[
              (val?: string) => !!val || t('rule.organization_required'),
            ]"
            hide-bottom-space
            outlined
            rounded
            emit-value
            map-options
            data-test="camp-organization"
          />

          <div class="row items-center justify-between q-mt-xs">
            <q-btn
              :label="t('organization_note.title')"
              icon="info"
              size="md"
              flat
              dense
              no-caps
              rounded
            >
              <q-menu>
                <div class="organization-note q-pa-md">
                  <ul class="q-my-none q-pl-md">
                    <li>{{ t('organization_note.entity') }}</li>
                    <li>{{ t('organization_note.access') }}</li>
                    <li>{{ t('organization_note.organizer') }}</li>
                    <li>{{ t('organization_note.create') }}</li>
                  </ul>
                </div>
              </q-menu>
            </q-btn>

            <q-btn
              :label="t('organization_note.create_action')"
              icon="add"
              color="primary"
              size="sm"
              flat
              dense
              no-caps
              rounded
              @click="createOrganization"
            />
          </div>

          <q-banner
            v-if="selectedOrganizationUnverified"
            dense
            class="draft-note rounded-md q-mt-sm"
          >
            <template #avatar>
              <q-icon name="info" />
            </template>
            {{ t('unverified_notice') }}
          </q-banner>
        </camp-edit-step>

        <!-- Template -->
        <camp-edit-step
          v-model="step"
          :name="1"
          :title="t('step.template')"
          icon="settings"
        >
          <!-- Preset -->
          <q-select
            v-model="data.preset"
            :label="t('field.use_template')"
            :options="presetOptions"
            :disable="data.referenceCampId != null"
            outlined
            rounded
            emit-value
            map-options
          >
            <template #selected-item="scope">
              <span class="ellipsis">
                {{ scope.opt.label }}
              </span>
            </template>
          </q-select>

          <!-- Template -->
          <q-select
            v-if="!data.preset || data.referenceCampId"
            v-model="data.referenceCampId"
            :label="t('field.template')"
            :options="referenceCampOptions"
            :rules="[
              (val?: string) => !!val || t('validation.referenceCampId.empty'),
            ]"
            clearable
            outlined
            rounded
            emit-value
            map-options
            @clear="clearReferenceCamp()"
          >
            <template #before>
              <q-icon name="content_copy" />
            </template>
            <template #selected-item="scope">
              <span class="ellipsis">
                {{ scope.opt.label }}
              </span>
            </template>
          </q-select>
        </camp-edit-step>

        <!-- General -->
        <camp-edit-step
          v-model="step"
          :name="2"
          :title="t('step.general')"
          icon="info"
        >
          <!-- Countries -->
          <country-select
            v-model="data.countries"
            :disable="loading"
            :label="t('field.countries')"
            :countries="['de', 'fr', 'gb', 'pl', 'cz']"
            :rules="[
              (val?: string[]) =>
                (val && val.length > 0) || t('validation.countries.empty'),
            ]"
            hide-bottom-space
            outlined
            rounded
            multiple
          >
            <template #before>
              <q-icon name="language" />
            </template>
          </country-select>

          <!-- name -->
          <translated-input
            v-model="data.name"
            :disable="loading"
            :label="t('field.name')"
            :locales="data.countries"
            :rules="[
              (val?: string) => !!val || t('validation.name.empty'),
              (val: string) => val.length <= 255 || t('validation.name.length'),
            ]"
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon name="title" />
            </template>
          </translated-input>
        </camp-edit-step>

        <!-- Organizer -->
        <camp-edit-step
          v-model="step"
          :name="3"
          :title="t('step.organizer')"
          icon="business"
        >
          <!-- organizer -->
          <translated-input
            v-model="data.organizer"
            :disable="loading"
            :label="t('field.organizer')"
            :locales="data.countries"
            :rules="[
              (val?: string) => !!val || t('validation.organizer.empty'),
              (val: string) =>
                val.length <= 255 || t('validation.organizer.length'),
            ]"
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon name="corporate_fare" />
            </template>
          </translated-input>

          <!-- contact email -->
          <translated-input
            v-model="data.contactEmail"
            :disable="loading"
            :label="t('field.contactEmail')"
            :locales="data.countries"
            :rules="[
              (val?: string) => !!val || t('validation.contactEmail.empty'),
            ]"
            type="email"
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon name="email" />
            </template>
          </translated-input>
        </camp-edit-step>

        <!-- Date -->
        <camp-edit-step
          v-model="step"
          :name="4"
          :title="t('step.dates')"
          icon="calendar_month"
        >
          <!-- dates -->
          <date-range-input
            v-model:from="data.startAt"
            v-model:to="data.endAt"
            :default-start-time="defaultStartTime"
            :default-end-time="defaultEndTime"
            :disable="loading"
            :label="t('field.dateRange')"
            :rules="[
              (val?: string) => !!val || t('validation.dateRange.empty'),
            ]"
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon name="event" />
            </template>
          </date-range-input>

          <!-- Times -->
          <div class="row">
            <time-input
              v-model="data.startAt"
              :disable="loading"
              :label="t('field.startTime')"
              :rules="[
                (val?: string) => !!val || t('validation.startAt.empty'),
              ]"
              class="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6"
              hide-bottom-space
              outlined
              rounded
            >
              <template #before>
                <q-icon name="schedule" />
              </template>
            </time-input>

            <time-input
              v-model="data.endAt"
              :disable="loading"
              :label="t('field.endTime')"
              :rules="[
                (val?: string) => !!val || t('validation.endAt.empty'),
                () =>
                  !data.startAt ||
                  !data.endAt ||
                  new Date(data.endAt) > new Date(data.startAt) ||
                  t('validation.endAt.min'),
              ]"
              class="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6"
              hide-bottom-space
              outlined
              rounded
            >
              <template #before>
                <!-- Invalid name for spacing -->
                <q-icon name="none" />
              </template>
            </time-input>
          </div>
        </camp-edit-step>

        <!-- Participants -->
        <camp-edit-step
          v-model="step"
          :name="5"
          :title="t('step.participants')"
          icon="people"
        >
          <!-- participants -->
          <translated-input
            v-model.number="data.maxParticipants"
            :disable="loading"
            :label="t('field.maxParticipants')"
            :locales="data.countries"
            :rules="[
              (val?: number) => !!val || t('validation.maxParticipants.empty'),
              (val: number) =>
                val >= 0 || t('validation.maxParticipants.positive'),
            ]"
            always
            hide-bottom-space
            outlined
            rounded
            type="number"
          >
            <template #before>
              <q-icon name="group" />
            </template>
          </translated-input>

          <!-- age -->
          <!-- minAge -->
          <q-input
            v-model.number="data.minAge"
            :disable="loading"
            :label="t('field.minAge')"
            :rules="[
              (val?: number) => val != null || t('validation.minAge.empty'),
              (val: number) => val >= 0 || t('validation.minAge.nonNegative'),
              (val: number) => val < 100 || t('validation.minAge.max'),
            ]"
            hide-bottom-space
            outlined
            rounded
            type="number"
          >
            <template #before>
              <q-icon name="remove" />
            </template>
          </q-input>

          <!-- maxAge -->
          <q-input
            v-model.number="data.maxAge"
            :disable="loading"
            :label="t('field.maxAge')"
            :rules="[
              (val: number) => val != null || t('validation.maxAge.empty'),
              (val: number) =>
                (data.minAge != null && val >= data.minAge) ||
                t('validation.maxAge.min'),
              (val: number) => val < 100 || t('validation.minAge.max'),
            ]"
            hide-bottom-space
            outlined
            rounded
            type="number"
          >
            <template #before>
              <q-icon name="add" />
            </template>
          </q-input>

          <q-select
            v-model="data.confirmationMode"
            :label="t('field.confirmation_mode')"
            :options="confirmationModeOptions"
            hide-bottom-space
            emit-value
            map-options
            outlined
            rounded
          >
            <template #before>
              <q-icon name="how_to_reg" />
            </template>
          </q-select>
        </camp-edit-step>

        <!-- Camp Details -->
        <camp-edit-step
          v-model="step"
          :name="6"
          :title="t('step.details')"
          icon="edit"
        >
          <!-- location -->
          <translated-input
            v-model="data.location"
            :disable="loading"
            :label="t('field.location')"
            :locales="data.countries"
            :rules="[
              (val?: string) => !!val || t('validation.location.empty'),
              (val: string) =>
                val.length < 255 || t('validation.location.length'),
            ]"
            hide-bottom-space
            outlined
            rounded
          >
            <template #before>
              <q-icon name="map" />
            </template>
          </translated-input>

          <!-- price -->
          <q-input
            v-model.number="data.price"
            :disable="loading"
            :label="t('field.price')"
            :rules="[
              (val?: number) => val != null || t('validation.price.empty'),
              (val: number) => val >= 0 || t('validation.price.nonNegative'),
            ]"
            hide-bottom-space
            input-class="text-right"
            outlined
            rounded
            suffix="€"
            type="number"
          >
            <template #before>
              <q-icon name="euro" />
            </template>
          </q-input>
        </camp-edit-step>

        <!-- Visibility -->
        <camp-edit-step
          v-model="step"
          :name="7"
          :title="t('step.settings')"
          icon="settings"
          last
          @next-step="onComplete"
        >
          <!-- Public -->
          <q-toggle
            v-model="data.public"
            :label="t('field.public')"
            :disable="selectedOrganizationUnverified"
          />
          <div
            v-if="selectedOrganizationUnverified"
            class="text-caption text-grey-7"
          >
            {{ t('unverified_notice') }}
          </div>
        </camp-edit-step>
      </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  date as dateUtil,
  type QSelectOption,
  useDialogPluginComponent,
} from 'quasar';
import TimeInput from '@/components/common/inputs/TimeInput.vue';
import CampEditStep from '@/components/campManagement/settings/create/CampEditStep.vue';
import CountrySelect from '@/components/common/CountrySelect.vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import DateRangeInput from '@/components/common/inputs/DateRangeInput.vue';
import { computed, onMounted, ref, watch } from 'vue';
import type {
  Camp,
  CampCreateData,
  CampDetails,
  Organization,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useCampsStore } from '@/stores/camps-store';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import OrganizationCreateDialog from '@/components/organization/OrganizationCreateDialog.vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const assignedCampsStore = useAssignedCampsStore();
const campStore = useCampsStore();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const DEFAULT_DATA = {
  confirmationMode: 'AUTOMATIC',
  preset: 'standard',
  // Required by the API; the first step will not advance without it.
  organizationId: '',
} as CampCreateData;

const step = ref<number>(0);
const loading = ref<boolean>(false);
const data = ref<CampCreateData>({
  ...DEFAULT_DATA,
});
const { t } = useI18n();
const { to } = useObjectTranslation();

const organizationsStore = useOrganizationsStore();
const { data: organizations } = storeToRefs(organizationsStore);
const { campCreationOrganizationIds } = useOrganizationPermissions();

const organizationOptions = computed<QSelectOption<string>[]>(() => {
  const eligible = campCreationOrganizationIds.value;

  return (organizations.value ?? [])
    .filter((organization) => eligible.includes(organization.id))
    .map((organization) => ({
      label: organization.name,
      value: organization.id,
    }));
});

const selectedOrganization = computed<Organization | undefined>(() =>
  (organizations.value ?? []).find(
    (organization) => organization.id === data.value.organizationId,
  ),
);

/**
 * An unverified organization may still prepare a camp, but the API refuses to
 * publish it — mirror that here so the toggle cannot promise what it can't do.
 */
const selectedOrganizationUnverified = computed<boolean>(() => {
  const selected = selectedOrganization.value;

  return selected !== undefined && selected.verificationStatus !== 'VERIFIED';
});

// The organizer is almost always the owning organization, so offer its name.
// A field still holding the previous organization's name was filled in here and
// may be replaced; anything else was typed by hand and survives.
watch(selectedOrganization, (organization, previous) => {
  const organizer = data.value.organizer;
  const edited =
    organizer !== undefined && organizer !== '' && organizer !== previous?.name;

  // A cloned camp takes its organizer from the reference camp instead.
  if (edited || organization === undefined || data.value.referenceCampId) {
    return;
  }

  data.value.organizer = organization.name;
});

watch(selectedOrganizationUnverified, (unverified) => {
  if (unverified) {
    data.value.public = false;
  }
});

onMounted(async () => {
  await organizationsStore.fetchData();

  // Skip a pointless choice when there is only one.
  const eligible = organizationOptions.value;
  if (eligible.length === 1) {
    data.value.organizationId = eligible[0]!.value;
  }
});

const referenceCamp = computed<Camp | undefined>(() => {
  return assignedCampsStore.data?.find(
    (camp) => camp.id === data.value.referenceCampId,
  );
});

// Pre-fill the times of the reference camp when dates are picked
const defaultStartTime = computed<string | undefined>(() =>
  toTime(referenceCamp.value?.startAt),
);
const defaultEndTime = computed<string | undefined>(() =>
  toTime(referenceCamp.value?.endAt),
);

function toTime(iso?: string): string | undefined {
  return iso ? dateUtil.formatDate(new Date(iso), 'HH:mm') : undefined;
}

type ReferenceCampOptions = QSelectOption<string | undefined>[];
const referenceCampOptions = computed<ReferenceCampOptions>(() => {
  return (assignedCampsStore.data ?? [])
    .map((camp): QSelectOption => ({
      value: camp.id,
      label: to(camp.name),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const confirmationModeOptions = computed<
  QSelectOption<CampCreateData['confirmationMode']>[]
>(() => {
  return [
    {
      label: t('confirmation_mode.automatic'),
      value: 'AUTOMATIC',
    },
    {
      label: t('confirmation_mode.manual'),
      value: 'MANUAL',
    },
  ];
});

const presetOptions = computed<QSelectOption<CampCreateData['preset']>[]>(
  () => {
    return [
      {
        label: t('preset.standard'),
        value: 'standard',
      },
      {
        label: t('preset.minimal'),
        value: 'minimal',
      },
      {
        label: t('preset.otherCamp'),
        value: null,
      },
    ];
  },
);

watch(
  () => data.value.referenceCampId,
  () => {
    const refCamp = referenceCamp.value;
    if (!refCamp) {
      return;
    }

    // The organization default is only a stand-in for a reference camp, so the
    // reference camp's organizer replaces it. Anything typed by hand stays.
    if (data.value.organizer === selectedOrganization.value?.name) {
      data.value.organizer = refCamp.organizer;
    }

    const copyKeys = [
      'countries',
      'name',
      'organizer',
      'contactEmail',
      'maxParticipants',
      'minAge',
      'maxAge',
      'location',
      'price',
      'public',
      'confirmationMode',
    ] as const satisfies ReadonlyArray<
      keyof CampCreateData & keyof CampDetails
    >;

    for (const key of copyKeys) {
      if (data.value[key] === undefined) {
        data.value[key] = refCamp[key] as never;
      }
    }
  },
);

async function onComplete() {
  loading.value = true;
  // Create camp
  try {
    await campStore.createEntry(data.value);

    onDialogOK();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (ignored) {
    loading.value = false;
    step.value--;
  }
}

// Drops what the reference camp filled in, but not the organization: that is
// picked on step 1, before a template is ever chosen, and silently clearing it
// makes an earlier step invalid again with nothing on screen to say so.
function clearReferenceCamp() {
  data.value = {
    ...DEFAULT_DATA,
    organizationId: data.value.organizationId,
  };
}

/**
 * Founding an organization mid-flow rather than sending the user to the
 * organizations page, which would cost them the form. The store adds it to the
 * options and refreshes the profile the permission filter reads, so the new
 * organization can be selected straight away.
 */
function createOrganization() {
  quasar
    .dialog({ component: OrganizationCreateDialog })
    .onOk((organization: Organization) => {
      data.value.organizationId = organization.id;
    });
}
</script>

<style scoped>
.camp-create-dialog-card {
  width: 500px;
}

.draft-note {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.organization-note {
  max-width: 340px;
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
step:
  organization: 'Organization'
  general: 'General'
  template: 'Template'
  details: 'Details'
  organizer: 'Organizer'
  dates: 'Dates'
  participants: 'Participants'
  settings: 'Settings'

organization_note:
  title: 'Why an organization?'
  entity: "It's the legal entity the camp runs under, accountable for it and for the data collected through it, and verified by us."
  access: 'Its administrators never see registrations. They can view and edit the camp itself and see who manages it — nothing more.'
  organizer: "It doesn't have to be the name participants see; you set that separately as the organizer."
  create: "If this camp doesn't belong to any of the organizations listed, you can create a new one."
  create_action: 'New organization'

unverified_notice: 'This organization is awaiting verification. The camp will be saved as a private draft and cannot be published or open registration until it is verified.'
rule:
  organization_required: 'Please choose an organization'
field:
  organization: 'Organization'
  countries: 'Countries'
  name: 'Camp name'
  use_template: 'Preset'
  template: 'Camp'
  organizer: 'Organizer'
  contactEmail: 'Contact email'
  maxParticipants: 'Maximum number of participants'
  dateRange: 'Start and end date'
  startTime: 'Start time'
  endTime: 'End time'
  minAge: 'Minimum age'
  maxAge: 'Maximum age'
  confirmation_mode: 'Accept registrations'
  location: 'Location'
  price: 'Price'
  public: 'Show camp on main page'

preset:
  standard: 'Standard'
  minimal: 'Minimal'
  otherCamp: 'Copy from another camp'

validation:
  countries:
    empty: 'Please select at least one countryQuestion'
  referenceCampId:
    empty: 'Please select a camp to copy from'
  name:
    empty: 'Please enter a camp name'
    length: 'Camp name must not exceed 255 characters'
  organizer:
    empty: 'Please enter the organizer'
  contactEmail:
    empty: 'Please enter an email address'
  maxParticipants:
    empty: 'Please enter the maximum number of participants'
    positive: 'Maximum participants must be a positive number'
  dateRange:
    empty: 'Please select a start and end date'
  startAt:
    empty: 'Please select a start time'
  endAt:
    empty: 'Please select an end time'
    min: 'End time must be after the start time'
  minAge:
    empty: 'Please enter a minimum age'
    nonNegative: 'Minimum age must not be negative'
    max: 'Minimum age must be less than 100'
  maxAge:
    empty: 'Please enter a maximum age'
    min: 'Maximum age must be greater than or equal to the minimum age'
    max: 'Maximum age must be less than 100'
  location:
    empty: 'Please enter a location'
    length: 'Location must not exceed 255 characters'
  price:
    empty: 'Please enter a price greater than or equal to 0'
    nonNegative: 'Price must not be negative'

confirmation_mode:
  automatic: 'Automatic'
  manual: 'Manual'
</i18n>

<i18n lang="yaml" locale="de">
step:
  organization: 'Organisation'
  general: 'Allgemein'
  template: 'Vorlage'
  details: 'Details'
  organizer: 'Organisator'
  dates: 'Termine'
  participants: 'Teilnehmer'
  settings: 'Einstellungen'

organization_note:
  title: 'Warum eine Organisation?'
  entity: 'Sie ist der Rechtsträger, unter dem das Camp läuft, verantwortlich für das Camp und die darüber erhobenen Daten – und von uns geprüft.'
  access: 'Ihre Administratoren sehen niemals Anmeldungen. Sie können das Camp selbst ansehen und bearbeiten und sehen, wer es leitet – mehr nicht.'
  organizer: 'Sie muss nicht der Name sein, den Teilnehmende sehen; den legst du separat als Veranstalter fest.'
  create: 'Gehört dieses Camp zu keiner der aufgeführten Organisationen, kannst du eine neue anlegen.'
  create_action: 'Neue Organisation'

unverified_notice: 'Diese Organisation wartet auf die Verifizierung. Das Camp wird als privater Entwurf gespeichert und kann bis dahin nicht veröffentlicht werden.'
rule:
  organization_required: 'Bitte wähle eine Organisation'
field:
  organization: 'Organisation'
  countries: 'Länder'
  name: 'Camp Name'
  use_template: 'Vorlage'
  template: 'Camp'
  organizer: 'Veranstalter'
  contactEmail: 'Kontakt-Email'
  maxParticipants: 'Maximale Teilnehmeranzahl'
  dateRange: 'Start- und Enddatum'
  startTime: 'Startzeit'
  endTime: 'Endzeit'
  minAge: 'Mindestalter'
  maxAge: 'Maximalalter'
  confirmation_mode: 'Anmeldungen annehmen'
  location: 'Ort'
  price: 'Preis'
  public: 'Camp auf Startseite anzeigen'

preset:
  standard: 'Standard'
  minimal: 'Minimal'
  otherCamp: 'Von einem anderen Camp kopieren'

validation:
  countries:
    empty: 'Bitte wählen Sie mindestens ein Land aus'
  referenceCampId:
    empty: 'Bitte wähle ein Camp aus, von dem kopiert werden soll'
  name:
    empty: 'Bitte geben Sie einen Camp-Namen ein'
    length: 'Der Camp-Name darf maximal 255 Zeichen haben'
  organizer:
    empty: 'Bitte geben Sie ein Veranstalter an'
  contactEmail:
    empty: 'Bitte geben Sie eine Email Adresse an'
  maxParticipants:
    empty: 'Bitte geben Sie die maximale Teilnehmerzahl ein'
    positive: 'Die maximale Teilnehmerzahl muss eine positive Zahl sein'
  dateRange:
    empty: 'Bitte wählen Sie ein Start- und Enddatum aus'
  startAt:
    empty: 'Bitte wählen Sie eine Startzeit aus'
  endAt:
    empty: 'Bitte wählen Sie eine Endzeit aus'
    min: 'Die Endzeit muss nach der Startzeit liegen'
  minAge:
    empty: 'Bitte geben Sie ein Mindestalter ein'
    nonNegative: 'Das Mindestalter darf nicht negativ sein'
    max: 'Das Mindestalter muss kleiner als 100 sein'
  maxAge:
    empty: 'Bitte geben Sie ein Höchstalter ein'
    min: 'Das Höchstalter muss größer oder gleich dem Mindestalter sein'
    max: 'Das Höchstalter muss kleiner als 100 sein'
  location:
    empty: 'Bitte geben Sie einen Ort ein'
    length: 'Der Ort darf maximal 255 Zeichen haben'
  price:
    empty: 'Bitte geben Sie einen Preis größer oder gleich 0 ein'
    nonNegative: 'Der Preis darf nicht negativ sein'

confirmation_mode:
  automatic: 'Automatisch'
  manual: 'Manuell'
</i18n>

<i18n lang="yaml" locale="fr">
step:
  organization: 'Organisation'
  general: 'Général'
  template: 'Modèle'
  details: 'Détails'
  organizer: 'Organisateur'
  dates: 'Dates'
  participants: 'Participants'
  settings: 'Paramètres'

organization_note:
  title: 'Pourquoi une organisation ?'
  entity: "C'est l'entité juridique sous laquelle le camp est organisé, responsable du camp et des données collectées par son intermédiaire, et vérifiée par nos soins."
  access: "Ses administrateurs ne voient jamais les inscriptions. Ils peuvent consulter et modifier le camp lui-même et voir qui l'encadre — rien de plus."
  organizer: "Ce n'est pas forcément le nom que voient les participants ; celui-ci se définit séparément comme organisateur."
  create: "Si ce camp n'appartient à aucune des organisations proposées, vous pouvez en créer une."
  create_action: 'Nouvelle organisation'

unverified_notice: 'Cette organisation attend sa vérification. Le camp sera enregistré comme brouillon privé et ne pourra pas être publié avant.'
rule:
  organization_required: 'Choisis une organisation'
field:
  organization: 'Organisation'
  countries: 'Pays'
  name: 'Nom du camp'
  use_template: 'Modèle'
  template: 'Camp'
  organizer: 'Organisateur'
  contactEmail: 'Email de contact'
  maxParticipants: 'Nombre maximum de participants'
  dateRange: 'Date de début et de fin'
  startTime: 'Heure de début'
  endTime: 'Heure de fin'
  minAge: 'Âge minimum'
  maxAge: 'Âge maximum'
  confirmation_mode: 'Accepter les inscriptions'
  location: 'Emplacement'
  price: 'Prix'
  public: "Afficher le camp sur la page d'accueil"

preset:
  standard: 'Standard'
  minimal: 'Minimal'
  otherCamp: 'Copier depuis un autre camp'

validation:
  countries:
    empty: 'Veuillez sélectionner au moins un pays'
  referenceCampId:
    empty: 'Veuillez sélectionner un camp à copier'
  name:
    empty: 'Veuillez entrer un nom de camp'
    length: 'Le nom du camp ne doit pas dépasser 255 caractères'
  organizer:
    empty: "Veuillez entrer l'organisateur"
  contactEmail:
    empty: 'Veuillez entrer un email'
  maxParticipants:
    empty: 'Veuillez entrer le nombre maximum de participants'
    positive: 'Le nombre maximum de participants doit être un nombre positif'
  dateRange:
    empty: 'Veuillez sélectionner une date de début et de fin'
  startAt:
    empty: 'Veuillez sélectionner une heure de début'
  endAt:
    empty: 'Veuillez sélectionner une heure de fin'
    min: "L'heure de fin doit être postérieure à l'heure de début"
  minAge:
    empty: 'Veuillez entrer un âge minimum'
    nonNegative: "L'âge minimum ne doit pas être négatif"
    max: "L'âge minimum doit être inférieur à 100"
  maxAge:
    empty: 'Veuillez entrer un âge maximum'
    min: "L'âge maximum doit être supérieur ou égal à l'âge minimum"
    max: "L'âge maximum doit être inférieur à 100"
  location:
    empty: 'Veuillez entrer un lieu'
    length: 'Le lieu ne doit pas dépasser 255 caractères'
  price:
    empty: 'Veuillez entrer un prix supérieur ou égal à 0'
    nonNegative: 'Le prix ne doit pas être négatif'

confirmation_mode:
  automatic: 'Automatique'
  manual: 'Manuel'
</i18n>

<i18n lang="yaml" locale="pl">
step:
  organization: 'Organizacja'
  general: 'Ogólne'
  template: 'Szablon'
  details: 'Szczegóły'
  organizer: 'Organizator'
  dates: 'Terminy'
  participants: 'Uczestnicy'
  settings: 'Ustawienia'

organization_note:
  title: 'Dlaczego organizacja?'
  entity: 'To podmiot prawny, w ramach którego działa obóz, odpowiedzialny za obóz i za zbierane w nim dane, zweryfikowany przez nas.'
  access: 'Jej administratorzy nigdy nie widzą zgłoszeń. Mogą przeglądać i edytować sam obóz oraz zobaczyć, kto go prowadzi — nic więcej.'
  organizer: 'Nie musi to być nazwa widoczna dla uczestników; tę ustawiasz osobno jako organizatora.'
  create: 'Jeśli ten obóz nie należy do żadnej z wymienionych organizacji, możesz utworzyć nową.'
  create_action: 'Nowa organizacja'

unverified_notice: 'Ta organizacja oczekuje na weryfikację. Obóz zostanie zapisany jako prywatna wersja robocza i nie będzie mógł zostać opublikowany.'
rule:
  organization_required: 'Wybierz organizację'
field:
  organization: 'Organizacja'
  countries: 'Kraje'
  name: 'Nazwa obozu'
  use_template: 'Szablon'
  template: 'Obóz'
  organizer: 'Organizator'
  contactEmail: 'E-mail kontaktowy'
  maxParticipants: 'Maksymalna liczba uczestników'
  dateRange: 'Data rozpoczęcia i zakończenia'
  startTime: 'Godzina rozpoczęcia'
  endTime: 'Godzina zakończenia'
  minAge: 'Minimalny wiek'
  maxAge: 'Maksymalny wiek'
  confirmation_mode: 'Przyjmowanie zgłoszeń'
  location: 'Miejsce'
  price: 'Cena'
  public: 'Pokaż obóz na stronie głównej'

preset:
  standard: 'Standard'
  minimal: 'Minimalny'
  otherCamp: 'Skopiuj z innego obozu'

validation:
  countries:
    empty: 'Wybierz co najmniej jeden kraj'
  referenceCampId:
    empty: 'Wybierz obóz, z którego chcesz skopiować'
  name:
    empty: 'Podaj nazwę obozu'
    length: 'Nazwa obozu może mieć maksymalnie 255 znaków'
  organizer:
    empty: 'Podaj organizatora'
  contactEmail:
    empty: 'Podaj adres e-mail'
  maxParticipants:
    empty: 'Podaj maksymalną liczbę uczestników'
    positive: 'Maksymalna liczba uczestników musi być liczbą dodatnią'
  dateRange:
    empty: 'Wybierz datę rozpoczęcia i zakończenia'
  startAt:
    empty: 'Wybierz godzinę rozpoczęcia'
  endAt:
    empty: 'Wybierz godzinę zakończenia'
    min: 'Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia'
  minAge:
    empty: 'Podaj minimalny wiek'
    nonNegative: 'Minimalny wiek nie może być liczbą ujemną'
    max: 'Minimalny wiek musi być mniejszy niż 100'
  maxAge:
    empty: 'Podaj maksymalny wiek'
    min: 'Maksymalny wiek musi być większy lub równy minimalnemu wiekowi'
    max: 'Maksymalny wiek musi być mniejszy niż 100'
  location:
    empty: 'Podaj miejsce'
    length: 'Miejsce może mieć maksymalnie 255 znaków'
  price:
    empty: 'Podaj cenę większą lub równą 0'
    nonNegative: 'Cena nie może być ujemna'

confirmation_mode:
  automatic: 'Automatyczny'
  manual: 'Ręczny'
</i18n>

<i18n lang="yaml" locale="cs">
step:
  organization: 'Organizace'
  general: 'Obecné'
  template: 'Šablona'
  details: 'Podrobnosti'
  organizer: 'Organizátor'
  dates: 'Termíny'
  participants: 'Účastníci'
  settings: 'Nastavení'

organization_note:
  title: 'Proč organizace?'
  entity: 'Je to právní subjekt, pod kterým tábor běží, odpovědný za tábor i za data prostřednictvím něj shromážděná, a námi ověřený.'
  access: 'Její správci nikdy nevidí přihlášky. Mohou zobrazit a upravit samotný tábor a vidět, kdo jej vede — nic víc.'
  organizer: 'Nemusí to být jméno, které vidí účastníci; to nastavíte zvlášť jako organizátora.'
  create: 'Pokud tento tábor nepatří k žádné z uvedených organizací, můžete vytvořit novou.'
  create_action: 'Nová organizace'

unverified_notice: 'Tato organizace čeká na ověření. Tábor bude uložen jako soukromý koncept a nelze jej zatím zveřejnit.'
rule:
  organization_required: 'Vyber organizaci'
field:
  organization: 'Organizace'
  countries: 'Země'
  name: 'Název tábora'
  use_template: 'Šablona'
  template: 'Tábor'
  organizer: 'Organizátor'
  contactEmail: 'Kontaktní e-mail'
  maxParticipants: 'Maximální počet účastníků'
  dateRange: 'Datum začátku a konce'
  startTime: 'Čas začátku'
  endTime: 'Čas konce'
  minAge: 'Minimální věk'
  maxAge: 'Maximální věk'
  confirmation_mode: 'Přijímání přihlášek'
  location: 'Místo'
  price: 'Cena'
  public: 'Zobrazit tábor na úvodní stránce'

preset:
  standard: 'Standard'
  minimal: 'Minimální'
  otherCamp: 'Zkopírovat z jiného tábora'

validation:
  countries:
    empty: 'Vyberte alespoň jednu zemi'
  referenceCampId:
    empty: 'Vyberte tábor, ze kterého chcete kopírovat'
  name:
    empty: 'Zadejte název tábora'
    length: 'Název tábora může mít maximálně 255 znaků'
  organizer:
    empty: 'Zadejte organizátora'
  contactEmail:
    empty: 'Zadejte e-mailovou adresu'
  maxParticipants:
    empty: 'Zadejte maximální počet účastníků'
    positive: 'Maximální počet účastníků musí být kladné číslo'
  dateRange:
    empty: 'Vyberte datum začátku a konce'
  startAt:
    empty: 'Vyberte čas začátku'
  endAt:
    empty: 'Vyberte čas konce'
    min: 'Čas konce musí být pozdější než čas začátku'
  minAge:
    empty: 'Zadejte minimální věk'
    nonNegative: 'Minimální věk nesmí být záporný'
    max: 'Minimální věk musí být menší než 100'
  maxAge:
    empty: 'Zadejte maximální věk'
    min: 'Maximální věk musí být větší nebo roven minimálnímu věku'
    max: 'Maximální věk musí být menší než 100'
  location:
    empty: 'Zadejte místo'
    length: 'Místo může mít maximálně 255 znaků'
  price:
    empty: 'Zadejte cenu větší nebo rovnou 0'
    nonNegative: 'Cena nesmí být záporná'

confirmation_mode:
  automatic: 'Automatický'
  manual: 'Manuální'
</i18n>
