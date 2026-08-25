// ==========================================
// SIDAT
// PUSH NOTIFICATION WARGA
// Versi sederhana
// ==========================================


// ==========================================
// VAPID PUBLIC KEY
// ==========================================

const SIDAT_VAPID_PUBLIC_KEY =
    "BIBLdBe6ORdVY4UuJB0iHTKOuJXFJ2wPN-05x96b1hNYR4h7G-RptBHscw6wMrTfZndz4SqTDUvBncgeOCQYJhM";


// ==========================================
// KONVERSI VAPID KEY
// ==========================================

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


// ==========================================
// ARRAY BUFFER → BASE64 URL
// ==========================================

function arrayBufferToBase64Url(
    buffer
) {

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

    return btoa(binary)
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


// ==========================================
// DAFTARKAN PUSH NOTIFICATION
// ==========================================

async function daftarkanPushNotification() {

    try {

        // ----------------------------------
        // CEK BROWSER
        // ----------------------------------

        if (
            !("serviceWorker" in navigator)
        ) {

            console.warn(
                "SIDAT: Service Worker tidak didukung."
            );

            return false;

        }


        if (
            !("PushManager" in window)
        ) {

            console.warn(
                "SIDAT: Push Notification tidak didukung."
            );

            return false;

        }


        if (
            !("Notification" in window)
        ) {

            console.warn(
                "SIDAT: Notification API tidak didukung."
            );

            return false;

        }


        // ----------------------------------
        // DATA WARGA
        // ----------------------------------

        const dataWarga =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) ||
                "{}"
            );


        const residentId =
            dataWarga.resident_id ||
            dataWarga.residentId ||
            dataWarga.id_resident ||
            null;


        if (!residentId) {

            console.warn(
                "SIDAT: resident_id tidak ditemukan."
            );

            return false;

        }


        // ----------------------------------
        // ACCESS TOKEN
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


        // ----------------------------------
        // SERVICE WORKER
        // ----------------------------------

        const registration =
            await navigator
                .serviceWorker
                .register(
                    "../service-worker.js"
                );


        await navigator
            .serviceWorker
            .ready;


        // ----------------------------------
        // IZIN NOTIFIKASI
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
        // AMBIL SUBSCRIPTION
        // ----------------------------------

        let subscription =
            await registration
                .pushManager
                .getSubscription();


        // ----------------------------------
        // BUAT SUBSCRIPTION
        // ----------------------------------

        if (!subscription) {

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

        }


        if (!subscription) {

            throw new Error(
                "Push Subscription gagal dibuat."
            );

        }


        // ----------------------------------
        // AMBIL KEYS
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


        // ----------------------------------
        // HAPUS SUBSCRIPTION LAMA
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

            console.warn(
                "SIDAT: Subscription lama gagal dihapus."
            );

        }


        // ----------------------------------
        // SIMPAN SUBSCRIPTION
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


        console.log(
            "SIDAT: Push Notification aktif."
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


// ==========================================
// EXPORT GLOBAL
// ==========================================

window.daftarkanPushNotification =
    daftarkanPushNotification;
