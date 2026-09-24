import type { PaymentMessageTemplates } from './types.js';

// Payments work the same for every preset, so all of them share these.
const paymentMessageTemplates: PaymentMessageTemplates = {
  payment_requested: {
    subject: {
      en: 'Payment for {{ event.name }}',
      de: 'Zahlung für {{ event.name }}',
      fr: 'Paiement pour {{ event.name }}',
      pl: 'Płatność za {{ event.name }}',
      cs: 'Platba za {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>The participation fee for <strong>{{ event.name }}</strong> is <strong>{{ payment.amount }}</strong>. Please pay it online using the link below:</p>
           <p><a href="{{ payment.url }}">Pay now</a></p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>Der Teilnahmebeitrag für <strong>{{ event.name }}</strong> beträgt <strong>{{ payment.amount }}</strong>. Bitte bezahle ihn online über den folgenden Link:</p>
           <p><a href="{{ payment.url }}">Jetzt bezahlen</a></p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>Les frais de participation pour <strong>{{ event.name }}</strong> s'élèvent à <strong>{{ payment.amount }}</strong>. Merci de les régler en ligne via le lien ci-dessous :</p>
           <p><a href="{{ payment.url }}">Payer maintenant</a></p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Opłata za udział w <strong>{{ event.name }}</strong> wynosi <strong>{{ payment.amount }}</strong>. Prosimy o zapłatę online, korzystając z poniższego linku:</p>
           <p><a href="{{ payment.url }}">Zapłać teraz</a></p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>Účastnický poplatek za <strong>{{ event.name }}</strong> činí <strong>{{ payment.amount }}</strong>. Zaplať ho prosím online přes následující odkaz:</p>
           <p><a href="{{ payment.url }}">Zaplatit nyní</a></p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
  payment_received: {
    subject: {
      en: 'Payment Received – {{ event.name }}',
      de: 'Zahlung erhalten – {{ event.name }}',
      fr: 'Paiement reçu – {{ event.name }}',
      pl: 'Płatność otrzymana – {{ event.name }}',
      cs: 'Platba přijata – {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Thank you! We have received your payment for <strong>{{ event.name }}</strong>.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>Vielen Dank! Wir haben deine Zahlung für <strong>{{ event.name }}</strong> erhalten.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>Merci ! Nous avons bien reçu ton paiement pour <strong>{{ event.name }}</strong>.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Dziękujemy! Otrzymaliśmy Twoją płatność za <strong>{{ event.name }}</strong>.</p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>Děkujeme! Tvou platbu za <strong>{{ event.name }}</strong> jsme obdrželi.</p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
  payment_failed: {
    subject: {
      en: 'Payment Failed – {{ event.name }}',
      de: 'Zahlung fehlgeschlagen – {{ event.name }}',
      fr: 'Échec du paiement – {{ event.name }}',
      pl: 'Płatność nieudana – {{ event.name }}',
      cs: 'Platba se nezdařila – {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>Unfortunately, your payment for <strong>{{ event.name }}</strong> did not go through. You can try again using the link below:</p>
           <p><a href="{{ payment.url }}">Try again</a></p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>Leider ist deine Zahlung für <strong>{{ event.name }}</strong> fehlgeschlagen. Über den folgenden Link kannst du es erneut versuchen:</p>
           <p><a href="{{ payment.url }}">Erneut versuchen</a></p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>Malheureusement, ton paiement pour <strong>{{ event.name }}</strong> n'a pas abouti. Tu peux réessayer via le lien ci-dessous :</p>
           <p><a href="{{ payment.url }}">Réessayer</a></p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Niestety Twoja płatność za <strong>{{ event.name }}</strong> nie powiodła się. Możesz spróbować ponownie, korzystając z poniższego linku:</p>
           <p><a href="{{ payment.url }}">Spróbuj ponownie</a></p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>Tvoje platba za <strong>{{ event.name }}</strong> bohužel neprošla. Můžeš to zkusit znovu přes následující odkaz:</p>
           <p><a href="{{ payment.url }}">Zkusit znovu</a></p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
  payment_refunded: {
    subject: {
      en: 'Refund Issued – {{ event.name }}',
      de: 'Rückerstattung veranlasst – {{ event.name }}',
      fr: 'Remboursement effectué – {{ event.name }}',
      pl: 'Zwrot zlecony – {{ event.name }}',
      cs: 'Vrácení peněz provedeno – {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>We have refunded <strong>{{ refund.amount }}</strong> of your payment for <strong>{{ event.name }}</strong>. Depending on your payment method, it may take a few days to arrive.</p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>Wir haben dir <strong>{{ refund.amount }}</strong> deiner Zahlung für <strong>{{ event.name }}</strong> zurückerstattet. Je nach Zahlungsmethode kann es einige Tage dauern, bis der Betrag bei dir ankommt.</p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>Nous t'avons remboursé <strong>{{ refund.amount }}</strong> de ton paiement pour <strong>{{ event.name }}</strong>. Selon ton moyen de paiement, il peut falloir quelques jours avant que le montant n'arrive.</p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Zwróciliśmy <strong>{{ refund.amount }}</strong> z Twojej płatności za <strong>{{ event.name }}</strong>. W zależności od metody płatności środki mogą dotrzeć w ciągu kilku dni.</p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>Vrátili jsme ti <strong>{{ refund.amount }}</strong> z tvé platby za <strong>{{ event.name }}</strong>. V závislosti na platební metodě může připsání trvat několik dní.</p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
  payment_reminder: {
    subject: {
      en: 'Payment Reminder – {{ event.name }}',
      de: 'Zahlungserinnerung – {{ event.name }}',
      fr: 'Rappel de paiement – {{ event.name }}',
      pl: 'Przypomnienie o płatności – {{ event.name }}',
      cs: 'Připomínka platby – {{ event.name }}',
    },
    body: {
      en: `<p>Hi {{ registration.computedData.firstName }},</p>
           <p>This is a friendly reminder that the participation fee of <strong>{{ payment.amount }}</strong> for <strong>{{ event.name }}</strong> is still outstanding.</p>
           <p><a href="{{ payment.url }}">Pay now</a></p>
           <p>If you have any questions, feel free to reply to this email.</p>
           <p>Best regards,<br>Your Event Team</p>`,
      de: `<p>Hallo {{ registration.computedData.firstName }},</p>
           <p>Dies ist eine freundliche Erinnerung, dass der Teilnahmebeitrag von <strong>{{ payment.amount }}</strong> für <strong>{{ event.name }}</strong> noch offen ist.</p>
           <p><a href="{{ payment.url }}">Jetzt bezahlen</a></p>
           <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
           <p>Herzliche Grüße<br>Dein Veranstaltungsteam</p>`,
      fr: `<p>Salut {{ registration.computedData.firstName }},</p>
           <p>Petit rappel : les frais de participation de <strong>{{ payment.amount }}</strong> pour <strong>{{ event.name }}</strong> sont toujours en attente.</p>
           <p><a href="{{ payment.url }}">Payer maintenant</a></p>
           <p>Si tu as des questions, n'hésite pas à répondre directement à cet e-mail.</p>
           <p>Bien à toi,<br>Ton équipe de l'événement</p>`,
      pl: `<p>Cześć {{ registration.computedData.firstName }},</p>
           <p>Przypominamy, że opłata za udział w wysokości <strong>{{ payment.amount }}</strong> za <strong>{{ event.name }}</strong> nie została jeszcze uregulowana.</p>
           <p><a href="{{ payment.url }}">Zapłać teraz</a></p>
           <p>W razie pytań możesz odpowiedzieć na tego maila.</p>
           <p>Serdecznie pozdrawiamy,<br>Zespół wydarzenia</p>`,
      cs: `<p>Ahoj {{ registration.computedData.firstName }},</p>
           <p>Připomínáme, že účastnický poplatek ve výši <strong>{{ payment.amount }}</strong> za <strong>{{ event.name }}</strong> zatím nebyl uhrazen.</p>
           <p><a href="{{ payment.url }}">Zaplatit nyní</a></p>
           <p>Pokud máš dotazy, odpověz na tento e-mail.</p>
           <p>S pozdravem,<br>Tým akce</p>`,
    },
  },
};

export default paymentMessageTemplates;
