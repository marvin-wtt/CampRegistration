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
        </q-stepper>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { PDFDocument, PDFForm } from 'pdf-lib';

const props = defineProps<{
  camp: CampDetails;
  registrations: Registration[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t, locale } = useI18n();
const accessor = useRegistrationHelper();

const step = ref<string>();

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

const generateFiles = async () => {
  const countries = new Set(
    ...props.registrations
      .map(accessor.country)
      .filter((value) => value !== undefined),
  );

  const files = await Promise.all(Array.from(countries).map(fillPdf));
};

const fillPdf = async (country: string) => {
  // TODO Use api service and get asset url
  // TODO Cache the file
  const bytes = await fetch('').then((res) => res.arrayBuffer());
  const document = await PDFDocument.load(bytes);
  const form = document.getForm();

  setCountryData(form, country);

  const nights = campNights.value;
  const fileLocale = locale.value.split('-')[0];

  const registrations = props.registrations.filter((registration) => {
    return accessor.country(registration)?.toLowerCase() === country;
  });

  const participants = registrations.filter(accessor.participant);
  setRegistrationData(form, formFiledNames.participants, participants, nights);

  const team = registrations.filter((r) => !accessor.participant(r));
  setRegistrationData(form, formFiledNames.team, team, nights);
};

const campNights = computed<number>(() => {
  const start = new Date(props.camp.startAt);
  const end = new Date(props.camp.endAt);

  // TODO Calculate started days
  return 0;
});

const formFiledNames: Record<'participants' | 'team', FormKeys> = {
  participants: {
    lastName: (i) => `Name${i}`,
    firstName: (i) => `Vorname${i}`,
    zipCode: (i) => `Postleit Zahl${i}`,
    city: (i) => `Ort${i}`,
    country: (i) => `Land${i}`,
    age: (i) => `Alter${i}`,
    nights: (i) => `Anzahl der Nächte${i}`,
    distance: (i) => `km-${twoDigits(i)}`,
  },
  team: {
    lastName: (i) => `Name${i}_2`,
    firstName: (i) => `Vorname${i}_2`,
    zipCode: (i) => `Postleit zahl${i}_2`,
    city: (i) => `Ort${i}_2`,
    country: (i) => `Land${i}_2`,
    age: (i) => `Alter${i}_2`,
    nights: (i) => `Anzahl der Nächte${i}_2`,
    distance: (i) => `km-team-${twoDigits(i)}`,
    role: (i) => `dropdown-4-${twoDigits(i)}`,
  },
};

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
      .setText(accessor.country(registration)); // TODO Convert to name
    form
      .getTextField(formKeys.age(i))
      .setText(accessor.age(registration)?.toString());
    form.getTextField(formKeys.nights(i)).setText(nights.toString());
    // TODO Distance

    if (formKeys.role) {
      // TODO Dropdown
      form.getDropdown(formKeys.role(i)).select('');
    }
  });
}

function onOKClick(): void {
  onDialogOK();
}

function onCancelClick(): void {
  onDialogCancel();
}
</script>

<style scoped></style>
