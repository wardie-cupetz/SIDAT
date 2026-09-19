// ============================================================
// SIDAT - DASHBOARD KETUA RT
// ============================================================
// Fungsi:
// - Validasi login KETUA RT
// - Statistik Data Warga
// - Statistik Data KK
// - Saldo Kas
// - Saldo Jimpitan
// - Jimpitan belum diambil hari ini
// - Jumlah Laporan Warga
// - Aktivitas terbaru
// - Login tetap tersimpan
// - Tidak mengubah akun WARGA
// ============================================================

(() => {
    "use strict";

    console.log("[SIDAT] ketua-rt/dashboard.js aktif");

    // ========================================================
    // KONFIGURASI
    // ========================================================

    const ACCESS_TOKEN_KEY = "sidat_access_token";
    const KETUA_RT_USER_KEY = "sidat_ketua_rt_user";
    const WILAYAH_CACHE_KEY = "sidat_wilayah_ketua_rt";

    // Mengikuti js/supabase-config.js SIDAT
    const API_URL = SUPABASE_URL;
    const API_KEY = SUPABASE_KEY;

    // ========================================================
    // HELPER ELEMENT
    // ========================================================

    function el(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const node = el(id);

        if (node) {
            node.textContent = value;
        }
    }

    // ========================================================
    // FORMAT RUPIAH
    // ========================================================

    function formatRupiah(value) {
        const number = Number(value || 0);

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }

    // ========================================================
    // FORMAT TANGGAL
    // ========================================================

    function formatTanggal(value) {
        if (!value) {
            return "-";
        }

        try {
            return new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }).format(new Date(value));
        } catch {
            return "-";
        }
    }

    // ========================================================
    // TANGGAL HARI INI
    // ========================================================

    function getTodayLocal() {
        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // ========================================================
    // LOADING
    // ========================================================

    function showLoading(show) {
        const loading = el("loadingScreen");

        if (!loading) {
            return;
        }

        if (show) {
            loading.classList.remove("hidden");
            loading.style.display = "";
        } else {
            loading.classList.add("hidden");
            loading.style.display = "none";
        }
    }

    // ========================================================
    // ERROR
    // ========================================================

    function showError(message) {
        console.error(
            "[SIDAT] Dashboard error:",
            message
        );

        const errorBox =
            el("dashboardError");

        if (errorBox) {
            errorBox.textContent = message;
            errorBox.style.display = "block";
        }
    }

    // ========================================================
    // TOKEN
    // ========================================================

    function getAccessToken() {
        return localStorage.getItem(
            ACCESS_TOKEN_KEY
        );
    }

    // ========================================================
    // CLEAR SESSION
    // ========================================================

    function clearSession() {
        localStorage.removeItem(
            ACCESS_TOKEN_KEY
        );

        localStorage.removeItem(
            "sidat_refresh_token"
        );

        localStorage.removeItem(
            KETUA_RT_USER_KEY
        );

        window.location.href =
            "../index.html";
    }

    // ========================================================
    // CEK KONFIGURASI
    // ========================================================

    function validateConfig() {
        if (
            typeof SUPABASE_URL === "undefined" ||
            typeof SUPABASE_KEY === "undefined"
        ) {
            throw new Error(
                "Supabase config belum dimuat. Pastikan ../js/supabase-config.js dipanggil sebelum dashboard.js."
            );
        }

        if (
            !SUPABASE_URL ||
            !SUPABASE_KEY
        ) {
            throw new Error(
                "SUPABASE_URL atau SUPABASE_KEY kosong."
            );
        }

        console.log(
            "[SIDAT] Supabase config berhasil ditemukan."
        );
    }

    // ========================================================
    // SUPABASE FETCH
    // ========================================================

    async function supabaseFetch(
        path,
        options = {}
    ) {
        const token =
            getAccessToken();

        if (!token) {
            throw new Error(
                "Sesi login tidak ditemukan."
            );
        }

        const headers = {
            apikey: API_KEY,
            Authorization:
                `Bearer ${token}`,
            "Content-Type":
                "application/json",
            ...(options.headers || {})
        };

        const response =
            await fetch(
                `${API_URL}${path}`,
                {
                    ...options,
                    headers
                }
            );

        if (
            response.status === 401
        ) {
            clearSession();

            throw new Error(
                "Sesi login telah berakhir."
            );
        }

        const text =
            await response.text();

        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        }

        if (!response.ok) {
            const message =
                data?.message ||
                data?.error_description ||
                data?.hint ||
                data?.details ||
                data?.error ||
                `HTTP ${response.status}`;

            throw new Error(message);
        }

        return data;
    }

    // ========================================================
    // SUPABASE RPC
    // ========================================================

    async function supabaseRpc(
        functionName,
        params = {}
    ) {
        return supabaseFetch(
            `/rest/v1/rpc/${functionName}`,
            {
                method: "POST",
                body: JSON.stringify(params)
            }
        );
    }

    // ========================================================
    // LOAD AUTH USER
    // ========================================================

    async function loadAuthUser() {
        const user =
            await supabaseFetch(
                "/auth/v1/user"
            );

        if (
            !user ||
            !user.id
        ) {
            throw new Error(
                "Data pengguna tidak ditemukan."
            );
        }

        return user;
    }

    // ========================================================
    // LOAD PROFIL KETUA RT
    // ========================================================

    async function loadProfilKetuaRT(
        user
    ) {
        const profiles =
            await supabaseFetch(
                `/rest/v1/profiles?select=id,user_id,role,resident_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`
            );

        const profile =
            Array.isArray(profiles)
                ? profiles[0]
                : null;

        if (!profile) {
            throw new Error(
                "Profil KETUA RT tidak ditemukan."
            );
        }

        if (
            profile.role !==
            "ketua_rt"
        ) {
            throw new Error(
                `Akun ini memiliki role "${profile.role}", bukan KETUA RT.`
            );
        }

        let resident = null;

        if (profile.resident_id) {
            try {
                const residents =
                    await supabaseFetch(
                        `/rest/v1/residents?select=*&id=eq.${encodeURIComponent(profile.resident_id)}&limit=1`
                    );

                if (
                    Array.isArray(
                        residents
                    )
                ) {
                    resident =
                        residents[0] ||
                        null;
                }
            } catch (error) {
                console.warn(
                    "[SIDAT] Data resident KETUA RT tidak dapat dimuat:",
                    error.message
                );
            }
        }

        const displayName =
            resident?.name ||
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            "Ketua RT";

        const displayPhoto =
            resident?.photo_url ||
            resident?.photo ||
            user.user_metadata?.avatar_url ||
            "";

        // Nama
        setText(
            "adminName",
            displayName
        );

        setText(
            "ketuaRTName",
            displayName
        );

        setText(
            "profileName",
            displayName
        );

        // Email
        const emailElement =
            el("profileEmail");

        if (emailElement) {
            emailElement.textContent =
                user.email || "-";
        }

        // Foto
        if (displayPhoto) {
            document
                .querySelectorAll(
                    "#profilePhoto, .profile-photo, .avatar-image"
                )
                .forEach(
                    (image) => {
                        image.src =
                            displayPhoto;

                        image.style.display =
                            "";
                    }
                );
        }

        // Simpan informasi user
        const userData = {
            user_id: user.id,
            email:
                user.email || "",
            role:
                profile.role,
            resident_id:
                profile.resident_id ||
                null,
            name:
                displayName
        };

        localStorage.setItem(
            KETUA_RT_USER_KEY,
            JSON.stringify(
                userData
            )
        );

        console.log(
            "[SIDAT] Profil KETUA RT berhasil dimuat."
        );

        return {
            user,
            profile,
            resident
        };
    }

    // ========================================================
    // LOAD WILAYAH
    // ========================================================

    async function loadWilayah() {
        let wilayah = null;

        // ----------------------------------------------------
        // PRIORITAS 1: TABLE WILAYAH
        // ----------------------------------------------------

        try {
            const result =
                await supabaseFetch(
                    "/rest/v1/wilayah?select=*&limit=1"
                );

            if (
                Array.isArray(result) &&
                result.length > 0
            ) {
                wilayah = result[0];
            }
        } catch (error) {
            console.warn(
                "[SIDAT] Table wilayah gagal:",
                error.message
            );
        }

        // ----------------------------------------------------
        // PRIORITAS 2: TABLE SETTINGS
        // ----------------------------------------------------

        if (!wilayah) {
            try {
                const result =
                    await supabaseFetch(
                        "/rest/v1/settings?select=*&limit=1"
                    );

                if (
                    Array.isArray(result) &&
                    result.length > 0
                ) {
                    wilayah = result[0];
                }
            } catch (error) {
                console.warn(
                    "[SIDAT] Table settings gagal:",
                    error.message
                );
            }
        }

        // ----------------------------------------------------
        // PRIORITAS 3: CACHE
        // ----------------------------------------------------

        if (!wilayah) {
            const cached =
                localStorage.getItem(
                    WILAYAH_CACHE_KEY
                );

            if (cached) {
                try {
                    wilayah =
                        JSON.parse(
                            cached
                        );
                } catch {
                    wilayah = null;
                }
            }
        }

        if (!wilayah) {
            console.warn(
                "[SIDAT] Data wilayah tidak ditemukan."
            );

            return null;
        }

        localStorage.setItem(
            WILAYAH_CACHE_KEY,
            JSON.stringify(
                wilayah
            )
        );

        // ----------------------------------------------------
        // NORMALISASI DATA
        // ----------------------------------------------------

        const dusun =
            wilayah.dusun ||
            wilayah.nama_dusun ||
            "Morangan";

        const desa =
            wilayah.desa ||
            wilayah.nama_desa ||
            "Karanganom";

        const rt =
            wilayah.rt ||
            wilayah.nama_rt ||
            "03";

        const rw =
            wilayah.rw ||
            wilayah.nama_rw ||
            "02";

        const kecamatan =
            wilayah.kecamatan ||
            wilayah.nama_kecamatan ||
            "Klaten Utara";

        const kabupaten =
            wilayah.kabupaten ||
            wilayah.nama_kabupaten ||
            "Klaten";

        const provinsi =
            wilayah.provinsi ||
            wilayah.nama_provinsi ||
            "Jawa Tengah";

        // ----------------------------------------------------
        // TAMPILKAN
        // ----------------------------------------------------

        setText(
            "regionDusun",
            `Dusun ${dusun}`
        );

        setText(
            "regionDesa",
            `Desa ${desa}`
        );

        setText(
            "regionRTRW",
            `RT ${rt} / RW ${rw}`
        );

        setText(
            "regionKecamatan",
            kecamatan
        );

        setText(
            "regionKabupaten",
            kabupaten
        );

        setText(
            "regionProvinsi",
            provinsi
        );

        // ----------------------------------------------------
        // LOGO
        // ----------------------------------------------------

        const logoUrl =
            wilayah.logo_url ||
            wilayah.logo ||
            "";

        if (logoUrl) {
            document
                .querySelectorAll(
                    "#wilayahLogo, .wilayah-logo"
                )
                .forEach(
                    (img) => {
                        img.src =
                            logoUrl;

                        img.style.display =
                            "";
                    }
                );
        }

        console.log(
            "[SIDAT] Data wilayah berhasil dimuat."
        );

        return wilayah;
    }

    // ========================================================
    // STATISTIK WARGA
    // ========================================================

    async function loadStatistikWarga() {
        try {
            const result =
                await supabaseRpc(
                    "get_resident_statistics"
                );

            let data =
                result;

            if (
                Array.isArray(
                    result
                )
            ) {
                data =
                    result[0] ||
                    {};
            }

            const totalWarga =
                Number(
                    data?.total_warga ??
                    data?.total_residents ??
                    data?.warga ??
                    0
                );

            const totalKK =
                Number(
                    data?.total_kk ??
                    data?.total_households ??
                    data?.kk ??
                    0
                );

            setText(
                "totalWarga",
                totalWarga.toLocaleString(
                    "id-ID"
                )
            );

            setText(
                "totalKK",
                totalKK.toLocaleString(
                    "id-ID"
                )
            );

            return {
                totalWarga,
                totalKK
            };
        } catch (error) {
            console.error(
                "[SIDAT] Statistik warga gagal:",
                error
            );

            setText(
                "totalWarga",
                "0"
            );

            setText(
                "totalKK",
                "0"
            );

            return {
                totalWarga: 0,
                totalKK: 0
            };
        }
    }

    // ========================================================
    // SALDO KAS
    // ========================================================

    async function loadSaldoKas() {
        try {
            const transactions =
                await supabaseFetch(
                    "/rest/v1/cash_transactions?select=transaction_type,amount,created_at&order=created_at.desc"
                );

            let saldo = 0;

            if (
                Array.isArray(
                    transactions
                )
            ) {
                transactions.forEach(
                    (transaction) => {
                        const amount =
                            Number(
                                transaction.amount
                            ) || 0;

                        const type =
                            String(
                                transaction.transaction_type ||
                                ""
                            ).toLowerCase();

                        if (
                            type ===
                                "masuk" ||
                            type ===
                                "income" ||
                            type ===
                                "pemasukan" ||
                            type ===
                                "jimpitan_transfer"
                        ) {
                            saldo +=
                                amount;
                        } else if (
                            type ===
                                "keluar" ||
                            type ===
                                "expense" ||
                            type ===
                                "pengeluaran"
                        ) {
                            saldo -=
                                amount;
                        }
                    }
                );
            }

            setText(
                "saldoKas",
                formatRupiah(
                    saldo
                )
            );

            return saldo;
        } catch (error) {
            console.error(
                "[SIDAT] Saldo kas gagal:",
                error
            );

            setText(
                "saldoKas",
                formatRupiah(
                    0
                )
            );

            return 0;
        }
    }

    // ========================================================
    // SALDO JIMPITAN
    // ========================================================

    async function loadSaldoJimpitan() {
        try {
            const result =
                await supabaseRpc(
                    "get_jimpitan_balance"
                );

            let balance =
                result;

            if (
                Array.isArray(
                    result
                )
            ) {
                balance =
                    result[0];
            }

            let saldo = 0;

            if (
                typeof balance ===
                "number"
            ) {
                saldo =
                    balance;
            } else if (
                typeof balance ===
                "string"
            ) {
                saldo =
                    Number(
                        balance
                    ) || 0;
            } else if (
                balance &&
                typeof balance ===
                    "object"
            ) {
                saldo =
                    Number(
                        balance.balance ??
                        balance.saldo ??
                        balance.total ??
                        balance.amount ??
                        0
                    ) || 0;
            }

            setText(
                "saldoJimpitan",
                formatRupiah(
                    saldo
                )
            );

            return saldo;
        } catch (error) {
            console.error(
                "[SIDAT] Saldo jimpitan gagal:",
                error
            );

            setText(
                "saldoJimpitan",
                formatRupiah(
                    0
                )
            );

            return 0;
        }
    }

    // ========================================================
    // JIMPITAN BELUM DIAMBIL HARI INI
    // ========================================================

    async function loadJimpitanBelumDiambil() {
        const card =
            el(
                "cardJimpitanBelumDiambil"
            );

        const value =
            el(
                "jimpitanBelumDiambil"
            );

        try {
            const today =
                getTodayLocal();

            console.log(
                "[SIDAT] Memuat monitoring jimpitan:",
                today
            );

            const result =
                await supabaseRpc(
                    "get_jimpitan_monitoring",
                    {
                        p_date:
                            today
                    }
                );

            const rows =
                Array.isArray(
                    result
                )
                    ? result
                    : [];

            let belumDiambil =
                0;

            rows.forEach(
                (row) => {
                    const sudahDiambil =
                        row?.sudah_diambil ??
                        row?.taken ??
                        row?.is_taken ??
                        row?.picked_up ??
                        row?.sudahDiambil ??
                        false;

                    if (
                        !Boolean(
                            sudahDiambil
                        )
                    ) {
                        belumDiambil++;
                    }
                }
            );

            if (value) {
                value.textContent =
                    belumDiambil.toLocaleString(
                        "id-ID"
                    );
            }

            if (card) {
                card.style.display =
                    "";
            }

            console.log(
                "[SIDAT] Jimpitan belum diambil:",
                belumDiambil
            );

            return belumDiambil;
        } catch (error) {
            console.error(
                "[SIDAT] Monitoring jimpitan gagal:",
                error
            );

            if (value) {
                value.textContent =
                    "0";
            }

            if (card) {
                card.style.display =
                    "";
            }

            return 0;
        }
    }

    // ========================================================
    // JUMLAH LAPORAN WARGA
    // ========================================================

    async function loadJumlahLaporan() {
        try {
            const reports =
                await supabaseFetch(
                    "/rest/v1/reports?select=id"
                );

            const jumlah =
                Array.isArray(
                    reports
                )
                    ? reports.length
                    : 0;

            setText(
                "jumlahLaporan",
                jumlah.toLocaleString(
                    "id-ID"
                )
            );

            setText(
                "totalLaporan",
                jumlah.toLocaleString(
                    "id-ID"
                )
            );

            return jumlah;
        } catch (error) {
            console.error(
                "[SIDAT] Jumlah laporan gagal:",
                error
            );

            setText(
                "jumlahLaporan",
                "0"
            );

            setText(
                "totalLaporan",
                "0"
            );

            return 0;
        }
    }

    // ========================================================
    // AKTIVITAS TERBARU
    // ========================================================

    async function loadLogAktivitas() {
        const list =
            el(
                "activityList"
            );

        if (!list) {
            return;
        }

        try {
            const notifications =
                await supabaseFetch(
                    "/rest/v1/notifications?select=id,title,message,created_by,created_at,target_type&order=created_at.desc&limit=5"
                );

            if (
                !Array.isArray(
                    notifications
                ) ||
                notifications.length ===
                    0
            ) {
                list.innerHTML = `
                    <div class="empty-state">
                        Belum ada aktivitas terbaru.
                    </div>
                `;

                return;
            }

            list.innerHTML =
                notifications
                    .map(
                        (item) => {
                            const title =
                                item.title ||
                                "Aktivitas SIDAT";

                            const message =
                                item.message ||
                                "";

                            const date =
                                formatTanggal(
                                    item.created_at
                                );

                            return `
                                <div class="activity-item">

                                    <div class="activity-icon">
                                        🔔
                                    </div>

                                    <div class="activity-content">

                                        <div class="activity-title">
                                            ${escapeHtml(title)}
                                        </div>

                                        <div class="activity-message">
                                            ${escapeHtml(message)}
                                        </div>

                                        <div class="activity-date">
                                            ${escapeHtml(date)}
                                        </div>

                                    </div>

                                </div>
                            `;
                        }
                    )
                    .join("");
        } catch (error) {
            console.error(
                "[SIDAT] Aktivitas gagal:",
                error
            );

            list.innerHTML = `
                <div class="empty-state">
                    Aktivitas belum dapat dimuat.
                </div>
            `;
        }
    }

    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHtml(value) {
        return String(
            value ?? ""
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

    // ========================================================
    // ROUTE 4 MENU KETUA RT
    // ========================================================

    const ROUTES = {
        "data-warga":
            "../admin/data-warga.html",

        "akun-warga":
            "../admin/data-warga.html",

        "jimpitan":
            "../warga/riwayat-jimpitan.html",

        "generate-qr":
            "../admin/generate-qr.html",

        "laporan":
            "../admin/admin-laporan.html",

        "laporan-warga":
            "../admin/admin-laporan.html"
    };

    // ========================================================
    // SETUP ROUTE
    // ========================================================

    function setupRoutes() {
        document.addEventListener(
            "click",
            (event) => {
                const item =
                    event.target.closest(
                        "[data-route]"
                    );

                if (!item) {
                    return;
                }

                const route =
                    String(
                        item.getAttribute(
                            "data-route"
                        ) || ""
                    ).toLowerCase();

                const target =
                    ROUTES[route];

                if (!target) {
                    return;
                }

                event.preventDefault();

                window.location.href =
                    target;
            }
        );
    }

    // ========================================================
    // PROFILE ROUTE
    // ========================================================

    function setupProfileRoutes() {
        document.addEventListener(
            "click",
            (event) => {
                const profile =
                    event.target.closest(
                        "[data-profile]"
                    );

                if (!profile) {
                    return;
                }

                event.preventDefault();

                window.location.href =
                    "../admin/profil.html";
            }
        );
    }

    // ========================================================
    // DISABLE MENU YANG BUKAN MILIK KETUA RT
    // ========================================================

    function disableForbiddenRoutes() {
        document.addEventListener(
            "click",
            (event) => {
                const item =
                    event.target.closest(
                        "[data-route]"
                    );

                if (!item) {
                    return;
                }

                const route =
                    String(
                        item.getAttribute(
                            "data-route"
                        ) || ""
                    ).toLowerCase();

                const forbidden = [
                    "pengaturan",
                    "settings",
                    "backup",

                    // Menu yang secara visual
                    // sudah tersedia melalui
                    // akun WARGA Ketua RT.
                    "data-kk",
                    "kas",
                    "arus-kas",
                    "agenda",
                    "notula"
                ];

                if (
                    forbidden.includes(
                        route
                    )
                ) {
                    event.preventDefault();

                    console.warn(
                        "[SIDAT] Menu tidak tersedia untuk KETUA RT:",
                        route
                    );
                }
            },
            true
        );
    }

    // ========================================================
    // LOGOUT
    // ========================================================

    function setupLogout() {
        document.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-logout], #logoutButton, #btnLogout"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();

                const confirmLogout =
                    window.confirm(
                        "Apakah Anda yakin ingin keluar dari akun KETUA RT?"
                    );

                if (!confirmLogout) {
                    return;
                }

                clearSession();
            }
        );
    }

    // ========================================================
    // BACK BUTTON
    // ========================================================

    function setupBackProtection() {
        let backPressed =
            false;

        window.addEventListener(
            "popstate",
            () => {
                if (
                    backPressed
                ) {
                    return;
                }

                backPressed =
                    true;

                const closeApp =
                    window.confirm(
                        "Apakah Anda ingin menutup aplikasi SIDAT?"
                    );

                if (closeApp) {
                    try {
                        if (
                            window.Capacitor &&
                            window.Capacitor.Plugins &&
                            window.Capacitor.Plugins.App
                        ) {
                            window.Capacitor
                                .Plugins
                                .App
                                .exitApp();

                            return;
                        }
                    } catch (
                        error
                    ) {
                        console.warn(
                            "[SIDAT] exitApp gagal:",
                            error
                        );
                    }
                }

                try {
                    history.pushState(
                        null,
                        "",
                        window.location.href
                    );
                } catch {
                    // abaikan
                }

                setTimeout(
                    () => {
                        backPressed =
                            false;
                    },
                    300
                );
            }
        );

        try {
            history.pushState(
                null,
                "",
                window.location.href
            );
        } catch {
            // abaikan
        }
    }

    // ========================================================
    // PREPARE DASHBOARD
    // ========================================================

    function prepareDashboard() {
        const card =
            el(
                "cardJimpitanBelumDiambil"
            );

        if (card) {
            card.style.display =
                "";
        }

        setText(
            "jumlahLaporan",
            "0"
        );

        setText(
            "totalLaporan",
            "0"
        );
    }

    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    async function loadDashboard() {
        showLoading(true);

        try {
            // ------------------------------------------------
            // TOKEN
            // ------------------------------------------------

            const token =
                getAccessToken();

            if (!token) {
                window.location.href =
                    "../index.html";

                return;
            }

            // ------------------------------------------------
            // CONFIG
            // ------------------------------------------------

            validateConfig();

            prepareDashboard();

            // ------------------------------------------------
            // USER
            // ------------------------------------------------

            const user =
                await loadAuthUser();

            // ------------------------------------------------
            // PROFIL
            // ------------------------------------------------

            await loadProfilKetuaRT(
                user
            );

            // ------------------------------------------------
            // WILAYAH
            // ------------------------------------------------

            await loadWilayah();

            // ------------------------------------------------
            // DATA DASHBOARD
            // ------------------------------------------------

            await Promise.all([
                loadStatistikWarga(),
                loadSaldoKas(),
                loadSaldoJimpitan(),
                loadJimpitanBelumDiambil(),
                loadJumlahLaporan(),
                loadLogAktivitas()
            ]);

            console.log(
                "[SIDAT] Dashboard KETUA RT berhasil dimuat."
            );
        } catch (error) {
            console.error(
                "[SIDAT] Gagal memuat dashboard:",
                error
            );

            showError(
                error?.message ||
                "Dashboard gagal dimuat."
            );

            const message =
                String(
                    error?.message ||
                    ""
                ).toLowerCase();

            if (
                message.includes(
                    "sesi"
                ) ||
                message.includes(
                    "login"
                ) ||
                message.includes(
                    "token"
                )
            ) {
                setTimeout(
                    () => {
                        clearSession();
                    },
                    1500
                );
            }
        } finally {
            showLoading(false);
        }
    }

    // ========================================================
    // INIT
    // ========================================================

    function init() {
        console.log(
            "[SIDAT] Inisialisasi dashboard KETUA RT..."
        );

        setupRoutes();
        setupProfileRoutes();
        disableForbiddenRoutes();
        setupLogout();
        setupBackProtection();

        loadDashboard();
    }

    // ========================================================
    // DOM READY
    // ========================================================

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();