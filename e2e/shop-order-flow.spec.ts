import { expect, test, type Page, type Response } from "@playwright/test";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { computeOrder, resolveShop } from "../lib/shop";

const E2E_HEADER = "x-niightmare-shop-e2e";
const ADMIN_PASSWORD = "niightmare-shop-e2e-password";
async function largeDetailedPng() {
  const width = 1200;
  const height = 1200;
  return sharp(randomBytes(width * height * 3), {
    raw: { width, height, channels: 3 },
  })
    .png({ compressionLevel: 0 })
    .toBuffer();
}

function expectCompressedJpeg(response: Response, field: "slip" | "shippingImage") {
  const body = response.request().postDataJSON();
  const value = String(body?.[field] || "");
  expect(
    value.startsWith("data:image/jpeg;base64,"),
    `field=${field} keys=${Object.keys(body || {}).join(",")} prefix=${value.slice(0, 40)}`
  ).toBeTruthy();
  expect(Buffer.from(value.split(",")[1] || "", "base64").length).toBeLessThanOrEqual(1_500_000);
}

function isOrderResponse(response: Response, intent: "reserve" | "pay") {
  if (!response.url().endsWith("/api/shop/order") || response.request().method() !== "POST") {
    return false;
  }
  try {
    return response.request().postDataJSON()?.intent === intent;
  } catch {
    return false;
  }
}

function isAdminPatch(response: Response, status?: string, shipping = false) {
  if (!response.url().endsWith("/api/admin/orders") || response.request().method() !== "PATCH") {
    return false;
  }
  try {
    const body = response.request().postDataJSON();
    return shipping ? typeof body?.shippingImage === "string" : body?.status === status;
  } catch {
    return false;
  }
}

async function expectE2EResponse(response: Response) {
  const failure = response.ok() ? "" : `status=${response.status()} body=${await response.text()}`;
  expect(response.ok(), failure).toBeTruthy();
  expect(response.headers()[E2E_HEADER]).toBe("1");
}

async function chooseOrderTab(page: Page, name: RegExp) {
  await page.getByRole("button", { name }).click();
}

test("multi-collection carts combine when every product uses the same currency", () => {
  const shop = resolveShop(null);
  const first = shop.collections[0];
  const second = {
    ...first,
    id: "second-collection",
    slug: "second-collection",
    productName: { en: "Second Collection", lo: "Second Collection" },
  };
  const items = [
    { collectionId: first.id, sizeId: first.sizes[0].id, quantity: 1 },
    { collectionId: second.id, sizeId: second.sizes[0].id, quantity: 2 },
  ];

  const combined = computeOrder({ ...shop, collections: [first, second] }, items);
  expect(combined.lines).toHaveLength(2);
  expect(combined.totalQty).toBe(3);
  expect(combined.currencyConflict).toBe(false);

  const mixedCurrency = computeOrder(
    { ...shop, collections: [first, { ...second, currency: "USD" }] },
    items
  );
  expect(mixedCurrency.currencyConflict).toBe(true);
});

