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
"sidat-pwa-v1";const CACHE_NAME =
"sidat-pwa-v2";

// ==========================================
// FILE DASAR SIDAT
// ==========================================

const STATIC_FILES = [

"./",

"./index.html",

"./manifest.json"

]const STATIC_FILES = [

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


    /*
     * Hanya menangani request GET.
     */

    if (
        request.method !==
        "GET"
    ) {

        return;

    }


    /*
     * Jangan mengambil alih
     * request Supabase.
     *
     * Database tetap menggunakan
     * koneksi online seperti sebelumnya.
     */

    if (
        request.url.includes(
            "supabase.co"
        )
    ) {

        return;

    }


    event.respondWith(

        fetch(
            request
        )
        .then(
            response => {

                /*
                 * Simpan response yang valid
                 * ke cache.
                 */

                if (
                    response &&
                    response.status ===
                    200 &&
                    response.type ===
                    "basic"
                ) {

                    const responseClone =
                        response.clone();


                    caches.open(
                        CACHE_NAME
                    )
                    .then(
                        cache => {

                            cache.put(
                                request,
                                responseClone
                            );

                        }
                    );

                }


                return response;

            }
        )
        .catch(
            () => {

                /*
                 * Jika internet tidak tersedia,
                 * coba gunakan cache.
                 */

                return caches.match(
                    request
                );

            }
        )

    );

}

);
