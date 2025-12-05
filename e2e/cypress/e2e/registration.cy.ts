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

    // Response interceptor
    cy.intercept("POST", `/api/v1/camps/${campId}/registrations`).as(
      "createCampRegistration",
    );

    // Visit page
    cy.visit(`/camps/${campId}/`);

    // Enter text
    cy.getBySel("registration-form")
      .find("[data-name=first_name]")
      .find("input")
      .type("Tom");

    cy.getBySel("registration-form")
      .find("[data-name=last_name]")
      .find("input")
      .type("Smith");

    // Submit
    cy.getBySel("registration-form")
      .find(".sd-navigation__complete-btn")
      .find("input")
      .click();

    cy.wait("@createCampRegistration").then((interception) => {
      expect(interception.response.statusCode).to.eq(201);

      const body = interception.response.body;
      expect(body).to.have.property("data");
      const data = body.data;
      expect(data).to.have.property("id");
      expect(data).to.have.property("data");
      expect(data.data).to.have.property("first_name", "Tom");
      expect(data.data).to.have.property("last_name", "Smith");
    });
  });

  it("should register a user for a camp with files", () => {
    const campId = "01JKEMXG5C62NBMA6V0QQDJ7JD";

    // Response interceptor
    cy.intercept("POST", `/api/v1/camps/${campId}/registrations`).as(
      "createCampRegistration",
    );

    // Visit page
    cy.visit(`/camps/${campId}/`);

    // Enter text
    cy.getBySel("registration-form")
      .find("[data-name=first_name]")
      .find("input")
      .type("Tom");

    // Load files
    const fixture = (name: string) => `cypress/fixtures/${name}`;
    cy.getBySel("registration-form")
      .find("[data-name=files]")
      .find(".sd-file__decorator")
      .selectFile(
        [
          fixture("file-example_PDF_1MB.pdf"),
          fixture("file_example_JPG_2500kB.jpg"),
        ],
        {
          action: "drag-drop",
        },
      );

    // Submit
    cy.getBySel("registration-form")
      .find("#sv-nav-complete")
      .find("input")
      .click();

    cy.wait("@createCampRegistration").then((interception) => {
      expect(interception.response.statusCode).to.eq(201);

      const body = interception.response.body;
      expect(body).to.have.property("data");
      const data = body.data;
      expect(data).to.have.property("id");
      expect(data).to.have.property("data");
      expect(data.data).to.have.property("first_name", "Tom");
      expect(data.data).to.have.property("files");
      expect(data.data.files).to.have.length(2);
    });
  });
});
