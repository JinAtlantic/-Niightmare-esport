const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const publicChecks = [
  ["/", "NIIGHTMARE"],
  ["/matches", "MATCH"],
  ["/achievements", "ACHIEVEMENT"],
  ["/roster", "ROSTER"],
  ["/sponsors", "SPONSOR"],
  ["/shop", "SHOP"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/admin", "ADMIN"],
];

async function request(path) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "follow",
    headers: { "user-agent": "niightmare-ci-smoke/1.0" },
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await request("/");
      if (response.ok) return;
      lastError = new Error(`server returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw lastError || new Error("production server did not become ready");
}

async function expectPage(path, marker) {
  const response = await request(path);
  const body = await response.text();
  if (response.status !== 200) throw new Error(`${path}: expected 200, got ${response.status}`);
  if (!body.toUpperCase().includes(marker.toUpperCase())) {
    throw new Error(`${path}: missing marker ${JSON.stringify(marker)}`);
  }
  if (/application error|internal server error|__next_error__/i.test(body)) {
    throw new Error(`${path}: rendered an application error`);
  }
  console.log(`PASS ${path} 200`);
}

async function expectStatus(path, expected) {
  const response = await request(path);
  if (response.status !== expected) {
    throw new Error(`${path}: expected ${expected}, got ${response.status}`);
  }
  console.log(`PASS ${path} ${expected}`);
}

await waitForServer();
for (const [path, marker] of publicChecks) await expectPage(path, marker);

const content = await request("/api/content");
if (content.status !== 200 || !content.headers.get("content-type")?.includes("application/json")) {
  throw new Error(`/api/content: expected JSON 200, got ${content.status}`);
}
console.log("PASS /api/content JSON 200");

await expectStatus("/api/admin/orders", 401);
await expectStatus("/api/cron/order-retention", 401);

console.log("Smoke checks passed");
