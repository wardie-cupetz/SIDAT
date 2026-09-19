/* =========================================================
SIDAT - ADMIN DASHBOARD
Versi: Final Dashboard Admin
========================================================= */

(function () {
"use strict";

/* =====================================================
   KONFIGURASI
   ===================================================== */

const ACCESS_TOKEN_KEY = "sidat_access_token";
const ADMIN_USER_KEY = "sidat_admin_user";

const token = localStorage.getItem(ACCESS_TOKEN_KEY);

if (!token) {
    window.location.href = "../index.html";
    return;
}


/* =====================================================
   HELPER DOM
   ===================================================== */

const $ = (id) => document.getElementById(id);


/* =====================================================
   DOM
   ===================================================== */

const loadingScreen = $("loadingScreen");

const namaAplikasi = $("namaAplikasi");
const detailWilayah = $("detailWilayah");

const rtLogo = $("rtLogo");

const adminName = $("adminName");
const adminNameTop = $("adminNameTop");

const profileButton = $("profileButton");
const profileImage = $("profileImage");
const profilePlaceholder = $("profilePlaceholder");

const totalWarga = $("totalWarga");
const totalKK = $("totalKK");

const saldoKas = $("saldoKas");
const saldoJimpitan = $("saldoJimpitan");

const activityList = $("activityList");

const menuOverlay = $("menuOverlay");
const menuSheet = $("menuSheet");
const closeMenuButton = $("closeMenuButton");


/* =====================================================
   SUPABASE
   ===================================================== */

const SUPABASE_BASE_URL =
    typeof SUPABASE_URL !== "undefined"
        ? SUPABASE_URL
        : "";

const SUPABASE_ANON_KEY =
    typeof SUPABASE_KEY !== "undefined"
        ? SUPABASE_KEY
        : "";


/* =====================================================
   FETCH SUPABASE
   ===================================================== */

async function supabaseGet(path) {

    if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            "Konfigurasi Supabase tidak ditemukan."
        );
    }

    const response = await fetch(
        `${SUPABASE_BASE_URL}${path}`,
        {
            method: "GET",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {

        let errorText = "";

        try {
            errorText = await response.text();
        } catch (_) {
            errorText = "";
        }

        throw new Error(
            `Supabase GET ${response.status}: ${errorText}`
        );
    }

    return response.json();
}


/* =====================================================
   SUPABASE RPC
   ===================================================== */

async function supabaseRpc(functionName, body = {}) {

    if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            "Konfigurasi Supabase tidak ditemukan."
        );
    }

    const response = await fetch(
        `${SUPABASE_BASE_URL}/rest/v1/rpc/${functionName}`,
        {
            method: "POST",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );

    if (!response.ok) {

        let errorText = "";

        try {
            errorText = await response.text();
        } catch (_) {
            errorText = "";
        }

        throw new Error(
            `Supabase RPC ${functionName} ${response.status}: ${errorText}`
        );
    }

    return response.json();
}


/* =====================================================
   FORMAT RUPIAH
   ===================================================== */

function formatRupiah(value) {

    const number = Number(value || 0);

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ).format(number);
}


/* =====================================================
   FORMAT TANGGAL
   ===================================================== */

