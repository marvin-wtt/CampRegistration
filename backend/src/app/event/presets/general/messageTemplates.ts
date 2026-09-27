import type { PresetMessageTemplates } from '../types.js';

const generalMessageTemplates: PresetMessageTemplates = {
  registration_submitted: {
    subject: {
      en: 'Registration Received – {{ event.name }}',
      de: 'Anmeldung erhalten – {{ event.name }}',
      fr: 'Inscription reçue – {{ event.name }}',
      pl: 'Zgłoszenie otrzymane – {{ event.name }}',
      cs: 'Registrace přijata – {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Thank you for registering for <strong>{{ event.name }}</strong>. We have received your registration.</p>
           <p>We will review your registration and get back to you soon with further information.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,

      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>vielen Dank für deine Anmeldung zu <strong>{{ event.name }}</strong>. Wir haben deine Anmeldung erhalten.</p>
           <p>Wir prüfen deine Anmeldung und melden uns in Kürze mit weiteren Informationen bei dir.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,

      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>merci pour ton inscription à l'événement <strong>{{ event.name }}</strong>. Nous avons bien reçu ton inscription.</p>
           <p>Nous allons examiner ton inscription et te recontacterons prochainement avec plus d'informations.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,

      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>dziękujemy za zgłoszenie na wydarzenie <strong>{{ event.name }}</strong>. Otrzymaliśmy Twoje zgłoszenie.</p>
           <p>Obecnie je sprawdzamy i wkrótce odezwiemy się z dodatkowymi informacjami.</p>
           <p>W razie pytań możesz po prostu odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,

      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>děkujeme za registraci na akci <strong>{{ event.name }}</strong>. Tvou registraci jsme obdrželi.</p>
           <p>Registraci nyní kontrolujeme a brzy se ti ozveme s dalšími informacemi.</p>
           <p>Pokud máš jakékoli dotazy, neváhej odpovědět na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
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
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Your registration for <strong>{{ event.name }}</strong> has been confirmed. We look forward to welcoming you!</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>deine Anmeldung zu <strong>{{ event.name }}</strong> wurde bestätigt. Wir freuen uns darauf, dich begrüßen zu dürfen!</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>ton inscription à l'événement <strong>{{ event.name }}</strong> a été confirmée. Nous avons hâte de t'accueillir !</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Twoje zgłoszenie na wydarzenie <strong>{{ event.name }}</strong> zostało potwierdzone. Cieszymy się, że będziesz z nami!</p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>tvoje registrace na akci <strong>{{ event.name }}</strong> byla potvrzena. Těšíme se na tebe!</p>
           <p>Pokud máš dotazy, jednoduše odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
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
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Your registration for <strong>{{ event.name }}</strong> has been placed on the waitlist because all available spots are currently taken. We'll let you know as soon as a spot becomes available.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>deine Anmeldung zu <strong>{{ event.name }}</strong> wurde auf die Warteliste gesetzt, da derzeit alle Plätze vergeben sind. Wir informieren dich, sobald ein Platz frei wird.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>ton inscription à l'événement <strong>{{ event.name }}</strong> a été placée sur la liste d'attente, car toutes les places sont actuellement occupées. Nous te préviendrons dès qu'une place se libère.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Twoje zgłoszenie na wydarzenie <strong>{{ event.name }}</strong> zostało umieszczone na liście oczekujących, ponieważ wszystkie miejsca są obecnie zajęte. Damy Ci znać, gdy tylko zwolni się miejsce.</p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>tvoje registrace na akci <strong>{{ event.name }}</strong> byla zařazena na čekací listinu, protože jsou momentálně všechna místa obsazena. Dáme ti vědět, jakmile se uvolní místo.</p>
           <p>Pokud máš dotazy, neváhej odpovědět na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
  registration_waitlist_accepted: {
    subject: {
      en: "Waitlist Registration Accepted – You're In for {{ event.name }}",
      de: 'Wartelistenanmeldung akzeptiert – Du bist dabei bei {{ event.name }}',
      fr: "Inscription acceptée depuis la liste d'attente – Tu participes à {{ event.name }}",
      pl: 'Zgłoszenie z listy oczekujących przyjęte – Jesteś w {{ event.name }}!',
      cs: 'Registrace z čekací listiny přijata – Jsi součástí {{ event.name }}!',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Great news! A spot has opened up and your registration for <strong>{{ event.name }}</strong> has now been confirmed. We look forward to welcoming you!</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>gute Nachrichten! Ein Platz ist frei geworden und deine Anmeldung zu <strong>{{ event.name }}</strong> wurde nun bestätigt. Wir freuen uns darauf, dich begrüßen zu dürfen!</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>excellente nouvelle ! Une place s'est libérée et ton inscription à l'événement <strong>{{ event.name }}</strong> est maintenant confirmée. Nous avons hâte de t'accueillir !</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>dobre wieści! Zwolniło się miejsce i Twoje zgłoszenie na wydarzenie <strong>{{ event.name }}</strong> zostało potwierdzone. Cieszymy się, że będziesz z nami!</p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>skvělé zprávy! Uvolnilo se místo a tvoje registrace na akci <strong>{{ event.name }}</strong> byla potvrzena. Těšíme se na tebe!</p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
  registration_updated: {
    subject: {
      en: 'Registration Updated – Check Your Details for {{ event.name }}',
      de: 'Anmeldung aktualisiert – Überprüfe deine Daten für {{ event.name }}',
      fr: 'Inscription mise à jour – Vérifie tes informations pour {{ event.name }}',
      pl: 'Zgłoszenie zaktualizowane – Sprawdź swoje dane dla {{ event.name }}',
      cs: 'Registrace aktualizována – Zkontroluj své údaje pro {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Your registration details for <strong>{{ event.name }}</strong> have been updated. Please review the changes and let us know if everything is correct.</p>
           <p>{{ registration.changes }}</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>deine Anmeldedaten für <strong>{{ event.name }}</strong> wurden aktualisiert. Bitte prüfe die Änderungen und gib uns Bescheid, ob alles passt.</p>
           <p>{{ registration.changes }}</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>les détails de ton inscription à l'événement <strong>{{ event.name }}</strong> ont été mis à jour. Merci de vérifier les modifications et de nous dire si tout est en ordre.</p>
           <p>{{ registration.changes }}</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Twoje dane rejestracyjne na wydarzenie <strong>{{ event.name }}</strong> zostały zaktualizowane. Sprawdź proszę zmiany i daj nam znać, czy wszystko się zgadza.</p>
           <p>{{ registration.changes }}</p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>tvá registrační data pro akci <strong>{{ event.name }}</strong> byla aktualizována. Zkontroluj prosím změny a dej nám vědět, zda je vše v pořádku.</p>
           <p>{{ registration.changes }}</p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
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
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>We're sorry to inform you that your registration for <strong>{{ event.name }}</strong> has been canceled. If you believe this is a mistake or have any questions, please reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>wir bedauern, dir mitteilen zu müssen, dass deine Anmeldung zu <strong>{{ event.name }}</strong> storniert wurde. Falls du denkst, dass dies ein Fehler ist oder du Fragen hast, antworte bitte auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>nous sommes désolés de t'informer que ton inscription à l'événement <strong>{{ event.name }}</strong> a été annulée. Si tu penses qu'il s'agit d'une erreur ou si tu as des questions, réponds à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>z przykrością informujemy, że Twoje zgłoszenie na wydarzenie <strong>{{ event.name }}</strong> zostało anulowane. Jeśli uważasz, że to pomyłka lub masz pytania, odpowiedz na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>s politováním ti oznamujeme, že tvoje registrace na akci <strong>{{ event.name }}</strong> byla zrušena. Pokud si myslíš, že jde o omyl, nebo máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
};

export default generalMessageTemplates;
