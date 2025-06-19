/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    getBySel(
      dataTestAttribute: string,
      args?: any,
    ): Chainable<JQuery<HTMLElement>>;

    getEmails(email: string): Chainable<{
      subject: string;
      text: string;
      body: string;
    }>;

    waitForEmails(email: string): Chainable<{
      subject: string;
      text: string;
      body: string;
    }>;

    clearEmails(): Chainable<void>;

    generateTotp(secret: string): Chainable<string>;

    seedDatabase(): void;

    truncateDatabase(): void;

    resetDatabase(): void;
  }
}
