// ==========================================
// SIDAT
// FCM NATIVE - ANDROID APK
// FINAL V2
//
// PERBAIKAN:
// - Permission Android diminta secara eksplisit
// - Menunggu Capacitor + PushNotifications siap
// - Permission dicek SEBELUM register()
// - Notification channel Android
// - FCM token
// - Sinkron token ke Supabase
// - Admin + Warga
// - Foreground popup Admin + Warga
// - Background notification
// - Klik notification -> halaman tujuan
// - Retry sinkronisasi
// ==========================================

(function () {
    "use strict";

    const FCM_STORAGE_KEY = "sidat_fcm_native_token";
    const FCM_CHANNEL_ID = "sidat_notification";
    const FCM_RETRY_COUNT = 5;
    const FCM_RETRY_DELAY = 2000;

    let PushNotifications = null;
    let sinkronisasiBerjalan = false;
    let listenersTerpasang = false;
    let registerSedangBerjalan = false;

    // ==========================================
    // DEBUG
    // ==========================================

    function debug(message, type = "info") {
        console.log("[SIDAT FCM]", message);

        try {
            let panel = document.getElementById(
                "sidat-fcm-debug-panel"
            );

            if (!panel) {
                panel = document.createElement("div");
                panel.id = "sidat-fcm-debug-panel";

                Object.assign(panel.style, {
                    position: "fixed",
                    left: "8px",
                    right: "8px",
                    bottom: "8px",
                    zIndex: "2147483647",
                    maxHeight: "180px",
                    overflowY: "auto",
                    background: "rgba(0,0,0,.88)",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    lineHeight: "1.45",
                    fontFamily: "monospace",
                    boxSizing: "border-box"
                });

                document.body.appendChild(panel);
            }

            const row = document.createElement("div");

            row.textContent =
                new Date().toLocaleTimeString() +
                " | " +
                type.toUpperCase() +
                " | " +
                message;

            if (type === "error") {
                row.style.color = "#ff8a8a";
            } else if (type === "success") {
                row.style.color = "#8aff9a";
            } else if (type === "warn") {
                row.style.color = "#ffe08a";
            }

            panel.appendChild(row);

            while (panel.children.length > 30) {
                panel.removeChild(panel.firstChild);
            }

            panel.scrollTop = panel.scrollHeight;

        } catch (e) {
            console.warn(
                "[SIDAT FCM] Debug panel error:",
                e
            );
        }
    }

    // ==========================================
    // UTILITY
    // ==========================================

    function tidur(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function amanJSON(value, fallback = null) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function escapeHtmlFCM(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // AMBIL PLUGIN
    // ==========================================

    function ambilPushNotifications() {
        try {
            if (!window.Capacitor) {
                return null;
            }

            if (
                window.Capacitor.Plugins &&
                window.Capacitor.Plugins.PushNotifications
            ) {
                return window.Capacitor.Plugins.PushNotifications;
            }

            if (
                typeof window.Capacitor.registerPlugin ===
                "function"
            ) {
                return window.Capacitor.registerPlugin(
                    "PushNotifications"
                );
            }

        } catch (e) {
            debug(
                "Gagal mengambil plugin PushNotifications: " +
                (e?.message || e),
                "error"
            );
        }

        return null;
    }

    // ==========================================
    // TUNGGU PLUGIN SIAP
    // ==========================================

    async function tungguPluginPush(
        maxPercobaan = 20,
        delay = 500
    ) {
        for (let i = 1; i <= maxPercobaan; i++) {

            PushNotifications =
                ambilPushNotifications();

            if (PushNotifications) {
                debug(
                    "PushNotifications tersedia pada percobaan " +
                    i,
                    "success"
                );

                return PushNotifications;
            }

            debug(
                "Menunggu PushNotifications... " +
                i +
                "/" +
                maxPercobaan,
                "warn"
            );

            await tidur(delay);
        }

        debug(
            "Plugin PushNotifications tidak tersedia.",
            "error"
        );

        return null;
    }

    // ==========================================
    // ROLE
    // ==========================================

    function ambilRoleLocal() {
        const adminUser = amanJSON(
            localStorage.getItem(
                "sidat_admin_user"
            ) || "null",
            null
        );

        if (adminUser) {
            return "admin";
        }

        return "warga";
    }

    // ==========================================
    // SUPABASE
    // ==========================================

    function ambilSupabaseClient() {

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        try {

            const url =
                window.SUPABASE_URL ||
                window.supabaseUrl ||
                window.SIDAT_SUPABASE_URL;

            const key =
                window.SUPABASE_KEY ||
                window.SUPABASE_ANON_KEY ||
                window.supabaseAnonKey ||
                window.SIDAT_SUPABASE_ANON_KEY;

            if (
                url &&
                key &&
                window.supabase &&
                typeof window.supabase.createClient ===
                "function"
            ) {

                window.supabaseClient =
                    window.supabase.createClient(
                        url,
                        key
                    );

                return window.supabaseClient;
            }

        } catch (e) {

            debug(
                "Gagal membuat Supabase client: " +
                (e?.message || e),
                "error"
            );
        }

        return null;
    }

    // ==========================================
    // SESSION
    // ==========================================

    async function ambilSession() {

        const supabaseClient =
            ambilSupabaseClient();

        if (!supabaseClient) {
            debug(
                "Supabase client belum tersedia.",
                "warn"
            );

            return null;
        }

        try {

            const { data, error } =
                await supabaseClient.auth.getSession();

            if (error) {

                debug(
                    "Gagal mengambil session: " +
                    error.message,
                    "error"
                );

                return null;
            }

            return data?.session || null;

        } catch (e) {

            debug(
                "Exception getSession: " +
                (e?.message || e),
                "error"
            );

            return null;
        }
    }

    // ==========================================
    // SINKRONISASI TOKEN
    // ==========================================

    async function sinkronkanTokenFCM() {

        if (sinkronisasiBerjalan) {
            return false;
        }

        sinkronisasiBerjalan = true;

        try {

            const token =
                localStorage.getItem(
                    FCM_STORAGE_KEY
                );

            if (!token) {

                debug(
                    "Token FCM belum tersedia.",
                    "warn"
                );

                return false;
            }

            const session =
                await ambilSession();

            if (!session?.user?.id) {

                debug(
                    "Session belum tersedia.",
                    "warn"
                );

                return false;
            }

            const supabaseClient =
                ambilSupabaseClient();

            if (!supabaseClient) {
                return false;
            }

            const userId =
                session.user.id;

            debug(
                "Session ditemukan: " +
                userId,
                "success"
            );

            const {
                data: profile,
                error: profileError
            } =
                await supabaseClient
                    .from("profiles")
                    .select(
                        "user_id,role,resident_id"
                    )
                    .eq("user_id", userId)
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
                    "Profile belum ditemukan.",
                    "warn"
                );

                return false;
            }

            debug(
                "Profile ditemukan. role=" +
                profile.role +
                " resident_id=" +
                (
                    profile.resident_id ||
                    "NULL"
                ),
                "success"
            );

            const endpoint =
                "fcm-native:" +
                userId;

            // ==========================================
            // ADMIN
            // ==========================================

            if (profile.role === "admin") {

                const {
                    data: existing,
                    error: findError
                } =
                    await supabaseClient
                        .from("push_subscriptions")
                        .select("id")
                        .eq("user_id", userId)
                        .eq(
                            "endpoint",
                            endpoint
                        )
                        .maybeSingle();

                if (findError) {

                    debug(
                        "Gagal mencari subscription admin: " +
                        findError.message,
                        "error"
                    );

                    return false;
                }

                const payload = {

                    user_id: userId,

                    resident_id: null,

                    endpoint: endpoint,

                    p256dh: endpoint,

                    auth: endpoint,

                    fcm_token: token,

                    updated_at:
                        new Date().toISOString()
                };

                if (existing?.id) {

                    const { error } =
                        await supabaseClient
                            .from(
                                "push_subscriptions"
                            )
                            .update(payload)
                            .eq(
                                "id",
                                existing.id
                            );

                    if (error) {

                        debug(
                            "Gagal update token admin: " +
                            error.message,
                            "error"
                        );

                        return false;
                    }

                    debug(
                        "Token FCM admin berhasil diperbarui.",
                        "success"
                    );

                } else {

                    const { error } =
                        await supabaseClient
                            .from(
                                "push_subscriptions"
                            )
                            .insert(payload);

                    if (error) {

                        debug(
                            "Gagal insert token admin: " +
                            error.message,
                            "error"
                        );

                        return false;
                    }

                    debug(
                        "Token FCM admin berhasil disimpan.",
                        "success"
                    );
                }

                return true;
            }

            // ==========================================
            // WARGA
            // ==========================================

            if (!profile.resident_id) {

                debug(
                    "Profile warga tidak memiliki resident_id.",
                    "error"
                );

                return false;
            }

            const {
                data: existing,
                error: findError
            } =
                await supabaseClient
                    .from("push_subscriptions")
                    .select("id")
                    .or(
                        "resident_id.eq." +
                        profile.resident_id +
                        ",user_id.eq." +
                        userId
                    )
                    .limit(1)
                    .maybeSingle();

            if (findError) {

                debug(
                    "Gagal mencari subscription warga: " +
                    findError.message,
                    "error"
                );

                return false;
            }

            const payload = {

                user_id: userId,

                resident_id:
                    profile.resident_id,

                endpoint: endpoint,

                p256dh: endpoint,

                auth: endpoint,

                fcm_token: token,

                updated_at:
                    new Date().toISOString()
            };

            if (existing?.id) {

                const { error } =
                    await supabaseClient
                        .from(
                            "push_subscriptions"
                        )
                        .update(payload)
                        .eq(
                            "id",
                            existing.id
                        );

                if (error) {

                    debug(
                        "Gagal update token FCM warga: " +
                        error.message,
                        "error"
                    );

                    return false;
                }

                debug(
                    "Token FCM warga berhasil diperbarui.",
                    "success"
                );

            } else {

                const { error } =
                    await supabaseClient
                        .from(
                            "push_subscriptions"
                        )
                        .insert(payload);

                if (error) {

                    debug(
                        "Gagal insert token FCM warga: " +
                        error.message,
                        "error"
                    );

                    return false;
                }

                debug(
                    "Token FCM warga berhasil disimpan.",
                    "success"
                );
            }

            return true;

        } finally {

            sinkronisasiBerjalan = false;
        }
    }

    // ==========================================
    // SIMPAN TOKEN
    // ==========================================

    async function simpanTokenFCM(token) {

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
            "FCM token diterima dan disimpan.",
            "success"
        );

        await sinkronkanDenganRetry();
    }

    // ==========================================
    // RETRY
    // ==========================================

    async function sinkronkanDenganRetry() {

        for (
            let i = 1;
            i <= FCM_RETRY_COUNT;
            i++
        ) {

            const berhasil =
                await sinkronkanTokenFCM();

            if (berhasil) {

                debug(
                    "Sinkronisasi FCM berhasil pada percobaan " +
                    i,
                    "success"
                );

                return true;
            }

            if (
                i < FCM_RETRY_COUNT
            ) {

                debug(
                    "Retry sinkronisasi " +
                    i +
                    "/" +
                    FCM_RETRY_COUNT,
                    "warn"
                );

                await tidur(
                    FCM_RETRY_DELAY
                );
            }
        }

        debug(
            "Sinkronisasi FCM belum berhasil setelah retry.",
            "error"
        );

        return false;
    }

    // ==========================================
    // PERMISSION ANDROID
    // ==========================================

    async function pastikanIzinNotifikasi() {

        if (!PushNotifications) {

            debug(
                "PushNotifications belum tersedia.",
                "error"
            );

            return false;
        }

        try {

            debug(
                "Memeriksa permission notifikasi Android..."
            );

            const permission =
                await PushNotifications
                    .checkPermissions();

            debug(
                "Status permission awal: " +
                (
                    permission?.receive ||
                    "unknown"
                )
            );

            if (
                permission?.receive ===
                "granted"
            ) {

                debug(
                    "Izin notifikasi sudah diberikan.",
                    "success"
                );

                return true;
            }

            if (
                permission?.receive ===
                "denied"
            ) {

                debug(
                    "Izin notifikasi saat ini DENIED. Android mungkin mengharuskan pengguna mengaktifkannya melalui Pengaturan.",
                    "warn"
                );
            }

            debug(
                "Memanggil requestPermissions()..."
            );

            const requested =
                await PushNotifications
                    .requestPermissions();

            debug(
                "Hasil request permission: " +
                (
                    requested?.receive ||
                    "unknown"
                )
            );

            if (
                requested?.receive ===
                "granted"
            ) {

                debug(
                    "Izin notifikasi berhasil diberikan.",
                    "success"
                );

                return true;
            }

            debug(
                "Izin notifikasi belum diberikan.",
                "error"
            );

            return false;

        } catch (e) {

            debug(
                "Error permission notifikasi: " +
                (e?.message || e),
                "error"
            );

            console.error(
                "[SIDAT FCM] Permission error:",
                e
            );

            return false;
        }
    }

    // ==========================================
    // CHANNEL
    // ==========================================

    async function buatNotificationChannel() {

        if (!PushNotifications) {
            return;
        }

        try {

            await PushNotifications
                .createChannel({

                    id: FCM_CHANNEL_ID,

                    name:
                        "Notifikasi SIDAT",

                    description:
                        "Notifikasi laporan dan pengumuman SIDAT",

                    importance: 5,

                    visibility: 1,

                    sound: "default",

                    vibration: true,

                    lights: true
                });

            debug(
                "Notification channel berhasil dibuat.",
                "success"
            );

        } catch (e) {

            debug(
                "Notification channel: " +
                (e?.message || e),
                "warn"
            );
        }
    }

    // ==========================================
    // DATA NOTIFIKASI
    // ==========================================

    function ambilDataNotifikasi(
        notification
    ) {

        const data =
            notification?.data || {};

        const role =
            ambilRoleLocal();

        const title =
            notification?.title ||
            data?.title ||
            "SIDAT";

        const body =
            notification?.body ||
            data?.body ||
            data?.message ||
            "Ada pemberitahuan baru.";

        const reportId =
            data?.report_id ||
            data?.reportId ||
            null;

        let url =
            data?.url ||
            data?.click_action ||
            data?.clickAction ||
            null;

        if (!url && reportId) {

            if (role === "admin") {

                url =
                    "/admin/admin-laporan.html?report_id=" +
                    encodeURIComponent(
                        reportId
                    );

            } else {

                url =
                    "/warga/laporan.html?report_id=" +
                    encodeURIComponent(
                        reportId
                    );
            }
        }

        if (!url) {

            url =
                role === "admin"
                    ? "/admin/pengumuman.html"
                    : "/warga/pengumuman.html";
        }

        return {
            title,
            body,
            reportId,
            url
        };
    }

    // ==========================================
    // POPUP FOREGROUND
    // ==========================================

    function tampilkanPopupFCM(
        title,
        body,
        reportId,
        url,
        role
    ) {

        try {

            const old =
                document.getElementById(
                    "sidat-fcm-foreground-popup"
                );

            if (old) {
                old.remove();
            }

            const overlay =
                document.createElement("div");

            overlay.id =
                "sidat-fcm-foreground-popup";

            Object.assign(
                overlay.style,
                {
                    position: "fixed",
                    inset: "0",
                    zIndex: "2147483646",
                    background:
                        "rgba(0,0,0,.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    boxSizing: "border-box"
                }
            );

            const box =
                document.createElement("div");

            Object.assign(
                box.style,
                {
                    width: "100%",
                    maxWidth: "420px",
                    background: "#fff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow:
                        "0 12px 40px rgba(0,0,0,.35)"
                }
            );

            const header =
                document.createElement("div");

            Object.assign(
                header.style,
                {
                    background: "#198754",
                    color: "#fff",
                    padding: "16px",
                    fontWeight: "700",
                    fontSize: "18px"
                }
            );

            header.textContent =
                title;

            const content =
                document.createElement("div");

            Object.assign(
                content.style,
                {
                    padding: "18px",
                    color: "#222"
                }
            );

            const message =
                document.createElement("div");

            message.style.whiteSpace =
                "pre-wrap";

            message.style.fontSize =
                "15px";

            message.style.lineHeight =
                "1.5";

            message.innerHTML =
                escapeHtmlFCM(body);

            const buttons =
                document.createElement("div");

            Object.assign(
                buttons.style,
                {
                    display: "flex",
                    gap: "10px",
                    marginTop: "18px"
                }
            );

            const lihat =
                document.createElement("button");

            Object.assign(
                lihat.style,
                {
                    flex: "1",
                    border: "0",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#198754",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "14px"
                }
            );

            lihat.textContent =
                reportId
                    ? "Lihat Laporan"
                    : "Lihat Pengumuman";

            lihat.addEventListener(
                "click",
                function () {

                    bukaURLNotifikasi(
                        url,
                        role,
                        reportId
                    );
                }
            );

            const tutup =
                document.createElement("button");

            Object.assign(
                tutup.style,
                {
                    flex: "1",
                    border: "1px solid #ccc",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#fff",
                    color: "#333",
                    fontWeight: "600",
                    fontSize: "14px"
                }
            );

            tutup.textContent =
                "Tutup";

            tutup.addEventListener(
                "click",
                function () {
                    overlay.remove();
                }
            );

            buttons.appendChild(
                lihat
            );

            buttons.appendChild(
                tutup
            );

            content.appendChild(
                message
            );

            content.appendChild(
                buttons
            );

            box.appendChild(
                header
            );

            box.appendChild(
                content
            );

            overlay.appendChild(
                box
            );

            document.body.appendChild(
                overlay
            );

            if (
                navigator.vibrate
            ) {

                navigator.vibrate([
                    200,
                    100,
                    200
                ]);
            }

            debug(
                "Popup foreground berhasil ditampilkan.",
                "success"
            );

        } catch (e) {

            debug(
                "Gagal menampilkan popup FCM: " +
                (e?.message || e),
                "error"
            );
        }
    }

    // ==========================================
    // NAVIGASI
    // ==========================================

    function bukaURLNotifikasi(
        url,
        role,
        reportId
    ) {

        let tujuan = url;

        if (!tujuan) {

            if (reportId) {

                if (role === "admin") {

                    tujuan =
                        "/admin/admin-laporan.html?report_id=" +
                        encodeURIComponent(
                            reportId
                        );

                } else {

                    tujuan =
                        "/warga/laporan.html?report_id=" +
                        encodeURIComponent(
                            reportId
                        );
                }

            } else {

                tujuan =
                    role === "admin"
                        ? "/admin/pengumuman.html"
                        : "/warga/pengumuman.html";
            }
        }

        debug(
            "Navigasi notifikasi -> " +
            tujuan,
            "success"
        );

        try {

            if (
                tujuan.startsWith(
                    "http://"
                ) ||
                tujuan.startsWith(
                    "https://"
                )
            ) {

                window.location.href =
                    tujuan;

                return;
            }

            if (
                !tujuan.startsWith("/")
            ) {

                tujuan =
                    "/" + tujuan;
            }

            window.location.href =
                window.location.origin +
                tujuan;

        } catch (e) {

            window.location.href =
                tujuan;
        }
    }

    // ==========================================
    // LISTENER
    // ==========================================

    async function pasangListener() {

        if (
            !PushNotifications ||
            listenersTerpasang
        ) {
            return;
        }

        try {

            await PushNotifications.addListener(
                "registration",
                async function (token) {

                    debug(
                        "EVENT registration diterima.",
                        "success"
                    );

                    const value =
                        token?.value ||
                        token?.token ||
                        "";

                    if (value) {

                        await simpanTokenFCM(
                            value
                        );

                    } else {

                        debug(
                            "EVENT registration tidak membawa token.",
                            "error"
                        );
                    }
                }
            );

            await PushNotifications.addListener(
                "registrationError",
                function (error) {

                    debug(
                        "FCM registration error: " +
                        JSON.stringify(
                            error
                        ),
                        "error"
                    );
                }
            );

            await PushNotifications.addListener(
                "pushNotificationReceived",
                function (notification) {

                    debug(
                        "EVENT pushNotificationReceived diterima.",
                        "success"
                    );

                    console.log(
                        "SIDAT FCM Notification:",
                        notification
                    );

                    const info =
                        ambilDataNotifikasi(
                            notification
                        );

                    const role =
                        ambilRoleLocal();

                    debug(
                        "FCM foreground: role=" +
                        role +
                        " report_id=" +
                        (
                            info.reportId ||
                            "none"
                        ),
                        "success"
                    );

                    tampilkanPopupFCM(
                        info.title,
                        info.body,
                        info.reportId,
                        info.url,
                        role
                    );
                }
            );

            await PushNotifications.addListener(
                "pushNotificationActionPerformed",
                function (event) {

                    debug(
                        "EVENT pushNotificationActionPerformed diterima.",
                        "success"
                    );

                    const info =
                        ambilDataNotifikasi(
                            event?.notification
                        );

                    bukaURLNotifikasi(
                        info.url,
                        ambilRoleLocal(),
                        info.reportId
                    );
                }
            );

            listenersTerpasang = true;

            debug(
                "Listener FCM berhasil dipasang.",
                "success"
            );

        } catch (e) {

            listenersTerpasang = false;

            debug(
                "Gagal memasang listener FCM: " +
                (e?.message || e),
                "error"
            );
        }
    }

    // ==========================================
    // REGISTER FCM
    // ==========================================

    async function registerFCM() {

        if (
            registerSedangBerjalan
        ) {

            debug(
                "Register FCM masih berjalan.",
                "warn"
            );

            return false;
        }

        registerSedangBerjalan = true;

        try {

            // Tunggu plugin benar-benar tersedia
            PushNotifications =
                await tungguPluginPush();

            if (!PushNotifications) {
                return false;
            }

            debug(
                "Plugin PushNotifications siap.",
                "success"
            );

            // Listener dipasang sebelum register
            await pasangListener();

            // ==========================================
            // PERMISSION SEBELUM REGISTER
            // ==========================================

            const izin =
                await pastikanIzinNotifikasi();

            if (!izin) {

                debug(
                    "Register FCM dihentikan karena permission belum diberikan.",
                    "error"
                );

                return false;
            }

            // ==========================================
            // CHANNEL
            // ==========================================

            await buatNotificationChannel();

            // ==========================================
            // REGISTER
            // ==========================================

            debug(
                "Memanggil PushNotifications.register()..."
            );

            await PushNotifications.register();

            debug(
                "PushNotifications.register() berhasil dipanggil.",
                "success"
            );

            // Beri waktu event registration masuk
            await tidur(1000);

            // ==========================================
            // TOKEN LAMA
            // ==========================================

            const tokenLama =
                localStorage.getItem(
                    FCM_STORAGE_KEY
                );

            if (tokenLama) {

                debug(
                    "Token FCM lokal ditemukan. Sinkronisasi...",
                    "success"
                );

                await sinkronkanDenganRetry();
            }

            return true;

        } catch (e) {

            debug(
                "Register FCM error: " +
                (e?.message || e),
                "error"
            );

            console.error(
                "[SIDAT FCM] Register error:",
                e
            );

            return false;

        } finally {

            registerSedangBerjalan =
                false;
        }
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    window.SIDATRegisterFCM =
        registerFCM;

    window.SIDATGetFCMToken =
        function () {

            return localStorage.getItem(
                FCM_STORAGE_KEY
            );
        };

    window.SIDATSinkronkanFCM =
        sinkronkanTokenFCM;

    window.SIDATSinkronkanFCMRetry =
        sinkronkanDenganRetry;

    // ==========================================
    // START
    // ==========================================

    async function mulaiFCM() {

        debug(
            "Memulai FCM Native FINAL V2..."
        );

        if (!window.Capacitor) {

            debug(
                "Capacitor tidak tersedia. FCM Native dilewati.",
                "warn"
            );

            return;
        }

        debug(
            "Capacitor terdeteksi.",
            "success"
        );

        // Tunggu WebView + Capacitor stabil
        await tidur(1000);

        const berhasil =
            await registerFCM();

        if (!berhasil) {

            debug(
                "Inisialisasi FCM belum berhasil. Retry 3 detik...",
                "warn"
            );

            setTimeout(
                function () {
                    registerFCM();
                },
                3000
            );
        }
    }

    // ==========================================
    // STARTUP
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                setTimeout(
                    mulaiFCM,
                    500
                );
            },
            {
                once: true
            }
        );

    } else {

        setTimeout(
            mulaiFCM,
            500
        );
    }

    // Retry sinkronisasi setelah aplikasi aktif
    setTimeout(
        function () {

            sinkronkanDenganRetry();

        },
        7000
    );

})();