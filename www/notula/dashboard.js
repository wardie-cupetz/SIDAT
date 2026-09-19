/* =========================================================
   SIDAT
   DASHBOARD NOTULA
   ========================================================= */

(() => {
    "use strict";

    if (window.__SIDAT_NOTULA_DASHBOARD_INITIALIZED__) {
        return;
    }

    window.__SIDAT_NOTULA_DASHBOARD_INITIALIZED__ = true;

    /* =====================================================
       KONFIGURASI
       ===================================================== */

    const ACCESS_TOKEN_KEY = "sidat_access_token";
    const ROLE = "notula";

    let supabaseClient = null;
    let currentUser = null;
    let currentProfile = null;

    /* =====================================================
       SUPABASE CLIENT
       ===================================================== */

    function getSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (
            window.supabase &&
            typeof window.supabase.createClient === "function" &&
            typeof window.SUPABASE_URL === "string" &&
            typeof window.SUPABASE_KEY === "string"
        ) {
            window.supabaseClient =
                window.supabase.createClient(
                    window.SUPABASE_URL,
                    window.SUPABASE_KEY
                );

            return window.supabaseClient;
        }

        throw new Error(
            "Supabase client belum tersedia."
        );
    }

    /* =====================================================
       LOADING
       ===================================================== */

    function showLoading() {
        const loading =
            document.getElementById("loadingScreen");

        if (loading) {
            loading.classList.remove("hidden");
        }
    }

    function hideLoading() {
        const loading =
            document.getElementById("loadingScreen");

        if (loading) {
            loading.classList.add("hidden");
        }
    }

    /* =====================================================
       SESSION
       ===================================================== */

    async function loadSession() {
        supabaseClient =
            getSupabaseClient();

        let session = null;
        let user = null;

        try {
            const result =
                await supabaseClient.auth.getSession();

            session =
                result?.data?.session || null;

            user =
                session?.user || null;
        } catch (error) {
            console.warn(
                "Gagal mengambil session Supabase:",
                error
            );
        }

        /*
         * Fallback token SIDAT.
         */
        if (!user) {
            const accessToken =
                localStorage.getItem(
                    ACCESS_TOKEN_KEY
                );

            if (accessToken) {
                try {
                    const result =
                        await supabaseClient.auth.getUser(
                            accessToken
                        );

                    user =
                        result?.data?.user || null;
                } catch (error) {
                    console.warn(
                        "Token SIDAT tidak dapat digunakan:",
                        error
                    );
                }
            }
        }

        if (!user) {
            window.location.replace(
                "../index.html"
            );

            return null;
        }

        currentUser = user;

        if (session?.access_token) {
            localStorage.setItem(
                ACCESS_TOKEN_KEY,
                session.access_token
            );
        }

        return user;
    }

    /* =====================================================
       VALIDASI ROLE
       ===================================================== */

    async function validateRole(user) {
        if (!user) {
            throw new Error(
                "User tidak ditemukan."
            );
        }

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select(
                    "role,resident_id"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .single();

        if (error) {
            console.error(
                "Gagal membaca profile:",
                error
            );

            throw new Error(
                "Profil pengguna tidak dapat dibaca."
            );
        }

        if (!data) {
            throw new Error(
                "Profil pengguna belum tersedia."
            );
        }

        currentProfile = data;

        if (data.role !== ROLE) {
            console.warn(
                "Role tidak sesuai:",
                data.role
            );

            window.location.replace(
                "../index.html"
            );

            return false;
        }

        return true;
    }

    /* =====================================================
       PROFIL NOTULA
       ===================================================== */

    async function loadProfilNotula(
        user,
        profile
    ) {
        let nama =
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.user_metadata?.nama ||
            "Notula";

        const email =
            user?.email || "";

        /*
         * Jika akun mempunyai resident_id,
         * gunakan nama resident.
         */
        if (profile?.resident_id) {
            try {
                const { data, error } =
                    await supabaseClient
                        .from("residents")
                        .select("name")
                        .eq(
                            "id",
                            profile.resident_id
                        )
                        .maybeSingle();

                if (
                    !error &&
                    data?.name
                ) {
                    nama = data.name;
                }
            } catch (error) {
                console.warn(
                    "Gagal mengambil nama resident:",
                    error
                );
            }
        }

        setText(
            "namaNotula",
            nama
        );

        setText(
            "notulaName",
            nama
        );

        setText(
            "profileName",
            nama
        );

        setText(
            "profileEmail",
            email
        );
    }

    /* =====================================================
       WILAYAH
       ===================================================== */

    async function loadWilayah() {
        let wilayah = null;

        try {
            const { data, error } =
                await supabaseClient
                    .from("settings")
                    .select("*")
                    .limit(1)
                    .maybeSingle();

            if (
                !error &&
                data
            ) {
                wilayah = data;
            }
        } catch (error) {
            console.warn(
                "Gagal membaca settings:",
                error
            );
        }

        /*
         * Fallback cache lokal.
         */
        if (!wilayah) {
            try {
                const cached =
                    localStorage.getItem(
                        "sidat_wilayah_notula"
                    );

                if (cached) {
                    wilayah =
                        JSON.parse(cached);
                }
            } catch (error) {
                console.warn(
                    "Cache wilayah tidak valid:",
                    error
                );
            }
        }

        /*
         * Default SIDAT.
         */
        if (!wilayah) {
            wilayah = {
                dusun: "Morangan",
                desa: "Karanganom",
                rt: "03",
                rw: "02",
                kecamatan: "Klaten Utara",
                kabupaten: "Klaten",
                provinsi: "Jawa Tengah"
            };
        }

        setWilayahFromObject(
            wilayah
        );

        try {
            localStorage.setItem(
                "sidat_wilayah_notula",
                JSON.stringify(wilayah)
            );
        } catch (error) {
            console.warn(
                "Gagal menyimpan cache wilayah:",
                error
            );
        }
    }

    function setWilayahFromObject(
        data
    ) {
        if (!data) {
            return;
        }

        const dusun =
            data.dusun ??
            data.nama_dusun ??
            "";

        const desa =
            data.desa ??
            data.nama_desa ??
            "";

        const rt =
            data.rt ??
            data.nomor_rt ??
            "03";

        const rw =
            data.rw ??
            data.nomor_rw ??
            "02";

        const kecamatan =
            data.kecamatan ??
            data.nama_kecamatan ??
            "";

        const kabupaten =
            data.kabupaten ??
            data.kabupaten_kota ??
            data.kota ??
            "";

        const provinsi =
            data.provinsi ??
            data.nama_provinsi ??
            "";

        setText(
            "regionDusun",
            dusun
        );

        setText(
            "regionDesa",
            desa
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
    }

    /* =====================================================
       STATISTIK AGENDA
       ===================================================== */

    async function loadStatistikAgenda() {
        const today =
            new Date()
                .toISOString()
                .slice(0, 10);

        try {
            const { count, error } =
                await supabaseClient
                    .from("agendas")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .gte(
                        "event_date",
                        today
                    )
                    .neq(
                        "status",
                        "cancelled"
                    );

            if (error) {
                console.warn(
                    "Gagal membaca statistik agenda:",
                    error
                );

                setText(
                    "jumlahAgenda",
                    "0"
                );

                return;
            }

            setText(
                "jumlahAgenda",
                Number(
                    count || 0
                ).toLocaleString(
                    "id-ID"
                )
            );
        } catch (error) {
            console.warn(
                "Error statistik agenda:",
                error
            );

            setText(
                "jumlahAgenda",
                "0"
            );
        }
    }

    /* =====================================================
       STATISTIK NOTULA
       ===================================================== */

    async function loadStatistikNotula() {
        try {
            const { count, error } =
                await supabaseClient
                    .from("meeting_minutes")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    );

            if (error) {
                console.warn(
                    "Gagal membaca statistik notula:",
                    error
                );

                setText(
                    "jumlahNotula",
                    "0"
                );

                return;
            }

            setText(
                "jumlahNotula",
                Number(
                    count || 0
                ).toLocaleString(
                    "id-ID"
                )
            );
        } catch (error) {
            console.warn(
                "Error statistik notula:",
                error
            );

            setText(
                "jumlahNotula",
                "0"
            );
        }
    }

    /* =====================================================
       STATISTIK PENGUMUMAN
       ===================================================== */

    async function loadStatistikPengumuman() {
        try {
            const { count, error } =
                await supabaseClient
                    .from("announcements")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .eq(
                        "is_active",
                        true
                    );

            if (error) {
                console.warn(
                    "Gagal membaca statistik pengumuman:",
                    error
                );

                setText(
                    "jumlahPengumuman",
                    "0"
                );

                return;
            }

            setText(
                "jumlahPengumuman",
                Number(
                    count || 0
                ).toLocaleString(
                    "id-ID"
                )
            );
        } catch (error) {
            console.warn(
                "Error statistik pengumuman:",
                error
            );

            setText(
                "jumlahPengumuman",
                "0"
            );
        }
    }

    /* =====================================================
       STATISTIK ABSENSI
       ===================================================== */

    async function loadStatistikAbsensi() {
        try {
            const { count, error } =
                await supabaseClient
                    .from("meeting_attendees")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    );

            if (error) {
                console.warn(
                    "Gagal membaca statistik absensi:",
                    error
                );

                setText(
                    "jumlahAbsensi",
                    "0"
                );

                return;
            }

            setText(
                "jumlahAbsensi",
                Number(
                    count || 0
                ).toLocaleString(
                    "id-ID"
                )
            );
        } catch (error) {
            console.warn(
                "Error statistik absensi:",
                error
            );

            setText(
                "jumlahAbsensi",
                "0"
            );
        }
    }

    /* =====================================================
       AGENDA TERDEKAT
       ===================================================== */

    async function loadAgendaTerdekat() {
        const today =
            new Date()
                .toISOString()
                .slice(0, 10);

        try {
            const { data, error } =
                await supabaseClient
                    .from("agendas")
                    .select(
                        "id,title,type,event_date,start_time,end_time,location,status"
                    )
                    .gte(
                        "event_date",
                        today
                    )
                    .neq(
                        "status",
                        "cancelled"
                    )
                    .order(
                        "event_date",
                        {
                            ascending: true
                        }
                    )
                    .order(
                        "start_time",
                        {
                            ascending: true
                        }
                    )
                    .limit(5);

            if (error) {
                console.warn(
                    "Gagal membaca agenda terdekat:",
                    error
                );

                return;
            }

            const list =
                document.getElementById(
                    "activityList"
                );

            if (!list) {
                return;
            }

            if (
                !Array.isArray(data) ||
                data.length === 0
            ) {
                return;
            }

            list.innerHTML =
                data
                    .map(
                        agenda => {
                            const title =
                                escapeHtml(
                                    agenda.title ||
                                    "Agenda"
                                );

                            const date =
                                formatDate(
                                    agenda.event_date
                                );

                            const time =
                                formatTime(
                                    agenda.start_time
                                );

                            const location =
                                escapeHtml(
                                    agenda.location ||
                                    ""
                                );

                            return `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            aria-hidden="true"
                                        >
                                            <rect
                                                x="3"
                                                y="4"
                                                width="18"
                                                height="18"
                                                rx="2"
                                            ></rect>

                                            <line
                                                x1="16"
                                                y1="2"
                                                x2="16"
                                                y2="6"
                                            ></line>

                                            <line
                                                x1="8"
                                                y1="2"
                                                x2="8"
                                                y2="6"
                                            ></line>

                                            <line
                                                x1="3"
                                                y1="10"
                                                x2="21"
                                                y2="10"
                                            ></line>
                                        </svg>
                                    </div>

                                    <div class="activity-content">
                                        <div class="activity-title">
                                            ${title}
                                        </div>

                                        <div class="activity-message">
                                            ${date}
                                            ${
                                                time
                                                    ? ` • ${time}`
                                                    : ""
                                            }
                                            ${
                                                location
                                                    ? ` • ${location}`
                                                    : ""
                                            }
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    )
                    .join("");

        } catch (error) {
            console.warn(
                "Error agenda terdekat:",
                error
            );
        }
    }

    /* =====================================================
       NOTULA TERBARU
       ===================================================== */

    async function loadNotulaTerbaru() {
        try {
            const { data, error } =
                await supabaseClient
                    .from("meeting_minutes")
                    .select(
                        "id,title,meeting_type,meeting_date,start_time,status"
                    )
                    .order(
                        "meeting_date",
                        {
                            ascending: false
                        }
                    )
                    .order(
                        "start_time",
                        {
                            ascending: false
                        }
                    )
                    .limit(5);

            if (error) {
                console.warn(
                    "Gagal membaca notula terbaru:",
                    error
                );

                return;
            }

            /*
             * Fungsi ini sengaja tidak langsung
             * mengganti activityList.
             *
             * Struktur HTML dashboard saat ini
             * hanya menyediakan satu area aktivitas.
             */
        } catch (error) {
            console.warn(
                "Error notula terbaru:",
                error
            );
        }
    }

    /* =====================================================
       PENGUMUMAN TERBARU
       ===================================================== */

    async function loadPengumumanTerbaru() {
        try {
            const { data, error } =
                await supabaseClient
                    .from("announcements")
                    .select(
                        "id,title,type,is_active,created_at"
                    )
                    .eq(
                        "is_active",
                        true
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(5);

            if (error) {
                console.warn(
                    "Gagal membaca pengumuman terbaru:",
                    error
                );

                return;
            }

            /*
             * Data tersedia untuk pengembangan
             * aktivitas dashboard berikutnya.
             */
            return data || [];
        } catch (error) {
            console.warn(
                "Error pengumuman terbaru:",
                error
            );

            return [];
        }
    }

    /* =====================================================
       AKTIVITAS / NOTIFICATIONS
       ===================================================== */

    async function loadAktivitas() {
        try {
            const { data, error } =
                await supabaseClient
                    .from("notifications")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(5);

            if (error) {
                console.warn(
                    "Gagal membaca notifications:",
                    error
                );

                setText(
                    "jumlahAktivitas",
                    "0"
                );

                return;
            }

            const items =
                Array.isArray(data)
                    ? data
                    : [];

            setText(
                "jumlahAktivitas",
                items.length.toLocaleString(
                    "id-ID"
                )
            );

            const list =
                document.getElementById(
                    "activityList"
                );

            if (!list) {
                return;
            }

            if (items.length === 0) {
                return;
            }

            list.innerHTML =
                items
                    .map(
                        item => {
                            const title =
                                escapeHtml(
                                    item.title ||
                                    item.name ||
                                    "Notifikasi"
                                );

                            const message =
                                escapeHtml(
                                    item.message ||
                                    item.body ||
                                    item.description ||
                                    ""
                                );

                            const date =
                                formatDateTime(
                                    item.created_at
                                );

                            return `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                                            ></path>

                                            <path
                                                d="M13.73 21a2 2 0 0 1-3.46 0"
                                            ></path>
                                        </svg>
                                    </div>

                                    <div class="activity-content">
                                        <div class="activity-title">
                                            ${title}
                                        </div>

                                        <div class="activity-message">
                                            ${message}
                                        </div>

                                        <div class="activity-time">
                                            ${date}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    )
                    .join("");

        } catch (error) {
            console.warn(
                "Error aktivitas:",
                error
            );

            setText(
                "jumlahAktivitas",
                "0"
            );
        }
    }

    /* =====================================================
       BACK BUTTON
       ===================================================== */

    function setupBackProtection() {
        try {
            history.pushState(
                {
                    sidatNotulaDashboard: true
                },
                "",
                window.location.href
            );

            window.addEventListener(
                "popstate",
                () => {
                    const keluar =
                        window.confirm(
                            "Tutup aplikasi SIDAT? Anda tetap login sebagai NOTULA."
                        );

                    if (keluar) {
                        try {
                            if (
                                window.Capacitor &&
                                window.Capacitor.Plugins &&
                                window.Capacitor.Plugins.App
                            ) {
                                window.Capacitor.Plugins.App.exitApp();
                                return;
                            }
                        } catch (error) {
                            console.warn(
                                "Gagal menutup aplikasi:",
                                error
                            );
                        }

                        /*
                         * Jangan logout.
                         */
                        history.go(-1);

                    } else {
                        history.pushState(
                            {
                                sidatNotulaDashboard: true
                            },
                            "",
                            window.location.href
                        );
                    }
                }
            );

        } catch (error) {
            console.warn(
                "Back protection gagal:",
                error
            );
        }
    }

    /* =====================================================
       AUTH LISTENER
       ===================================================== */

    function setupAuthListener() {
        if (
            !supabaseClient ||
            !supabaseClient.auth
        ) {
            return;
        }

        supabaseClient.auth.onAuthStateChange(
            (
                event,
                session
            ) => {

                if (
                    session?.access_token
                ) {
                    localStorage.setItem(
                        ACCESS_TOKEN_KEY,
                        session.access_token
                    );
                }

                if (
                    event === "SIGNED_OUT"
                ) {
                    localStorage.removeItem(
                        ACCESS_TOKEN_KEY
                    );
                }
            }
        );
    }

    /* =====================================================
       DOM HELPER
       ===================================================== */

    function setText(
        id,
        value
    ) {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            value == null
                ? ""
                : String(value);
    }

    /* =====================================================
       FORMAT DATE
       ===================================================== */

    function formatDate(
        dateValue
    ) {
        if (!dateValue) {
            return "";
        }

        try {
            return new Intl.DateTimeFormat(
                "id-ID",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ).format(
                new Date(
                    `${dateValue}T00:00:00`
                )
            );
        } catch (error) {
            return String(
                dateValue
            );
        }
    }

    /* =====================================================
       FORMAT TIME
       ===================================================== */

    function formatTime(
        timeValue
    ) {
        if (!timeValue) {
            return "";
        }

        return String(
            timeValue
        ).slice(0, 5);
    }

    /* =====================================================
       FORMAT DATETIME
       ===================================================== */

    function formatDateTime(
        dateValue
    ) {
        if (!dateValue) {
            return "";
        }

        try {
            return new Intl.DateTimeFormat(
                "id-ID",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(
                new Date(
                    dateValue
                )
            );
        } catch (error) {
            return String(
                dateValue
            );
        }
    }

    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(
        value
    ) {
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

    /* =====================================================
       INIT
       ===================================================== */

    async function init() {
        showLoading();

        try {
            setupAuthListener();

            const user =
                await loadSession();

            if (!user) {
                return;
            }

            const valid =
                await validateRole(
                    user
                );

            if (!valid) {
                return;
            }

            await Promise.allSettled([
                loadProfilNotula(
                    user,
                    currentProfile
                ),

                loadWilayah(),

                loadStatistikAgenda(),

                loadStatistikNotula(),

                loadStatistikPengumuman(),

                loadStatistikAbsensi(),

                loadAgendaTerdekat(),

                loadNotulaTerbaru(),

                loadPengumumanTerbaru(),

                loadAktivitas()
            ]);

            setupBackProtection();

        } catch (error) {
            console.error(
                "Gagal memuat dashboard NOTULA:",
                error
            );

            window.alert(
                error?.message ||
                "Terjadi kesalahan saat memuat dashboard."
            );

        } finally {
            hideLoading();
        }
    }

    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    } else {
        init();
    }

})();