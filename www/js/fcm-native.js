// ==========================================
// SIDAT
// FCM NATIVE - ANDROID APK
// Capacitor + Firebase Cloud Messaging
// PRODUKSI - TANPA DEBUG PANEL
// ==========================================

(function () {

    "use strict";


    // ======================================
    // CEK CAPACITOR
    // ======================================

    if (
        !window.Capacitor
    ) {
        return;
    }


    if (
        !window.Capacitor.Plugins
    ) {
        return;
    }


    if (
        !window.Capacitor.Plugins
            .PushNotifications
    ) {
        return;
    }


    const PushNotifications =
        window.Capacitor.Plugins
            .PushNotifications;


    // ======================================
    // STORAGE
    // ======================================

    const FCM_STORAGE_KEY =
        "sidat_fcm_native_token";


    // ======================================
    // SESSION SUPABASE
    // ======================================

    async function ambilSessionSupabase() {

        try {

            if (
                window.supabaseClient &&
                window.supabaseClient.auth
            ) {

                const {
                    data,
                    error
                } =
                    await window
                        .supabaseClient
                        .auth
                        .getSession();


                if (
                    !error &&
                    data?.session
                ) {

                    return data.session;

                }

            }


            if (
                typeof SUPABASE_URL ===
                    "undefined" ||
                typeof SUPABASE_KEY ===
                    "undefined" ||
                typeof supabase ===
                    "undefined"
            ) {

                return null;

            }


            const client =
                supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );


            const {
                data,
                error
            } =
                await client
                    .auth
                    .getSession();


            if (error) {
                return null;
            }


            return data?.session ||
                null;

        }

        catch (error) {

            return null;

        }

    }


    // ======================================
    // TOKEN LOCAL
    // ======================================

    function simpanTokenFCM(
        token
    ) {

        if (!token) {
            return;
        }


        localStorage.setItem(
            FCM_STORAGE_KEY,
            token
        );

    }


    function ambilTokenFCM() {

        return localStorage.getItem(
            FCM_STORAGE_KEY
        );

    }


    // ======================================
    // SUPABASE CLIENT
    // ======================================

    function ambilClientSupabase() {

        if (
            window.supabaseClient &&
            typeof window
                .supabaseClient
                .from ===
                "function"
        ) {

            return window.supabaseClient;

        }


        if (
            typeof SUPABASE_URL ===
                "undefined" ||
            typeof SUPABASE_KEY ===
                "undefined" ||
            typeof supabase ===
                "undefined"
        ) {

            return null;

        }


        return supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    }


    // ======================================
    // SINKRON TOKEN
    // ======================================

    async function sinkronkanTokenFCM() {

        try {

            const token =
                ambilTokenFCM();


            if (!token) {
                return false;
            }


            const session =
                await ambilSessionSupabase();


            if (
                !session?.user
            ) {

                return false;

            }


            const user =
                session.user;


            const client =
                ambilClientSupabase();


            if (!client) {
                return false;
            }


            // ==================================
            // PROFILE
            // ==================================

            const {
                data: profile,
                error: profileError
            } =
                await client
                    .from("profiles")
                    .select(
                        "user_id, role, resident_id"
                    )
                    .eq(
                        "user_id",
                        user.id
                    )
                    .maybeSingle();


            if (profileError) {
                return false;
            }


            if (!profile) {
                return false;
            }


            // ==================================
            // ADMIN
            // ==================================

            if (
                profile.role ===
                "admin"
            ) {

                const {
                    data: existing,
                    error: existingError
                } =
                    await client
                        .from(
                            "push_subscriptions"
                        )
                        .select(
                            "id, user_id, resident_id, fcm_token"
                        )
                        .eq(
                            "user_id",
                            user.id
                        )
                        .maybeSingle();


                if (existingError) {
                    return false;
                }


                if (
                    existing?.id
                ) {

                    const {
                        error
                    } =
                        await client
                            .from(
                                "push_subscriptions"
                            )
                            .update({

                                fcm_token:
                                    token,

                                resident_id:
                                    null,

                                endpoint:
                                    `fcm-native:${user.id}`,

                                updated_at:
                                    new Date()
                                        .toISOString()

                            })
                            .eq(
                                "id",
                                existing.id
                            );


                    if (error) {
                        return false;
                    }


                    return true;

                }


                const {
                    error: insertError
                } =
                    await client
                        .from(
                            "push_subscriptions"
                        )
                        .insert({

                            user_id:
                                user.id,

                            resident_id:
                                null,

                            endpoint:
                                `fcm-native:${user.id}`,

                            p256dh:
                                `fcm-native-${user.id}`,

                            auth:
                                `fcm-native-${user.id}`,

                            fcm_token:
                                token,

                            created_at:
                                new Date()
                                    .toISOString(),

                            updated_at:
                                new Date()
                                    .toISOString()

                        });


                if (insertError) {
                    return false;
                }


                return true;

            }


            // ==================================
            // WARGA
            // ==================================

            if (
                profile.role ===
                "warga"
            ) {

                const residentId =
                    profile.resident_id;


                if (!residentId) {
                    return false;
                }


                const {
                    data: existing,
                    error: existingError
                } =
                    await client
                        .from(
                            "push_subscriptions"
                        )
                        .select(
                            "id, resident_id, user_id, fcm_token"
                        )
                        .eq(
                            "resident_id",
                            residentId
                        )
                        .maybeSingle();


                if (existingError) {
                    return false;
                }


                if (
                    existing?.id
                ) {

                    const {
                        error
                    } =
                        await client
                            .from(
                                "push_subscriptions"
                            )
                            .update({

                                fcm_token:
                                    token,

                                user_id:
                                    user.id,

                                resident_id:
                                    residentId,

                                endpoint:
                                    `fcm-native:${user.id}`,

                                p256dh:
                                    `fcm-native-${user.id}`,

                                auth:
                                    `fcm-native-${user.id}`,

                                updated_at:
                                    new Date()
                                        .toISOString()

                            })
                            .eq(
                                "id",
                                existing.id
                            );


                    if (error) {
                        return false;
                    }


                    return true;

                }


                const {
                    error: insertError
                } =
                    await client
                        .from(
                            "push_subscriptions"
                        )
                        .insert({

                            user_id:
                                user.id,

                            resident_id:
                                residentId,

                            endpoint:
                                `fcm-native:${user.id}`,

                            p256dh:
                                `fcm-native-${user.id}`,

                            auth:
                                `fcm-native-${user.id}`,

                            fcm_token:
                                token,

                            created_at:
                                new Date()
                                    .toISOString(),

                            updated_at:
                                new Date()
                                    .toISOString()

                        });


                if (insertError) {
                    return false;
                }


                return true;

            }


            return false;

        }

        catch (error) {

            return false;

        }

    }


    // ======================================
    // RETRY SINKRONISASI FCM
    // ======================================

    async function sinkronkanFCMRetry(
        jumlahPercobaan = 6,
        jeda = 2000
    ) {

        for (
            let percobaan = 1;
            percobaan <= jumlahPercobaan;
            percobaan++
        ) {

            const token =
                ambilTokenFCM();


            if (token) {

                const berhasil =
                    await sinkronkanTokenFCM();


                if (berhasil) {
                    return true;
                }

            }


            if (
                percobaan <
                jumlahPercobaan
            ) {

                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            jeda
                        );

                    }
                );

            }

        }


        return false;

    }


    // ======================================
    // REGISTER FCM
    // ======================================

    async function registerFCM() {

        try {

            const permission =
                await PushNotifications
                    .requestPermissions();


            if (
                permission.receive !==
                "granted"
            ) {

                return false;

            }


            await PushNotifications
                .register();


            return true;

        }

        catch (error) {

            return false;

        }

    }


    // ======================================
    // EVENT REGISTRATION
    // ======================================

    PushNotifications.addListener(
        "registration",
        async function (
            token
        ) {

            const fcmToken =
                token?.value;


            if (!fcmToken) {
                return;
            }


            simpanTokenFCM(
                fcmToken
            );


            await sinkronkanTokenFCM();

        }
    );


    // ======================================
    // REGISTRATION ERROR
    // ======================================

    PushNotifications.addListener(
        "registrationError",
        function () {

            // Sengaja kosong.
            // Error tidak ditampilkan
            // kepada pengguna.

        }
    );


    // ======================================
    // NOTIFICATION ACTION
    // ======================================

    PushNotifications.addListener(
        "pushNotificationActionPerformed",
        function (
            event
        ) {

            const data =
                event?.notification
                    ?.data ||
                {};


            if (
                data.url
            ) {

                window.location.href =
                    data.url;

                return;

            }


            window.location.href =
                "/warga/pengumuman.html";

        }
    );


    // ======================================
    // GLOBAL
    // ======================================

    window.SIDATRegisterFCM =
        registerFCM;


    window.SIDATGetFCMToken =
        ambilTokenFCM;


    window.SIDATSinkronkanFCM =
        sinkronkanTokenFCM;


    window.SIDATSinkronkanFCMRetry =
        sinkronkanFCMRetry;


    // ======================================
    // AUTO REGISTER + RETRY SESSION
    // ======================================

    setTimeout(
        async function () {

            try {

                for (
                    let percobaan = 1;
                    percobaan <= 6;
                    percobaan++
                ) {

                    const session =
                        await ambilSessionSupabase();


                    if (
                        session?.user
                    ) {

                        const berhasil =
                            await registerFCM();


                        if (
                            berhasil
                        ) {

                            return;

                        }

                    }


                    if (
                        percobaan < 6
                    ) {

                        await new Promise(
                            function (resolve) {

                                setTimeout(
                                    resolve,
                                    2000
                                );

                            }
                        );

                    }

                }

            }

            catch (error) {

                // Tidak menampilkan
                // debug kepada pengguna.

            }

        },
        1500
    );


})();
