import { expect, test, type Page, type Response } from "@playwright/test";

const E2E_HEADER = "x-niightmare-shop-e2e";
const ADMIN_PASSWORD = "niightmare-shop-e2e-password";
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWNYEfodjhiI4wAAJ/EfQQ19TOgAAAAASUVORK5CYII=",
  "base64"
);

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
  expect(response.ok()).toBeTruthy();
  expect(response.headers()[E2E_HEADER]).toBe("1");
}

async function chooseOrderTab(page: Page, name: RegExp) {
  await page.getByRole("button", { name }).click();
}

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

  await page.goto("/shop");
  await page.getByLabel("S quantity").fill("1");
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
  const orderId = String(reserveJson.order.id);
  const refCode = String(reserveJson.order.refCode);
  expect(orderId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(refCode).toMatch(/^NM-[A-Z0-9]{8}$/);

  await expect(page.getByRole("dialog", { name: "Transfer to pay" })).toBeVisible();
  await page.locator('input[type="file"][accept="image/png,image/jpeg,image/webp"]').setInputFiles({
    name: "payment-slip.png",
    mimeType: "image/png",
    buffer: PIXEL_PNG,
  });
  await expect(page.getByAltText("slip preview")).toBeVisible();

  const payPromise = page.waitForResponse((response) => isOrderResponse(response, "pay"));
  await page.getByRole("button", { name: "I've transferred" }).click();
  const payResponse = await payPromise;
  await expectE2EResponse(payResponse);
  await expect(page.getByText("Payment submitted!", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /My Orders \(1\)/ })).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: 5_000 }
  );

  const admin = await page.context().newPage();
  await admin.goto("/admin");
  await admin.getByRole("textbox", { name: "Password", exact: true }).fill(ADMIN_PASSWORD);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  await expect(admin.getByText(refCode, { exact: true }).last()).toBeVisible();

  const verifyPromise = admin.waitForResponse((response) =>
    isAdminPatch(response, "verified")
  );
  await admin.getByRole("button", { name: /ยืนยันการจ่าย/ }).click();
  await expectE2EResponse(await verifyPromise);

  await chooseOrderTab(admin, /^จ่ายแล้ว\s*1$/);
  const shippingDetails = admin.locator("details:visible").filter({
    hasText: "รูปใบรับของ / เลขพัสดุ",
  });
  await shippingDetails.locator("summary").click();
  const shippingPromise = admin.waitForResponse((response) => isAdminPatch(response, undefined, true));
  await shippingDetails.locator('input[type="file"]').setInputFiles({
    name: "shipping-receipt.png",
    mimeType: "image/png",
    buffer: PIXEL_PNG,
  });
  await expectE2EResponse(await shippingPromise);
  await expect(shippingDetails.getByAltText("shipping")).toBeVisible();

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
  await expect(admin.getByText(refCode, { exact: true }).last()).toBeVisible();

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
