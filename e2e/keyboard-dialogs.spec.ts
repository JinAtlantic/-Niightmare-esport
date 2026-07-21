import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function activeElementIsInside(page: Page, container: Locator) {
  return container.evaluate((element) => element.contains(document.activeElement));
}

async function expectNoAccessibilityViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const report = results.violations.flatMap((violation) => [
    `${violation.id} [${violation.impact ?? "unknown"}]`,
    ...violation.nodes.map(
      (node) => `${node.target.join(" ")}: ${node.failureSummary ?? "failed"}`
    ),
  ]);
  expect(
    results.violations.length,
    `${label}: ${report.join("\n")}`
  ).toBe(0);
}

test("Roadmap dialog traps keyboard focus and restores it to the opener", async ({ page }) => {
  await page.goto("/matches", { waitUntil: "domcontentloaded" });

  const opener = page.getByRole("button", { name: /Niightmare Roadmap/i });
  await opener.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: /Niightmare Roadmap/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText(/COMPLETED|COMPETING NOW|UP NEXT/);
  await expectNoAccessibilityViolations(page, "Roadmap dialog");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);

  await page.keyboard.press("Tab");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Player profile dialog keeps keyboard focus inside and returns it", async ({ page }) => {
  await page.goto("/roster", { waitUntil: "domcontentloaded" });

  const opener = page.getByRole("button", { name: /View profile/i }).first();
  await opener.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-player-vital]")).toHaveCount(3);
  await expect(dialog.locator("[data-player-vital] svg")).toHaveCount(0);
  await expectNoAccessibilityViolations(page, "Player dialog");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);
  await page.keyboard.press("Tab");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Sponsor dialog keeps keyboard focus inside and returns it", async ({ page }) => {
  await page.goto("/sponsors", { waitUntil: "domcontentloaded" });

  const opener = page.locator("section button").filter({ has: page.locator("h3") }).first();
  const sponsorName = (await opener.locator("h3").innerText()).trim();
  await opener.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: sponsorName });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("About", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Connect", { exact: true })).toHaveCount(0);
  await expectNoAccessibilityViolations(page, "Sponsor dialog");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);
  await page.keyboard.press("Tab");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Payment dialog traps focus, closes with Escape, and returns to Order & pay", async ({
  page,
  request,
}) => {
  await request.post("/api/shop/order", { data: { intent: "reset-e2e" } });
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await page.getByLabel("S quantity").fill("1");
  await page.getByLabel("Full name").fill("Keyboard Buyer");
  await page.getByLabel("Phone / WhatsApp").fill("02055550999");
  await page.getByLabel("Courier").selectOption({ index: 1 });
  await page.getByLabel("Province").fill("Vientiane Capital");
  await page.getByLabel("City / District").fill("Chanthabouly");
  await page.getByLabel("Branch").fill("Keyboard branch");

  const opener = page.getByRole("button", { name: "Order & pay" });
  await opener.focus();
  const reserved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/shop/order") &&
      response.request().method() === "POST" &&
      response.request().postDataJSON()?.intent === "reserve"
  );
  await page.keyboard.press("Enter");
  await reserved;

  const dialog = page.getByRole("dialog", { name: "Transfer to pay" });
  await expect(dialog).toBeVisible();
  await expectNoAccessibilityViolations(page, "Payment dialog");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => activeElementIsInside(page, dialog)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Tournament picker supports arrow-key navigation and Escape", async ({ page }) => {
  await page.goto("/matches", { waitUntil: "domcontentloaded" });

  const trigger = page.getByRole("button", { name: /All Tournaments/i });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const menu = page.getByRole("menu", { name: "Tournament" });
  await expect(menu).toBeVisible();
  await expectNoAccessibilityViolations(page, "Tournament menu");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeElementIsInside(page, menu)).toBe(true);

  await page.keyboard.press("Tab");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});
