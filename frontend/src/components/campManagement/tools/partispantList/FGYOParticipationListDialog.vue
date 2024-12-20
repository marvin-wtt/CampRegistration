<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h5">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="column q-gutter-y-sm">
        {{ t('roleText') }}

        <q-select
          v-for="r in roles"
          :key="r.value"
          v-model="roleMappings[r.value]"
          :label="r.label"
          :options="roleOptions"
          emit-value
          map-options
          clearable
          outlined
          rounded
        />
      </q-card-section>

      <q-separator inset />

      <q-card-section class="column q-gutter-y-sm">
        <q-input
          v-model="responsiblePerson"
          :label="t('field.responsiblePerson')"
          outlined
          rounded
        />

        <div>
          {{ t('disclaimer') }}
        </div>
      </q-card-section>

      <q-card-section
        v-if="progress != null"
        class="q-pa-sm"
      >
        <q-linear-progress
          :value="progress.current / progress.total"
          stripe
          rounded
        />
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          :label="t('action.cancel')"
          color="primary"
          :disable="progress != null"
          rounded
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.export')"
          :loading
          :disable="progress != null"
          rounded
          color="primary"
          @click="generateFiles"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { exportFile, QSelectOption, useDialogPluginComponent } from 'quasar';
import { useAPIService } from 'src/services/APIService.ts';
import { useRegistrationsStore } from 'stores/registration-store.ts';
import { FileConfig, ParticipationListData } from './FGYOParticipationList';
import { useCampDetailsStore } from 'stores/camp-details-store.ts';
import { useRegistrationHelper } from 'src/composables/registrationHelper.ts';
import { Registration } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import { participantListConfig } from 'components/campManagement/tools/partispantList/config.ts';
import { pdfUtils } from 'src/utils/pdfUtils.ts';
import { useAuthStore } from 'stores/auth-store.ts';

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } =
  useDialogPluginComponent();
const { firstName, lastName, age, country, address, participant, role } =
  useRegistrationHelper();
const registrationsStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();
const authStore = useAuthStore();
const api = useAPIService();
const { t, locale } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

onMounted(() => {
  campDetailsStore.fetchData();
  registrationsStore.fetchData();
});

const loading = computed<boolean>(() => {
  return registrationsStore.isLoading || campDetailsStore.isLoading;
});

const config = computed<FileConfig>(() => {
  const key = locale.value.startsWith('fr') ? 'fr' : 'de';

  return participantListConfig[key];
});

interface Progress {
  current: number;
  total: number;
}

const progress = ref<Progress | null>(null);

const responsiblePerson = ref<string | undefined>(authStore.user?.name);
const roleMappings = ref<
  Record<string, keyof FileConfig['fields']['counselors']['role']['values']>
>({});

const roles = computed<QSelectOption[]>(() => {
  if (!registrationsStore.data) return [];

  const roles = registrationsStore.data
    .filter((r) => !participant(r))
    .map(role)
    .filter((r) => r != undefined);
  const uniqueRoles = [...new Set(roles)];

  return uniqueRoles.map((role) => ({
    value: role,
    label: role, // TODO Is it possible to extract the role name?
  }));
});
const roleOptions = computed<QSelectOption[]>(() => {
  return Object.entries(config.value.fields.counselors.role.values).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );
});

async function generateFiles() {
  if (!registrationsStore.data || !campDetailsStore.data) {
    throw 'Data not loaded';
  }

  const nights = calculateNights(
    campDetailsStore.data.startAt,
    campDetailsStore.data.endAt,
  );

  const groups = groupRegistrationsByCountryAndRole(
    registrationsStore.data,
    nights,
  );

  progress.value = {
    current: 0,
    total: groups.length,
  };
  for (const group of groups) {
    progress.value.current++;
    await writeFile(group);
  }
  progress.value = null;

  onDialogOK();
}

function calculateNights(startDate: string, endDate: string) {
  // Parse the dates
  const start = new Date(startDate);
  start.setHours(0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0);

  const timeDiff = Math.abs(start.getTime() - end.getTime());

  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function splitIntoGroups<T>(items: T[], maxGroupSize: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += maxGroupSize) {
    groups.push(items.slice(i, i + maxGroupSize));
  }
  return groups;
}

