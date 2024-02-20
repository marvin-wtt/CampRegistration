<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-stepper
          v-model="step"
          vertical
          color="primary"
          animated
        >
          <q-step
            title="Download"
            name="download"
            icon="download"
          >
            <q-stepper-navigation>
              <q-btn
                color="primary"
                label="Download"
                :loading="downloadLoading"
                @click="onDownload"
              />
              <q-btn
                flat
                color="primary"
                label="Back"
                class="q-ml-sm"
                @click="step = 'TODO'"
              />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, exportFile } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { useAPIService } from 'src/services/APIService';

const props = defineProps<{
  camp: CampDetails;
  registrations: Registration[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t, locale } = useI18n();
const accessor = useRegistrationHelper();
const api = useAPIService();

const step = ref<string>('download');
const downloadLoading = ref<boolean>(false);

async function onDownload() {
  downloadLoading.value = true;
  try {
    await generateFiles();
  } catch (error: unknown) {
    console.log(error);
  } finally {
    downloadLoading.value = false;
  }
}

type FormKeyValue = (i: number) => string;

interface FormKeys {
  lastName: FormKeyValue;
  firstName: FormKeyValue;
  zipCode: FormKeyValue;
  city: FormKeyValue;
  country: FormKeyValue;
  age: FormKeyValue;
  nights: FormKeyValue;
  distance: FormKeyValue;
  role?: FormKeyValue;
}

const formFiledNames: Record<'participants' | 'team', FormKeys> = {
  participants: {
    lastName: (i) => `Name${i + 1}`,
    firstName: (i) => `Vorname${i + 1}`,
    zipCode: (i) => `Postleit zahl${i + 1}`,
    city: (i) => `Ort${i + 1}`,
    country: (i) => `Land${i + 1}`,
    age: (i) => `Alter${i + 1}`,
    nights: (i) => `Anzahl der Nächte${i + 1}`,
    distance: (i) => `km-${twoDigits(i + 1)}`,
  },
  team: {
    lastName: (i) => `Name${i + 1}_2`,
    firstName: (i) => `Vorname${i + 1}_2`,
    zipCode: (i) => `Postleit zahl${i + 1}_2`,
    city: (i) => `Ort${i + 1}_2`,
    country: (i) => `Land${i + 1}_2`,
    age: (i) => `Alter${i + 1}_2`,
    nights: (i) => `Anzahl der Nächte${i + 1}_2`,
    distance: (i) => `km-team-${twoDigits(i + 1)}`,
    role: (i) => `dropdown-4-${twoDigits(i + 1)}`,
  },
};

const generateFiles = async () => {
  const countries = new Set(
    props.registrations
      .map(accessor.country)
      .filter((value): value is string => value !== undefined),
  );

  const fileLocale = locale.value.split('-')[0];
  const bytes = await api.fetchFile(`fgyo/participats_${fileLocale}.pdf`);

  const document = await PDFDocument.load(bytes);

  const files = await Promise.all(
    Array.from(countries).map(async (country, i) => {
      // Copy the document if it's not the last element
      const d = i !== countries.size - 1 ? await document.copy() : document;
      await fillPdf(d, country);
      return d.save();
    }),
  );

  files.forEach((value, index) => {
    exportFile(`participants_${index}.pdf`, value);
  });
};

const fillPdf = async (document: PDFDocument, country: string) => {
  const form = document.getForm();
  const nights = campNights.value;

  setCountryData(form, country);

  const registrations = props.registrations.filter((registration) => {
    return accessor.country(registration)?.toLowerCase() === country;
  });

  const participants = registrations.filter(accessor.participant);
  setRegistrationData(form, formFiledNames.participants, participants, nights);

  const team = registrations.filter((r) => !accessor.participant(r));
  setRegistrationData(form, formFiledNames.team, team, nights);

  return document;
};

const campNights = computed<number>(() => {
  const start = new Date(props.camp.startAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(props.camp.endAt);
  end.setHours(0, 0, 0, 0);

  const millisecondsInDay = 1000 * 60 * 60 * 24;
  const diffTime = Math.abs(start.getTime() - end.getTime());

  return Math.ceil(diffTime / millisecondsInDay);
});

function twoDigits(n: number): string {
  return n < 10 ? `0${n}` : n.toString();
}

function setCountryData(form: PDFForm, country: string) {
  const radio = form.getRadioGroup('Groupe4');
  if (country === 'de') {
    radio.select('Choix1');
  } else if (country === 'fr') {
    radio.select('Choix2');
  } else {
    radio.select('Choix3');
    // TODO Set name into text input field
  }
}

function setRegistrationData(
  form: PDFForm,
  formKeys: FormKeys,
  registrations: Registration[],
  nights: number,
) {
  registrations.forEach((registration, i) => {
    form
      .getTextField(formKeys.lastName(i))
      .setText(accessor.lastName(registration));
    form
      .getTextField(formKeys.firstName(i))
      .setText(accessor.firstName(registration));
    form
      .getTextField(formKeys.zipCode(i))
      .setText(accessor.address(registration)?.zip_code);
    form
      .getTextField(formKeys.city(i))
      .setText(accessor.address(registration)?.city);
    form
      .getTextField(formKeys.country(i))
      .setText(t(`country.${accessor.country(registration)}`));
    form
      .getTextField(formKeys.age(i))
      .setText(accessor.age(registration)?.toString());
    form.getTextField(formKeys.nights(i)).setText(nights.toString());
    form
      .getTextField(formKeys.distance(i))
      .setText(
        calculateDistance(accessor.address(registration)?.zip_code)?.toString(),
      );

    if (formKeys.role) {
      // TODO Dropdown
      form.getDropdown(formKeys.role(i)).select('');
    }
  });
}

function calculateDistance(zipCode: string | undefined): number | undefined {
  if (!zipCode) {
    return undefined;
  }

  return 0;
}

function onOKClick(): void {
  onDialogOK();
}

function onCancelClick(): void {
  onDialogCancel();
}
</script>

<i18n lang="yaml" locale="en">
country:
  de: 'Germany'
  fr: 'France'
</i18n>

<!-- TODO Add translations -->

<style scoped></style>
