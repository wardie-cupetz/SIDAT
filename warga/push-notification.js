// ==========================================
// SIDAT
// PUSH NOTIFICATION WARGA
// RESET & REGISTER VAPID
// ==========================================

(function () {

    "use strict";


    // ======================================
    // VAPID PUBLIC KEY
    // ======================================

    const SIDAT_VAPID_PUBLIC_KEY =
        "BIBLdBe6ORdVY4UuJB0iHTKOuJXFJ2wPN-05x96b1hNYR4h7G-RptBHscw6wMrTfZndz4SqTDUvBncgeOCQYJhM";


    // ======================================
    // STORAGE KEY
    // ======================================

    const VAPID_STORAGE_KEY =
        "sidat_push_vapid_public_key_v2";


    // ======================================
    // KONVERSI VAPID KEY
    // ======================================

    function urlBase64ToUint8Array(
        base64String
    ) {

        const padding =
            "=".repeat(
                (
                    4 -
                    base64String.length % 4
                ) % 4
            );


        const base64 =
            (
                base64String +
                padding
            )
            .replace(
                /-/g,
                "+"
            )
            .replace(
                /_/g,
                "/"
            );


        const rawData =
            window.atob(
                base64
            );


        const outputArray =
            new Uint8Array(
                rawData.length
            );


        for (
            let i = 0;
            i < rawData.length;
            i++
        ) {

            outputArray[i] =
                rawData.charCodeAt(i);

        }


        return outputArray;

    }


    // ======================================
    // ARRAY BUFFER → BASE64 URL
    // ======================================

    function arrayBufferToBase64Url(
        buffer
    ) {

        if (!buffer) {
            return null;
        }


        const bytes =
            new Uint8Array(
                buffer
            );


        let binary = "";


        for (
            let i = 0;
            i < bytes.byteLength;
            i++
        ) {

            binary +=
                String.fromCharCode(
                    bytes[i]
                );

        }


        return btoa(
            binary
        )
        .replace(
            /\+/g,
            "-"
        )
        .replace(
            /\//g,
            "_"
        )
        .replace(
            /=+$/,
            ""
        );

    }


    // ======================================
    // AMBIL DATA WARGA
    // ======================================

    function ambilDataWarga() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) || "{}"
            );

        }

        catch (error) {

            console.error(
                "SIDAT: Data warga tidak valid.",
                error
            );

            return {};

        }

    }

// ======================================
// REGISTER SERVICE WORKER
// ======================================

