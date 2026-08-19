<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="move-camp-card">
      <q-form @submit="onSubmit">
        <q-card-section class="q-pb-none">
          <div class="text-h6">{{ t('title') }}</div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ campName }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-select
            v-model="organizationId"
            :label="t('field.organization')"
            :options="filteredOptions"
            :rules="[(val?: string) => !!val || t('rule.required')]"
            hide-bottom-space
            :loading
            color="primary"
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="300"
            rounded
            outlined
            @filter="onFilter"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    :color="scope.opt.verified ? 'positive' : 'warning'"
                    text-color="white"
                    dense
                    square
                    size="sm"
                  >
                    {{
                      scope.opt.verified
                        ? t('status.verified')
                        : t('status.unverified')
                    }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </template>

            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{ t('noResults') }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-banner
            v-if="willHide"
            dense
            class="warn-note rounded-md"
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>
            {{ t('hiddenWarning') }}
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            flat
            rounded
            no-caps
            color="primary"
            @click="onDialogCancel"
          />
          <q-btn
            :label="t('action.move')"
            type="submit"
            color="primary"
            unelevated
            rounded
            no-caps
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAPIService } from '@/services/APIService';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { countryName } from '@/utils/countries';
import type { Camp, Organization } from '@camp-registration/common/entities';

const props = defineProps<{ camp: Camp }>();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
defineEmits([...useDialogPluginComponent.emits]);

interface OrganizationOption {
  label: string;
  caption: string;
  value: string;
  verified: boolean;
}

const organizations = ref<Organization[]>([]);
const organizationId = ref<string | null>(null);
const loading = ref<boolean>(false);
const filteredOptions = ref<OrganizationOption[]>([]);
// Searching replaces the option list, so the picked organization is kept on its
// own — it may no longer be among the options by the time the form is read.
const selectedOption = ref<OrganizationOption>();

const campName = computed(() => to(props.camp.name));

const allOptions = computed<OrganizationOption[]>(() =>
  organizations.value
    // Moving a camp to the organization it already belongs to is a no-op.
    .filter((organization) => organization.id !== props.camp.organizationId)
    .map((organization) => ({
      label: organization.name,
      caption: countryName(organization.country, locale.value),
      value: organization.id,
      verified: organization.verificationStatus === 'VERIFIED',
    })),
);

/**
 * Moving does not rewrite `listed`. Visibility is derived from the owner's
 * moderation status on read, so a published camp simply drops out of the
 * directory while the new owner is unverified, and returns when it is verified.
 */
const willHide = computed(() => {
  if (!props.camp.listed || !selectedOption.value) {
    return false;
  }

  return !selectedOption.value.verified;
});

// The listing is server-paginated, so searching has to go back to the API —
// filtering the first page would hide every organization beyond it.
async function onFilter(
  search: string,
  update: (fn: () => void) => void,
  abort: () => void,
) {
  try {
    const result = await fetchOrganizations(search);
    update(() => {
      organizations.value = result;
      filteredOptions.value = allOptions.value;
    });
  } catch {
    abort();
  }
}

async function fetchOrganizations(search?: string): Promise<Organization[]> {
  loading.value = true;
  try {
    const needle = search?.trim();

    return await api.fetchOrganizations({
      view: 'all',
      ...(needle ? { name: needle } : {}),
      sortBy: 'name',
      sortType: 'asc',
    });
  } finally {
    loading.value = false;
  }
}

function onSubmit() {
  if (organizationId.value) {
    onDialogOK(organizationId.value);
  }
}

watch(organizationId, (id) => {
  selectedOption.value = id
    ? allOptions.value.find((option) => option.value === id)
    : undefined;
});

onMounted(async () => {
  organizations.value = await fetchOrganizations();
  filteredOptions.value = allOptions.value;
});
</script>

<style lang="scss" scoped>
.move-camp-card {
  width: 480px;
  max-width: 90vw;
}

.warn-note {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Move to another organization'
field:
  organization: 'Target organization'
status:
  verified: 'Verified'
  unverified: 'Not verified'
rule:
  required: 'Please choose an organization'
noResults: 'No matching organization'
hiddenWarning: 'This organization is not verified, so the camp will be hidden from the public directory and stop accepting registrations until it is. It stays published and reappears once the organization is verified.'
action:
  move: 'Move'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'In andere Organisation verschieben'
field:
  organization: 'Zielorganisation'
status:
  verified: 'Verifiziert'
  unverified: 'Nicht verifiziert'
rule:
  required: 'Bitte wähle eine Organisation'
noResults: 'Keine passende Organisation'
hiddenWarning: 'Diese Organisation ist nicht verifiziert. Das Camp wird bis dahin nicht mehr öffentlich angezeigt und nimmt keine Anmeldungen an. Es bleibt veröffentlicht und erscheint nach der Verifizierung wieder.'
action:
  move: 'Verschieben'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Déplacer vers une autre organisation'
field:
  organization: 'Organisation cible'
status:
  verified: 'Vérifiée'
  unverified: 'Non vérifiée'
rule:
  required: 'Choisis une organisation'
noResults: 'Aucune organisation correspondante'
hiddenWarning: "Cette organisation n'est pas vérifiée : le camp sera masqué de l'annuaire public et cessera d'accepter les inscriptions. Il reste publié et réapparaîtra après la vérification."
action:
  move: 'Déplacer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przenieś do innej organizacji'
field:
  organization: 'Organizacja docelowa'
status:
  verified: 'Zweryfikowana'
  unverified: 'Niezweryfikowana'
rule:
  required: 'Wybierz organizację'
noResults: 'Brak pasującej organizacji'
hiddenWarning: 'Ta organizacja nie jest zweryfikowana, więc obóz zostanie ukryty w publicznym katalogu i przestanie przyjmować zapisy. Pozostaje opublikowany i wróci po weryfikacji.'
action:
  move: 'Przenieś'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přesunout do jiné organizace'
field:
  organization: 'Cílová organizace'
status:
  verified: 'Ověřená'
  unverified: 'Neověřená'
rule:
  required: 'Vyber organizaci'
noResults: 'Žádná odpovídající organizace'
hiddenWarning: 'Tato organizace není ověřená, takže tábor bude skryt z veřejného katalogu a přestane přijímat registrace. Zůstává zveřejněn a vrátí se po ověření.'
action:
  move: 'Přesunout'
  cancel: 'Zrušit'
</i18n>
