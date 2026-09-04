// ==========================================
// SIDAT
// FCM NATIVE - ANDROID APK
// Capacitor + Firebase Cloud Messaging
// VERSI FINAL
//
// FUNGSI:
// - Register FCM
// - Simpan token FCM
// - Sinkron token ke Supabase
// - Admin + Warga
// - Foreground popup Admin + Warga
// - Background notification melalui FCM
// - Klik notification -> halaman tujuan
// - Retry sinkronisasi
// ==========================================

(function () {

    "use strict";


    // ======================================
    // DEBUG PANEL
    // ======================================

    const DEBUG_ID =
        "sidat-fcm-debug-panel";


    function buatDebugPanel() {

        if (
            document.getElementById(
                DEBUG_ID
            )
        ) {
            return;
        }


        const panel =
            document.createElement(
                "div"
            );


        panel.id =
            DEBUG_ID;


        panel.style.cssText = `
            position: fixed;
            left: 10px;
            right: 10px;
            bottom: 10px;
            z-index: 999999;
            background: #111827;
            color: #ffffff;
            border-radius: 12px;
            padding: 14px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            line-height: 1.5;
            box-shadow: 0 8px 30px rgba(0,0,0,.35);
            max-height: 45vh;
            overflow-y: auto;
        `;


        panel.innerHTML = `
            <div style="
                font-weight:bold;
                font-size:15px;
                margin-bottom:8px;
            ">
                🔔 SIDAT FCM DEBUG
            </div>

            <div id="sidat-fcm-status">
                Memulai...
            </div>

            <button
                id="sidat-fcm-close"
                style="
                    margin-top:10px;
                    border:0;
                    padding:7px 12px;
                    border-radius:7px;
                    background:#374151;
                    color:#fff;
                "
            >
                Tutup Debug
            </button>
        `;


        document.body.appendChild(
            panel
        );


        const closeButton =
            document.getElementById(
                "sidat-fcm-close"
            );


        if (closeButton) {

            closeButton.onclick =
                function () {

                    panel.remove();

                };

        }

    }


    function debug(
        message,
        type = "info"
    ) {

        console.log(
            "SIDAT FCM:",
            message
        );


        const status =
            document.getElementById(
                "sidat-fcm-status"
            );


        if (!status) {
            return;
        }


        const waktu =
            new Date()
                .toLocaleTimeString(
                    "id-ID"
                );


        let symbol =
            "ℹ️";


        if (
            type === "success"
        ) {

            symbol =
                "✅";

        }


        if (
            type === "error"
        ) {

            symbol =
                "❌";

        }


        if (
            type === "warning"
        ) {

            symbol =
                "⚠️";

        }


        const row =
            document.createElement(
                "div"
            );


        row.style.cssText = `
            padding:5px 0;
            border-bottom:1px solid #374151;
        `;


        row.innerHTML =
            `${symbol} <span style="color:#9ca3af">${waktu}</span> ${message}`;


        status.appendChild(
            row
        );


        status.scrollTop =
            status.scrollHeight;

    }


    function tampilkanError(
        error
    ) {

        let message;


        if (
            error instanceof Error
        ) {

            message =
                error.message;

        }

        else if (
            typeof error === "object"
        ) {

            try {

                message =
                    JSON.stringify(
                        error
                    );

            }

            catch {

                message =
                    String(error);

            }

        }

        else {

            message =
                String(error);

        }


        debug(
            message,
            "error"
        );

    }


    // ======================================
    // MULAI
    // ======================================

    function mulaiDebug() {

        if (
            !document.body
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                mulaiDebug,
                {
                    once: true
                }
            );

            return;

        }


        buatDebugPanel();


        debug(
            "Modul fcm-native.js dimuat.",
            "success"
        );

    }


    mulaiDebug();


    // ======================================
    // CEK CAPACITOR
    // ======================================

    if (
        !window.Capacitor
    ) {

        debug(
            "Capacitor tidak ditemukan.",
            "error"
        );

        return;

    }


    debug(
        "Capacitor ditemukan.",
        "success"
    );


    if (
        !window.Capacitor.Plugins
    ) {

        debug(
            "Capacitor.Plugins tidak tersedia.",
            "error"
        );

        return;

    }


    if (
        !window.Capacitor.Plugins
            .PushNotifications
    ) {

        debug(
            "Plugin PushNotifications tidak tersedia.",
            "error"
        );

        return;

    }


    const PushNotifications =
        window.Capacitor.Plugins
            .PushNotifications;


    debug(
        "Plugin PushNotifications ditemukan.",
        "success"
    );


    // ======================================
    // STORAGE
    // ======================================

    const FCM_STORAGE_KEY =
        "sidat_fcm_native_token";

    const FCM_CHANNEL_ID =
        "sidat_notification";

    const FCM_RETRY_COUNT =
        5;

    const FCM_RETRY_DELAY =
        2000;

    let sinkronisasiBerjalan =
        false;


    // ======================================
    // SESSION SUPABASE
    // ======================================

    async function ambilSessionSupabase() {

        debug(
            "Mencari session Supabase..."
        );


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

                    debug(
                        "Session Supabase ditemukan melalui supabaseClient.",
                        "success"
                    );


                    return data.session;

                }


                if (error) {

                    debug(
                        "supabaseClient.getSession(): " +
                        error.message,
                        "warning"
                    );

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

                debug(
                    "Konfigurasi Supabase belum tersedia.",
                    "error"
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

                debug(
                    "Gagal mengambil session: " +
                    error.message,
                    "error"
                );

                return null;

            }


            if (
                data?.session
            ) {

                debug(
                    "Session Supabase ditemukan melalui client fallback.",
                    "success"
                );

            }

            else {

                debug(
                    "Session Supabase tidak ditemukan.",
                    "warning"
                );

            }


            return data?.session ||
                null;

        }

        catch (error) {

            tampilkanError(
                error
            );

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

            debug(
                "Token FCM kosong.",
                "error"
            );

            return;

        }


        localStorage.setItem(
            FCM_STORAGE_KEY,
            token
        );


        debug(
            "Token FCM disimpan ke localStorage.",
            "success"
        );

    }


    function ambilTokenFCM() {

        return localStorage.getItem(
            FCM_STORAGE_KEY
        );

    }


    // ======================================
    // RINGKAS TOKEN
    // ======================================

    function ringkasToken(
        token
    ) {

        if (!token) {

            return "(kosong)";

        }


        if (
            token.length <= 16
        ) {

            return token;

        }


        return (
            token.substring(
                0,
                8
            ) +
            "..." +
            token.substring(
                token.length - 8
            )
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

        debug(
            "Memulai sinkronisasi token FCM..."
        );


        try {

            const token =
                ambilTokenFCM();


            if (!token) {

                debug(
                    "Token FCM belum tersedia.",
                    "warning"
                );

                return false;

            }


            debug(
                "Token FCM tersedia: " +
                ringkasToken(token),
                "success"
            );


            const session =
                await ambilSessionSupabase();


            if (
                !session?.user
            ) {

                debug(
                    "Session user belum tersedia. Token belum disimpan ke Supabase.",
                    "warning"
                );

                return false;

            }


            const user =
                session.user;


            debug(
                "User aktif: " +
                user.id,
                "success"
            );


            const client =
                ambilClientSupabase();


            if (!client) {

                debug(
                    "Supabase client tidak tersedia.",
                    "error"
                );

                return false;

            }


            // ==================================
            // PROFILE
            // ==================================

            debug(
                "Mengambil profile user..."
            );


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

                debug(
                    "Gagal mengambil profile: " +
                    profileError.message,
                    "error"
                );

                return false;

            }


            if (!profile) {

                debug(
                    "Profile user tidak ditemukan.",
                    "error"
                );

                return false;

            }


            debug(
                "Profile ditemukan. Role: " +
                profile.role +
                " | resident_id: " +
                (
                    profile.resident_id ||
                    "NULL"
                ),
                "success"
            );


            // ==================================
            // ADMIN
            // ==================================

            if (
                profile.role ===
                "admin"
            ) {

                debug(
                    "Akun ADMIN terdeteksi.",
                    "success"
                );


                debug(
                    "Mencari subscription Admin..."
                );


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

                    debug(
                        "Gagal mencari subscription Admin: " +
                        existingError.message,
                        "error"
                    );

                    return false;

                }


                if (
                    existing?.id
                ) {

                    debug(
                        "Subscription Admin ditemukan: " +
                        existing.id,
                        "success"
                    );


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

                        debug(
                            "Gagal UPDATE token Admin: " +
                            error.message,
                            "error"
                        );

                        return false;

                    }


                    debug(
                        "TOKEN FCM ADMIN BERHASIL DIPERBARUI.",
                        "success"
                    );


                    return true;

                }


                debug(
                    "Subscription Admin belum ada. Membuat record baru..."
                );


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

                    debug(
                        "GAGAL INSERT TOKEN ADMIN: " +
                        insertError.message,
                        "error"
                    );


                    if (
                        insertError.code
                    ) {

                        debug(
                            "Supabase code: " +
                            insertError.code,
                            "error"
                        );

                    }


                    if (
                        insertError.details
                    ) {

                        debug(
                            "Details: " +
                            insertError.details,
                            "error"
                        );

                    }


                    if (
                        insertError.hint
                    ) {

                        debug(
                            "Hint: " +
                            insertError.hint,
                            "warning"
                        );

                    }


                    return false;

                }


                debug(
                    "TOKEN FCM ADMIN BERHASIL DISIMPAN.",
                    "success"
                );


                return true;

            }


            // ==================================
            // WARGA
            // ==================================

            if (
                profile.role ===
                "warga"
            ) {

                debug(
                    "Akun WARGA terdeteksi.",
                    "success"
                );


                const residentId =
                    profile.resident_id;


                if (!residentId) {

                    debug(
                        "resident_id warga tidak ditemukan.",
                        "error"
                    );

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
                            "id, resident_id, user_id, fcm_token, endpoint"
                        )
                        .eq(
                            "resident_id",
                            residentId
                        )
                        .maybeSingle();


                if (existingError) {

                    debug(
                        "Gagal mencari subscription warga: " +
                        existingError.message,
                        "error"
                    );

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

                        debug(
                            "Gagal update token warga: " +
                            error.message,
                            "error"
                        );

                        return false;

                    }


                    debug(
                        "TOKEN FCM WARGA BERHASIL DIPERBARUI.",
                        "success"
                    );


                    return true;

                }


                debug(
                    "Subscription warga belum ditemukan. Membuat record baru..."
                );


                const now =
                    new Date().toISOString();


                const {
                    error: insertWargaError
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
                                now,

                            updated_at:
                                now

                        });


                if (insertWargaError) {

                    debug(
                        "GAGAL INSERT TOKEN WARGA: " +
                        insertWargaError.message,
                        "error"
                    );


                    if (
                        insertWargaError.code
                    ) {

                        debug(
                            "Supabase code: " +
                            insertWargaError.code,
                            "error"
                        );

                    }


                    if (
                        insertWargaError.details
                    ) {

                        debug(
                            "Details: " +
                            insertWargaError.details,
                            "error"
                        );

                    }


                    if (
                        insertWargaError.hint
                    ) {

                        debug(
                            "Hint: " +
                            insertWargaError.hint,
                            "warning"
                        );

                    }


                    return false;

                }


                debug(
                    "TOKEN FCM WARGA BERHASIL DISIMPAN.",
                    "success"
                );


                return true;

            }


            debug(
                "Role tidak dikenali: " +
                profile.role,
                "error"
            );


            return false;

        }

        catch (error) {

            tampilkanError(
                error
            );

            return false;

        }

    }


    // ======================================
    // SINKRONISASI DENGAN RETRY
    // ======================================

    async function sinkronkanDenganRetry(
        jumlahPercobaan = FCM_RETRY_COUNT,
        jedaMs = FCM_RETRY_DELAY
    ) {

        if (sinkronisasiBerjalan) {

            debug(
                "Sinkronisasi FCM sedang berjalan. Permintaan baru dilewati."
            );

            return false;

        }


        sinkronisasiBerjalan = true;


        try {

            for (
                let percobaan = 1;
                percobaan <= jumlahPercobaan;
                percobaan++
            ) {

                debug(
                    "Sinkronisasi FCM " +
                    percobaan +
                    "/" +
                    jumlahPercobaan
                );


                const berhasil =
                    await sinkronkanTokenFCM();


                if (berhasil) {

                    debug(
                        "Sinkronisasi FCM berhasil.",
                        "success"
                    );

                    return true;

                }


                if (
                    percobaan <
                    jumlahPercobaan
                ) {

                    debug(
                        "Belum berhasil. Menunggu " +
                        jedaMs +
                        " ms sebelum mencoba lagi.",
                        "warning"
                    );


                    await new Promise(
                        function (resolve) {

                            setTimeout(
                                resolve,
                                jedaMs
                            );

                        }
                    );

                }

            }


            debug(
                "Sinkronisasi FCM gagal setelah semua percobaan.",
                "error"
            );


            return false;

        }

        finally {

            sinkronisasiBerjalan =
                false;

        }

    }


    // ======================================
    // REGISTER FCM
    // ======================================

    async function registerFCM() {

        debug(
            "Memulai proses register FCM..."
        );


        try {

            if (
                !PushNotifications ||
                typeof PushNotifications.requestPermissions !==
                    "function" ||
                typeof PushNotifications.register !==
                    "function"
            ) {

                debug(
                    "API PushNotifications tidak lengkap. Register FCM dibatalkan.",
                    "error"
                );

                return false;

            }


            debug(
                "Meminta izin notifikasi..."
            );


            const permission =
                await PushNotifications
                    .requestPermissions();


            debug(
                "Status izin: " +
                JSON.stringify(
                    permission
                )
            );


            if (
                permission.receive !==
                "granted"
            ) {

                debug(
                    "Izin notifikasi TIDAK diberikan.",
                    "error"
                );

                return false;

            }


            debug(
                "Izin notifikasi diberikan.",
                "success"
            );


            // ==========================================
            // NOTIFICATION CHANNEL ANDROID
            // ==========================================

            try {

                if (
                    typeof PushNotifications
                        .createChannel ===
                    "function"
                ) {

                    await PushNotifications
                        .createChannel({

                            id:
                                FCM_CHANNEL_ID,

                            name:
                                "Notifikasi SIDAT",

                            description:
                                "Notifikasi laporan dan informasi SIDAT.",

                            importance:
                                5,

                            visibility:
                                1,

                            sound:
                                "default",

                            vibration:
                                true,

                            lights:
                                true

                        });


                    debug(
                        "Notification channel " +
                        FCM_CHANNEL_ID +
                        " berhasil dibuat.",
                        "success"
                    );

                }

                else {

                    debug(
                        "createChannel() tidak tersedia. Channel dilewati.",
                        "warning"
                    );

                }

            }

            catch (channelError) {

                debug(
                    "Notification channel dilewati: " +
                    (
                        channelError?.message ||
                        channelError
                    ),
                    "warning"
                );

            }


            // ==========================================
            // REGISTER
            // ==========================================

            debug(
                "Memanggil PushNotifications.register()..."
            );


            await PushNotifications
                .register();


            debug(
                "Register FCM dipanggil. Menunggu token Firebase...",
                "success"
            );


            return true;

        }

        catch (error) {

            tampilkanError(
                error
            );

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

            debug(
                "EVENT REGISTRATION diterima.",
                "success"
            );


            const fcmToken =
                token?.value;


            if (!fcmToken) {

                debug(
                    "Firebase tidak memberikan token.",
                    "error"
                );

                return;

            }


            debug(
                "TOKEN FCM DITERIMA: " +
                ringkasToken(
                    fcmToken
                ),
                "success"
            );


            simpanTokenFCM(
                fcmToken
            );


            const berhasil =
                await sinkronkanDenganRetry();


            if (
                berhasil
            ) {

                debug(
                    "🎉 PROSES FCM SELESAI. TOKEN SUDAH TERSIMPAN.",
                    "success"
                );

            }

            else {

                debug(
                    "Token FCM ada, tetapi sinkronisasi ke Supabase belum berhasil setelah retry.",
                    "error"
                );

            }

        }
    );


    // ======================================
    // REGISTRATION ERROR
    // ======================================

    PushNotifications.addListener(
        "registrationError",
        function (
            error
        ) {

            debug(
                "FCM REGISTRATION ERROR: " +
                JSON.stringify(
                    error
                ),
                "error"
            );

        }
    );


    // ======================================
    // AMBIL ROLE LOCAL
    // ======================================

    function ambilRoleLocal() {

        try {

            // Tampilkan popup untuk ADMIN maupun WARGA
const adminUser =
    JSON.parse(
        localStorage.getItem(
            "sidat_admin_user"
        ) || "null"
    );

const wargaUser =
    JSON.parse(
        localStorage.getItem(
            "sidat_warga_user"
        ) || "null"
    );

if (!adminUser && !wargaUser) {
    debug(
        "Tidak ditemukan sesi ADMIN/WARGA lokal.",
        "warn"
    );
    return;
}

        catch {

            // Abaikan JSON rusak
        }


        /*
         * Beberapa versi SIDAT dapat
         * menyimpan user warga dengan
         * key berbeda.
         *
         * Role utama tetap kita coba
         * dari session Supabase bila
         * diperlukan.
         */

        return "warga";

    }


    // ======================================
    // TENTUKAN DATA NOTIFIKASI
    // ======================================

    function ambilDataNotifikasi(
        notification
    ) {

        const data =
            notification?.data ||
            {};

        const title =
            notification?.title ||
            data?.title ||
            "Notifikasi SIDAT";

        const body =
            notification?.body ||
            data?.body ||
            data?.message ||
            "Ada informasi baru dari SIDAT.";

        const reportId =
            data?.report_id ||
            data?.reportId ||
            null;

        let url =
            data?.url ||
            "";

        /*
         * Jika server sudah mengirim URL,
         * gunakan URL tersebut.
         */

        if (!url) {

            if (
                reportId
            ) {

                if (
                    ambilRoleLocal() ===
                    "admin"
                ) {

                    url =
                        "/admin/admin-laporan.html?report_id=" +
                        encodeURIComponent(
                            reportId
                        );

                }

                else {

                    url =
                        "/warga/laporan.html?report_id=" +
                        encodeURIComponent(
                            reportId
                        );

                }

            }

            else {

                if (
                    ambilRoleLocal() ===
                    "admin"
                ) {

                    url =
                        "/admin/pengumuman.html";

                }

                else {

                    url =
                        "/warga/pengumuman.html";

                }

            }

        }


        return {
            title,
            body,
            reportId,
            url,
            data
        };

    }


    // ======================================
    // NOTIFICATION RECEIVED
    // FOREGROUND
    // ======================================

    PushNotifications.addListener(
        "pushNotificationReceived",
        async function (
            notification
        ) {

            debug(
                "EVENT pushNotificationReceived diterima.",
                "success"
            );


            console.log(
                "SIDAT FCM Notification:",
                notification
            );


            /*
             * Ambil data notification.
             */

            const info =
                ambilDataNotifikasi(
                    notification
                );


            debug(
                "FCM foreground: " +
                JSON.stringify({
                    title:
                        info.title,

                    reportId:
                        info.reportId,

                    url:
                        info.url
                }),
                "success"
            );


            /*
             * PENTING:
             *
             * Sebelumnya kode hanya menampilkan
             * popup jika sidat_admin_user ada.
             *
             * Itu menyebabkan WARGA menerima FCM
             * tetapi tidak mendapatkan popup.
             *
             * Sekarang ADMIN dan WARGA sama-sama
             * mendapatkan popup.
             */

            const role =
                ambilRoleLocal();


            if (
                role === "admin"
            ) {

                tampilkanPopupFCM(
                    info.title,
                    info.body,
                    info.reportId,
                    info.url,
                    "admin"
                );

            }

            else {

                tampilkanPopupFCM(
                    info.title,
                    info.body,
                    info.reportId,
                    info.url,
                    "warga"
                );

            }

        }
    );


    // ==========================================
    // POPUP NOTIFIKASI FCM
    // ADMIN + WARGA
    // ==========================================

    function tampilkanPopupFCM(
        title,
        body,
        reportId,
        url,
        role
    ) {

        /*
         * Hapus popup lama jika masih ada.
         */

        const popupLama =
            document.getElementById(
                "sidat-fcm-admin-popup"
            );

        if (popupLama) {
            popupLama.remove();
        }


        const popupWargaLama =
            document.getElementById(
                "sidat-fcm-warga-popup"
            );

        if (popupWargaLama) {
            popupWargaLama.remove();
        }


        const overlay =
            document.createElement(
                "div"
            );


        /*
         * ID dibedakan berdasarkan role
         * agar tidak mengganggu popup lama.
         */

        overlay.id =
            role === "admin"
                ? "sidat-fcm-admin-popup"
                : "sidat-fcm-warga-popup";


        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,.55);
            padding: 20px;
        `;


        const popup =
            document.createElement(
                "div"
            );


        popup.style.cssText = `
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 15px 45px rgba(0,0,0,.3);
            font-family: Arial, sans-serif;
        `;


        const tombolUtama =
            reportId
                ? (
                    role === "admin"
                        ? "Lihat Laporan"
                        : "Lihat Laporan"
                )
                : "Lihat Pengumuman";


        popup.innerHTML = `
            <div style="
                background:#198754;
                color:#fff;
                padding:18px;
                font-size:18px;
                font-weight:bold;
            ">
                🔔 ${escapeHtmlFCM(title)}
            </div>

            <div style="
                padding:20px;
                color:#333;
                font-size:15px;
                line-height:1.6;
                white-space:pre-wrap;
                word-break:break-word;
            ">
                ${escapeHtmlFCM(body)}
            </div>

            <div style="
                display:flex;
                gap:10px;
                padding:0 20px 20px;
            ">

                <button
                    id="sidat-fcm-lihat"
                    style="
                        flex:1;
                        border:0;
                        border-radius:10px;
                        padding:12px;
                        background:#198754;
                        color:#fff;
                        font-weight:bold;
                        font-size:14px;
                    "
                >
                    ${tombolUtama}
                </button>

                <button
                    id="sidat-fcm-tutup"
                    style="
                        flex:1;
                        border:0;
                        border-radius:10px;
                        padding:12px;
                        background:#e9ecef;
                        color:#333;
                        font-weight:bold;
                        font-size:14px;
                    "
                >
                    Tutup
                </button>

            </div>
        `;


        overlay.appendChild(
            popup
        );


        document.body.appendChild(
            overlay
        );


        /*
         * Tombol tutup.
         */

        const tombolTutup =
            document.getElementById(
                "sidat-fcm-tutup"
            );


        if (
            tombolTutup
        ) {

            tombolTutup.onclick =
                function () {

                    overlay.remove();

                };

        }


        /*
         * Tombol lihat.
         */

        const tombolLihat =
            document.getElementById(
                "sidat-fcm-lihat"
            );


        if (
            tombolLihat
        ) {

            tombolLihat.onclick =
                function () {

                    overlay.remove();


                    if (
                        url
                    ) {

                        window.location.href =
                            url;

                        return;

                    }


                    if (
                        reportId
                    ) {

                        if (
                            role ===
                            "admin"
                        ) {

                            window.location.href =
                                "/admin/admin-laporan.html?report_id=" +
                                encodeURIComponent(
                                    reportId
                                );

                        }

                        else {

                            window.location.href =
                                "/warga/laporan.html?report_id=" +
                                encodeURIComponent(
                                    reportId
                                );

                        }

                        return;

                    }


                    if (
                        role ===
                        "admin"
                    ) {

                        window.location.href =
                            "/admin/pengumuman.html";

                    }

                    else {

                        window.location.href =
                            "/warga/pengumuman.html";

                    }

                };

        }


        /*
         * Getaran singkat.
         */

        try {

            if (
                navigator.vibrate
            ) {

                navigator.vibrate([
                    200,
                    100,
                    200
                ]);

            }

        }

        catch {

            // Tidak semua Android mengizinkan vibrate.

        }

    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtmlFCM(
        text
    ) {

        return String(
            text ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // ======================================
    // NOTIFICATION ACTION
    // KLIK NOTIFIKASI
    // ======================================

    PushNotifications.addListener(
        "pushNotificationActionPerformed",
        function (
            event
        ) {

            debug(
                "Notifikasi FCM diklik.",
                "success"
            );


            console.log(
                "SIDAT FCM Action:",
                event
            );


            const notification =
                event?.notification ||
                {};


            const info =
                ambilDataNotifikasi(
                    notification
                );


            if (
                info.url
            ) {

                debug(
                    "Membuka URL notification: " +
                    info.url,
                    "success"
                );


                window.location.href =
                    info.url;

                return;

            }


            if (
                info.reportId
            ) {

                if (
                    ambilRoleLocal() ===
                    "admin"
                ) {

                    window.location.href =
                        "/admin/admin-laporan.html?report_id=" +
                        encodeURIComponent(
                            info.reportId
                        );

                }

                else {

                    window.location.href =
                        "/warga/laporan.html?report_id=" +
                        encodeURIComponent(
                            info.reportId
                        );

                }

                return;

            }


            if (
                ambilRoleLocal() ===
                "admin"
            ) {

                window.location.href =
                    "/admin/pengumuman.html";

            }

            else {

                window.location.href =
                    "/warga/pengumuman.html";

            }

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
        sinkronkanDenganRetry;


    // ======================================
    // AUTO REGISTER
    // ======================================

    /*
     * Beri sedikit waktu agar:
     * - Supabase
     * - session login
     * - DOM
     * siap terlebih dahulu.
     */

    setTimeout(
        function () {

            registerFCM();

        },
        1500
    );


    // ======================================
    // RETRY SINKRONISASI
    // ======================================

    setTimeout(
        async function () {

            const token =
                ambilTokenFCM();


            if (!token) {

                debug(
                    "Retry sinkronisasi dilewati karena token FCM belum tersedia.",
                    "warning"
                );

                return;

            }


            await sinkronkanDenganRetry();

        },
        7000
    );


})();
