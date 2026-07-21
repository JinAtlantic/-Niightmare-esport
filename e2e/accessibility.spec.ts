import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { Result } from "axe-core";

const ADMIN_PASSWORD = "niightmare-shop-e2e-password";
const PUBLIC_ROUTES = [
  "/",
  "/matches",
  "/achievements",
  "/gallery",
  "/roster",
  "/sponsors",
  "/shop",
  "/shop/official-2026",
  "/shop?view=cart",
  "/shop?view=orders",
  "/privacy",
  "/terms",
] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function violationReport(label: string, violations: Result[]): string {
  if (!violations.length) return `${label}: no accessibility violations`;
  return [
    `${label}: ${violations.length} accessibility violation(s)`,
    ...violations.flatMap((violation) => [
      `- ${violation.id} [${violation.impact ?? "unknown"}]: ${violation.help}`,
      ...violation.nodes.map(
        (node) => `  ${node.target.join(" ")} — ${node.failureSummary ?? "failed"}`
      ),
    ]),
  ].join("\n");
}

async function expectAccessible(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.length,
    violationReport(label, results.violations)
  ).toBe(0);
}

for (const route of PUBLIC_ROUTES) {
  test(`public accessibility ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(400);
    await expectAccessible(page, route);
  });
}

test("admin login and every read-only editor meet WCAG A/AA", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expectAccessible(page, "admin login");

  await page.getByRole("textbox", { name: "Password", exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();

  const editors: { tab: string; marker: string | RegExp }[] = [
    { tab: "Orders", marker: "ออเดอร์เสื้อ" },
    { tab: "Home", marker: "About Us (หน้า Home)" },
    { tab: "Games", marker: "ID: mlbb" },
    { tab: "Matches", marker: "Records" },
    { tab: "Achievements", marker: "ข้อความหน้า Achievements" },
    { tab: "Team", marker: "ทีม MLBB" },
    { tab: "Gallery", marker: "Description" },
    { tab: "Sponsors", marker: /\d+ partners/ },
    { tab: "Shop", marker: "Collections" },
  ];

  for (const editor of editors) {
    await page.getByRole("button", { name: editor.tab, exact: true }).click();
    await expect(page.locator("main")).toContainText(editor.marker);
    await expectAccessible(page, `admin ${editor.tab}`);
  }
});