function formatTanggalWaktu(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   AMBIL USER AUTH
   ===================================================== */

async function loadAuthUser() {

    const response = await fetch(
        `${SUPABASE_BASE_URL}/auth/v1/user`,
        {
            method: "GET",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            "Sesi admin tidak valid."
        );
    }

    return response.json();
}


/* =====================================================
   LOAD PROFIL ADMIN
   ===================================================== */

async function loadProfilAdmin() {

    try {

        const authUser = await loadAuthUser();

        const userId = authUser?.id;

        if (!userId) {
            throw new Error(
                "ID user admin tidak ditemukan."
            );
        }


        const profiles = await supabaseGet(
            `/rest/v1/profiles?select=id,user_id,role,resident_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`
        );

        const profile =
            Array.isArray(profiles)
                ? profiles[0]
                : null;


        if (!profile) {

            console.warn(
                "Profile admin tidak ditemukan."
            );

            tampilkanNamaAdmin(
                authUser?.user_metadata?.full_name ||
                authUser?.user_metadata?.name ||
                "Admin SIDAT"
            );

            return;
        }


        if (
            profile.role &&
            profile.role !== "admin"
        ) {

            console.warn(
                "User yang sedang membuka dashboard bukan role admin."
            );
        }


        let resident = null;

        if (profile.resident_id) {

            const residents = await supabaseGet(
                `/rest/v1/residents?select=*&id=eq.${encodeURIComponent(profile.resident_id)}&limit=1`
            );

            if (
                Array.isArray(residents) &&
                residents.length > 0
            ) {
                resident = residents[0];
            }
        }


        const nama =
            resident?.name ||
            authUser?.user_metadata?.full_name ||
            authUser?.user_metadata?.name ||
            "Admin SIDAT";

        tampilkanNamaAdmin(nama);


        const photoUrl =
            resident?.photo_url ||
            authUser?.user_metadata?.avatar_url ||
            authUser?.user_metadata?.picture ||
            "";

        tampilkanFotoAdmin(photoUrl);


        const adminData = {
            user_id: userId,
            profile_id: profile.id || null,
            resident_id: profile.resident_id || null,
            role: profile.role || "admin",
            name: nama,
            photo_url: photoUrl
        };

        localStorage.setItem(
            ADMIN_USER_KEY,
            JSON.stringify(adminData)
        );

    } catch (error) {

        console.error(
            "Gagal memuat profil admin:",
            error
        );

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        ADMIN_USER_KEY
                    ) || "null"
                );

            if (saved) {

                tampilkanNamaAdmin(
                    saved.name ||
                    "Admin SIDAT"
                );

                tampilkanFotoAdmin(
                    saved.photo_url || ""
                );

                return;
            }

        } catch (_) {}

        tampilkanNamaAdmin(
            "Admin SIDAT"
        );
    }
}


/* =====================================================
   TAMPILKAN NAMA ADMIN
   ===================================================== */

function tampilkanNamaAdmin(nama) {

    const safeName =
        nama ||
        "Admin SIDAT";

    if (adminName) {
        adminName.textContent =
            safeName;
    }

    if (adminNameTop) {
        adminNameTop.textContent =
            safeName;
    }
}


/* =====================================================
   TAMPILKAN FOTO ADMIN
   ===================================================== */

function tampilkanFotoAdmin(photoUrl) {

    if (!profileImage) {
        return;
    }

    if (
        photoUrl &&
        typeof photoUrl === "string"
    ) {

        profileImage.src = photoUrl;

        profileImage.style.display =
            "block";

        if (profilePlaceholder) {
            profilePlaceholder.style.display =
                "none";
        }

        profileImage.onerror = function () {

            profileImage.onerror = null;

            profileImage.removeAttribute(
                "src"
            );

            profileImage.style.display =
                "none";

            if (profilePlaceholder) {
                profilePlaceholder.style.display =
                    "block";
            }
        };

    } else {

        profileImage.removeAttribute(
            "src"
        );

        profileImage.style.display =
            "none";

        if (profilePlaceholder) {
            profilePlaceholder.style.display =
                "block";
        }
    }
}


/* =====================================================
   LOAD WILAYAH
   ===================================================== */

