import TableComponentRegistry from '@/components/event/table/ComponentRegistry';
import ActionTableCell from '@/components/event/table/tableCells/ActionTableCell.vue';
import AddressTableCell from '@/components/event/table/tableCells/AddressTableCell.vue';
import AgeTableCell from '@/components/event/table/tableCells/AgeTableCell.vue';
import CountryFlagTableCell from '@/components/event/table/tableCells/CountryFlagTableCell.vue';
import DateTableCell from '@/components/event/table/tableCells/DateTableCell.vue';
import DefaultTableCell from '@/components/event/table/tableCells/DefaultTableCell.vue';
import EmailTableCell from '@/components/event/table/tableCells/EmailTableCell.vue';
import FileTableCell from '@/components/event/table/tableCells/FileTableCell.vue';
import GenderTableCell from '@/components/event/table/tableCells/GenderTableCell.vue';
import HiddenTextTableCell from '@/components/event/table/tableCells/HiddenTextTableCell.vue';
import IconTableCell from '@/components/event/table/tableCells/IconTableCell.vue';
import IconMappingTableCell from '@/components/event/table/tableCells/IconMappingTableCell.vue';
import IconMappingOptionsEditor from '@/components/event/table/tableCells/IconMappingOptionsEditor.vue';
import IndexTableCell from '@/components/event/table/tableCells/IndexTableCell.vue';
import LanguageSkillsTableCell from '@/components/event/table/tableCells/LanguageSkillsTableCell.vue';
import NameTableCell from '@/components/event/table/tableCells/NameTableCell.vue';
import PhoneNumberTableCell from '@/components/event/table/tableCells/PhoneNumberTableCell.vue';
import TextTableCell from '@/components/event/table/tableCells/TextTableCell.vue';
import TimeAgoTableCell from '@/components/event/table/tableCells/TimeAgoTableCell.vue';
import TranslatedValueTableCell from '@/components/event/table/tableCells/TranslatedValueTableCell.vue';
import EditorTableCell from '@/components/event/table/tableCells/EditorTableCell.vue';
import FileEditorTableCell from '@/components/event/table/tableCells/FileEditorTableCell.vue';
import FormSelectTableCell from '@/components/event/table/tableCells/FormSelectTableCell.vue';
import StatusTableCell from '@/components/event/table/tableCells/StatusTableCell.vue';
import AgeOptionsEditor from '@/components/event/table/tableCells/AgeOptionsEditor.vue';
import TextOptionsEditor from '@/components/event/table/tableCells/TextOptionsEditor.vue';

// Labels for the (non-internal) cell types live in the i18n blocks of
// TableTemplateColumnEditDialog.vue, keyed by the registry name (`cellType.<name>`).
const components = () => {
  TableComponentRegistry.register('action', ActionTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('address', AddressTableCell);
  TableComponentRegistry.register('age', AgeTableCell, {
    optionsComponent: AgeOptionsEditor,
  });
  TableComponentRegistry.register('country_flag', CountryFlagTableCell);
  TableComponentRegistry.register('date', DateTableCell);
  TableComponentRegistry.register('default', DefaultTableCell);
  TableComponentRegistry.register('editor', EditorTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('email', EmailTableCell);
  TableComponentRegistry.register('file', FileTableCell);
  TableComponentRegistry.register('file_editor', FileEditorTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('form_select', FormSelectTableCell);
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
  TableComponentRegistry.register('time_ago', TimeAgoTableCell);
  TableComponentRegistry.register('translated_value', TranslatedValueTableCell);
};

export default components;
