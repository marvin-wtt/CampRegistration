describe('Authentication', () => {


  before(() => {
    cy.exec("npm run db:reset -w ../backend");
  });

  beforeEach(() => {
    cy.exec(
      "npm run db:truncate -w ../backend && npm run db:seed -w ../backend",
    );

    //cy.clearEmails();
  });

  describe('Login', () => {
    it('should log in with valid credentials', () => {
      cy.intercept("POST", `/api/v1/auth/login`).as(
        "loginUser",
      );

      cy.visit('/login');

      cy.getBySel('login-form')
        .getBySel('email')
        .type('john@example.com');

      cy.getBySel('login-form')
        .getBySel('password')
        .type('password');

      cy.getBySel('login-form')
        .getBySel('remember')
        .click();

      cy.getBySel('login-form')
        .getBySel('submit')
        .click();

      cy.wait('@loginUser').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);

        const body = interception.response.body;
        expect(body).to.have.property('data');
        const data = body.data;
        expect(data).to.have.property('accessToken');
        expect(data).to.have.property('refreshToken');
      });

      cy.getBySel('login-form')
        .getBySel('error')
        .should('not.exist');

      cy.location('pathname').should('eq', '/management');
    });
  });


});