const messageTemplatesObj = {
  registration_submitted: {
    includeOnCreate: true,
    subject: {
      en: 'Registration Received – {{ camp.name }}',
      de: 'Anmeldung erhalten – {{ camp.name }}',
      fr: 'Inscription reçue – {{ camp.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.data.first_name }},</p>
           <p>Thank you for registering for camp <strong>{{ camp.name }}</strong>. We have received your registration and are excited to have you join us. We'll be in touch soon with more details – so stay tuned!</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Camp Team</p>`,
      de: `<p>Hallo {{ registration.data.first_name }},</p>
           <p>Vielen Dank für deine Anmeldung zum Camp <strong>{{ camp.name }}</strong>. Wir haben deine Anmeldung erhalten und freuen uns, dass du dabei bist. In Kürze erhältst du weitere Informationen – bleib gespannt!</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Liebe Grüße,<br>Dein Camp Team</p>`,
      fr: `<p>Salut {{ registration.data.first_name }},</p>
           <p>Merci pour ton inscription au camp <strong>{{ camp.name }}</strong>. Nous avons bien reçu ton inscription et sommes ravis de te compter parmi nous. Nous te contacterons bientôt avec plus de détails – reste à l'écoute !</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe du camp</p>`,
    },
  },
  registration_confirmed: {
    includeOnCreate: true,
    subject: {
      en: 'Registration Confirmed – Welcome to {{ camp.name }}!',
      de: 'Anmeldung bestätigt – Willkommen im Camp {{ camp.name }}!',
      fr: 'Inscription confirmée – Bienvenue au camp {{ camp.name }} !',
    },
    body: {
      en: `<p>Hi {{ registration.data.first_name }},</p>
           <p>Your registration for camp <strong>{{ camp.name }}</strong> has been confirmed! We can't wait to welcome you and share an unforgettable experience together.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Camp Team</p>`,
      de: `<p>Hallo {{ registration.data.first_name }},</p>
           <p>Deine Anmeldung für das Camp <strong>{{ camp.name }}</strong> wurde bestätigt! Wir freuen uns sehr darauf, dich willkommen zu heißen und gemeinsam eine unvergessliche Zeit zu erleben.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Liebe Grüße,<br>Dein Camp Team</p>`,
      fr: `<p>Salut {{ registration.data.first_name }},</p>
           <p>Ton inscription au camp <strong>{{ camp.name }}</strong> a été confirmée ! Nous avons hâte de t'accueillir et de vivre ensemble une expérience inoubliable.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe du camp</p>`,
    },
  },
  registration_waitlisted: {
    includeOnCreate: true,
    subject: {
      en: 'Registration Waitlisted – {{ camp.name }}',
      de: 'Anmeldung auf Warteliste – {{ camp.name }}',
      fr: "Inscription en liste d'attente – {{ camp.name }}",
    },
    body: {
      en: `<p>Hi {{ registration.data.first_name }},</p>
           <p>Your registration for camp <strong>{{ camp.name }}</strong> has been placed on the waitlist because the limit for your country has been reached. We'll keep you updated and let you know as soon as a spot becomes available.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Camp Team</p>`,
      de: `<p>Hallo {{ registration.data.first_name }},</p>
           <p>Deine Anmeldung für das Camp <strong>{{ camp.name }}</strong> wurde auf die Warteliste gesetzt, da das Länderkontingent erreicht wurde. Wir halten dich auf dem Laufenden und informieren dich, sobald ein Platz frei wird.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Liebe Grüße,<br>Dein Camp Team</p>`,
      fr: `<p>Salut {{ registration.data.first_name }},</p>
           <p>Ton inscription au camp <strong>{{ camp.name }}</strong> a été placée sur la liste d'attente car la limite pour ton pays a été atteinte. Nous te tiendrons informé(e) et te contacterons dès qu'une place sera disponible.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe du camp</p>`,
    },
  },
  registration_waitlist_accepted: {
    includeOnCreate: true,
    subject: {
      en: "Waitlist Registration Accepted – You're In for {{ camp.name }}",
      de: 'Wartelistenanmeldung akzeptiert – Du bist dabei bei {{ camp.name }}',
      fr: "Inscription acceptée depuis la liste d'attente – Tu es accepté(e) pour {{ camp.name }}",
    },
    body: {
      en: `<p>Hi {{ registration.data.first_name }},</p>
           <p>Great news! Your waitlisted registration for camp <strong>{{ camp.name }}</strong> has now been confirmed. We're excited to have you with us and look forward to a fantastic camp experience together.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Camp Team</p>`,
      de: `<p>Hallo {{ registration.data.first_name }},</p>
           <p>Gute Nachrichten! Deine Anmeldung von der Warteliste für das Camp <strong>{{ camp.name }}</strong> wurde nun bestätigt. Wir freuen uns sehr, dass du dabei bist, und erwarten eine fantastische Camp-Zeit.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Liebe Grüße,<br>Dein Camp Team</p>`,
      fr: `<p>Salut {{ registration.data.first_name }},</p>
           <p>Excellente nouvelle ! Ton inscription en liste d'attente pour le camp <strong>{{ camp.name }}</strong> a été confirmée. Nous sommes ravis de t'accueillir et attendons avec impatience une expérience de camp formidable ensemble.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe du camp</p>`,
    },
  },
  registration_updated: {
    includeOnCreate: true,
    subject: {
      en: 'Registration Updated – Check Your Details for {{ camp.name }}',
      de: 'Anmeldung aktualisiert – Überprüfe deine Daten für {{ camp.name }}',
      fr: 'Inscription mise à jour – Vérifie tes informations pour {{ camp.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.data.first_name }},</p>
           <p>Your registration details for camp <strong>{{ camp.name }}</strong> have been updated. Please review the changes and let us know if everything is correct.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Camp Team</p>`,
      de: `<p>Hallo {{ registration.data.first_name }},</p>
           <p>Deine Anmeldedaten für das Camp <strong>{{ camp.name }}</strong> wurden aktualisiert. Bitte prüfe die Änderungen und gib uns Bescheid, ob alles passt.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Liebe Grüße,<br>Dein Camp Team</p>`,
      fr: `<p>Salut {{ registration.data.first_name }},</p>
           <p>Les détails de ton inscription au camp <strong>{{ camp.name }}</strong> ont été mis à jour. Merci de vérifier les modifications et de nous dire si tout est en ordre.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe du camp</p>`,
    },
  },
  registration_canceled: {
    includeOnCreate: true,
    subject: {
      en: 'Registration Canceled – {{ camp.name }}',
      de: 'Anmeldung storniert – {{ camp.name }}',
      fr: 'Inscription annulée – {{ camp.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.data.first_name }},</p>
           <p>We're sorry to inform you that your registration for camp <strong>{{ camp.name }}</strong> has been canceled. If you believe this is a mistake or have any questions, please reply to this email.</p>
           <p>Best regards,<br>Your Camp Team</p>`,
      de: `<p>Hallo {{ registration.data.first_name }},</p>
           <p>Wir bedauern, dir mitteilen zu müssen, dass deine Anmeldung für das Camp <strong>{{ camp.name }}</strong> storniert wurde. Falls du denkst, dass dies ein Fehler ist oder du Fragen hast, antworte bitte auf diese E-Mail.</p>
           <p>Liebe Grüße,<br>Dein Camp Team</p>`,
      fr: `<p>Salut {{ registration.data.first_name }},</p>
           <p>Nous sommes désolés de t'informer que ton inscription au camp <strong>{{ camp.name }}</strong> a été annulée. Si tu penses qu'il s'agit d'une erreur ou si tu as des questions, réponds à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe du camp</p>`,
    },
  },
};

export const messageTemplates = Object.entries(messageTemplatesObj).map(
  ([event, { subject, body }]) => ({
    subject,
    body,
    event,
  }),
);

export default messageTemplates;
