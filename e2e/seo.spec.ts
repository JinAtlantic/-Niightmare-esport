import { expect, test } from "@playwright/test";
import { matchesSchema, upcomingEventSchema } from "../lib/seo";

test("structured match data follows supplied live content", () => {
  const content = {
    site: {
      upcomingMatch: {
        status: "practice",
        date: "",
        game: "mlbb",
        tournament: { en: "Team Practice", lo: "Team Practice" },
        opponent: "",
      },
    },
    matches: {
      matches: [
        {
          id: "live-result",
          date: "2026-07-20",
          game: "mlbb",
          tournament: { en: "LIVE CONTENT CUP", lo: "LIVE CONTENT CUP" },
          opponent: "LIVE OPPONENT",
          score: "2-0",
          result: "win",
          vod: null,
        },
      ],
      tournaments: [],
    },
  };

  expect(upcomingEventSchema(content)).toBeNull();
  const schema = matchesSchema(content);
  const event = schema.itemListElement[0].item;
  expect(event.name).toContain("LIVE CONTENT CUP");
  expect(event.name).toContain("LIVE OPPONENT");
  expect(event.eventStatus).toBe("https://schema.org/EventCompleted");
});

test("dynamic product metadata and sitemap are crawlable", async ({ page, request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("/shop/official-2026");
  expect(sitemapText).toMatch(/\/roster\/[^<]+/);

  const response = await page.goto("/shop/official-2026", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);
  await expect(page).not.toHaveTitle(/Product.*Shop/);
  await expect(page).toHaveTitle(/NIIGHTMARE Esports/);
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute(
    "content",
    /View NIIGHTMARE Esports merchandise/
  );
  const html = await page.content();
  expect(html).toContain('"@type":"Product"');
  expect(html).toContain('"priceCurrency":"LAK"');

  const roster = await request.get("/roster");
  expect(roster.ok()).toBeTruthy();
  expect(await roster.text()).toContain('"@type":"SportsTeam"');

  await page.goto("/sponsors", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute(
    "content",
    /sponsorship tiers/i
  );
});
