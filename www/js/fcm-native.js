(function () {
    "use strict";

    // ==========================================
    // REGISTER PLUGIN
    // ==========================================

    alert("FCM-1");

    alert(
        "Plugins: " +
        Object.keys(window.Capacitor.Plugins || {}).join(", ")
    );

    alert(
        "PushNotifications: " +
        typeof window.Capacitor?.Plugins?.PushNotifications
    );

    alert("Capacitor: " + typeof window.Capacitor);

    alert(
        "registerPlugin: " +
        typeof window.Capacitor?.registerPlugin
    );

    alert(
        "isPluginAvailable: " +
        typeof window.Capacitor?.isPluginAvailable
    );

    // ===== GANTI BAGIAN INI =====
    const PushNotifications =
        window.Capacitor.Plugins.PushNotifications;

    if (!PushNotifications) {
        alert("PushNotifications NULL");
        return;
    }
    // ============================

    alert("FCM-1A");
// ==========================================
// CEK PLUGIN
// ==========================================

if (
    !window.Capacitor.isPluginAvailable(
        "PushNotifications"
    )
) {
    alert("PLUGIN TIDAK TERSEDIA");
    return;
}

alert("FCM-1B");

    console.log(
        "SIDAT FCM Native: Plugin PushNotifications tersedia."
    );

    // ==========================================
    // SIMPAN TOKEN FCM KE SUPABASE
    // ==========================================

    async function simpanFCMToken() {
alert("1. Masuk simpanFCMToken()");
        try {

            const fcmToken =
                localStorage.getItem(
                    "sidat_fcm_native_token"
                );
alert(
    "2. FCM Token:\n" +
    (fcmToken || "NULL")
);
            if (!fcmToken) {

                console.warn(
                    "SIDAT FCM Native: token FCM belum tersedia."
                );

                return false;
            }

            const accessToken =
                localStorage.getItem(
                    "sidat_access_token"
                );
alert(
    "3. Access Token:\n" +
    (accessToken ? "ADA" : "NULL")
);
            if (!accessToken) {

                console.warn(
                    "SIDAT FCM Native: access token belum tersedia."
                );

                return false;
            }

            let sidatUser = {};

            try {

                sidatUser =
                    JSON.parse(
                        localStorage.getItem(
                            "sidat_user"
                        ) || "{}"
                    );

            } catch (error) {

                console.error(
                    "SIDAT FCM Native: sidat_user tidak valid.",
                    error
                );

                return false;
            }

            const residentId =
                sidatUser.resident_id ||
                sidatUser.residentId ||
                sidatUser.id_resident ||
                null;
alert(
    "4. Resident ID:\n" +
    (residentId || "NULL")
);
            if (!residentId) {

                console.warn(
                    "SIDAT FCM Native: resident_id belum tersedia."
                );

                return false;
            }

            console.log(
                "SIDAT FCM Native: menyimpan token untuk resident:",
                residentId
            );
alert("5. Mengirim PATCH ke Supabase...");
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
                                    fcmToken,

                                updated_at:
                                    new Date()
                                        .toISOString()
                            })
                    }
                );
            alert(
    "6. HTTP Status: " +
    response.status
);

           if (!response.ok) {

    const errorText =
        await response.text();
alert(
    "7. ERROR:\n" +
    errorText
);
    alert(
        "Gagal simpan FCM\n\nStatus: " +
        response.status +
        "\n\n" +
        errorText
    );

    console.error(
        "SIDAT FCM Native: gagal menyimpan FCM token:",
        response.status,
        errorText
    );

    return false;
}
            console.log(
                "SIDAT FCM Native: FCM token berhasil disimpan ke Supabase.",
                {
                    residentId:
                        residentId
                }
            );

alert(
    "FCM token berhasil disimpan."
);
            return true;

        } catch (error) {
alert(
    "9. EXCEPTION:\n" +
    (error.message || JSON.stringify(error))
);
            console.error(
                "SIDAT FCM Native: error menyimpan token ke Supabase:",
                error
            );

            return false;
        }
    }

    // ==========================================
    // LISTENER REGISTRATION
    // ==========================================

    PushNotifications.addListener(
        "registration",
        async function (token) {

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

            if (!token.value) {

                console.warn(
                    "SIDAT FCM Native: token kosong."
                );

                return;
            }

            // ==========================================
            // SIMPAN TOKEN SEMENTARA
            // ==========================================

            localStorage.setItem(
                "sidat_fcm_native_token",
                token.value
            );

            console.log(
                "SIDAT FCM Native: token tersimpan di localStorage."
            );

            // ==========================================
            // COBA SIMPAN KE SUPABASE
            // ==========================================

           const accessToken =
    localStorage.getItem("sidat_access_token");

if (accessToken) {
    await simpanFCMToken();
} else {
    console.log(
        "SIDAT FCM Native: Access token belum ada, FCM token hanya disimpan sementara."
    );
}

    // ==========================================
    // LISTENER ERROR REGISTRASI
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
    // NOTIFIKASI MASUK
    // ==========================================

    PushNotifications.addListener(
        "pushNotificationReceived",
        function (notification) {

            console.log(
                "SIDAT FCM Native: NOTIFICATION RECEIVED:",
                notification
            );
        }
    );

    // ==========================================
    // NOTIFIKASI DITEKAN
    // ==========================================

    PushNotifications.addListener(
        "pushNotificationActionPerformed",
        function (notification) {

            console.log(
                "SIDAT FCM Native: NOTIFICATION ACTION:",
                notification
            );
        }
    );

    // ==========================================
    // REGISTER FCM
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
                permission.receive !==
                "granted"
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

        } catch (error) {

            console.error(
                "SIDAT FCM Native: gagal register:",
                error
            );
        }
    }
alert("FCM-2: Akan export global");
    // ==========================================
    // EXPORT GLOBAL
    // ==========================================

    window.SIDATPushNotifications =
        PushNotifications;

    window.SIDATRegisterFCM =
        registerFCM;

    window.SIDATSaveFCMToken =
        simpanFCMToken;
    alert("FCM-3: Export selesai");

    // ==========================================
    // JALANKAN OTOMATIS
    // ==========================================

    registerFCM();

})();
