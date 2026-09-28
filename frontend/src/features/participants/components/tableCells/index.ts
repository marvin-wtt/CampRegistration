import { defineAsyncComponent } from 'vue';
import TableComponentRegistry from '@/features/participants/components/ComponentRegistry';
import DefaultTableCell from '@/features/participants/components/tableCells/DefaultTableCell.vue';
import { formatAddress } from '@/utils/formatAddress';
import {
  formatFormSelectCsvValue,
  formatIsoDateCsvValue,
  isTranslatableCsvValue,
  stringifyCsvValue,
} from '@/utils/csvValueFormatter';

// Every cell renderer (and its options editor, if any) is only needed once a
// template actually uses that `renderAs` type, so they are loaded lazily
// instead of bundled eagerly with every other cell type. `DefaultTableCell`
// is the one exception: ComponentRegistry.ts already imports it eagerly as
// the `.load()` fallback, so wrapping it here would add async overhead for
// zero bundle-size benefit.
const ActionTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/ActionTableCell.vue'),
);
const AddressTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/AddressTableCell.vue'),
);
const AgeTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/AgeTableCell.vue'),
);
const AgeOptionsEditor = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/AgeOptionsEditor.vue'),
);
const CountryFlagTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/CountryFlagTableCell.vue'),
);
const DateTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/DateTableCell.vue'),
);
const EditorTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/EditorTableCell.vue'),
);
const EmailTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/EmailTableCell.vue'),
);
const FileTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/FileTableCell.vue'),
);
const FileEditorTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/FileEditorTableCell.vue'),
);
const FormSelectTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/FormSelectTableCell.vue'),
);
const GenderTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/GenderTableCell.vue'),
);
const HiddenTextTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/HiddenTextTableCell.vue'),
);
const IconTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/IconTableCell.vue'),
);
const IconMappingTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/IconMappingTableCell.vue'),
);
const IconMappingOptionsEditor = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/IconMappingOptionsEditor.vue'),
);
const IndexTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/IndexTableCell.vue'),
);
const LanguageSkillsTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/LanguageSkillsTableCell.vue'),
);
const NameTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/NameTableCell.vue'),
);
const PhoneNumberTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/PhoneNumberTableCell.vue'),
);
const TextTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/TextTableCell.vue'),
);
const TextOptionsEditor = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/TextOptionsEditor.vue'),
);
const TimeAgoTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/TimeAgoTableCell.vue'),
);
const TranslatedValueTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/TranslatedValueTableCell.vue'),
);
const StatusTableCell = defineAsyncComponent(
  () =>
    import('@/features/participants/components/tableCells/StatusTableCell.vue'),
);

// Labels for the (non-internal) cell types live in the i18n blocks of
// TableTemplateColumnEditDialog.vue, keyed by the registry name (`cellType.<name>`).
const components = () => {
  TableComponentRegistry.register('action', ActionTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('address', AddressTableCell, {
    toCsv: (value, ctx) => formatAddress(value, ctx.translateCountry),
  });
  TableComponentRegistry.register('age', AgeTableCell, {
    optionsComponent: AgeOptionsEditor,
    toCsv: formatIsoDateCsvValue,
  });
  TableComponentRegistry.register('country_flag', CountryFlagTableCell);
  TableComponentRegistry.register('date', DateTableCell, {
    toCsv: formatIsoDateCsvValue,
  });
  TableComponentRegistry.register('default', DefaultTableCell);
  TableComponentRegistry.register('editor', EditorTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('email', EmailTableCell);
  TableComponentRegistry.register('file', FileTableCell);
  TableComponentRegistry.register('file_editor', FileEditorTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('form_select', FormSelectTableCell, {
    toCsv: (value, ctx, column) =>
      formatFormSelectCsvValue(column.fieldName, value, ctx),
  });
  TableComponentRegistry.register('gender', GenderTableCell);
  TableComponentRegistry.register('hidden_text', HiddenTextTableCell);
  TableComponentRegistry.register('icon', IconTableCell, {
    internal: true, // Component should be removed as it is included in icon mapping
  });
  TableComponentRegistry.register('icon_mapping', IconMappingTableCell, {
    optionsComponent: IconMappingOptionsEditor,
  });
  TableComponentRegistry.register('index', IndexTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('language_skills', LanguageSkillsTableCell);
  TableComponentRegistry.register('name', NameTableCell);
  TableComponentRegistry.register('phone_number', PhoneNumberTableCell);
  TableComponentRegistry.register('status', StatusTableCell);
  TableComponentRegistry.register('text', TextTableCell, {
    optionsComponent: TextOptionsEditor,
  });
  TableComponentRegistry.register('time_ago', TimeAgoTableCell, {
    toCsv: formatIsoDateCsvValue,
  });
  TableComponentRegistry.register(
    'translated_value',
    TranslatedValueTableCell,
    {
      toCsv: (value, ctx) =>
        isTranslatableCsvValue(value)
          ? ctx.translate(value)
          : stringifyCsvValue(value),
    },
  );
};

export default components;