async function loadWilayah() {

    try {

        let wilayahData = null;


        const wilayahResult = await supabaseGet(
            "/rest/v1/wilayah?select=*&limit=1"
        );

        if (
            Array.isArray(wilayahResult) &&
            wilayahResult.length > 0
        ) {
            wilayahData =
                wilayahResult[0];
        }


        if (!wilayahData) {

            try {

                const settingsResult =
                    await supabaseGet(
                        "/rest/v1/settings?select=*&limit=1"
                    );

                if (
                    Array.isArray(settingsResult) &&
                    settingsResult.length > 0
                ) {

                    const settings =
                        settingsResult[0];

                    wilayahData = {
                        nama_aplikasi:
                            settings.rt_name ||
                            "SIDAT",

                        nama_dusun:
                            settings.dusun ||
                            settings.dusunn ||
                            "",

                        nama_desa:
                            settings.village ||
                            "",

                        rt:
                            settings.rt_name ||
                            settings.rt ||
                            "",

                        rw:
                            settings.rw_name ||
                            settings.rw ||
                            "",

                        nama_ketua_rt:
                            settings.chairman_name ||
                            "",

                        kecamatan:
                            settings.district ||
                            "",

                        kabupaten:
                            settings.regency ||
                            "",

                        provinsi:
                            settings.province ||
                            "Jawa Tengah",

                        logo_url:
                            settings.logo_url ||
                            ""
                    };
                }

            } catch (fallbackError) {

                console.warn(
                    "Fallback settings gagal:",
                    fallbackError
                );
            }
        }


        if (!wilayahData) {

            tampilkanWilayahDefault();

            return;
        }


        const aplikasi =
            wilayahData.nama_aplikasi ||
            "SIDAT";

        if (namaAplikasi) {
            namaAplikasi.textContent =
                aplikasi;
        }


        const logoUrl =
            wilayahData.logo_url ||
            "";

        tampilkanLogoRT(
            logoUrl
        );


        renderDetailWilayah(
            wilayahData
        );


        try {

            localStorage.setItem(
                "sidat_wilayah_admin",
                JSON.stringify(
                    wilayahData
                )
            );

        } catch (_) {}

    } catch (error) {

        console.error(
            "Gagal memuat wilayah:",
            error
        );


        try {

            const cached =
                JSON.parse(
                    localStorage.getItem(
                        "sidat_wilayah_admin"
                    ) || "null"
                );

            if (cached) {

                const aplikasi =
                    cached.nama_aplikasi ||
                    "SIDAT";

                if (namaAplikasi) {
                    namaAplikasi.textContent =
                        aplikasi;
                }

                tampilkanLogoRT(
                    cached.logo_url || ""
                );

                renderDetailWilayah(
                    cached
                );

                return;
            }

        } catch (_) {}


        tampilkanWilayahDefault();
    }
}


/* =====================================================
   RENDER DETAIL WILAYAH
   ===================================================== */

function renderDetailWilayah(data) {

    if (!detailWilayah) {
        return;
    }

    const rt =
        bersihkan(data.rt);

    const rw =
        bersihkan(data.rw);

    const dusun =
        bersihkan(data.nama_dusun);

    const desa =
        bersihkan(data.nama_desa);

    const kecamatan =
        bersihkan(data.kecamatan);

    const kabupaten =
        bersihkan(data.kabupaten);

    const provinsi =
        bersihkan(data.provinsi);

    const rtValue =
        rt.replace(/^RT\s*/i, "");

    const rwValue =
        rw.replace(/^RW\s*/i, "");

    const bagianBaris1 = [];

    if (rtValue || rwValue) {

        const rtText =
            rtValue
                ? `RT ${rtValue}`
                : "";

        const rwText =
            rwValue
                ? `RW ${rwValue}`
                : "";

        bagianBaris1.push(
            [rtText, rwText]
                .filter(Boolean)
                .join(" • ")
        );
    }

    if (dusun) {
        bagianBaris1.push(
            dusun
        );
    }

    if (desa) {
        bagianBaris1.push(
            desa
        );
    }

    const bagianBaris2 = [];

    if (kecamatan) {
        bagianBaris2.push(
            kecamatan
        );
    }

    if (kabupaten) {
        bagianBaris2.push(
            kabupaten
        );
    }

    if (provinsi) {
        bagianBaris2.push(
            provinsi
        );
    }

    const baris1 =
        bagianBaris1.length
            ? bagianBaris1.join(" • ")
            : "";

    const baris2 =
        bagianBaris2.length
            ? bagianBaris2.join(" • ")
            : "";

    detailWilayah.innerHTML = `
        ${
            baris1
                ? `<span class="wilayah-line">${escapeHtml(baris1)}</span>`
                : ""
        }

        ${
            baris2
                ? `<span class="wilayah-line">${escapeHtml(baris2)}</span>`
                : ""
        }
    `;
}


/* =====================================================
   BERSIHKAN TEXT
   ===================================================== */

function bersihkan(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ");
}


/* =====================================================
   DEFAULT WILAYAH
   ===================================================== */

