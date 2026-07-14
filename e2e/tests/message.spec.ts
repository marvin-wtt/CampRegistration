import { test, expect } from "../support/fixtures";
import { getMessageBySentTo } from "../support/maildev";

test.describe("message", () => {
  test("should send a message to a registration and deliver it by email", async ({
    page,
  }) => {
    const campId = "01JHP0CXJFR4MQS8SF1HQJCY38";

    await page.goto("/login");
    const loginForm = page.getByTestId("login-form");
    await loginForm.getByTestId("email").fill("john@example.com");
    await loginForm.getByTestId("password").fill("password");
    await loginForm.getByTestId("submit").click();
    await expect(page).toHaveURL(/\/management\/camps$/);

    await page.goto(`/management/camps/${campId}/contact`);

    const contactForm = page.getByTestId("contact-form");

    await contactForm.getByTestId("to").locator("input").fill("Tom");

    await page.getByText("Tom Smith", { exact: true }).click();

    const subjectField = contactForm.getByTestId("subject");
    await subjectField.click();
    await subjectField
      .locator('[contenteditable="true"]')
      .pressSequentially("Welcome to camp");

    const messageField = contactForm.getByTestId("message");
    await messageField.click();
    await messageField
      .locator('[contenteditable="true"]')
      .pressSequentially("See you soon!");

    const createMessageResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/camps/${campId}/messages`) &&
        resp.request().method() === "POST",
    );
    await contactForm.getByTestId("send").click();
    const response = await createMessageResponse;

    expect(response.status()).toBe(201);

    // Wait for the email queue to deliver.
    await page.waitForTimeout(1000);

    const email = await getMessageBySentTo("tom.smith@example.com");
    expect(email).not.toBeNull();
    expect(email!.subject).toBe("Welcome to camp");
    expect(email!.text).toContain("See you soon!");
  });
});
