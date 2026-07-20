import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url)
);

// Keep the browser suite hermetic even on a developer machine whose .env.local
// points at Production. Existing empty variables are not overwritten by Next's
// dotenv loader, so no Supabase, Storage, push, or email client can be created.
const env = {
  ...process.env,
  SHOP_E2E_MODE: "true",
  SHOP_ORDER_EMAIL_NOTIFICATIONS: "false",
  ADMIN_PASSWORD: "niightmare-shop-e2e-password",
  ADMIN_SECRET: "niightmare-shop-e2e-secret-long-and-local-only",
  ADMIN_TOTP_SECRET: "",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
  VAPID_PRIVATE_KEY: "",
  VAPID_SUBJECT: "",
};

const child = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3100"],
  { env, stdio: "inherit" }
);

function stop() {
  if (!child.killed) child.kill();
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
child.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.once("exit", (code, signal) => {
  if (signal) process.exitCode = 0;
  else process.exitCode = code ?? 1;
});
