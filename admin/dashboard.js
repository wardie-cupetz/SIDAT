/* ==========================================
SIDAT
DASHBOARD ADMIN
Dibuat oleh Suwardi
========================================== */

console.log(
"SIDAT: Dashboard Admin memuat..."
);

/* ==========================================
SUPABASE CLIENT KHUSUS DASHBOARD
========================================== */

let sidatDashboardClient = null;

/* ==========================================
INIT SUPABASE
========================================== */

function initDashboardSupabase() {

if (
    typeof SUPABASE_URL === "undefined" ||
    typeof SUPABASE_KEY === "undefined"
) {

    throw new Error(
        "Konfigurasi Supabase tidak ditemukan."
    );

}


if (
    typeof supabase === "undefined" ||
    !supabase.createClient
) {

    throw new Error(
        "Library Supabase belum dimuat."
    );

}


sidatDashboardClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


console.log(
    "SIDAT: Supabase Dashboard siap."
);

}

/* ==========================================
CEK CLIENT
========================================== */

function pastikanDashboardClient() {

if (
    !sidatDashboardClient ||
    typeof sidatDashboardClient.rpc !==
        "function" ||
    typeof sidatDashboardClient.from !==
        "function"
) {

    throw new Error(
        "Supabase Client Dashboard belum siap."
    );

}

}

function bukaNotifikasiAdmin() {

    window.location.href =
        "notifikasi-admin.html";

}

window.bukaNotifikasiAdmin =
    bukaNotifikasiAdmin;

/* ==========================================
FORMAT RUPIAH
========================================== */

function formatRupiah(
nominal
) {

return new Intl.NumberFormat(
    "id-ID",
    {
        style:
            "currency",

        currency:
            "IDR",

        maximumFractionDigits:
            0
    }
).format(
    Number(nominal) || 0
);

}

// ==========================================
// LOAD WILAYAH SIDAT
// ==========================================

