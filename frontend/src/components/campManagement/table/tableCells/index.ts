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
import IndexTableCell from 'components/campManagement/table/tableCells/IndexTableCell.vue';
import LanguageSkillsTableCell from 'components/campManagement/table/tableCells/LanguageSkillsTableCell.vue';
import NameTableCell from 'components/campManagement/table/tableCells/NameTableCell.vue';
import PermissionLeaveTableCell from 'components/campManagement/table/tableCells/PermissionLeaveTableCell.vue';
import PhoneNumberTableCell from 'components/campManagement/table/tableCells/PhoneNumberTableCell.vue';
import TextTableCell from 'components/campManagement/table/tableCells/TextTableCell.vue';
import TimeAgoTableCell from 'components/campManagement/table/tableCells/TimeAgoTableCell.vue';
import TranslatedValueTableCell from 'components/campManagement/table/tableCells/TranslatedValueTableCell.vue';

// TODO Add custom config options
const components = () => {
  TableComponentRegistry.register('action', ActionTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('address', AddressTableCell, {
    label: {
      en: 'Address',
      de: 'Adresse',
      fr: 'Adresse',
    },
  });
  TableComponentRegistry.register('age', AgeTableCell, {
    label: {
      en: 'Age',
      de: 'Alter',
      fr: 'Áge',
    },
    edit: {
      type: 'text',
      inputType: 'number',
    },
  });
  TableComponentRegistry.register('country_flag', CountryFlagTableCell, {
    label: {
      en: 'Country Flag',
      de: 'Länderflagge',
      fr: 'Drapeau du Pays',
    },
  });
  TableComponentRegistry.register('date', DateTableCell, {
    label: {
      en: 'Date',
      de: 'Datum',
      fr: 'Date',
    },
    edit: {
      type: 'text',
      inputType: 'date',
    },
  });
  TableComponentRegistry.register('default', DefaultTableCell, {
    label: {
      en: 'Default',
      de: 'Standard',
      fr: 'Défaut',
    },
  });
  TableComponentRegistry.register('email', EmailTableCell, {
    label: {
      en: 'Email',
      de: 'E-Mail',
      fr: 'E-Mail',
    },
    edit: {
      type: 'text',
      inputType: 'email',
    },
  });
  TableComponentRegistry.register('file', FileTableCell, {
    label: {
      en: 'File',
      de: 'Datei',
      fr: 'Ficher',
    },
    edit: {
      type: 'file',
    },
  });
  TableComponentRegistry.register('gender', GenderTableCell, {
    label: {
      en: 'gender',
      de: 'Geschlecht',
      fr: 'Sexe',
    },
    edit: {
      type: 'dropdown',
      choices: [
        {
          text: {
            en: 'Female',
            de: 'Weiblich',
            fr: 'Femme',
          },
          value: 'f',
        },
        {
          text: {
            en: 'Male',
            de: 'Männlich',
            fr: 'Mâle',
          },
          value: 'm',
        },
      ],
    },
  });
  TableComponentRegistry.register('hidden_text', HiddenTextTableCell, {
    label: {
      en: 'Hidden Text',
      de: 'Versteckter Text',
      fr: 'Texte Caché',
    },
    edit: {
      type: 'text',
    },
  });
  TableComponentRegistry.register('icon', IconTableCell, {
    label: {
      en: 'Icon',
      de: 'Symbol',
      fr: 'Icône',
    },
    edit: {
      type: 'text',
    },
  });
  TableComponentRegistry.register('index', IndexTableCell, {
    internal: true,
  });
  TableComponentRegistry.register('language_skills', LanguageSkillsTableCell, {
    label: {
      en: 'Language Skills',
      de: 'Sprachkenntnisse',
      fr: 'Compétences linguistiques',
    },
    edit: {
      type: 'comment',
    },
  });
  TableComponentRegistry.register('name', NameTableCell, {
    label: {
      en: 'Name',
      de: 'Name',
      fr: 'Nom',
    },
    edit: {
      type: 'text',
    },
  });
  // TODO Can this be replaces with icon?
  TableComponentRegistry.register(
    'permission_leave',
    PermissionLeaveTableCell,
    {},
  );
  TableComponentRegistry.register('phone_number', PhoneNumberTableCell, {
    label: {
      en: 'Phone Number',
      de: 'Telefonnummer',
      fr: 'Numéro de Téléphone',
    },
    edit: {
      type: 'text',
    },
  });
  TableComponentRegistry.register('text', TextTableCell, {
    label: {
      en: 'Text',
      de: 'Text',
      fr: 'Texte',
    },
    edit: {
      type: 'comment',
    },
  });
  TableComponentRegistry.register('time_ago', TimeAgoTableCell, {
    label: {
      en: 'Time Ago',
      de: 'Vor (Zeit)',
      fr: 'Avant (Temps)',
    },
  });
  TableComponentRegistry.register(
    'translated_value',
    TranslatedValueTableCell,
    {
      label: {
        en: 'Translated value',
        de: 'Übersetzter Wert',
        fr: 'Valeur traduite',
      },
    },
  );
};

export default components;
