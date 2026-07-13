import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "../support/fixtures";
import { dropFiles } from "../support/files";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, "..", "fixtures", name);

test.describe("registration page", () => {
  test("should register a user for a camp", async ({ page }) => {
    const campId = "01JHP0CXJFR4MQS8SF1HQJCY38";

    await page.goto(`/camps/${campId}/`);

    const registrationForm = page.getByTestId("registration-form");
    await registrationForm
      .locator("[data-name=first_name]")
      .locator("input")
      .fill("Tom");
    await registrationForm
      .locator("[data-name=last_name]")
      .locator("input")
      .fill("Smith");

    const createRegistrationResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/camps/${campId}/registrations`) &&
        resp.request().method() === "POST",
    );
    await registrationForm.locator(".sd-navigation__complete-btn").click();
    const response = await createRegistrationResponse;

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty("data");
    const data = body.data;
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("first_name", "Tom");
    expect(data.data).toHaveProperty("last_name", "Smith");
  });

  test("should show an error if the registration fails", async ({ page }) => {
    const campId = "01JHP0CXJFR4MQS8SF1HQJCY38";

    await page.goto(`/camps/${campId}/`);

    // Force the registration request to fail on the server side.
    await page.route(
      (url) =>
        url.pathname.includes(`/api/v1/camps/${campId}/registrations`) &&
        !url.pathname.includes("/files"),
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }

        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 500,
            message: "Internal Server Error",
          }),
        });
      },
    );

    const registrationForm = page.getByTestId("registration-form");
    await registrationForm
      .locator("[data-name=first_name]")
      .locator("input")
      .fill("Tom");
    await registrationForm
      .locator("[data-name=last_name]")
      .locator("input")
      .fill("Smith");

    const createRegistrationResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/camps/${campId}/registrations`) &&
        resp.request().method() === "POST",
    );
    await registrationForm.locator(".sd-navigation__complete-btn").click();
    const response = await createRegistrationResponse;

    expect(response.status()).toBe(500);

    // The form surfaces the failure to the user instead of showing success.
    await expect(page.getByText("Registration failed")).toBeVisible();
    await expect(registrationForm.locator(".sv-save-data_error")).toBeVisible();
  });

  test("should register a user for a camp with files", async ({ page }) => {
    const campId = "01JKEMXG5C62NBMA6V0QQDJ7JD";

    await page.goto(`/camps/${campId}/`);

    const registrationForm = page.getByTestId("registration-form");
    await registrationForm
      .locator("[data-name=first_name]")
      .locator("input")
      .fill("Tom");

    await dropFiles(
      registrationForm.locator("[data-name=files] .sd-file__decorator"),
      [
        fixture("file-example_PDF_1MB.pdf"),
        fixture("file_example_JPG_2500kB.jpg"),
      ],
    );

    const createRegistrationResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/camps/${campId}/registrations`) &&
        resp.request().method() === "POST",
    );
    await registrationForm.locator(".sd-navigation__complete-btn").click();
    const response = await createRegistrationResponse;

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty("data");
    const data = body.data;
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("first_name", "Tom");
    expect(data.data).toHaveProperty("files");
    expect(data.data.files).toHaveLength(2);
  });
});
