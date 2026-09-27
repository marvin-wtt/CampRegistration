import type { PresetMessageTemplates } from '../types.js';

// Seminar participants are adults, so every template uses the formal register.
const seminarMessageTemplates: PresetMessageTemplates = {
  registration_submitted: {
    subject: {
      en: 'Registration Received – {{ event.name }}',
      de: 'Anmeldung erhalten – {{ event.name }}',
      fr: 'Inscription reçue – {{ event.name }}',
      pl: 'Zgłoszenie otrzymane – {{ event.name }}',
      cs: 'Registrace přijata – {{ event.name }}',
    },
    body: {
      en: `<p>Dear {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Thank you for registering for the seminar <strong>{{ event.name }}</strong>. We have received your registration.</p>
           <p>We will review your registration and get back to you soon with further information.</p>
           <p>If you have any questions, please reply to this email.</p>
           <p>Kind regards,<br>The Seminar Team</p>`,
      de: `<p>Guten Tag {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>vielen Dank für Ihre Anmeldung zum Seminar <strong>{{ event.name }}</strong>. Wir haben Ihre Anmeldung erhalten.</p>
           <p>Wir prüfen Ihre Anmeldung und melden uns in Kürze mit weiteren Informationen bei Ihnen.</p>
           <p>Bei Fragen antworten Sie gerne auf diese E-Mail.</p>
           <p>Mit freundlichen Grüßen<br>Ihr Seminarteam</p>`,
      fr: `<p>Bonjour {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Nous vous remercions pour votre inscription au séminaire <strong>{{ event.name }}</strong>. Nous avons bien reçu votre inscription.</p>
           <p>Nous allons l'examiner et reviendrons vers vous prochainement avec plus d'informations.</p>
           <p>Pour toute question, n'hésitez pas à répondre à cet e-mail.</p>
           <p>Cordialement,<br>L'équipe du séminaire</p>`,
      pl: `<p>Dzień dobry,</p>
           <p>dziękujemy za zgłoszenie na seminarium <strong>{{ event.name }}</strong>. Otrzymaliśmy Państwa zgłoszenie.</p>
           <p>Obecnie je weryfikujemy i wkrótce skontaktujemy się z dodatkowymi informacjami.</p>
           <p>W razie pytań prosimy o odpowiedź na tę wiadomość.</p>
           <p>Z poważaniem,<br>Zespół seminarium</p>`,
      cs: `<p>Dobrý den,</p>
           <p>děkujeme za Vaši registraci na seminář <strong>{{ event.name }}</strong>. Vaši registraci jsme obdrželi.</p>
           <p>Registraci nyní kontrolujeme a brzy se Vám ozveme s dalšími informacemi.</p>
           <p>V případě dotazů odpovězte prosím na tento e-mail.</p>
           <p>S pozdravem,<br>Tým semináře</p>`,
    },
  },
  registration_confirmed: {
    subject: {
      en: 'Registration Confirmed – {{ event.name }}',
      de: 'Anmeldung bestätigt – {{ event.name }}',
      fr: 'Inscription confirmée – {{ event.name }}',
      pl: 'Zgłoszenie potwierdzone – {{ event.name }}',
      cs: 'Registrace potvrzena – {{ event.name }}',
    },
    body: {
      en: `<p>Dear {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>We are pleased to confirm your registration for the seminar <strong>{{ event.name }}</strong>. We look forward to welcoming you.</p>
           <p>If you have any questions, please reply to this email.</p>
           <p>Kind regards,<br>The Seminar Team</p>`,
      de: `<p>Guten Tag {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>wir freuen uns, Ihnen Ihre Anmeldung zum Seminar <strong>{{ event.name }}</strong> bestätigen zu können, und freuen uns auf Ihre Teilnahme.</p>
           <p>Bei Fragen antworten Sie gerne auf diese E-Mail.</p>
           <p>Mit freundlichen Grüßen<br>Ihr Seminarteam</p>`,
      fr: `<p>Bonjour {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Nous avons le plaisir de vous confirmer votre inscription au séminaire <strong>{{ event.name }}</strong>. Nous nous réjouissons de vous accueillir.</p>
           <p>Pour toute question, n'hésitez pas à répondre à cet e-mail.</p>
           <p>Cordialement,<br>L'équipe du séminaire</p>`,
      pl: `<p>Dzień dobry,</p>
           <p>z przyjemnością potwierdzamy Państwa zgłoszenie na seminarium <strong>{{ event.name }}</strong>. Cieszymy się na Państwa udział.</p>
           <p>W razie pytań prosimy o odpowiedź na tę wiadomość.</p>
           <p>Z poważaniem,<br>Zespół seminarium</p>`,
      cs: `<p>Dobrý den,</p>
           <p>s potěšením potvrzujeme Vaši registraci na seminář <strong>{{ event.name }}</strong>. Těšíme se na Vaši účast.</p>
           <p>V případě dotazů odpovězte prosím na tento e-mail.</p>
           <p>S pozdravem,<br>Tým semináře</p>`,
    },
  },
  registration_waitlisted: {
    subject: {
      en: 'Registration Waitlisted – {{ event.name }}',
      de: 'Anmeldung auf Warteliste – {{ event.name }}',
      fr: "Inscription en liste d'attente – {{ event.name }}",
      pl: 'Zgłoszenie na liście oczekujących – {{ event.name }}',
      cs: 'Registrace na čekací listině – {{ event.name }}',
    },
    body: {
      en: `<p>Dear {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Your registration for the seminar <strong>{{ event.name }}</strong> has been placed on the waitlist because all available places are currently taken. We will notify you as soon as a place becomes available.</p>
           <p>If you have any questions, please reply to this email.</p>
           <p>Kind regards,<br>The Seminar Team</p>`,
      de: `<p>Guten Tag {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Ihre Anmeldung zum Seminar <strong>{{ event.name }}</strong> wurde auf die Warteliste gesetzt, da derzeit alle Plätze vergeben sind. Wir informieren Sie, sobald ein Platz frei wird.</p>
           <p>Bei Fragen antworten Sie gerne auf diese E-Mail.</p>
           <p>Mit freundlichen Grüßen<br>Ihr Seminarteam</p>`,
      fr: `<p>Bonjour {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Votre inscription au séminaire <strong>{{ event.name }}</strong> a été placée sur la liste d'attente, car toutes les places sont actuellement occupées. Nous vous informerons dès qu'une place se libère.</p>
           <p>Pour toute question, n'hésitez pas à répondre à cet e-mail.</p>
           <p>Cordialement,<br>L'équipe du séminaire</p>`,
      pl: `<p>Dzień dobry,</p>
           <p>Państwa zgłoszenie na seminarium <strong>{{ event.name }}</strong> zostało umieszczone na liście oczekujących, ponieważ wszystkie miejsca są obecnie zajęte. Poinformujemy Państwa, gdy tylko zwolni się miejsce.</p>
           <p>W razie pytań prosimy o odpowiedź na tę wiadomość.</p>
           <p>Z poważaniem,<br>Zespół seminarium</p>`,
      cs: `<p>Dobrý den,</p>
           <p>Vaše registrace na seminář <strong>{{ event.name }}</strong> byla zařazena na čekací listinu, protože jsou momentálně všechna místa obsazena. Jakmile se místo uvolní, budeme Vás informovat.</p>
           <p>V případě dotazů odpovězte prosím na tento e-mail.</p>
           <p>S pozdravem,<br>Tým semináře</p>`,
    },
  },
  registration_waitlist_accepted: {
    subject: {
      en: 'Waitlist Registration Accepted – {{ event.name }}',
      de: 'Wartelistenanmeldung bestätigt – {{ event.name }}',
      fr: "Inscription depuis la liste d'attente confirmée – {{ event.name }}",
      pl: 'Zgłoszenie z listy oczekujących potwierdzone – {{ event.name }}',
      cs: 'Registrace z čekací listiny potvrzena – {{ event.name }}',
    },
    body: {
      en: `<p>Dear {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>A place has become available and we are pleased to confirm your registration for the seminar <strong>{{ event.name }}</strong>. We look forward to welcoming you.</p>
           <p>If you have any questions, please reply to this email.</p>
           <p>Kind regards,<br>The Seminar Team</p>`,
      de: `<p>Guten Tag {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>ein Platz ist frei geworden und wir freuen uns, Ihnen Ihre Anmeldung zum Seminar <strong>{{ event.name }}</strong> bestätigen zu können. Wir freuen uns auf Ihre Teilnahme.</p>
           <p>Bei Fragen antworten Sie gerne auf diese E-Mail.</p>
           <p>Mit freundlichen Grüßen<br>Ihr Seminarteam</p>`,
      fr: `<p>Bonjour {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Une place s'est libérée et nous avons le plaisir de vous confirmer votre inscription au séminaire <strong>{{ event.name }}</strong>. Nous nous réjouissons de vous accueillir.</p>
           <p>Pour toute question, n'hésitez pas à répondre à cet e-mail.</p>
           <p>Cordialement,<br>L'équipe du séminaire</p>`,
      pl: `<p>Dzień dobry,</p>
           <p>zwolniło się miejsce i z przyjemnością potwierdzamy Państwa zgłoszenie na seminarium <strong>{{ event.name }}</strong>. Cieszymy się na Państwa udział.</p>
           <p>W razie pytań prosimy o odpowiedź na tę wiadomość.</p>
           <p>Z poważaniem,<br>Zespół seminarium</p>`,
      cs: `<p>Dobrý den,</p>
           <p>uvolnilo se místo a s potěšením potvrzujeme Vaši registraci na seminář <strong>{{ event.name }}</strong>. Těšíme se na Vaši účast.</p>
           <p>V případě dotazů odpovězte prosím na tento e-mail.</p>
           <p>S pozdravem,<br>Tým semináře</p>`,
    },
  },
  registration_updated: {
    subject: {
      en: 'Registration Updated – {{ event.name }}',
      de: 'Anmeldung aktualisiert – {{ event.name }}',
      fr: 'Inscription mise à jour – {{ event.name }}',
      pl: 'Zgłoszenie zaktualizowane – {{ event.name }}',
      cs: 'Registrace aktualizována – {{ event.name }}',
    },
    body: {
      en: `<p>Dear {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Your registration details for the seminar <strong>{{ event.name }}</strong> have been updated. Please review the changes and let us know if anything is incorrect.</p>
           <p>{{ registration.changes }}</p>
           <p>If you have any questions, please reply to this email.</p>
           <p>Kind regards,<br>The Seminar Team</p>`,
      de: `<p>Guten Tag {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Ihre Anmeldedaten zum Seminar <strong>{{ event.name }}</strong> wurden aktualisiert. Bitte prüfen Sie die Änderungen und teilen Sie uns mit, falls etwas nicht stimmt.</p>
           <p>{{ registration.changes }}</p>
           <p>Bei Fragen antworten Sie gerne auf diese E-Mail.</p>
           <p>Mit freundlichen Grüßen<br>Ihr Seminarteam</p>`,
      fr: `<p>Bonjour {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Les informations de votre inscription au séminaire <strong>{{ event.name }}</strong> ont été mises à jour. Merci de vérifier les modifications et de nous signaler toute erreur.</p>
           <p>{{ registration.changes }}</p>
           <p>Pour toute question, n'hésitez pas à répondre à cet e-mail.</p>
           <p>Cordialement,<br>L'équipe du séminaire</p>`,
      pl: `<p>Dzień dobry,</p>
           <p>dane Państwa zgłoszenia na seminarium <strong>{{ event.name }}</strong> zostały zaktualizowane. Prosimy o sprawdzenie zmian i poinformowanie nas, jeśli coś się nie zgadza.</p>
           <p>{{ registration.changes }}</p>
           <p>W razie pytań prosimy o odpowiedź na tę wiadomość.</p>
           <p>Z poważaniem,<br>Zespół seminarium</p>`,
      cs: `<p>Dobrý den,</p>
           <p>údaje Vaší registrace na seminář <strong>{{ event.name }}</strong> byly aktualizovány. Zkontrolujte prosím změny a dejte nám vědět, pokud něco nesouhlasí.</p>
           <p>{{ registration.changes }}</p>
           <p>V případě dotazů odpovězte prosím na tento e-mail.</p>
           <p>S pozdravem,<br>Tým semináře</p>`,
    },
  },
  registration_canceled: {
    subject: {
      en: 'Registration Canceled – {{ event.name }}',
      de: 'Anmeldung storniert – {{ event.name }}',
      fr: 'Inscription annulée – {{ event.name }}',
      pl: 'Zgłoszenie anulowane – {{ event.name }}',
      cs: 'Registrace zrušena – {{ event.name }}',
    },
    body: {
      en: `<p>Dear {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>We regret to inform you that your registration for the seminar <strong>{{ event.name }}</strong> has been canceled. If you believe this is a mistake or have any questions, please reply to this email.</p>
           <p>Kind regards,<br>The Seminar Team</p>`,
      de: `<p>Guten Tag {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>wir bedauern, Ihnen mitteilen zu müssen, dass Ihre Anmeldung zum Seminar <strong>{{ event.name }}</strong> storniert wurde. Falls Sie dies für einen Fehler halten oder Fragen haben, antworten Sie bitte auf diese E-Mail.</p>
           <p>Mit freundlichen Grüßen<br>Ihr Seminarteam</p>`,
      fr: `<p>Bonjour {{ registration.computedData.firstName }} {{ registration.computedData.lastName }},</p>
           <p>Nous avons le regret de vous informer que votre inscription au séminaire <strong>{{ event.name }}</strong> a été annulée. Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, merci de répondre à cet e-mail.</p>
           <p>Cordialement,<br>L'équipe du séminaire</p>`,
      pl: `<p>Dzień dobry,</p>
           <p>z przykrością informujemy, że Państwa zgłoszenie na seminarium <strong>{{ event.name }}</strong> zostało anulowane. Jeśli uważają Państwo, że to pomyłka, lub mają pytania, prosimy o odpowiedź na tę wiadomość.</p>
           <p>Z poważaniem,<br>Zespół seminarium</p>`,
      cs: `<p>Dobrý den,</p>
           <p>s politováním Vám oznamujeme, že Vaše registrace na seminář <strong>{{ event.name }}</strong> byla zrušena. Pokud se domníváte, že jde o omyl, nebo máte dotazy, odpovězte prosím na tento e-mail.</p>
           <p>S pozdravem,<br>Tým semináře</p>`,
    },
  },
};

export default seminarMessageTemplates;
