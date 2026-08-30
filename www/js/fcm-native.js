(function () {
    "use strict";

    if (
        !window.Capacitor ||
        !window.Capacitor.Plugins ||
        !window.Capacitor.Plugins.PushNotifications
    ) {
        console.log("SIDAT FCM: PushNotifications tidak tersedia.");
        return;
    }

    const PushNotifications =
        window.Capacitor.Plugins.PushNotifications;

    async function registerFCM() {

        try {

            const permission =
                await PushNotifications.requestPermissions();

            if (
                permission.receive !== "granted"
            ) {

                console.log(
                    "SIDAT FCM: izin notifikasi ditolak."
                );

                return;
            }

            await PushNotifications.register();

        } catch (error) {

            console.error(
                "SIDAT FCM: register gagal",
                error
            );

        }

    }

    PushNotifications.addListener(
        "registration",
        function (token) {

            console.log(
                "SIDAT FCM TOKEN:",
                token.value
            );

            if (!token.value) {
                return;
            }

            localStorage.setItem(
                "sidat_fcm_native_token",
                token.value
            );

            console.log(
                "SIDAT FCM: token disimpan ke localStorage."
            );

        }
    );

    PushNotifications.addListener(
        "registrationError",
        function (error) {

            console.error(
                "SIDAT FCM registration error:",
                error
            );

        }
    );

    PushNotifications.addListener(
    "pushNotificationActionPerformed",
    function (event) {

        console.log("Push diklik:", event);

        const data =
            event.notification?.data || {};

        if (data.url) {
            window.location.href = data.url;
            return;
        }

        window.location.href =
            "/warga/pengumuman.html";

    }
);
    PushNotifications.addListener(
        "pushNotificationActionPerformed",
        function (notification) {

            console.log(
                "Push diklik:",
                notification
            );

        }
    );

    window.SIDATRegisterFCM =
        registerFCM;

    registerFCM();

})();
