import TableComponentRegistry from 'components/campManagement/table/ComponentRegistry';
import ActionTableCell from 'components/campManagement/table/tableCells/ActionTableCell.vue';
import AddressTableCell from 'components/campManagement/table/tableCells/AddressTableCell.vue';
import AgeTableCell from 'components/campManagement/table/tableCells/AgeTableCell.vue';
import CountryFlagTableCell from 'components/campManagement/table/tableCells/CountryFlagTableCell.vue';
import DateTableCell from 'components/campManagement/table/tableCells/DateTableCell.vue';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';
import EmailTableCell from 'components/campManagement/table/tableCells/EmailTableCell.vue';
import FileTableCell from 'components/campManagement/table/tableCells/FileTableCell.vue';
import GenderTableCell from 'components/campManagement/table/tableCells/GenderTableCell.vue';
import HiddenTextTableCell from 'components/campManagement/table/tableCells/HiddenTextTableCell.vue';
import IconTableCell from 'components/campManagement/table/tableCells/IconTableCell.vue';
import IconMappingTableCell from 'components/campManagement/table/tableCells/IconMappingTableCell.vue';
import IconMappingOptionsEditor from 'components/campManagement/table/tableCells/IconMappingOptionsEditor.vue';
import IndexTableCell from 'components/campManagement/table/tableCells/IndexTableCell.vue';
import LanguageSkillsTableCell from 'components/campManagement/table/tableCells/LanguageSkillsTableCell.vue';
import NameTableCell from 'components/campManagement/table/tableCells/NameTableCell.vue';
import PhoneNumberTableCell from 'components/campManagement/table/tableCells/PhoneNumberTableCell.vue';
import TextTableCell from 'components/campManagement/table/tableCells/TextTableCell.vue';
import TimeAgoTableCell from 'components/campManagement/table/tableCells/TimeAgoTableCell.vue';
import TranslatedValueTableCell from 'components/campManagement/table/tableCells/TranslatedValueTableCell.vue';
import EditorTableCell from 'components/campManagement/table/tableCells/EditorTableCell.vue';
import FormSelectTableCell from 'components/campManagement/table/tableCells/FormSelectTableCell.vue';
import StatusTableCell from 'components/campManagement/table/tableCells/StatusTableCell.vue';
import AgeOptionsEditor from 'components/campManagement/table/tableCells/AgeOptionsEditor.vue';
import TextOptionsEditor from 'components/campManagement/table/tableCells/TextOptionsEditor.vue';

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
