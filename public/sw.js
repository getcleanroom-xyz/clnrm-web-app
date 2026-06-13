self.addEventListener("push", (event) => {
  let data: Record<string, unknown> = { type: "slot_open", message: "Your slot is ready!" };
  try {
    if (event.data) data = JSON.parse(event.data.text());
  } catch {}

  const title = "CleanRoom";
  const body =
    data.type === "slot_open"
      ? "Your session slot is ready! You have 10 minutes to confirm."
      : (data.message as string) || "Update from CleanRoom";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "cleanroom-slot",
      renotify: true,
      data: { url: "/queue" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
