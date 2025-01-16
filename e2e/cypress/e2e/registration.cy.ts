describe("registration page", () => {
  before(() => {
    cy.exec("npm run db:reset -w ../backend");
  });

  beforeEach(() => {
    cy.exec(
      "npm run db:truncate -w ../backend && npm run db:seed -w ../backend",
    );
  });

  it("should register a user for a camp", () => {
    const campId = "01JHP0CXJFR4MQS8SF1HQJCY38";

    cy.intercept("POST", `/api/v1/camps/${campId}/registrations`).as(
      "createCampRegistration",
    );

    cy.visit(`/camps/${campId}/`);

    cy.getBySel("registration-form")
      .find("[data-name=first_name]")
      .find("input")
      .type("Tom");

    cy.getBySel("registration-form")
      .find("[data-name=last_name]")
      .find("input")
      .type("Smith");

    cy.getBySel("registration-form")
      .find("#sv-nav-complete")
      .find("input")
      .click();

    cy.wait("@createCampRegistration").then((interception) => {
      expect(interception.response.statusCode).to.eq(201);

      expect(interception.response.body).to.have.property("data");
      expect(interception.response.body.data).to.have.property("id");
      expect(interception.response.body.data).to.have.property("data");
      expect(interception.response.body.data.data).to.have.property(
        "first_name",
        "Tom",
      );
      expect(interception.response.body.data.data).to.have.property(
        "last_name",
        "Smith",
      );
    });
  });
});
