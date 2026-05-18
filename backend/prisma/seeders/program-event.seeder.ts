import { ProgramEventFactory } from '../factories/program-event.js';
import { Camp } from '#generated/prisma/client.js';

type EventData = {
  title: string | Record<string, string>;
  details?: string | Record<string, string>;
  location?: string | Record<string, string>;
  date?: string;
  time?: string | null;
  duration?: number | null;
  color?: string;
  plan?: 'a' | 'b' | 'both';
};

const EVENTS: EventData[] = [
  {
    title: { de: 'Anreise', fr: 'Arrivée', en: 'Arrival' },
    date: '2026-11-17',
    time: '15:00',
    duration: 120,
    color: '#4CAF50',
    plan: 'both',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    date: '2026-11-17',
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Morgenandacht', fr: 'Dévotion du matin', en: 'Morning devotion' },
    date: '2026-11-18',
    time: '08:00',
    duration: 30,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Frühstück', fr: 'Petit-déjeuner', en: 'Breakfast' },
    date: '2026-11-18',
    time: '08:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Bibelarbeit', fr: 'Étude biblique', en: 'Bible study' },
    date: '2026-11-18',
    time: '10:00',
    duration: 90,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Mittagessen', fr: 'Déjeuner', en: 'Lunch' },
    date: '2026-11-18',
    time: '12:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Kletterpark', fr: 'Parc d\'escalade', en: 'Climbing park' },
    details: { de: 'Sicherheitseinweisung um 14:00 Uhr', en: 'Safety briefing at 14:00' },
    location: { de: 'Kletterpark Süd', en: 'South Climbing Park' },
    date: '2026-11-18',
    time: '14:00',
    duration: 120,
    color: '#2196F3',
    plan: 'a',
  },
  {
    title: { de: 'Wanderung', fr: 'Randonnée', en: 'Hiking' },
    location: { de: 'Waldpfad Nord', en: 'North Forest Trail' },
    date: '2026-11-18',
    time: '14:00',
    duration: 120,
    color: '#4CAF50',
    plan: 'b',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    date: '2026-11-18',
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Lagerfeuer', fr: 'Feu de camp', en: 'Campfire' },
    location: { de: 'Feuerstelle', en: 'Fire pit' },
    date: '2026-11-18',
    time: '20:30',
    duration: 90,
    color: '#FF5722',
    plan: 'both',
  },
  {
    title: { de: 'Morgenandacht', fr: 'Dévotion du matin', en: 'Morning devotion' },
    date: '2026-11-19',
    time: '08:00',
    duration: 30,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Frühstück', fr: 'Petit-déjeuner', en: 'Breakfast' },
    date: '2026-11-19',
    time: '08:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Sporttag', fr: 'Journée sportive', en: 'Sports day' },
    details: { de: 'Fußball, Basketball, Volleyball', en: 'Football, basketball, volleyball' },
    location: { de: 'Sportplatz', en: 'Sports ground' },
    date: '2026-11-19',
    time: '10:00',
    duration: 180,
    color: '#2196F3',
    plan: 'both',
  },
  {
    title: { de: 'Mittagessen', fr: 'Déjeuner', en: 'Lunch' },
    date: '2026-11-19',
    time: '13:00',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Freie Zeit', fr: 'Temps libre', en: 'Free time' },
    date: '2026-11-19',
    time: '14:30',
    duration: 90,
    color: '#607D8B',
    plan: 'both',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    date: '2026-11-19',
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Spieleabend', fr: 'Soirée jeux', en: 'Game night' },
    date: '2026-11-19',
    time: '20:00',
    duration: 120,
    color: '#E91E63',
    plan: 'both',
  },
  {
    title: { de: 'Ausflug', fr: 'Excursion', en: 'Day trip' },
    details: { de: 'Fahrt in die Stadt', en: 'Trip to the city' },
    date: '2026-11-20',
    time: '09:00',
    duration: 360,
    color: '#00BCD4',
    plan: 'both',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    date: '2026-11-20',
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Bibelarbeit', fr: 'Étude biblique', en: 'Bible study' },
    date: '2026-11-21',
    time: '10:00',
    duration: 90,
    color: '#9C27B0',
    plan: 'both',
  },
  {
    title: { de: 'Mittagessen', fr: 'Déjeuner', en: 'Lunch' },
    date: '2026-11-21',
    time: '12:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Kreativangebot', fr: 'Atelier créatif', en: 'Creative workshop' },
    location: { de: 'Werkraum', en: 'Workshop room' },
    date: '2026-11-21',
    time: '14:00',
    duration: 120,
    color: '#FF9800',
    plan: 'a',
  },
  {
    title: { de: 'Teambuilding', fr: 'Team building', en: 'Team building' },
    date: '2026-11-21',
    time: '14:00',
    duration: 120,
    color: '#4CAF50',
    plan: 'b',
  },
  {
    title: { de: 'Abendessen', fr: 'Dîner', en: 'Dinner' },
    date: '2026-11-21',
    time: '18:30',
    duration: 60,
    color: '#FF9800',
    plan: 'both',
  },
  {
    title: { de: 'Abschlussfeier', fr: 'Cérémonie de clôture', en: 'Closing ceremony' },
    date: '2026-11-23',
    time: '19:00',
    duration: 120,
    color: '#E91E63',
    plan: 'both',
  },
  {
    title: { de: 'Abreise', fr: 'Départ', en: 'Departure' },
    date: '2026-11-24',
    time: '10:00',
    duration: null,
    color: '#4CAF50',
    plan: 'both',
  },
];

export class ProgramEventSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    for (const event of EVENTS) {
      await ProgramEventFactory.create({
        camp: { connect: { id: this.camp.id } },
        ...event,
      });
    }
  }
}
