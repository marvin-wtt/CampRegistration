import { CampDataType } from '../CampDataType';

export const address: CampDataType = {
  element: {
    value: 'address',
    text: {
      en: 'Address',
      de: 'Adresse',
      fr: 'Adresse',
    },
  },
  fit: (obj) => {
    return obj.getType() === 'address';
  },
};

export const country: CampDataType = {
  element: {
    value: 'country',
    text: {
      en: 'Country',
      de: 'Land',
      fr: 'Pays',
    },
  },
  fit: (obj) => {
    return obj.getType() === 'dropdown';
  },
};

export const dateOfBirth: CampDataType = {
  element: {
    value: 'date_of_birth',
    text: {
      en: 'Date of Birth',
      de: 'Geburtsdatun',
      fr: 'Date de naissance',
    },
  },
  fit: (obj) => {
    return (
      obj.getType() === 'date_of_birth' ||
      (obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'date')
    );
  },
};

export const email: CampDataType = {
  element: {
    value: 'email',
    text: {
      en: 'E-Mail (participant)',
      de: 'E-Mail (teilnehmer)',
      fr: 'E-Mail (participant)',
    },
  },
  fit: (obj) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'email'
    );
  },
};

export const firstName: CampDataType = {
  element: {
    value: 'first_name',
    text: {
      en: 'First Name',
      de: 'Vorname',
      fr: 'Prénom',
    },
  },
  fit: (obj) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'text'
    );
  },
};

export const guardianEmail: CampDataType = {
  element: {
    value: 'guardian_email',
    text: {
      en: 'E-Mail (guardian)',
      de: 'E-Mail (Sorgeberechtigen)',
      fr: 'E-Mail (responsables)',
    },
  },
  fit: (obj) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'email'
    );
  },
};

export const lastName: CampDataType = {
  element: {
    value: 'last_name',
    text: {
      en: 'Last Name',
      de: 'Nachname',
      fr: 'Nom de Famille',
    },
  },
  fit: (obj) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'text'
    );
  },
};

export const name: CampDataType = {
  element: {
    value: 'name',
    text: {
      en: 'Name',
      de: 'Name',
      fr: 'Nom',
    },
  },
  fit: (obj) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'text'
    );
  },
};

export const role: CampDataType = {
  element: {
    value: 'role',
    text: {
      en: 'Role',
      de: 'Rolle',
      fr: 'Rôle',
    },
  },
  fit: (obj) => {
    return ['role', 'dropdown'].includes(obj.getType());
  },
};

export const waitingList: CampDataType = {
  element: {
    value: 'waiting_list',
    text: {
      en: 'Waiting List',
      de: 'Warteliste',
      fr: "Liste d'attendre",
    },
  },
  fit: (obj) => {
    return obj.getType() === 'checkbox';
  },
};