test("buyer payment, admin fulfilment, and buyer status sync stay inside localhost", async ({
  page,
  request,
}) => {
  const resetResponse = await request.post("/api/shop/order", {
    data: { intent: "reset-e2e" },
  });
  expect(resetResponse.ok()).toBeTruthy();
  expect(resetResponse.headers()[E2E_HEADER]).toBe("1");

  const productionHostProbe = await request.post("/api/shop/order", {
    headers: {
      Host: "www.niightmareesport.com",
      "X-Forwarded-Host": "www.niightmareesport.com",
    },
    data: {
      intent: "reserve",
      items: [{ sizeId: "s", quantity: 1 }],
      customerName: "Host isolation probe",
      phone: "02055550000",
      courier: "Test courier",
      province: "Vientiane",
      city: "Chanthabouly",
      branch: "Test",
    },
  });
  expect(productionHostProbe.headers()[E2E_HEADER]).toBeUndefined();
  expect(productionHostProbe.status()).toBe(503);

  const invalidCollection = await request.post("/api/shop/order", {
    data: {
      intent: "reserve",
      items: [{ collectionId: "missing-collection", sizeId: "s", quantity: 1 }],
      customerName: "Invalid collection probe",
      phone: "02055550001",
      courier: "Test courier",
      province: "Vientiane",
      city: "Chanthabouly",
      branch: "Test",
    },
  });
  expect(invalidCollection.status()).toBe(400);

  await page.goto("/shop");
  await page.getByTestId("product-card-link").first().click();
  await expect(page).toHaveURL(/\/shop\/official-2026$/);
  await page.getByRole("button", { name: /^S Pre-order$/ }).click();
  await page.getByLabel("Quantity").fill("1");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: /^Cart: 1$/ }).click();
  await expect(page).toHaveURL(/view=cart/);
  await page.getByLabel("Full name").fill("Shop E2E Buyer");
  await page.getByLabel("Phone / WhatsApp").fill("02055550123");
  await page.getByLabel("Courier").selectOption({ index: 1 });
  await page.getByLabel("Province").fill("Vientiane Capital");
  await page.getByLabel("City / District").fill("Chanthabouly");
  await page.getByLabel("Branch").fill("E2E branch");

  const reservePromise = page.waitForResponse((response) => isOrderResponse(response, "reserve"));
  await page.getByRole("button", { name: "Order & pay" }).click();
  const reserveResponse = await reservePromise;
  await expectE2EResponse(reserveResponse);
  const reserveJson = await reserveResponse.json();
  expect(reserveResponse.request().postDataJSON()?.items?.[0]?.collectionId).toBe("official-2026");
  expect(reserveJson.order.items?.[0]?.collectionName?.en).toBe("NIIGHTMARE 2026 Official Jersey");
  const orderId = String(reserveJson.order.id);
  const refCode = String(reserveJson.order.refCode);
  expect(orderId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(refCode).toMatch(/^NM-[A-Z0-9]{8}$/);

  await expect(page.getByRole("dialog", { name: "Transfer to pay" })).toBeVisible();
  const detailedPng = await largeDetailedPng();
  expect(detailedPng.length).toBeGreaterThan(4 * 1024 * 1024);
  await page.locator('input[type="file"][accept="image/png,image/jpeg,image/webp"]').setInputFiles({
    name: "large-payment-slip.png",
    mimeType: "image/png",
    buffer: detailedPng,
  });
  await expect(page.getByAltText("slip preview")).toBeVisible();

  const payPromise = page.waitForResponse((response) => isOrderResponse(response, "pay"));
  await page.getByRole("button", { name: "I've transferred" }).click();
  const payResponse = await payPromise;
  expectCompressedJpeg(payResponse, "slip");
  await expectE2EResponse(payResponse);
  await expect(page.getByText("Payment submitted!", { exact: true })).toBeVisible();
  const myOrdersTab = page.getByRole("button", { name: /My Orders \(1\)/ });
  await expect(myOrdersTab).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: 5_000 }
  );
  await expect(myOrdersTab).toBeFocused();

  const admin = await page.context().newPage();
  await admin.goto("/admin");
  await admin.waitForLoadState("networkidle");
  await admin.getByRole("textbox", { name: "Password", exact: true }).fill(ADMIN_PASSWORD);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  await expect(admin.getByText(refCode, { exact: true }).filter({ visible: true }).first()).toBeVisible();

  const verifyPromise = admin.waitForResponse((response) =>
    isAdminPatch(response, "verified")
  );
  await admin.getByRole("button", { name: /ยืนยันการจ่าย/ }).click();
  await expectE2EResponse(await verifyPromise);

  await chooseOrderTab(admin, /^จ่ายแล้ว\s*1$/);
  const shippingRegion = admin.locator("aside:visible, details:visible").filter({
    hasText: /รูปส่งสินค้า|รูปใบรับของ \/ เลขพัสดุ/,
  });
  if ((await shippingRegion.evaluate((element) => element.tagName)) === "DETAILS") {
    await shippingRegion.locator("summary").click();
  }
  const shippingPromise = admin.waitForResponse((response) => isAdminPatch(response, undefined, true));
  await shippingRegion.locator('input[type="file"]').setInputFiles({
    name: "large-shipping-receipt.png",
    mimeType: "image/png",
    buffer: detailedPng,
  });
  const shippingResponse = await shippingPromise;
  await expectE2EResponse(shippingResponse);
  expectCompressedJpeg(shippingResponse, "shippingImage");
  await expect(shippingRegion.getByAltText("shipping")).toBeVisible();

  const packingPromise = admin.waitForResponse((response) =>
    isAdminPatch(response, "packing")
  );
  await admin.getByRole("button", { name: /เริ่มแพ็กของ/ }).click();
  await expectE2EResponse(await packingPromise);

  await chooseOrderTab(admin, /^กำลังแพ็กของ\s*1$/);
  const shippedPromise = admin.waitForResponse((response) =>
    isAdminPatch(response, "shipped")
  );
  await admin.getByRole("button", { name: /ทำเครื่องหมายส่งแล้ว/ }).click();
  await expectE2EResponse(await shippedPromise);
  await chooseOrderTab(admin, /^ส่งแล้ว\s*1$/);
  await expect(admin.getByText(refCode, { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await page.reload();
  const syncPromise = page.waitForResponse((response) =>
    response.url().includes(`/api/shop/order/status?ids=${orderId}`)
  );
  await page.getByRole("button", { name: /My Orders \(1\)/ }).click();
  const syncResponse = await syncPromise;
  await expectE2EResponse(syncResponse);
  await expect(page.getByText("Shipped — please wait for delivery", { exact: true })).toBeVisible();
  await expect(page.getByAltText("shipping")).toBeVisible();
});
