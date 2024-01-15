import { Data } from '../../src/form/variables/variables';

export const fakeCampData = (data: Partial<Data>): Data => {
  return {
    name: '',
    organizer: '',
    contactEmail: '',
    countries: ['de'],
    maxParticipants: 0,
    startAt: '',
    endAt: '',
    minAge: 0,
    maxAge: 0,
    price: 0,
    location: '',
    ...data,
  };
};
