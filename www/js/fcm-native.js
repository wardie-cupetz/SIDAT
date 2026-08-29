(function () {
    "use strict";

    console.log("SIDAT FCM Native: memulai...");

    // ==========================================
    // CEK CAPACITOR
    // ==========================================

    if (
        !window.Capacitor ||
        typeof window.Capacitor.registerPlugin !== "function"
    ) {
        console.warn(
            "SIDAT FCM Native: Capacitor tidak tersedia."
        );

        return;
    }


    // ==========================================
    // REGISTER PLUGIN
    // ==========================================

    const PushNotifications =
        window.Capacitor.registerPlugin(
            "PushNotifications"
        );


    // ==========================================
    // CEK PLUGIN
    // ==========================================

    if (
        !window.Capacitor.isPluginAvailable(
            "PushNotifications"
        )
    ) {
        console.warn(
            "SIDAT FCM Native: Plugin PushNotifications tidak tersedia."
        );

        return;
    }


    console.log(
        "SIDAT FCM Native: Plugin PushNotifications tersedia."
    );


    // ==========================================
    // LISTENER: BERHASIL MENDAPATKAN TOKEN
    // ==========================================

    PushNotifications.addListener(
        "registration",
        function (token) {

            console.log(
                "=========================================="
            );

            console.log(
                "SIDAT FCM TOKEN:"
            );

            console.log(
                token.value
            );

            console.log(
                "SIDAT FCM TOKEN LENGTH:",
                token.value
                    ? token.value.length
                    : 0
            );

            console.log(
                "=========================================="
            );

            // Simpan sementara untuk debugging.
            // Belum dikirim ke Supabase.
           if (token.value) {

    localStorage.setItem(
        "sidat_fcm_native_token",
        token.value
    );

    console.log(
        "SIDAT FCM Native: token tersimpan di localStorage."
    );

    // ==========================================
    // SIMPAN TOKEN FCM KE SUPABASE
    // ==========================================

    try {

        const accessToken =
            localStorage.getItem(
                "sidat_access_token"
            );

        const sidatUser =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) || "{}"
            );

        const residentId =
            sidatUser.resident_id ||
            sidatUser.residentId ||
            sidatUser.id_resident ||
            null;

        // Jika belum login, token tetap disimpan
        // di localStorage dan akan bisa digunakan
        // setelah login berikutnya.
        if (!accessToken || !residentId) {

            console.warn(
                "SIDAT FCM Native: session warga belum tersedia."
            );

            return;
        }

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/push_subscriptions?resident_id=eq.${encodeURIComponent(residentId)}`,
                {
                    method: "PATCH",

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
                        JSON.stringify({
                            fcm_token:
                                token.value,

                            updated_at:
                                new Date()
                                    .toISOString()
                        })
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "SIDAT FCM Native: gagal menyimpan FCM token:",
                response.status,
                errorText
            );

            return;
        }

        console.log(
            "SIDAT FCM Native: FCM token berhasil disimpan ke Supabase.",
            {
                residentId:
                    residentId
            }
        );

    }
    catch (error) {

        console.error(
            "SIDAT FCM Native: error menyimpan token ke Supabase:",
            error
        );

    }
}


    // ==========================================
    // LISTENER: ERROR REGISTRASI
    // ==========================================

    PushNotifications.addListener(
        "registrationError",
        function (error) {

            console.error(
                "SIDAT FCM REGISTRATION ERROR:",
                error
            );

        }
    );


    // ==========================================
    // LISTENER: NOTIFIKASI MASUK
    // ==========================================

    PushNotifications.addListener(
        "pushNotificationReceived",
        function (notification) {

            console.log(
                "SIDAT FCM NOTIFICATION RECEIVED:",
                notification
            );

        }
    );


    // ==========================================
    // LISTENER: NOTIFIKASI DITEKAN
    // ==========================================

    PushNotifications.addListener(
        "pushNotificationActionPerformed",
        function (notification) {

            console.log(
                "SIDAT FCM NOTIFICATION ACTION:",
                notification
            );

        }
    );


    // ==========================================
    // MINTA IZIN + REGISTER FCM
    // ==========================================

    async function registerFCM() {

        try {

            console.log(
                "SIDAT FCM Native: meminta permission..."
            );


            const permission =
                await PushNotifications
                    .requestPermissions();


            console.log(
                "SIDAT FCM Native: permission:",
                permission.receive
            );


            if (
                permission.receive !== "granted"
            ) {

                console.warn(
                    "SIDAT FCM Native: izin notifikasi ditolak."
                );

                return;

            }


            console.log(
                "SIDAT FCM Native: melakukan register..."
            );


            await PushNotifications.register();


            console.log(
                "SIDAT FCM Native: register() berhasil dipanggil."
            );

        }

        catch (error) {

            console.error(
                "SIDAT FCM Native: gagal register:",
                error
            );

        }

    }


    // ==========================================
    // EXPORT GLOBAL
    // ==========================================

    window.SIDATPushNotifications =
        PushNotifications;

    window.SIDATRegisterFCM =
        registerFCM;


    // ==========================================
    // JALANKAN OTOMATIS
    // ==========================================

    registerFCM();

})();
