import { expect, test, type Page } from "@playwright/test";

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
    await expect(page.locator("body")).not.toContainText(/NIIGHTMARE ESPORT(?!S)/i);
    await expect(page.locator("nextjs-portal")).toHaveCount(0);

    if (route === "/") {
      const sections = await page.locator("main section").allTextContents();
      const aboutIndex = sections.findIndex((text) => text.includes("WHO WE ARE"));
      const upcomingIndex = sections.findIndex((text) => text.includes("UPCOMING MATCH"));
      const resultsIndex = sections.findIndex((text) => text.includes("RECENT RESULTS"));
      expect([aboutIndex, upcomingIndex, resultsIndex]).toEqual([1, 2, 3]);
      await expect(page.getByText("Live stream", { exact: true })).toHaveCount(0);
      await expect(page.getByText("No live stream", { exact: true })).toHaveCount(0);
      await expect(page.getByText("WATCH LIVE", { exact: true })).toHaveCount(0);
    }

    if (route === "/sponsors") {
      const groups = page.locator("[data-sponsor-group]");
      await expect(groups).toHaveCount(3);
      await expect(groups.nth(0)).toContainText("OFFICIAL SPONSORS");
      await expect(groups.nth(1)).toContainText("EVENT SPONSORS");
      await expect(groups.nth(2)).toContainText("PAST PARTNERS");
      for (const group of await groups.all()) {
        const heading = group.getByRole("heading", { level: 2 });
        const centerOffset = await heading.evaluate((element) => {
          const section = element.closest("[data-sponsor-group]");
          if (!section) return Number.POSITIVE_INFINITY;
          const sectionRect = section.getBoundingClientRect();
          const headingRect = element.getBoundingClientRect();
          return Math.abs(
            headingRect.left + headingRect.width / 2 -
              (sectionRect.left + sectionRect.width / 2)
          );
        });
        expect(centerOffset).toBeLessThanOrEqual(2);
        await expect(group.locator(":scope > div:first-of-type > span")).toHaveCount(0);
      }
      await expect(page.locator("main")).not.toContainText("WORKING TOGETHER");
    }

    if (route === "/gallery") {
      await expect(page.locator("main")).not.toContainText(/NIIGHTMARE ARCHIVE/i);
    }

    if (route === "/roster") {
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Team");
    }

    await expectNoDocumentOverflow(page);
    assertRuntime();
  });
}

test("public pages reconcile server content with the live API", async ({ page }) => {
  await page.route("**/api/content", async (route) => {
    const response = await route.fetch();
    const content = (await response.json()) as {
      __contentSource?: string;
      matches: { matches: unknown[]; tournaments: unknown[] };
      achievements: { records?: unknown[] };
    };
    content.matches.matches = [
      {
        id: "recovery-1",
        date: "2026-07-03",
        game: "mlbb",
        tournament: { en: "LIVE RECOVERY CUP", lo: "LIVE RECOVERY CUP" },
        opponent: "RECOVERY ONE",
        score: "1-0",
        result: "win",
        vod: null,
        vods: [],
      },
      {
        id: "recovery-2",
        date: "2026-07-02",
        game: "mlbb",
        tournament: { en: "LIVE RECOVERY CUP", lo: "LIVE RECOVERY CUP" },
        opponent: "RECOVERY TWO",
        score: "1-0",
        result: "win",
        vod: null,
        vods: [],
      },
    ];
    content.matches.tournaments = [
      {
        id: "recovery-tournament",
        name: { en: "LIVE RECOVERY CUP", lo: "LIVE RECOVERY CUP" },
        game: "mlbb",
        placement: { en: "Champion", lo: "Champion" },
        prize: "$2",
        season: "2026",
      },
    ];
    content.achievements.records = [
      {
        id: "independent-achievement",
        game: "mlbb",
        tournament: { en: "INDEPENDENT ACHIEVEMENT", lo: "INDEPENDENT ACHIEVEMENT" },
        placement: { en: "Champion", lo: "Champion" },
        image: "",
        enabled: true,
      },
    ];
    delete content.__contentSource;
    await route.fulfill({ response, json: content });
  });

  await page.goto("/matches", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "LIVE RECOVERY CUP" })).toBeVisible();

  await page.goto("/achievements", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "INDEPENDENT ACHIEVEMENT" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "LIVE RECOVERY CUP" })).toHaveCount(0);
});

