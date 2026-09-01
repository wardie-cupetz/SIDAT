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
    // SUPABASE SESSION
    // ======================================

    async function ambilSessionSupabase() {

        try {

            /*
             * Gunakan client Supabase yang sudah
             * dibuat oleh halaman.
             */

            if (
                window.supabaseClient &&
                window.supabaseClient.auth
            ) {

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .getSession();

                if (!error && data?.session) {

                    return data.session;

                }

            }


            /*
             * Fallback:
             * buat client dari konfigurasi SIDAT
             */

            if (
                typeof SUPABASE_URL === "undefined" ||
                typeof SUPABASE_KEY === "undefined" ||
                typeof supabase === "undefined"
            ) {

                console.warn(
                    "SIDAT FCM: Konfigurasi Supabase belum tersedia."
                );

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

                console.error(
                    "SIDAT FCM: Gagal mengambil session:",
                    error
                );

                return null;

            }


            return data?.session || null;

        }

        catch (error) {

            console.error(
                "SIDAT FCM: Error session:",
                error
            );

            return null;

        }

    }


    // ======================================
    // SIMPAN TOKEN LOCAL
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
    // AMBIL TOKEN LOCAL
    // ======================================

    function ambilTokenFCM() {

        return localStorage.getItem(
            FCM_STORAGE_KEY
        );

    }


    // ======================================
    // SINKRONKAN TOKEN KE SUPABASE
    // ======================================

    async function sinkronkanTokenFCM() {

        try {

            const token =
                ambilTokenFCM();


            if (!token) {

                console.log(
                    "SIDAT FCM: Belum ada token FCM."
                );

                return;

            }


            const session =
                await ambilSessionSupabase();


            if (!session?.user) {

                console.log(
                    "SIDAT FCM: Session Supabase belum tersedia."
                );

                return;

            }


            const user =
                session.user;


            console.log(
                "SIDAT FCM: User aktif:",
                user.id
            );


            // ==================================
            // AMBIL PROFILE
            // ==================================

            let client =
                window.supabaseClient;


            if (
                !client ||
                !client.from
            ) {

                if (
                    typeof SUPABASE_URL === "undefined" ||
                    typeof SUPABASE_KEY === "undefined" ||
                    typeof supabase === "undefined"
                ) {

                    console.error(
                        "SIDAT FCM: Supabase client tidak tersedia."
                    );

                    return;

                }


                client =
                    supabase.createClient(
                        SUPABASE_URL,
                        SUPABASE_KEY
                    );

            }


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

                console.error(
                    "SIDAT FCM: Gagal mengambil profile:",
                    profileError
                );

                return;

            }


            if (!profile) {

                console.error(
                    "SIDAT FCM: Profile user tidak ditemukan."
                );

                return;

            }


            console.log(
                "SIDAT FCM: Profile:",
                profile
            );


            // ==================================
            // ADMIN
            // ==================================

            if (
                profile.role === "admin"
            ) {

                console.log(
                    "SIDAT FCM: Akun ADMIN terdeteksi."
                );


                /*
                 * Admin tidak memiliki resident_id.
                 * Karena itu gunakan user_id sebagai
                 * identitas perangkat admin.
                 */

                const {
                    data: existing,
                    error: existingError
                } =
                    await client
                        .from("push_subscriptions")
                        .select("id")
                        .eq(
                            "user_id",
                            user.id
                        )
                        .maybeSingle();


                if (existingError) {

                    console.error(
                        "SIDAT FCM: Gagal mencari subscription admin:",
                        existingError
                    );

                    return;

                }


                // ------------------------------
                // UPDATE
                // ------------------------------

                if (existing?.id) {

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

                                updated_at:
                                    new Date()
                                        .toISOString()

                            })
                            .eq(
                                "id",
                                existing.id
                            );


                    if (error) {

                        console.error(
                            "SIDAT FCM: Gagal update token ADMIN:",
                            error
                        );

                        return;

                    }


                    console.log(
                        "SIDAT FCM: Token ADMIN berhasil diperbarui."
                    );

                    return;

                }


                // ------------------------------
                // INSERT
                // ------------------------------

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
                                null,

                            auth:
                                null,

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

                    console.error(
                        "SIDAT FCM: Gagal menyimpan token ADMIN:",
                        insertError
                    );

                    return;

                }


                console.log(
                    "SIDAT FCM: Token ADMIN berhasil disimpan."
                );

                return;

            }


            // ==================================
            // WARGA
            // ==================================

            if (
                profile.role === "warga"
            ) {

                console.log(
                    "SIDAT FCM: Akun WARGA terdeteksi."
                );


                const residentId =
                    profile.resident_id;


                if (!residentId) {

                    console.warn(
                        "SIDAT FCM: resident_id warga tidak ditemukan."
                    );

                    return;

                }


                /*
                 * Gunakan endpoint FCM Native yang sudah
                 * tersimpan untuk warga jika tersedia.
                 */

                const {
                    data: existing,
                    error: existingError
                } =
                    await client
                        .from(
                            "push_subscriptions"
                        )
                        .select("id")
                        .eq(
                            "resident_id",
                            residentId
                        )
                        .maybeSingle();


                if (existingError) {

                    console.error(
                        "SIDAT FCM: Gagal mencari subscription warga:",
                        existingError
                    );

                    return;

                }


                if (existing?.id) {

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

                                updated_at:
                                    new Date()
                                        .toISOString()

                            })
                            .eq(
                                "id",
                                existing.id
                            );


                    if (error) {

                        console.error(
                            "SIDAT FCM: Gagal update token warga:",
                            error
                        );

                        return;

                    }


                    console.log(
                        "SIDAT FCM: Token WARGA berhasil diperbarui."
                    );

                    return;

                }


                console.warn(
                    "SIDAT FCM: Subscription warga belum ditemukan."
                );

            }

        }

        catch (error) {

            console.error(
                "SIDAT FCM: Sinkronisasi token gagal:",
                error
            );

        }

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
        async function (token) {

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


            // ------------------------------
            // SIMPAN TOKEN
            // ------------------------------

            simpanTokenFCM(
                fcmToken
            );


            console.log(
                "SIDAT FCM: Token berhasil diterima."
            );


            // ------------------------------
            // SINKRONKAN KE SUPABASE
            // ------------------------------

            await sinkronkanTokenFCM();

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


    window.SIDATSinkronkanFCM =
        sinkronkanTokenFCM;


    // ======================================
    // REGISTER OTOMATIS
    // ======================================

    registerFCM();


})();
