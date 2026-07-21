import { expect, test, type Page } from "@playwright/test";

const ADMIN_PASSWORD = "niightmare-shop-e2e-password";
const PUBLIC_ROUTES = [
  "/",
  "/matches",
  "/achievements",
  "/roster",
  "/sponsors",
  "/shop",
  "/privacy",
  "/terms",
] as const;

function watchRuntime(page: Page) {
  const issues: string[] = [];
  const origin = "http://localhost:3100";

  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location().url || "";
    const text = message.text();
    if (/\/_vercel\/(?:insights|speed-insights)\/script\.js/.test(text)) return;
    if (/Failed to load resource/i.test(text) && (location.includes("/_vercel/") || (location && !location.startsWith(origin)))) {
      return;
    }
    issues.push(`console: ${text}${location ? ` @ ${location}` : ""}`);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === origin && response.status() >= 500) {
      issues.push(`http ${response.status()}: ${url.pathname}`);
    }
  });

  return () => expect(issues, issues.join("\n") || "no runtime issues").toEqual([]);
}

async function expectNoDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    overflow.scrollWidth - overflow.viewport,
    `document width ${overflow.scrollWidth}px exceeds viewport ${overflow.viewport}px`
  ).toBeLessThanOrEqual(2);
}

for (const route of PUBLIC_ROUTES) {
  test(`public surface ${route} hydrates without runtime or overflow errors`, async ({ page }) => {
    const assertRuntime = watchRuntime(page);
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(400);

    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "NIIGHTMARE home" })).toBeVisible();
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
    await expectNoDocumentOverflow(page);
    assertRuntime();
  });
}

test("responsive navigation and language switch remain interactive", async ({ page }, testInfo) => {
  const assertRuntime = watchRuntime(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);

  const language = page.getByRole("button", { name: /Choose language, current EN/ });
  await language.click();
  await page.getByRole("menuitemradio", { name: /Lao/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "lo");

  await page.getByRole("button", { name: /Choose language, current LA/ }).click();
  await page.getByRole("menuitemradio", { name: /English/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  if (testInfo.project.name.startsWith("mobile")) {
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await page.getByRole("link", { name: /^matches$/i }).click();
  await expect(page).toHaveURL(/\/matches$/);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expectNoDocumentOverflow(page);
  assertRuntime();
});

test("every admin editor loads read-only from the isolated server", async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  const unexpectedWrites: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/admin/data") && request.method() !== "GET") {
      unexpectedWrites.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  const readiness = page.getByRole("region", { name: "Launch Readiness" });
  await expect(readiness).toBeVisible();
  await expect(readiness).toHaveAttribute("data-readiness-level", /^(ready|warning|blocked)$/);
  await expect(readiness.locator("article")).toHaveCount(6);
  await readiness.getByRole("button", { name: /ไป(?:ดู|แก้)ที่ Shop/ }).first().click();
  await expect(page.locator("main")).toContainText("สถานะร้าน & ราคา");

  const editors: { tab: string; marker: string | RegExp }[] = [
    { tab: "Orders", marker: "ออเดอร์เสื้อ" },
    { tab: "Home", marker: "About Us (หน้า Home)" },
    { tab: "Matches", marker: "Records" },
    { tab: "Achievements", marker: "ข้อความหน้า Achievements" },
    { tab: "Roster", marker: "ทีม MLBB" },
    { tab: "Sponsors", marker: /\d+ partners/ },
    { tab: "Shop", marker: "สถานะร้าน & ราคา" },
  ];

  for (const editor of editors) {
    await page.getByRole("button", { name: editor.tab, exact: true }).click();
    await expect(page.locator("main")).toContainText(editor.marker);
    await expect(page.locator("main")).not.toContainText("โหลดข้อมูลไม่สำเร็จ");
    await expect(page.locator("main")).not.toContainText("Could not load");

    if (editor.tab === "Home") {
      await page.getByRole("button", { name: /นัดต่อไป \(หน้า Home\)/ }).click();
      const nextMatchTime = page.locator('input[placeholder^="HH:MM"]').first();
      await expect(nextMatchTime).toBeVisible();
      await nextMatchTime.fill("");
      await nextMatchTime.pressSequentially("1930");
      await expect(nextMatchTime).toHaveValue("19:30");
      await nextMatchTime.blur();
      await expect(nextMatchTime).toHaveValue("19:30");
    }

    await expectNoDocumentOverflow(page);
  }

  expect(unexpectedWrites, "admin browser smoke must never save content").toEqual([]);
  assertRuntime();
});
