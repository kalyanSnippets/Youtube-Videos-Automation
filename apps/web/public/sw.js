// Service worker for the AI with Kalyan OS phone app. It never caches your data: every request goes
// to the server as normal. Its only job is to show a friendly screen instead of the browser's error
// page when the phone has no connection.
const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · AI with Kalyan OS</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0c11;color:#e7ecf4;font-family:system-ui,sans-serif;text-align:center;padding:24px}
button{margin-top:16px;background:#3fe6cf;color:#0a0c11;border:0;border-radius:10px;padding:10px 18px;font-weight:600;font-size:15px}p{color:#9aa3b5}</style></head>
<body><div><h1 style="font-size:20px">You're offline</h1><p>Connect to the internet to see your videos and comments.</p><button onclick="location.reload()">Try again</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // everything else goes straight to the network
  event.respondWith(
    fetch(event.request).catch(() => new Response(OFFLINE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } })),
  );
});