function tampilkanWilayahDefault() {

    if (namaAplikasi) {
        namaAplikasi.textContent =
            "SIDAT";
    }

    if (detailWilayah) {

        detailWilayah.innerHTML = `
            <span class="wilayah-line">
                RT 03 • RW 02 • Morangan
            </span>

            <span class="wilayah-line">
                Karanganom
            </span>

            <span class="wilayah-line">
                Klaten Utara • Klaten
            </span>

            <span class="wilayah-line">
                Jawa Tengah
            </span>
        `;
    }
}


/* =====================================================
   TAMPILKAN LOGO RT
   ===================================================== */

function tampilkanLogoRT(logoUrl) {

    if (!rtLogo) {
        return;
    }

    if (
        logoUrl &&
        typeof logoUrl === "string"
    ) {

        rtLogo.innerHTML = `
            <img
                src="${escapeHtml(logoUrl)}"
                alt="Logo RT"
                class="rt-logo-image"
            >
        `;

        const image =
            rtLogo.querySelector(
                ".rt-logo-image"
            );

        if (image) {

            image.addEventListener(
                "error",
                function () {

                    tampilkanLogoDefault();

                },
                {
                    once: true
                }
            );
        }

    } else {

        tampilkanLogoDefault();
    }
}


/* =====================================================
   LOGO DEFAULT
   ===================================================== */

