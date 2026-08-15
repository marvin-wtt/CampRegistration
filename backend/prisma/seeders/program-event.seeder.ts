import { ProgramEventFactory } from '../factories/program-event.factory';
import type { Camp } from '#generated/prisma/client.js';
import moment from 'moment';

type EventData = {
  title: string | Record<string, string>;
  details?: string | Record<string, string>;
  location?: string | Record<string, string>;
  /** Days after the camp start date. */
  day: number;
  time?: string | null;
  duration?: number | null;
  color?: string;
  plan?: 'a' | 'b' | 'both';
};

const EVENTS: EventData[] = [
  {
    title: { de: 'Anreise', fr: 'Arrivée', en: 'Arrival' },
    day: 0,
    time: '15:00',
    duration: 120,
    color: '#4CAF50',
    plan: 'both',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    day: 0,
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: {
      de: 'Morgenandacht',
      fr: 'Dévotion du matin',
      en: 'Morning devotion',
    },
    day: 1,
    time: '08:00',
    duration: 30,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Frühstück', fr: 'Petit-déjeuner', en: 'Breakfast' },
    day: 1,
    time: '08:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Bibelarbeit', fr: 'Étude biblique', en: 'Bible study' },
    day: 1,
    time: '10:00',
    duration: 90,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Mittagessen', fr: 'Déjeuner', en: 'Lunch' },
    day: 1,
    time: '12:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Kletterpark', fr: "Parc d'escalade", en: 'Climbing park' },
    details: {
      de: 'Sicherheitseinweisung um 14:00 Uhr',
      en: 'Safety briefing at 14:00',
    },
    location: { de: 'Kletterpark Süd', en: 'South Climbing Park' },
    day: 1,
    time: '14:00',
    duration: 120,
    color: '#2196F3',
    plan: 'a',
  },
  {
    title: { de: 'Wanderung', fr: 'Randonnée', en: 'Hiking' },
    location: { de: 'Waldpfad Nord', en: 'North Forest Trail' },
    day: 1,
    time: '14:00',
    duration: 120,
    color: '#4CAF50',
    plan: 'b',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    day: 1,
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Lagerfeuer', fr: 'Feu de camp', en: 'Campfire' },
    location: { de: 'Feuerstelle', en: 'Fire pit' },
    day: 1,
    time: '20:30',
    duration: 90,
    color: '#FF5722',
    plan: 'both',
  },
  {
    title: {
      de: 'Morgenandacht',
      fr: 'Dévotion du matin',
      en: 'Morning devotion',
    },
    day: 2,
    time: '08:00',
    duration: 30,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Frühstück', fr: 'Petit-déjeuner', en: 'Breakfast' },
    day: 2,
    time: '08:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Sporttag', fr: 'Journée sportive', en: 'Sports day' },
    details: {
      de: 'Fußball, Basketball, Volleyball',
      en: 'Football, basketball, volleyball',
    },
    location: { de: 'Sportplatz', en: 'Sports ground' },
    day: 2,
    time: '10:00',
    duration: 180,
    color: '#2196F3',
    plan: 'both',
  },
  {
    title: { de: 'Mittagessen', fr: 'Déjeuner', en: 'Lunch' },
    day: 2,
    time: '13:00',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Freie Zeit', fr: 'Temps libre', en: 'Free time' },
    day: 2,
    time: '14:30',
    duration: 90,
    color: '#607D8B',
    plan: 'both',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    day: 2,
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Spieleabend', fr: 'Soirée jeux', en: 'Game night' },
    day: 2,
    time: '20:00',
    duration: 120,
    color: '#E91E63',
    plan: 'both',
  },
  {
    title: { de: 'Ausflug', fr: 'Excursion', en: 'Day trip' },
    details: { de: 'Fahrt in die Stadt', en: 'Trip to the city' },
    day: 3,
    time: '09:00',
    duration: 360,
    color: '#00BCD4',
    plan: 'both',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    day: 3,
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Bibelarbeit', fr: 'Étude biblique', en: 'Bible study' },
    day: 4,
    time: '10:00',
    duration: 90,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Mittagessen', fr: 'Déjeuner', en: 'Lunch' },
    day: 4,
    time: '12:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: {
      de: 'Kreativangebot',
      fr: 'Atelier créatif',
      en: 'Creative workshop',
    },
    location: { de: 'Werkraum', en: 'Workshop room' },
    day: 4,
    time: '14:00',
    duration: 120,
    color: '#FF9800',
    plan: 'a',
  },
  {
    title: { de: 'Teambuilding', fr: 'Team building', en: 'Team building' },
    day: 4,
    time: '14:00',
    duration: 120,
    color: '#4CAF50',
    plan: 'b',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    day: 4,
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: {
      de: 'Abschlussfeier',
      fr: 'Cérémonie de clôture',
      en: 'Closing ceremony',
    },
    day: 6,
    time: '19:00',
    duration: 120,
    color: '#E91E63',
    plan: 'both',
  },
  {
    title: { de: 'Abreise', fr: 'Départ', en: 'Departure' },
    day: 7,
    time: '10:00',
    duration: null,
    color: '#4CAF50',
    plan: 'both',
  },
];

/** A full program, laid out relative to the camp's own start date. */
export class ProgramEventSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    const start = moment(this.camp.startAt).startOf('day');

    for (const { day, ...event } of EVENTS) {
      await ProgramEventFactory.create({
        camp: { connect: { id: this.camp.id } },
        date: start.clone().add(day, 'days').format('YYYY-MM-DD'),
        ...event,
      });
    }
  }
}
