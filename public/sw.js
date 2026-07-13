/* NIIGHTMARE admin push service worker.
 * Receives Web Push messages and shows an OS notification (sound + vibration)
 * even when the admin tab is closed or the phone screen is off. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// A no-op fetch handler (default network passthrough). Its mere presence lets
// Chrome treat the site as installable so the Add-to-Home-Screen prompt fires.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = data.title || "NIIGHTMARE";
  const options = {
    body: data.body || "มีออเดอร์ใหม่",
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || "nm-order",
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || "/admin" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // The payload carries the destination (admin alerts → /admin, buyer order
  // alerts → /shop?view=orders). Prefer an already-open tab on that path; else
  // reuse any tab; else open a new one.
  const url = (event.notification.data && event.notification.data.url) || "/";
  const base = url.split("?")[0];
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const match = clients.find((c) => c.url.includes(base)) || clients[0];
      if (match && "focus" in match) {
        if ("navigate" in match && match.url.indexOf(url) === -1) {
          try {
            match.navigate(url);
          } catch (e) {
            /* cross-origin / not controllable — just focus */
          }
        }
        return match.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
