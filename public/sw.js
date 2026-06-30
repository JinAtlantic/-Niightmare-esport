/* NIIGHTMARE admin push service worker.
 * Receives Web Push messages and shows an OS notification (sound + vibration)
 * even when the admin tab is closed or the phone screen is off. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

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
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/admin") && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