test("achievement records stay strictly separated by game", async ({ page }) => {
  await page.route("**/api/content", async (route) => {
    const response = await route.fetch();
    const content = await response.json();
    content.site.games = [
      { id: "mlbb", name: { en: "Mobile Legends: Bang Bang", lo: "MLBB" }, shortName: "MLBB", enabled: true },
      { id: "valorant", name: { en: "Valorant", lo: "Valorant" }, shortName: "VALORANT", enabled: true },
    ];
    content.achievements.records = [
      { id: "mlbb-only", game: "mlbb", tournament: { en: "MLBB ONLY CUP", lo: "MLBB ONLY CUP" }, placement: { en: "1st", lo: "1st" }, image: "", enabled: true },
      { id: "mlbb-hidden", game: "mlbb", tournament: { en: "HIDDEN MLBB CUP", lo: "HIDDEN MLBB CUP" }, placement: { en: "3rd", lo: "3rd" }, image: "", enabled: false },
      { id: "valorant-only", game: "valorant", tournament: { en: "VALORANT ONLY CUP", lo: "VALORANT ONLY CUP" }, placement: { en: "2nd", lo: "2nd" }, image: "", enabled: true },
    ];
    delete content.__contentSource;
    await route.fulfill({ response, json: content });
  });

  await page.goto("/achievements", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "MLBB ONLY CUP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "HIDDEN MLBB CUP" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "VALORANT ONLY CUP" })).toHaveCount(0);
  await page.getByRole("button", { name: /VALORANT/ }).click();
  await expect(page.getByRole("heading", { name: "VALORANT ONLY CUP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "MLBB ONLY CUP" })).toHaveCount(0);
});

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

test("shop products have shareable detail pages and keep per-size availability", async ({ page }) => {
  await page.goto("/shop/official-2026", { waitUntil: "domcontentloaded" });

  const productHeading = page.getByRole("heading", { level: 1 });
  await expect(productHeading).toBeVisible();
  await expect(productHeading).not.toHaveText("Product");
  const productName = await productHeading.textContent() || "";
  await expect(page).toHaveTitle(/NIIGHTMARE Esports/);
  expect(await page.content()).toContain('"@type":"Product"');

  const sizeButtons = page.getByRole("button", { name: /^(S|M|L|XL|XXL|3XL|4XL) (Ready to ship|Pre-order|Sold out)$/ });
  await expect(sizeButtons.first()).toBeVisible();
  expect(await sizeButtons.count()).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /^(Front|Back)$/ })).toHaveCount(0);

  await page.getByRole("link", { name: "All products" }).first().click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
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
  await expect(page.getByRole("region", { name: "Launch Readiness" })).toHaveCount(0);

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
    await expect(page.locator("main")).not.toContainText("โหลดข้อมูลไม่สำเร็จ");
    await expect(page.locator("main")).not.toContainText("Could not load");

    if (editor.tab === "Home") {
      await expect(page.locator("main")).not.toContainText(/Niightmare Roadmap/i);
      await page.getByRole("button", { name: /นัดต่อไป \(หน้า Home\)/ }).click();
      const nextMatchTime = page.locator('input[placeholder^="HH:MM"]').first();
      await expect(nextMatchTime).toBeVisible();
      await nextMatchTime.fill("");
      await nextMatchTime.pressSequentially("1930");
      await expect(nextMatchTime).toHaveValue("19:30");
      await nextMatchTime.blur();
      await expect(nextMatchTime).toHaveValue("19:30");
      await expect(page.locator('input[placeholder^="https://youtube.com/live"]')).toHaveCount(0);
    }

    if (editor.tab === "Matches") {
      const mlbb = page.getByRole("button", { name: /^Manage Game MLBB \d+ tournaments \d+ matches/i });
      const efootball = page.getByRole("button", { name: /^Manage Game eFootball \d+ tournaments \d+ matches/i });
      await expect(mlbb).toBeVisible();
      await expect(efootball).toBeVisible();

      await mlbb.click();
      await expect(page.getByRole("heading", { name: "MLBB Records" })).toBeVisible();
      await expect(page.getByText("All Games", { exact: true })).toHaveCount(0);

      await page.getByRole("button", { name: /เลือกเกมอื่น/ }).click();
      await efootball.click();
      await expect(page.getByRole("heading", { name: "eFootball Records" })).toBeVisible();
    }

    if (editor.tab === "Sponsors") {
      await page.getByRole("button", { name: /Apollo Entertainment/ }).click();
      const groupSelect = page.getByLabel("กลุ่มที่แสดงบนหน้า Sponsors").first();
      await expect(groupSelect).toHaveValue("official");
      await expect(groupSelect.locator("option")).toHaveText([
        "สปอนเซอร์ทางการ",
        "สปอนเซอร์เฉพาะงาน",
        "สปอนเซอร์ที่เคยร่วมงาน",
      ]);
      await groupSelect.selectOption("event");
      await expect(groupSelect).toHaveValue("event");
    }

    if (editor.tab === "Shop") {
      await expect(page.getByText("รูปสินค้า (รวมด้านหน้าและด้านหลัง)", { exact: true })).toHaveCount(1);
      await expect(page.locator("main")).not.toContainText("รูปด้านหน้าเสื้อ");
      await expect(page.locator("main")).not.toContainText("รูปด้านหลังเสื้อ");
      await expect(page.getByLabel("สถานะ")).toHaveCount(7);
      await expect(page.getByLabel("สถานะ").first()).toHaveValue("preorder");
      await page.getByRole("button", { name: /เพิ่มสินค้า/i }).click();
      await expect(page.locator("main")).toContainText("ทั้งหมด 2 สินค้า");
      await expect(page.locator("main")).toContainText("New Product");
      await expect(page.getByText("รูปสินค้า (รวมด้านหน้าและด้านหลัง)", { exact: true })).toHaveCount(2);
    }

    await expectNoDocumentOverflow(page);
  }

  expect(unexpectedWrites, "admin browser smoke must never save content").toEqual([]);
  assertRuntime();
});