async function loadWilayah() {

    console.log(
        "SIDAT: Memuat identitas wilayah..."
    );


    try {

        // ======================================
        // AMBIL TOKEN LANGSUNG
        // ======================================

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            throw new Error(
                "Access token SIDAT tidak ditemukan."
            );

        }


        // ======================================
        // AMBIL DATA WILAYAH
        // ======================================

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/wilayah?select=id,nama_aplikasi,nama_dusun,nama_desa,rt,rw,nama_ketua_rt,kecamatan,kabupaten,provinsi,logo_url,warna_tema&limit=1`,
                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "SIDAT DATA WILAYAH:",
            data
        );


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            console.warn(
                "SIDAT: Data wilayah kosong."
            );


            const wilayahInfo =
                document.getElementById(
                    "wilayahInfo"
                );


            if (wilayahInfo) {

                wilayahInfo.textContent =
                    "Informasi wilayah belum diatur.";

            }


            return;

        }


        const wilayah =
            data[0];


        // ======================================
        // JUDUL / KETUA RT
        // ======================================

        const wilayahTitle =
            document.getElementById(
                "wilayahTitle"
            );


        if (wilayahTitle) {

            wilayahTitle.textContent =
                wilayah.nama_ketua_rt
                    ? `Selamat datang, ${wilayah.nama_ketua_rt}`
                    : "Selamat datang, Admin";

        }


        // ======================================
        // INFORMASI WILAYAH
        // ======================================

        const wilayahInfo =
            document.getElementById(
                "wilayahInfo"
            );


        if (wilayahInfo) {

            const bagian =
                [];


            if (wilayah.rt) {

                bagian.push(
                    `RT ${wilayah.rt}`
                );

            }


            if (wilayah.rw) {

                bagian.push(
                    `RW ${wilayah.rw}`
                );

            }


            if (wilayah.nama_dusun) {

                bagian.push(
                    `Dusun ${wilayah.nama_dusun}`
                );

            }


            if (wilayah.nama_desa) {

                bagian.push(
                    `Desa ${wilayah.nama_desa}`
                );

            }


            if (wilayah.kecamatan) {

                bagian.push(
                    `Kec. ${wilayah.kecamatan}`
                );

            }


            if (wilayah.kabupaten) {

                bagian.push(
                    wilayah.kabupaten
                );

            }


            if (wilayah.provinsi) {

                bagian.push(
                    wilayah.provinsi
                );

            }


            wilayahInfo.textContent =
                bagian.length
                    ? bagian.join(" • ")
                    : "Informasi wilayah belum diatur.";

        }


        // ======================================
        // NAMA APLIKASI
        // ======================================

        const namaAplikasi =
            document.getElementById(
                "namaAplikasi"
            );


        if (namaAplikasi) {

            namaAplikasi.textContent =
                wilayah.nama_aplikasi ||
                "SIDAT";

        }


// ======================================
// LOGO RT
// ======================================

const logoRT =
    document.getElementById(
        "logoRT"
    );

const logoDefault =
    document.getElementById(
        "logoDefault"
    );


console.log(
    "SIDAT LOGO URL:",
    wilayah.logo_url
);


if (
    logoRT &&
    wilayah.logo_url
) {

    logoRT.src =
        wilayah.logo_url;

    logoRT.alt =
        wilayah.nama_aplikasi ||
        "Logo RT";


    logoRT.classList.remove(
        "hidden"
    );


    if (logoDefault) {

        logoDefault.classList.add(
            "hidden"
        );

    }


    // ==================================
    // JIKA GAMBAR GAGAL DIMUAT
    // ==================================

    logoRT.onerror =
        function () {

            console.warn(
                "SIDAT: Logo RT gagal dimuat:",
                wilayah.logo_url
            );


            logoRT.classList.add(
                "hidden"
            );


            if (logoDefault) {

                logoDefault.classList.remove(
                    "hidden"
                );

            }

        };

} else {

    // ==================================
    // TIDAK ADA LOGO
    // ==================================

    if (logoRT) {

        logoRT.removeAttribute(
            "src"
        );

        logoRT.classList.add(
            "hidden"
        );

    }


    if (logoDefault) {

        logoDefault.classList.remove(
            "hidden"
        );

    }

}


        // ======================================
        // WARNA TEMA
        // ======================================

        const warna =
            wilayah.warna_tema ||
            "#15803d";


        document.documentElement
            .style
            .setProperty(
                "--primary-color",
                warna
            );


        document.documentElement
            .style
            .setProperty(
                "--theme-color",
                warna
            );


        // ======================================
        // THEME COLOR HP
        // ======================================

        const metaTheme =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (metaTheme) {

            metaTheme.setAttribute(
                "content",
                warna
            );

        }


        // ======================================
        // CACHE WILAYAH
        // ======================================

        localStorage.setItem(
            "sidat_wilayah_data",
            JSON.stringify(
                wilayah
            )
        );


        console.log(
            "SIDAT: Identitas wilayah berhasil diterapkan."
        );


    } catch (error) {

        console.error(
            "SIDAT LOAD WILAYAH ERROR:",
            error
        );


        const wilayahInfo =
            document.getElementById(
                "wilayahInfo"
            );


        if (wilayahInfo) {

            wilayahInfo.textContent =
                "Informasi wilayah belum tersedia.";

        }

    }

}
// ==========================================
// LOAD BADGE NOTIFIKASI ADMIN
// ==========================================

async function loadBadgeNotifikasiAdmin() {

    const badge =
        document.getElementById(
            "adminNotificationBadge"
        );


    if (!badge) {

        console.log(
            "SIDAT: Badge notifikasi admin tidak ditemukan."
        );

        return;

    }


    try {

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            console.log(
                "SIDAT: Session admin tidak ditemukan."
            );

            return;

        }


        // ==================================
        // AMBIL NOTIFIKASI ADMIN
        // YANG BELUM DIBACA
        // ==================================

        const response =
            await fetch(

                `${SUPABASE_URL}` +
                `/rest/v1/notifications` +
                `?select=id` +
                `&target_type=eq.admin` +
                `&is_read=eq.false`,

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"

                    }

                }

            );


        console.log(
            "SIDAT STATUS NOTIFIKASI ADMIN:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "SIDAT ERROR NOTIFIKASI ADMIN:",
                errorText
            );

            return;

        }


        const data =
            await response.json();


        const jumlah =
            Array.isArray(data)
                ? data.length
                : 0;


        console.log(
            "SIDAT: Notifikasi admin belum dibaca:",
            jumlah
        );


        // ==================================
        // TAMPILKAN BADGE
        // ==================================

        if (jumlah > 0) {

            badge.textContent =
                jumlah > 99
                    ? "99+"
                    : jumlah;


            badge.classList.remove(
                "hidden"
            );

        }

        else {

            badge.textContent =
                "0";


            badge.classList.add(
                "hidden"
            );

        }

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal memuat badge admin:",
            error
        );

    }

}

/* ==========================================
LOAD STATISTIK WARGA
========================================== */

async function loadStatistikWarga() {

try {

    pastikanDashboardClient();


    const {
        data,
        error
    } = await sidatDashboardClient
        .rpc(
            "get_resident_statistics"
        );


    console.log(
        "Statistik warga:",
        data
    );


    if (error) {

        throw error;

    }


    let statistik =
        data;


    if (
        Array.isArray(
            data
        )
    ) {

        statistik =
            data[0] || {};

    }


    document.getElementById(
        "totalWarga"
    ).textContent =
        Number(
            statistik?.total_warga
        ) || 0;


    document.getElementById(
        "totalKK"
    ).textContent =
        Number(
            statistik?.total_kk
        ) || 0;


} catch (error) {

    console.error(
        "Gagal memuat statistik warga:",
        error
    );


    document.getElementById(
        "totalWarga"
    ).textContent =
        "0";


    document.getElementById(
        "totalKK"
    ).textContent =
        "0";

}

}

/* ==========================================
LOAD SALDO KAS
========================================== */

async function loadSaldoKas() {

try {

    pastikanDashboardClient();


    const {
        data,
        error
    } = await sidatDashboardClient
        .rpc(
            "get_cash_balance"
        );


    console.log(
        "Saldo kas Dashboard:",
        data
    );


    if (error) {

        throw error;

    }


    let saldoData =
        data;


    /*
     * Beberapa RPC SIDAT
     * mengembalikan object langsung.
     * Jika dibungkus data, tangani juga.
     */

    if (
        saldoData?.data
    ) {

        saldoData =
            saldoData.data;

    }


    if (
        Array.isArray(
            saldoData
        )
    ) {

        saldoData =
            saldoData[0] ||
            {};

    }


    document.getElementById(
        "saldoKas"
    ).textContent =
        formatRupiah(
            saldoData?.balance
        );


} catch (error) {

    console.error(
        "Gagal memuat saldo kas:",
        error
    );


    document.getElementById(
        "saldoKas"
    ).textContent =
        "Rp 0";

}

}

/* ==========================================
LOAD SALDO JIMPITAN
========================================== */

async function loadSaldoJimpitan() {

try {

    pastikanDashboardClient();


    const {
        data,
        error
    } = await sidatDashboardClient
        .rpc(
            "get_jimpitan_balance"
        );


    console.log(
        "Saldo jimpitan Dashboard:",
        data
    );


    if (error) {

        throw error;

    }


    let saldo =
        data;


    if (
        saldo?.data
    ) {

        saldo =
            saldo.data;

    }


    if (
        Array.isArray(
            saldo
        )
    ) {

        saldo =
            saldo[0];

        saldo =
            saldo?.get_jimpitan_balance ??
            saldo?.balance ??
            0;

    }


    if (
        typeof saldo ===
        "object"
    ) {

        saldo =
            saldo?.balance ??
            saldo?.saldo ??
            0;

    }


    document.getElementById(
        "saldoJimpitan"
    ).textContent =
        formatRupiah(
            saldo
        );


} catch (error) {

    console.error(
        "Gagal memuat saldo jimpitan:",
        error
    );


    document.getElementById(
        "saldoJimpitan"
    ).textContent =
        "Rp 0";

}

}

/* ==========================================
MENU
========================================== */

function bukaDataWarga() {

window.location.href =
    "data-warga.html";

}

function bukaArusKas() {

window.location.href =
    "kas.html";

}

function bukaJimpitan() {

window.location.href =
    "jimpitan-transfer.html";

}

function bukaGenerateQR() {

window.location.href =
    "generate-qr.html";

}

function bukaPengumuman() {
    window.location.href = "pengumuman.html";
}

function bukaLaporan() {

window.location.href =
    "admin-laporan.html";

}

function bukaPengaturan() {

window.location.href =
    "pengaturan.html";

}

/* ==========================================
LOGOUT
========================================== */

async function logoutAdmin() {

try {

    if (
        sidatDashboardClient &&
        sidatDashboardClient.auth
    ) {

        await sidatDashboardClient
            .auth
            .signOut();

    }

} catch (error) {

    console.error(
        "Logout error:",
        error
    );

}


localStorage.removeItem(
    "sidat_access_token"
);


localStorage.removeItem(
    "sidat_refresh_token"
);


localStorage.removeItem(
    "sidat_user"
);


window.location.href =
    "../index.html";

}

/* ==========================================
LOAD DASHBOARD
========================================== */

async function loadDashboard() {

try {

    initDashboardSupabase();
    loadBadgeNotifikasiAdmin();


    await Promise.all([

        loadWilayah(),

        loadStatistikWarga(),

        loadSaldoKas(),

        loadSaldoJimpitan()

    ]);


    console.log(
        "SIDAT: Dashboard Admin siap."
    );


} catch (error) {

    console.error(
        "Dashboard init error:",
        error
    );

}

}

/* ==========================================
START
========================================== */

document.addEventListener(
"DOMContentLoaded",
loadDashboard
);
window.loadBadgeNotifikasiAdmin =
    loadBadgeNotifikasiAdmin;
    
    
    function bukaBackupRestore() {

    window.location.href =
        "backup-restore.html";

}

window.bukaBackupRestore =
    bukaBackupRestore;