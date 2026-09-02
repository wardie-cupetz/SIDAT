// ==========================================
// SIDAT
// SERVICE WORKER
// PWA - SISTEM INFORMASI DATA WARGA
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// VERSI CACHE
// ==========================================

const CACHE_NAME =
    "sidat-pwa-v5";


// ==========================================
// FILE DASAR SIDAT
// ==========================================

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

            caches.open(
                CACHE_NAME
            )
            .then(
                cache => {

                    return cache.addAll(
                        STATIC_FILES
                    );

                }
            )

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

            caches.keys()
                .then(
                    cacheNames => {

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

                    }
                )

        );

        self.clients.claim();

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


        // ======================================
        // HANYA GET
        // ======================================

        if (
            request.method !==
            "GET"
        ) {

            return;

        }


        // ======================================
        // JANGAN GANGGU SUPABASE
        // ======================================

        if (
            request.url.includes(
                "supabase.co"
            )
        ) {

            return;

        }


        // ======================================
        // FILE YANG HARUS SELALU
        // MENGAMBIL VERSI TERBARU
        // ======================================

        const url =
            new URL(
                request.url
            );


        const pathname =
            url.pathname
                .toLowerCase();


        const isAppFile =
            pathname.endsWith(
                ".html"
            ) ||
            pathname.endsWith(
                ".js"
            ) ||
            pathname.endsWith(
                ".css"
            );


        // ======================================
        // NETWORK FIRST
        // ======================================

        event.respondWith(

            fetch(
                request,
                isAppFile
                    ? {
                        cache:
                            "no-store"
                    }
                    : {}
            )

            .then(
                response => {

                    // ==================================
                    // SIMPAN RESPONSE VALID
                    // ==================================

                    if (
                        response &&
                        response.status ===
                        200 &&
                        response.type ===
                        "basic"
                    ) {

                        const responseClone =
                            response.clone();


                        event.waitUntil(

                            caches.open(
                                CACHE_NAME
                            )
                            .then(
                                cache => {

                                    return cache.put(
                                        request,
                                        responseClone
                                    );

                                }
                            )

                        );

                    }


                    return response;

                }
            )

            .catch(
                () => {

                    // ==================================
                    // OFFLINE → GUNAKAN CACHE
                    // ==================================

                    return caches.match(
                        request
                    );

                }
            )

        );

    }
);
// ==========================================
// SIDAT - PUSH NOTIFICATION
// ==========================================

self.addEventListener(
    "push",
    event => {

        let data = {};

        try {

            data =
                event.data
                    ? event.data.json()
                    : {};

        } catch (error) {

            data = {

                title:
                    "📢 SIDAT",

                message:
                    event.data
                        ? event.data.text()
                        : "Ada notifikasi baru dari SIDAT."

            };

        }


        const title =
            data.title ||
            "📢 SIDAT";


        const options = {

            body:
                data.message ||
                "Ada notifikasi baru dari SIDAT.",

            icon:
                "/icons/icon-192.png",

            badge:
                "/icons/icon-192.png",

            tag:
                data.notification_id
                    ? `sidat-${data.notification_id}`
                    : "sidat-notification",

            data: {

                url:
                    data.url ||
                    "/warga/pengumuman.html"

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
// KLIK NOTIFIKASI
// ==========================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const url =
            event.notification?.data?.url ||
            "/warga/pengumuman.html";


        event.waitUntil(

            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(
                    clientList => {

                        for (
                            const client
                            of clientList
                        ) {

                            if (
                                "focus" in client
                            ) {

                                client.navigate(
                                    url
                                );

                                return client.focus();

                            }

                        }


                        if (
                            clients.openWindow
                        ) {

                            return clients.openWindow(
                                url
                            );

                        }

                    }
                )

        );

    }
);
