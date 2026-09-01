// ==========================================
// SIDAT
// FCM NATIVE - ANDROID APK
// Capacitor + Firebase Cloud Messaging
// ==========================================

(function () {

    "use strict";

    console.log(
        "SIDAT FCM: Modul FCM Native dimuat."
    );


    // ======================================
    // CEK CAPACITOR
    // ======================================

    if (
        !window.Capacitor ||
        !window.Capacitor.Plugins ||
        !window.Capacitor.Plugins.PushNotifications
    ) {

        console.log(
            "SIDAT FCM: PushNotifications tidak tersedia."
        );

        return;
    }


    const PushNotifications =
        window.Capacitor.Plugins.PushNotifications;


    // ======================================
    // STORAGE KEY
    // ======================================

    const FCM_STORAGE_KEY =
        "sidat_fcm_native_token";


    // ======================================
    // SIMPAN TOKEN
    // ======================================

    function simpanTokenFCM(token) {

        if (!token) {

            console.warn(
                "SIDAT FCM: Token kosong."
            );

            return;
        }


        localStorage.setItem(
            FCM_STORAGE_KEY,
            token
        );


        console.log(
            "SIDAT FCM: Token disimpan ke localStorage."
        );

    }


    // ======================================
    // AMBIL TOKEN
    // ======================================

    function ambilTokenFCM() {

        return localStorage.getItem(
            FCM_STORAGE_KEY
        );

    }


    // ======================================
    // REQUEST IZIN + REGISTER FCM
    // ======================================

    async function registerFCM() {

        try {

            console.log(
                "SIDAT FCM: Meminta izin notifikasi..."
            );


            const permission =
                await PushNotifications
                    .requestPermissions();


            console.log(
                "SIDAT FCM: Status izin:",
                permission
            );


            if (
                permission.receive !==
                "granted"
            ) {

                console.warn(
                    "SIDAT FCM: Izin notifikasi ditolak."
                );

                return false;
            }


            console.log(
                "SIDAT FCM: Mendaftarkan perangkat ke FCM..."
            );


            await PushNotifications.register();


            console.log(
                "SIDAT FCM: Register FCM berhasil dipanggil."
            );


            return true;

        }

        catch (error) {

            console.error(
                "SIDAT FCM: Register gagal:",
                error
            );

            return false;

        }

    }


    // ======================================
    // EVENT: REGISTRATION
    // ======================================

    PushNotifications.addListener(
        "registration",
        function (token) {

            console.log(
                "SIDAT FCM TOKEN:",
                token
            );


            const fcmToken =
                token?.value;


            if (!fcmToken) {

                console.error(
                    "SIDAT FCM: Firebase tidak memberikan token."
                );

                return;
            }


            // ----------------------------------
            // SIMPAN TOKEN
            // ----------------------------------

            simpanTokenFCM(
                fcmToken
            );


            console.log(
                "SIDAT FCM: Token berhasil diterima:"
            );

            console.log(
                fcmToken
            );


            // ----------------------------------
            // JIKA FUNGSI UPDATE SUDAH TERSEDIA
            // MAKA LANGSUNG SINKRONKAN
            // ----------------------------------

            if (
                typeof window.updatePushSubscription ===
                "function"
            ) {

                console.log(
                    "SIDAT FCM: Mencoba sinkronisasi token ke Supabase..."
                );


                window.updatePushSubscription()
                    .catch(function (error) {

                        console.error(
                            "SIDAT FCM: Sinkronisasi gagal:",
                            error
                        );

                    });

            }

        }
    );


    // ======================================
    // EVENT: REGISTRATION ERROR
    // ======================================

    PushNotifications.addListener(
        "registrationError",
        function (error) {

            console.error(
                "SIDAT FCM registration error:",
                error
            );

        }
    );


    // ======================================
    // EVENT: NOTIFIKASI DITERIMA
    // ======================================

    PushNotifications.addListener(
        "pushNotificationReceived",
        function (notification) {

            console.log(
                "SIDAT FCM: Notifikasi diterima:",
                notification
            );

        }
    );


    // ======================================
    // EVENT: NOTIFIKASI DIKLIK
    // ======================================

    PushNotifications.addListener(
        "pushNotificationActionPerformed",
        function (event) {

            console.log(
                "SIDAT FCM: Notifikasi diklik:",
                event
            );


            const data =
                event?.notification?.data ||
                {};


            if (data.url) {

                window.location.href =
                    data.url;

                return;
            }


            window.location.href =
                "/warga/pengumuman.html";

        }
    );


    // ======================================
    // EXPORT GLOBAL
    // ======================================

    window.SIDATRegisterFCM =
        registerFCM;


    window.SIDATGetFCMToken =
        ambilTokenFCM;


    // ======================================
    // REGISTER OTOMATIS
    // ======================================

    registerFCM();


})();