async function daftarkanServiceWorker() {

    if (!("serviceWorker" in navigator)) {

        console.warn(
            "SIDAT: Service Worker tidak didukung."
        );

        return null;

    }

    try {

        const registration =
            await navigator.serviceWorker.register(
                "../service-worker.js",
                {
                    scope: "../"
                }
            );

        console.log(
            "SIDAT: Service Worker berhasil didaftarkan.",
            registration.scope
        );

        await navigator.serviceWorker.ready;

        console.log(
            "SIDAT: Service Worker siap digunakan."
        );

        return registration;

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal mendaftarkan Service Worker.",
            error
        );

        return null;

    }

}


    // ======================================
    // DAFTARKAN PUSH NOTIFICATION
    // ======================================

    async function daftarkanPushNotification() {

        try {

            // ----------------------------------
            // CEK BROWSER
            // ----------------------------------

            if (
                !(
                    "serviceWorker" in navigator
                )
            ) {

                console.warn(
                    "SIDAT: Service Worker tidak didukung."
                );

                return false;

            }


            if (
                !(
                    "PushManager" in window
                )
            ) {

                console.warn(
                    "SIDAT: Push Notification tidak didukung."
                );

                return false;

            }


            if (
                !(
                    "Notification" in window
                )
            ) {

                console.warn(
                    "SIDAT: Notification tidak didukung."
                );

                return false;

            }


            // ----------------------------------
            // CEK SESSION
            // ----------------------------------

            const accessToken =
                localStorage.getItem(
                    "sidat_access_token"
                );


            if (!accessToken) {

                console.warn(
                    "SIDAT: Access token tidak ditemukan."
                );

                return false;

            }


            const dataWarga =
                ambilDataWarga();


            const residentId =
                dataWarga.resident_id ||
                dataWarga.residentId ||
                dataWarga.id_resident ||
                null;


            if (!residentId) {

                console.warn(
                    "SIDAT: Resident ID tidak ditemukan."
                );

                return false;

            }


            // ----------------------------------
            // DAFTARKAN SERVICE WORKER
            // ----------------------------------

            const registration =
    await daftarkanServiceWorker();

            alert(
                "SIDAT PUSH DEBUG\n\n" +
                "Scope: " + registration.scope + "\n" +
                "Active: " + !!registration.active + "\n" +
                "Notification: " + Notification.permission + "\n" +
                "Resident ID: " + residentId
            );


            


            // ----------------------------------
            // MINTA IZIN NOTIFIKASI
            // ----------------------------------

            if (
                Notification.permission ===
                "default"
            ) {

                const permission =
                    await Notification
                        .requestPermission();


                if (
                    permission !==
                    "granted"
                ) {

                    console.warn(
                        "SIDAT: Izin notifikasi tidak diberikan."
                    );

                    return false;

                }

            }


            if (
                Notification.permission !==
                "granted"
            ) {

                console.warn(
                    "SIDAT: Notifikasi belum diizinkan."
                );

                return false;

            }


            // ----------------------------------
            // AMBIL SUBSCRIPTION LAMA
            // ----------------------------------

            let subscription =
                await registration
                    .pushManager
                    .getSubscription();


            // ----------------------------------
            // CEK VAPID YANG TERSIMPAN
            // ----------------------------------

            const vapidTersimpan =
                localStorage.getItem(
                    VAPID_STORAGE_KEY
                );


            // ----------------------------------
            // RESET SUBSCRIPTION JIKA
            // VAPID BERBEDA / BELUM PERNAH
            // ----------------------------------

            if (
                subscription &&
                vapidTersimpan !==
                SIDAT_VAPID_PUBLIC_KEY
            ) {

                console.log(
                    "SIDAT: Subscription lama ditemukan."
                );

                console.log(
                    "SIDAT: Menghapus subscription lama dari Chrome."
                );


                try {

                    const berhasilUnsubscribe =
                        await subscription
                            .unsubscribe();


                    console.log(
                        "SIDAT: Unsubscribe lama:",
                        berhasilUnsubscribe
                    );

                }

                catch (unsubscribeError) {

                    console.warn(
                        "SIDAT: Gagal unsubscribe lama.",
                        unsubscribeError
                    );

                }


                subscription =
                    null;

            }


            // ----------------------------------
            // BUAT SUBSCRIPTION BARU
            // ----------------------------------

            if (!subscription) {

                console.log(
                    "SIDAT: Membuat Push Subscription baru."
                );


                subscription =
                    await registration
                        .pushManager
                        .subscribe(
                            {

                                userVisibleOnly:
                                    true,

                                applicationServerKey:
                                    urlBase64ToUint8Array(
                                        SIDAT_VAPID_PUBLIC_KEY
                                    )

                            }
                        );


                console.log(
                    "SIDAT: Push Subscription baru berhasil dibuat."
                );

            }


            if (!subscription) {

                throw new Error(
                    "Push Subscription gagal dibuat."
                );

            }


            // ----------------------------------
            // AMBIL KEYS SUBSCRIPTION
            // ----------------------------------

            const p256dh =
                arrayBufferToBase64Url(
                    subscription.getKey(
                        "p256dh"
                    )
                );


            const auth =
                arrayBufferToBase64Url(
                    subscription.getKey(
                        "auth"
                    )
                );


            if (
                !subscription.endpoint ||
                !p256dh ||
                !auth
            ) {

                throw new Error(
                    "Data Push Subscription tidak lengkap."
                );

            }


            console.log(
                "SIDAT: Endpoint Push:",
                subscription.endpoint
            );


            console.log(
                "SIDAT: Key length:",
                {
                    p256dh:
                        p256dh.length,

                    auth:
                        auth.length
                }
            );


            // ----------------------------------
            // HAPUS SUBSCRIPTION LAMA
            // DARI SUPABASE
            // ----------------------------------

            const deleteResponse =
                await fetch(

                    `${SUPABASE_URL}` +
                    `/rest/v1/push_subscriptions` +
                    `?resident_id=eq.${encodeURIComponent(
                        residentId
                    )}`,

                    {

                        method:
                            "DELETE",

                        headers: {

                            "apikey":
                                SUPABASE_KEY,

                            "Authorization":
                                `Bearer ${accessToken}`

                        }

                    }

                );


            if (
                !deleteResponse.ok &&
                deleteResponse.status !== 404
            ) {

                const deleteError =
                    await deleteResponse.text();


                console.warn(
                    "SIDAT: Subscription Supabase lama gagal dihapus.",
                    deleteError
                );

            }


            // ----------------------------------
            // SIMPAN SUBSCRIPTION BARU
            // ----------------------------------

            const response =
                await fetch(

                    `${SUPABASE_URL}` +
                    `/rest/v1/push_subscriptions`,

                    {

                        method:
                            "POST",

                        headers: {

                            "apikey":
                                SUPABASE_KEY,

                            "Authorization":
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=minimal"

                        },

                        body:
                            JSON.stringify(
                                {

                                    resident_id:
                                        residentId,

                                    endpoint:
                                        subscription.endpoint,

                                    p256dh:
                                        p256dh,

                                    auth:
                                        auth,

                                    updated_at:
                                        new Date()
                                            .toISOString()

                                }
                            )

                    }

                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                throw new Error(
                    errorText ||
                    "Gagal menyimpan Push Subscription."
                );

            }


            // ----------------------------------
            // SIMPAN VAPID AKTIF
            // ----------------------------------

            localStorage.setItem(
                VAPID_STORAGE_KEY,
                SIDAT_VAPID_PUBLIC_KEY
            );


            console.log(
                "SIDAT: Push Notification aktif dengan VAPID terbaru."
            );


            return true;

        }

        catch (error) {

            console.error(
                "SIDAT: Gagal mengaktifkan Push Notification.",
                error
            );


            return false;

        }

    }


    // ======================================
    // EXPORT GLOBAL
    // ======================================

    // ======================================
// EXPORT GLOBAL
// ======================================

window.daftarkanPushNotification =
    daftarkanPushNotification;


// ======================================
// AKTIFKAN PUSH OTOMATIS
// ======================================

daftarkanPushNotification();


})();