function tampilkanLogoDefault() {

    if (!rtLogo) {
        return;
    }

    rtLogo.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M3 21h18"></path>
            <path d="M5 21V8l7-5 7 5v13"></path>
            <path d="M9 21v-7h6v7"></path>
            <path d="M9 10h.01M15 10h.01"></path>
        </svg>
    `;
}


/* =====================================================
   LOAD STATISTIK WARGA
   ===================================================== */

async function loadStatistikWarga() {

    try {

        const result =
            await supabaseRpc(
                "get_resident_statistics"
            );

        let data = result;

        if (Array.isArray(result)) {
            data =
                result[0] ||
                {};
        }

        if (
            result &&
            typeof result === "object" &&
            !Array.isArray(result)
        ) {
            data = result;
        }

        const jumlahWarga =
            Number(
                data?.total_warga ??
                data?.total_residents ??
                data?.warga ??
                0
            );

        const jumlahKK =
            Number(
                data?.total_kk ??
                data?.total_households ??
                data?.kk ??
                0
            );

        if (totalWarga) {

            totalWarga.textContent =
                jumlahWarga.toLocaleString(
                    "id-ID"
                );
        }

        if (totalKK) {

            totalKK.textContent =
                jumlahKK.toLocaleString(
                    "id-ID"
                );
        }

    } catch (error) {

        console.error(
            "Gagal memuat statistik warga:",
            error
        );

        if (totalWarga) {
            totalWarga.textContent =
                "0";
        }

        if (totalKK) {
            totalKK.textContent =
                "0";
        }
    }
}


/* =====================================================
   LOAD SALDO KAS
   ===================================================== */

async function loadSaldoKas() {

    try {

        const transactions =
            await supabaseGet(
                "/rest/v1/cash_transactions?select=transaction_type,amount,created_at&order=created_at.desc"
            );

        let saldo = 0;

        if (Array.isArray(transactions)) {

            for (
                const item
                of transactions
            ) {

                const amount =
                    Number(
                        item.amount || 0
                    );

                const type =
                    String(
                        item.transaction_type ||
                        ""
                    )
                        .toLowerCase()
                        .trim();

                if (
                    type === "masuk" ||
                    type === "income" ||
                    type === "pemasukan" ||
                    type === "jimpitan_transfer"
                ) {

                    saldo += amount;

                } else if (
                    type === "keluar" ||
                    type === "expense" ||
                    type === "pengeluaran"
                ) {

                    saldo -= amount;

                } else {

                    saldo += amount;
                }
            }
        }

        if (saldoKas) {

            saldoKas.textContent =
                formatRupiah(
                    saldo
                );
        }

    } catch (error) {

        console.error(
            "Gagal memuat saldo kas:",
            error
        );

        if (saldoKas) {

            saldoKas.textContent =
                formatRupiah(0);
        }
    }
}


/* =====================================================
   LOAD SALDO JIMPITAN
   ===================================================== */

async function loadSaldoJimpitan() {

    try {

        const result =
            await supabaseRpc(
                "get_jimpitan_balance"
            );

        let saldo = 0;

        if (
            typeof result === "number"
        ) {

            saldo = result;

        } else if (
            Array.isArray(result)
        ) {

            const first =
                result[0];

            if (
                typeof first === "number"
            ) {

                saldo = first;

            } else {

                saldo =
                    Number(
                        first?.balance ??
                        first?.saldo ??
                        first?.total ??
                        first?.jimpitan_balance ??
                        0
                    );
            }

        } else if (
            result &&
            typeof result === "object"
        ) {

            saldo =
                Number(
                    result.balance ??
                    result.saldo ??
                    result.total ??
                    result.jimpitan_balance ??
                    0
                );
        }

        if (saldoJimpitan) {

            saldoJimpitan.textContent =
                formatRupiah(
                    saldo
                );
        }

    } catch (error) {

        console.error(
            "Gagal memuat saldo jimpitan:",
            error
        );

        if (saldoJimpitan) {

            saldoJimpitan.textContent =
                formatRupiah(0);
        }
    }
}


/* =====================================================
   LOAD LOG AKTIVITAS
   ===================================================== */

async function loadLogAktivitas() {

    if (!activityList) {
        return;
    }

    try {

        const notifications =
            await supabaseGet(
                "/rest/v1/notifications?select=id,title,message,created_by,created_at,target_type&order=created_at.desc&limit=5"
            );

        if (
            !Array.isArray(notifications) ||
            notifications.length === 0
        ) {

            renderActivityEmpty();

            return;
        }

        activityList.innerHTML =
            notifications
                .map(
                    (item) => {

                        const title =
                            escapeHtml(
                                item.title ||
                                "Aktivitas"
                            );

                        const message =
                            escapeHtml(
                                item.message ||
                                ""
                            );

                        const date =
                            formatTanggalWaktu(
                                item.created_at
                            );

                        return `
                            <article class="activity-item">

                                <div class="activity-icon">

                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M12 4v16"
                                        ></path>

                                        <path
                                            d="M5 12h14"
                                        ></path>
                                    </svg>

                                </div>

                                <div class="activity-content">

                                    <strong>
                                        ${title}
                                    </strong>

                                    <span>
                                        ${message}
                                    </span>

                                    <small>
                                        ${escapeHtml(date)}
                                    </small>

                                </div>

                            </article>
                        `;
                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "Gagal memuat log aktivitas:",
            error
        );

        renderActivityEmpty();
    }
}


/* =====================================================
   EMPTY ACTIVITY
   ===================================================== */

function renderActivityEmpty() {

    if (!activityList) {
        return;
    }

    activityList.innerHTML = `
        <div class="activity-empty">

            <div class="empty-icon">

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M5 4h14v16H5z"
                    ></path>

                    <path
                        d="M8 8h8M8 12h8M8 16h5"
                    ></path>
                </svg>

            </div>

            <strong>
                Belum ada aktivitas
            </strong>

            <span>
                Aktivitas terbaru akan tampil di sini.
            </span>

        </div>
    `;
}


/* =====================================================
   NAVIGASI MENU
   ===================================================== */

function bukaMenuItem(menu) {

    closeMenu();

    const routes = {
        "akun-warga": "data-warga.html",
        "arus-kas": "kas.html",
        "jimpitan": "jimpitan-transfer.html",
        "generate-qr": "generate-qr.html",
        "laporan": "admin-laporan.html",
        "pengumuman": "pengumuman.html",
        "agenda": "agenda.html",
        "notula": "notula.html"
    };

    const target =
        routes[menu];

    if (!target) {

        console.warn(
            "Menu belum memiliki tujuan:",
            menu
        );

        return;
    }

    window.location.href =
        target;
}


/* =====================================================
   BUKA BERANDA
   ===================================================== */

function bukaBeranda() {

    closeMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================================
   PENGATURAN
   ===================================================== */

function bukaPengaturan() {

    closeMenu();

    window.location.href =
        "pengaturan.html";
}


/* =====================================================
   PROFIL ADMIN
   ===================================================== */

function bukaProfilAdmin() {

    closeMenu();

    window.location.href =
        "profil-admin.html";
}


/* =====================================================
   OPEN MENU
   ===================================================== */

function openMenu() {

    if (!menuOverlay || !menuSheet) {
        return;
    }

    menuOverlay.classList.add(
        "show"
    );

    menuOverlay.classList.add(
        "active"
    );

    menuOverlay.style.display =
        "block";

    menuOverlay.style.visibility =
        "visible";

    menuOverlay.style.opacity =
        "1";

    menuOverlay.style.pointerEvents =
        "auto";


    menuSheet.classList.add(
        "show"
    );

    menuSheet.classList.add(
        "active"
    );

    menuSheet.style.display =
        "block";

    menuSheet.style.visibility =
        "visible";

    menuSheet.style.opacity =
        "1";

    menuSheet.style.pointerEvents =
        "auto";

    menuSheet.style.transform =
        "translateX(-50%) translateY(0)";


    menuOverlay.setAttribute(
        "aria-hidden",
        "false"
    );

    menuSheet.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "menu-open"
    );
}


/* =====================================================
   CLOSE MENU
   ===================================================== */

function closeMenu() {

    if (!menuOverlay || !menuSheet) {
        return;
    }

    menuOverlay.classList.remove(
        "show"
    );

    menuOverlay.classList.remove(
        "active"
    );

    menuOverlay.style.display =
        "";

    menuOverlay.style.visibility =
        "";

    menuOverlay.style.opacity =
        "";

    menuOverlay.style.pointerEvents =
        "";


    menuSheet.classList.remove(
        "show"
    );

    menuSheet.classList.remove(
        "active"
    );

    menuSheet.style.display =
        "";

    menuSheet.style.visibility =
        "";

    menuSheet.style.opacity =
        "";

    menuSheet.style.pointerEvents =
        "";

    menuSheet.style.transform =
        "";


    menuOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    menuSheet.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "menu-open"
    );
}


/* =====================================================
   EVENT MENU
   ===================================================== */

function pasangEventMenu() {

    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    menuOverlay
                ) {

                    closeMenu();
                }
            }
        );
    }


    if (closeMenuButton) {

        closeMenuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeMenu();
            }
        );
    }


    document
        .querySelectorAll(
            "[data-menu]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        const menu =
                            button.getAttribute(
                                "data-menu"
                            );

                        bukaMenuItem(
                            menu
                        );
                    }
                );
            }
        );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeMenu();
            }
        }
    );
}


/* =====================================================
   EVENT FOTO PROFIL
   ===================================================== */

function pasangEventProfil() {

    if (!profileButton) {
        return;
    }

    profileButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            bukaProfilAdmin();
        }
    );
}


/* =====================================================
   LOGOUT
   ===================================================== */

function logoutAdmin() {

    localStorage.removeItem(
        ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
        ADMIN_USER_KEY
    );

    window.location.href =
        "../index.html";
}


/* =====================================================
   LOADING SCREEN
   ===================================================== */

function hideLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.classList.add(
        "hidden"
    );

    setTimeout(
        function () {

            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";
            }

        },
        350
    );
}


/* =====================================================
   LOAD DASHBOARD
   ===================================================== */

async function loadDashboard() {

    try {

        await Promise.allSettled([

            loadProfilAdmin(),

            loadWilayah(),

            loadStatistikWarga(),

            loadSaldoKas(),

            loadSaldoJimpitan(),

            loadLogAktivitas()

        ]);

    } catch (error) {

        console.error(
            "Dashboard admin error:",
            error
        );

    } finally {

        hideLoadingScreen();
    }
}


/* =====================================================
   GLOBAL FUNCTION
   ===================================================== */

window.openMenu =
    openMenu;

window.closeMenu =
    closeMenu;

window.bukaMenuItem =
    bukaMenuItem;

window.bukaBeranda =
    bukaBeranda;

window.bukaPengaturan =
    bukaPengaturan;

window.bukaProfilAdmin =
    bukaProfilAdmin;

window.logoutAdmin =
    logoutAdmin;


/* =====================================================
   INIT
   ===================================================== */

function initDashboard() {

    pasangEventMenu();

    pasangEventProfil();

    loadDashboard();
}


/* =====================================================
   DOM READY
   ===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initDashboard
    );

} else {

    initDashboard();
}

})();