<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none event-create-dialog-card">
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
        <event-edit-step
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
            data-test="event-organization"
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
            class="unverified-note rounded-md q-mt-sm"
          >
            <template #avatar>
              <q-icon name="info" />
            </template>
            {{ t('unverified_notice') }}
          </q-banner>
        </event-edit-step>

        <!-- Template -->
        <event-edit-step
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
            :disable="data.referenceEventId != null"
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
            v-if="!data.preset || data.referenceEventId"
            v-model="data.referenceEventId"
            :label="t('field.template')"
            :options="referenceEventOptions"
            :rules="[
              (val?: string) => !!val || t('validation.referenceEventId.empty'),
            ]"
            clearable
            outlined
            rounded
            emit-value
            map-options
            @clear="clearReferenceEvent()"
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
        </event-edit-step>

        <!-- General -->
        <event-edit-step
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
            :hint="t('field.countries_hint')"
            :countries="['de', 'fr', 'gb', 'pl', 'cz']"
            :rules="[
              (val?: string[]) =>
                (val && val.length > 0) || t('validation.countries.empty'),
            ]"
            :readonly="data.referenceEventId != null"
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
        </event-edit-step>

        <!-- Organizer -->
        <event-edit-step
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
        </event-edit-step>

        <!-- Date -->
        <event-edit-step
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
        </event-edit-step>

        <!-- Participants -->
        <event-edit-step
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
        </event-edit-step>

        <!-- Event Details -->
        <event-edit-step
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
        </event-edit-step>

        <!-- Visibility -->
        <event-edit-step
          v-model="step"
          :name="7"
          :title="t('step.settings')"
          icon="settings"
          last
          @next-step="onComplete"
        >
          <!-- Listed -->
          <q-toggle
            v-model="data.listed"
            :label="t('field.listed')"
            :disable="selectedOrganizationUnverified"
          />
          <div
            v-if="selectedOrganizationUnverified"
            class="text-caption text-grey-7"
          >
            {{ t('unverified_notice') }}
          </div>
        </event-edit-step>
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
import EventEditStep from '@/components/event/settings/create/EventEditStep.vue';
import CountrySelect from '@/components/common/CountrySelect.vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import DateRangeInput from '@/components/common/inputs/DateRangeInput.vue';
import { computed, onMounted, ref, watch } from 'vue';
import type {
  Event,
  EventCreateData,
  EventDetails,
  Organization,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { useEventsStore } from '@/stores/events-store';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import OrganizationCreateDialog from '@/components/organization/OrganizationCreateDialog.vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const assignedEventsStore = useAssignedEventsStore();
const eventStore = useEventsStore();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const DEFAULT_DATA = {
  confirmationMode: 'AUTOMATIC',
  preset: 'standard',
  // Required by the API; the first step will not advance without it.
  organizationId: '',
} as EventCreateData;

const step = ref<number>(0);
const loading = ref<boolean>(false);
const data = ref<EventCreateData>({
  ...DEFAULT_DATA,
});
const { t } = useI18n();
const { to } = useObjectTranslation();

const organizationsStore = useOrganizationsStore();
const { data: organizations } = storeToRefs(organizationsStore);
const { eventCreationOrganizationIds } = useOrganizationPermissions();

const organizationOptions = computed<QSelectOption<string>[]>(() => {
  const eligible = eventCreationOrganizationIds.value;

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
 * An unverified organization may still prepare a event, but the API refuses to
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

  // A cloned event takes its organizer from the reference event instead.
  if (edited || organization === undefined || data.value.referenceEventId) {
    return;
  }

  data.value.organizer = organization.name;
});

watch(selectedOrganizationUnverified, (unverified) => {
  if (unverified) {
    data.value.listed = false;
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

const referenceEvent = computed<Event | undefined>(() => {
  return assignedEventsStore.data?.find(
    (event) => event.id === data.value.referenceEventId,
  );
});

// Pre-fill the times of the reference event when dates are picked
const defaultStartTime = computed<string | undefined>(() =>
  toTime(referenceEvent.value?.startAt),
);
const defaultEndTime = computed<string | undefined>(() =>
  toTime(referenceEvent.value?.endAt),
);

function toTime(iso?: string): string | undefined {
  return iso ? dateUtil.formatDate(new Date(iso), 'HH:mm') : undefined;
}

type ReferenceEventOptions = QSelectOption<string | undefined>[];
const referenceEventOptions = computed<ReferenceEventOptions>(() => {
  return (assignedEventsStore.data ?? [])
    .map((event): QSelectOption => ({
      value: event.id,
      label: to(event.name),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const confirmationModeOptions = computed<
  QSelectOption<EventCreateData['confirmationMode']>[]
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

const presetOptions = computed<QSelectOption<EventCreateData['preset']>[]>(
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
        label: t('preset.otherEvent'),
        value: null,
      },
    ];
  },
);

watch(
  () => data.value.referenceEventId,
  () => {
    const refEvent = referenceEvent.value;
    if (!refEvent) {
      return;
    }

    // The organization default is only a stand-in for a reference event, so the
    // reference event's organizer replaces it. Anything typed by hand stays.
    if (data.value.organizer === selectedOrganization.value?.name) {
      data.value.organizer = refEvent.organizer;
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
      'listed',
      'confirmationMode',
    ] as const satisfies ReadonlyArray<
      keyof EventCreateData & keyof EventDetails
    >;

    for (const key of copyKeys) {
      if (data.value[key] === undefined) {
        data.value[key] = refEvent[key] as never;
      }
    }
  },
);

async function onComplete() {
  loading.value = true;
  // Create event
  try {
    await eventStore.createEntry(data.value);

    onDialogOK();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (ignored) {
    loading.value = false;
    step.value--;
  }
}

// Drops what the reference event filled in, but not the organization: that is
// picked on step 1, before a template is ever chosen, and silently clearing it
// makes an earlier step invalid again with nothing on screen to say so.
function clearReferenceEvent() {
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
.event-create-dialog-card {
  width: 500px;
}

.unverified-note {
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
  entity: "It's the legal entity behind the event. It answers for the event and for the data people enter when they register."
  access: 'Its administrators can view and edit the event and see who manages it. They never see registrations.'
  organizer: 'The event is presented under the organizer, which you set separately. The organization is still visible to participants: next to the organizer in the event list, and in the privacy information.'
  create: "Can't find the right one? Create a new organization."
  create_action: 'New organization'

unverified_notice: 'This organization is not verified. You can set the event up now, but until it is verified the event stays hidden from the public listing and cannot accept registrations.'
rule:
  organization_required: 'Please choose an organization'
field:
  organization: 'Organization'
  countries: 'Countries'
  countries_hint: 'Cannot be changed after the event is created'
  name: 'Event name'
  use_template: 'Preset'
  template: 'Event'
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
  listed: 'Show event on main page'

preset:
  standard: 'Standard'
  minimal: 'Minimal'
  otherEvent: 'Copy from another event'

validation:
  countries:
    empty: 'Please select at least one countryQuestion'
  referenceEventId:
    empty: 'Please select an event to copy from'
  name:
    empty: 'Please enter an event name'
    length: 'Event name must not exceed 255 characters'
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
  entity: 'Sie ist der Rechtsträger hinter der Veranstaltung und verantwortlich für die Daten, die bei der Anmeldung erhoben werden.'
  access: 'Ihre Administratoren können die Veranstaltung ansehen und bearbeiten und sehen, wer es leitet. Anmeldungen sehen sie nie.'
  organizer: 'Die Veranstaltung tritt unter dem Veranstalter auf, den du separat festlegst. Die Organisation sehen Teilnehmende trotzdem: neben dem Veranstalter in der Veranstaltungsliste und in den Datenschutzinformationen.'
  create: 'Ist die passende nicht dabei? Leg eine neue Organisation an.'
  create_action: 'Neue Organisation'

unverified_notice: 'Diese Organisation ist nicht verifiziert. Du kannst die Veranstaltung jetzt einrichten, aber bis zur Verifizierung ist es nicht öffentlich sichtbar und nimmt keine Anmeldungen an.'
rule:
  organization_required: 'Bitte wähle eine Organisation'
field:
  organization: 'Organisation'
  countries: 'Länder'
  countries_hint: 'Kann nach dem Erstellen der Veranstaltung nicht mehr geändert werden'
  name: 'Veranstaltungsname'
  use_template: 'Vorlage'
  template: 'Veranstaltung'
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
  listed: 'Veranstaltung auf Startseite anzeigen'

preset:
  standard: 'Standard'
  minimal: 'Minimal'
  otherEvent: 'Von einer anderen Veranstaltung kopieren'

validation:
  countries:
    empty: 'Bitte wählen Sie mindestens ein Land aus'
  referenceEventId:
    empty: 'Bitte wähle eine Veranstaltung aus, von dem kopiert werden soll'
  name:
    empty: 'Bitte geben Sie einen Veranstaltungsnamen ein'
    length: 'Der Veranstaltungsname darf maximal 255 Zeichen haben'
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
  entity: "C'est l'entité juridique derrière l'événement. Elle répond de l'événement et des données saisies lors des inscriptions."
  access: "Ses administrateurs peuvent consulter et modifier l'événement et voir qui l'encadre. Ils ne voient jamais les inscriptions."
  organizer: "L'événement est présenté sous le nom de l'organisateur, que vous définissez séparément. L'organisation reste visible pour les participants : à côté de l'organisateur dans la liste des événements et dans les informations sur la protection des données."
  create: 'Vous ne trouvez pas la bonne ? Créez une nouvelle organisation.'
  create_action: 'Nouvelle organisation'

unverified_notice: "Cette organisation n'est pas vérifiée. Vous pouvez configurer l'événement dès maintenant, mais tant qu'elle ne l'est pas, il reste masqué de la liste publique et ne peut pas accepter d'inscriptions."
rule:
  organization_required: 'Choisis une organisation'
field:
  organization: 'Organisation'
  countries: 'Pays'
  countries_hint: "Ne peut plus être modifié après la création de l'événement"
  name: "Nom de l'événement"
  use_template: 'Modèle'
  template: 'Événement'
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
  listed: "Afficher l'événement sur la page d'accueil"

preset:
  standard: 'Standard'
  minimal: 'Minimal'
  otherEvent: 'Copier depuis un autre événement'

validation:
  countries:
    empty: 'Veuillez sélectionner au moins un pays'
  referenceEventId:
    empty: 'Veuillez sélectionner un événement à copier'
  name:
    empty: "Veuillez entrer un nom d'événement"
    length: "Le nom de l'événement ne doit pas dépasser 255 caractères"
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
  entity: 'To podmiot prawny stojący za wydarzeniem. Odpowiada za wydarzenie i za dane podawane podczas zapisów.'
  access: 'Jej administratorzy mogą przeglądać i edytować wydarzenie oraz zobaczyć, kto go prowadzi. Nigdy nie widzą zgłoszeń.'
  organizer: 'Wydarzenie występuje pod nazwą organizatora, którą ustawiasz osobno. Organizacja i tak jest widoczna dla uczestników: obok organizatora na liście wydarzeń oraz w informacjach o ochronie danych.'
  create: 'Nie ma tu tej właściwej? Utwórz nową organizację.'
  create_action: 'Nowa organizacja'

unverified_notice: 'Ta organizacja nie jest zweryfikowana. Wydarzenie możesz przygotować już teraz, ale do czasu weryfikacji pozostaje ukryty na liście publicznej i nie przyjmuje zapisów.'
rule:
  organization_required: 'Wybierz organizację'
field:
  organization: 'Organizacja'
  countries: 'Kraje'
  countries_hint: 'Nie można zmienić po utworzeniu wydarzenia'
  name: 'Nazwa wydarzenia'
  use_template: 'Szablon'
  template: 'Wydarzenie'
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
  listed: 'Pokaż wydarzenie na stronie głównej'

preset:
  standard: 'Standard'
  minimal: 'Minimalny'
  otherEvent: 'Skopiuj z innego wydarzenia'

validation:
  countries:
    empty: 'Wybierz co najmniej jeden kraj'
  referenceEventId:
    empty: 'Wybierz wydarzenie, z którego chcesz skopiować'
  name:
    empty: 'Podaj nazwę wydarzenia'
    length: 'Nazwa wydarzenia może mieć maksymalnie 255 znaków'
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
  entity: 'Je to právní subjekt, který za akcí stojí. Odpovídá za akci i za údaje zadané při přihlašování.'
  access: 'Její správci mohou akci zobrazit a upravit a vidí, kdo ji vede. Přihlášky nikdy nevidí.'
  organizer: 'Akce vystupuje pod organizátorem, kterého nastavíte zvlášť. Organizaci účastníci přesto uvidí: vedle organizátora v seznamu akcí a v informacích o ochraně osobních údajů.'
  create: 'Není tu ta správná? Vytvořte novou organizaci.'
  create_action: 'Nová organizace'

unverified_notice: 'Tato organizace není ověřená. Akci můžete připravit už teď, ale do ověření zůstane skrytá ve veřejném seznamu a nebude přijímat registrace.'
rule:
  organization_required: 'Vyber organizaci'
field:
  organization: 'Organizace'
  countries: 'Země'
  countries_hint: 'Po vytvoření akce nelze změnit'
  name: 'Název akce'
  use_template: 'Šablona'
  template: 'Akce'
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
  listed: 'Zobrazit akci na úvodní stránce'

preset:
  standard: 'Standard'
  minimal: 'Minimální'
  otherEvent: 'Zkopírovat z jiné akce'

validation:
  countries:
    empty: 'Vyberte alespoň jednu zemi'
  referenceEventId:
    empty: 'Vyberte akci, ze které chcete kopírovat'
  name:
    empty: 'Zadejte název akce'
    length: 'Název akce může mít maximálně 255 znaků'
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