function groupRegistrationsByCountryAndRole(
  registrations: Registration[],
  nights?: number,
) {
  type MappedData = Record<string, Omit<ParticipationListData, 'country'>>;
  const groupedByCountry = registrations.reduce(
    (result: MappedData, registration: Registration) => {
      const countryKey = country(registration) ?? '';

      if (!result[countryKey]) {
        result[countryKey] = {
          participants: [],
          counselors: [],
        };
      }

      if (participant(registration)) {
        result[countryKey].participants.push({
          lastName: lastName(registration),
          firstName: firstName(registration),
          zipCode: address(registration)?.zip_code,
          city: address(registration)?.city,
          country: t(countryKey),
          age: age(registration),
          distance: undefined,
          nights,
        });
      } else {
        const registrationRole = role(registration);
        const roleName = registrationRole
          ? roleMappings.value[registrationRole]
          : 'counselor';

        result[countryKey].counselors.push({
          lastName: lastName(registration),
          firstName: firstName(registration),
          zipCode: address(registration)?.zip_code,
          city: address(registration)?.city,
          country: t('countryKey'),
          age: age(registration),
          role: roleName,
          distance: undefined,
          nights,
        });
      }

      return result;
    },
    {} as MappedData,
  );

  const result: ParticipationListData[] = [];

  // For each country, split participants and counselors into subgroups if necessary
  for (const [countryKey, group] of Object.entries(groupedByCountry)) {
    const participantGroups = splitIntoGroups(
      group.participants,
      config.value.fields.participants.count,
    );
    const counselorGroups = splitIntoGroups(
      group.counselors,
      config.value.fields.counselors.count,
    );

    // Merge participants and counselors groups into the result array
    const maxGroups = Math.max(
      participantGroups.length,
      counselorGroups.length,
    );
    for (let i = 0; i < maxGroups; i++) {
      result.push({
        country: countryKey,
        participants: participantGroups[i] || [],
        counselors: counselorGroups[i] || [],
      });
    }
  }

  return result;
}

const files: Record<string, ArrayBuffer> = {};

async function loadFile() {
  const filename = config.value.file;
  if (!(filename in files)) {
    files[filename] = await api.fetchPublicFile('fgyo/' + config.value.file);
  }

  return structuredClone(files[filename]);
}

async function writeFile(data: ParticipationListData) {
  const { fields } = config.value;

  const buffer = await loadFile();
  const pdf = await pdfUtils(buffer);

  const country =
    data.country === 'de' || data.country === 'fr' ? data.country : 'other';

  pdf.setButton(
    fields.general.country.field,
    fields.general.country.values[country],
  );
  if (country === 'other') {
    pdf.setField(fields.general.otherCountry, data.country);
  }

  if (data.reference) {
    pdf.setField(fields.general.reference, data.reference);
  }

  data.participants.forEach((value, index) => {
    pdf.setField(fields.participants.lastName(index), value.lastName);
    pdf.setField(fields.participants.firstName(index), value.firstName);
    pdf.setField(fields.participants.zipCode(index), value.zipCode);
    pdf.setField(fields.participants.city(index), value.city);
    pdf.setField(fields.participants.country(index), value.country);
    pdf.setField(fields.participants.age(index), value.age);
    pdf.setField(fields.participants.nights(index), value.nights);
    pdf.setField(fields.participants.distance(index), value.distance);
  });

  data.counselors.forEach((value, index) => {
    pdf.setField(fields.counselors.lastName(index), value.lastName);
    pdf.setField(fields.counselors.firstName(index), value.firstName);
    pdf.setField(fields.counselors.zipCode(index), value.zipCode);
    pdf.setField(fields.counselors.city(index), value.city);
    pdf.setField(fields.counselors.country(index), value.country);
    pdf.setField(fields.counselors.age(index), value.age);
    pdf.setField(fields.counselors.nights(index), value.nights);
    pdf.setField(fields.counselors.distance(index), value.distance);

    if (value.role) {
      pdf.setField(
        fields.counselors.role.field(index),
        fields.counselors.role.values[value.role],
      );
    }
  });

  if (data.responsiblePerson) {
    pdf.setField(fields.general.responsiblePerson, data.responsiblePerson);
  }

  pdf.setField(fields.general.date, formatedDate());

  const filename = generateFileName(config.value.file, country);
  const fileData = await pdf.save();
  await download(fileData, filename);
}

function generateFileName(filename: string, locale: string) {
  // Split the filename into the name and extension parts
  const [name, extension] = filename.split(/\.(?=[^.]+$)/);

  // Return the new filename format
  return `${name}_${locale}.${extension}`;
}

async function download(data: Uint8Array, filename: string) {
  exportFile(filename, data, {
    mimeType: 'application/pdf',
  });
}

const formatedDate = (): string => {
  const today = new Date();
  return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
};
</script>

<i18n lang="yaml" locale="en">
title: 'Participation list'

roleText: 'Please map the camp roles to the official FGYO roles.'

disclaimer: 'Please check all fields for their correctness and then check the
  box on the last page to confirm that they are correct.'

field:
  responsiblePerson: 'Responsible Person'

de: 'Germany'
fr: 'France'

action:
  cancel: 'Cancel'
  export: 'Export'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Teilnehmerliste'

roleText: 'Bitte die Camp-Rollen den offiziellen DFJW-Rollen zuordnen.'

disclaimer: 'Bitte anschließend alle Felder auf ihre Richtigkeit überprüfen und
  dann das Häkchen auf der letzten Seite setzten, um die Korrektheit zu bestätigen.'

field:
  responsiblePerson: 'Verantwortliche Person'

de: 'Deutschland'
fr: 'Frankfreich'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Liste de participation'

roleText: "Veuillez faire correspondre les rôles du camp aux rôles officiels de l'OFAJ."

disclaimer: "Vérifie ensuite l'exactitude de tous les champs, puis coche la
  dernière page pour confirmer l'exactitude."

field:
  responsiblePerson: 'Person résponsable'

de: 'Allemagne'
fr: 'France'
</i18n>

<style scoped></style>
