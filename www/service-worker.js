// ==========================================
// SIDAT
// SERVICE WORKER
// PWA - SISTEM INFORMASI DATA WARGA
// ==========================================

const CACHE_NAME =
    "sidat-pwa-v5";

const STATIC_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./style.css",
    "./install-pwa.css",
    "./install-pwa.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener(
    "install",
    event => {

        console.log(
            "SIDAT PWA: Service Worker install"
        );

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        STATIC_FILES
                    );

                })
                .catch(error => {

                    console.error(
                        "SIDAT PWA: Cache gagal:",
                        error
                    );

                })

        );

        self.skipWaiting();

    }
);


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener(
    "activate",
    event => {

        console.log(
            "SIDAT PWA: Service Worker aktif"
        );

        event.waitUntil(

            caches
                .keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames

                            .filter(
                                cacheName =>
                                    cacheName !==
                                    CACHE_NAME
                            )

                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )

                    );

                })

                .then(() =>
                    self.clients.claim()
                )

        );

    }
);


// ==========================================
// FETCH
// ==========================================

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        if (
            request.method !==
            "GET"
        ) {
            return;
        }

        // Jangan intercept Supabase
        if (
            request.url.includes(
                "supabase.co"
            )
        ) {
            return;
        }

        event.respondWith(

            fetch(request)

                .then(response => {

                    if (
                        response &&
                        response.status === 200 &&
                        response.type === "basic"
                    ) {

                        const clone =
                            response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    request,
                                    clone
                                );

                            })
                            .catch(() => {});

                    }

                    return response;

                })

                .catch(() => {

                    return caches.match(
                        request
                    );

                })

        );

    }
);


// ==========================================
// PUSH NOTIFICATION
// ==========================================

self.addEventListener(
    "push",
    event => {

        console.log(
            "SIDAT: PUSH diterima."
        );

        let data = {};

        try {

            if (event.data) {

                data =
                    event.data.json();

            }

        } catch (error) {

            console.warn(
                "SIDAT: Payload push bukan JSON.",
                error
            );

            data = {

                title:
                    "📢 SIDAT",

                body:
                    event.data
                        ? event.data.text()
                        : "Ada notifikasi baru dari SIDAT."

            };

        }

        const title =
            data.title ||
            "📢 SIDAT";

        const body =
            data.body ||
            data.message ||
            "Ada notifikasi baru dari SIDAT.";

        const notificationId =
            data.notification_id ||
            "";

        const url =
            data.url ||
            "/warga/pengumuman.html";

        const icon =
            new URL(
                "./icons/icon-192.png",
                self.registration.scope
            ).href;

        const badge =
            new URL(
                "./icons/icon-192.png",
                self.registration.scope
            ).href;

        const options = {

            body: body,

            icon: icon,

            badge: badge,

            tag:
                notificationId
                    ? `sidat-${notificationId}`
                    : "sidat-notification",

            renotify: true,

            data: {

                url: url,

                notification_id:
                    notificationId,

                report_id:
                    data.report_id || "",

                created_at:
                    data.created_at || ""

            }

        };

        event.waitUntil(

            self.registration
                .showNotification(
                    title,
                    options
                )

        );

    }
);


// ==========================================
// NOTIFICATION CLICK
// ==========================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const url =
            event.notification
                ?.data
                ?.url ||
            "/warga/pengumuman.html";

        event.waitUntil(

            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })

                .then(clientList => {

                    for (
                        const client
                        of clientList
                    ) {

                        if (
                            "navigate"
                            in client
                        ) {

                            return client
                                .navigate(url)
                                .then(
                                    () =>
                                        client
                                            .focus()
                                );

                        }

                    }

                    if (
                        clients.openWindow
                    ) {

                        return clients
                            .openWindow(
                                url
                            );

                    }

                })

        );

    }
);
