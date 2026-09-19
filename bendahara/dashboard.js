/* =========================================================
SIDAT - DASHBOARD BENDAHARA
Berdasarkan Dashboard Ketua RT
========================================================= */

(() => {

"use strict";


/* =====================================================
   KONFIGURASI
   ===================================================== */

const ACCESS_TOKEN_KEY = "sidat_access_token";
const ROLE = "bendahara";


/* =====================================================
   ELEMENT
   ===================================================== */

const $ = (id) => document.getElementById(id);


/* =====================================================
   FORMAT RUPIAH
   ===================================================== */

function formatRupiah(value) {

    const number = Number(value) || 0;

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }
    ).format(number);

}


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
        typeof SUPABASE_URL !== "undefined" &&
        typeof SUPABASE_KEY !== "undefined"
    ) {

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        return window.supabaseClient;
    }

    throw new Error(
        "Supabase client belum tersedia."
    );

}


const supabaseClient = getSupabaseClient();


/* =====================================================
   LOADING
   ===================================================== */

function hideLoading() {

    const loading = $("loadingScreen");

    if (loading) {
        loading.classList.add("hidden");
    }

}


function showLoading() {

    const loading = $("loadingScreen");

    if (loading) {
        loading.classList.remove("hidden");
    }

}


/* =====================================================
   ERROR
   ===================================================== */

function showDashboardError(message) {

    const errorBox = $("dashboardError");

    if (!errorBox) {
        console.error(message);
        return;
    }

    errorBox.textContent = message;
    errorBox.classList.add("show");

}


/* =====================================================
   SESSION
   ===================================================== */

async function loadSession() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {
        throw error;
    }


    let session = data?.session || null;


    /*
     * Fallback token lama SIDAT.
     */

    if (!session) {

        const accessToken =
            localStorage.getItem(
                ACCESS_TOKEN_KEY
            );

        if (accessToken) {

            const result =
                await supabaseClient.auth.getUser(
                    accessToken
                );

            if (!result.error && result.data?.user) {

                return {
                    session: null,
                    user: result.data.user
                };

            }

        }

    }


    if (!session?.user) {

        window.location.href =
            "../index.html";

        return null;

    }


    return {
        session,
        user: session.user
    };

}


/* =====================================================
   CEK ROLE
   ===================================================== */

async function validateRole(user) {

    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select("role,resident_id")
        .eq("user_id", user.id)
        .single();


    if (error) {
        throw error;
    }


    if (!data) {

        throw new Error(
            "Profil pengguna tidak ditemukan."
        );

    }


    if (data.role !== ROLE) {

        console.error(
            "Role tidak sesuai:",
            data.role
        );

        window.location.href =
            "../index.html";

        return null;

    }


    return data;

}


/* =====================================================
   PROFIL BENDAHARA
   ===================================================== */

async function loadProfilBendahara(
    user,
    profile
) {

    const metadata =
        user.user_metadata || {};


    const nama =
        metadata.full_name ||
        metadata.name ||
        metadata.nama ||
        "Bendahara";


    const email =
        user.email ||
        "bendahara@warga.rt";


    const namaElement =
        $("namaBendahara");

    if (namaElement) {
        namaElement.textContent = nama;
    }


    const bendaharaName =
        $("bendaharaName");

    if (bendaharaName) {
        bendaharaName.textContent = nama;
    }


    const profileName =
        $("profileName");

    if (profileName) {
        profileName.textContent = nama;
    }


    const profileEmail =
        $("profileEmail");

    if (profileEmail) {
        profileEmail.textContent = email;
    }


    /*
     * Jika suatu saat akun Bendahara
     * memiliki resident_id, tetap bisa
     * mengambil nama warga tersebut.
     */

    if (profile?.resident_id) {

        try {

            const {
                data: resident,
                error
            } = await supabaseClient
                .from("residents")
                .select("name")
                .eq(
                    "id",
                    profile.resident_id
                )
                .maybeSingle();


            if (
                !error &&
                resident?.name
            ) {

                if (namaElement) {
                    namaElement.textContent =
                        resident.name;
                }

            }

        } catch (error) {

            console.warn(
                "Gagal memuat nama resident:",
                error
            );

        }

    }

}


/* =====================================================
   WILAYAH
   ===================================================== */

async function loadWilayah() {

    /*
     * Dashboard Ketua RT menggunakan
     * pengaturan wilayah SIDAT.
     *
     * Kita coba mengambil dari tabel
     * settings terlebih dahulu.
     */

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("settings")
            .select("*")
            .limit(1)
            .maybeSingle();


        if (
            !error &&
            data
        ) {

            setWilayahFromObject(data);

            return;

        }

    } catch (error) {

        console.warn(
            "Tabel settings tidak dapat dibaca:",
            error
        );

    }


    /*
     * Fallback ke localStorage.
     */

    try {

        const saved =
            localStorage.getItem(
                "sidat_wilayah_bendahara"
            );

        if (saved) {

            const wilayah =
                JSON.parse(saved);

            setWilayahFromObject(
                wilayah
            );

            return;

        }

    } catch (error) {

        console.warn(
            "Cache wilayah tidak valid:",
            error
        );

    }


    /*
     * Nilai default sesuai konfigurasi
     * SIDAT saat ini.
     */

    setWilayahFromObject({

        dusun: "Morangan",
        desa: "Karanganom",
        rt: "03",
        rw: "02",
        kecamatan: "Klaten Utara",
        kabupaten: "Klaten",
        provinsi: "Jawa Tengah"

    });

}


function setWilayahFromObject(data) {

    const dusun =
        data.dusun ||
        data.nama_dusun ||
        data.wilayah_dusun ||
        "Morangan";


    const desa =
        data.desa ||
        data.nama_desa ||
        data.wilayah_desa ||
        "Karanganom";


    const rt =
        data.rt ||
        data.nomor_rt ||
        "03";


    const rw =
        data.rw ||
        data.nomor_rw ||
        "02";


    const kecamatan =
        data.kecamatan ||
        "Klaten Utara";


    const kabupaten =
        data.kabupaten ||
        data.kota ||
        "Klaten";


    const provinsi =
        data.provinsi ||
        "Jawa Tengah";


    if ($("regionDusun")) {
        $("regionDusun").textContent =
            `Dusun ${dusun}`;
    }


    if ($("regionDesa")) {
        $("regionDesa").textContent =
            `Desa ${desa}`;
    }


    if ($("regionRTRW")) {
        $("regionRTRW").textContent =
            `RT ${rt} / RW ${rw}`;
    }


    if ($("regionKecamatan")) {
        $("regionKecamatan").textContent =
            `Kecamatan ${kecamatan}`;
    }


    if ($("regionKabupaten")) {
        $("regionKabupaten").textContent =
            `Kabupaten ${kabupaten}`;
    }


    if ($("regionProvinsi")) {
        $("regionProvinsi").textContent =
            `Provinsi ${provinsi}`;
    }

}


/* =====================================================
   SALDO KAS
   ===================================================== */

async function loadSaldoKas() {

    const {
        data,
        error
    } = await supabaseClient
        .from("cash_transactions")
        .select(
            "transaction_type,amount,created_at"
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {
        throw error;
    }


    let saldo = 0;


    (data || []).forEach(
        transaction => {

            const type =
                String(
                    transaction.transaction_type ||
                    ""
                ).toLowerCase();


            const amount =
                Number(
                    transaction.amount
                ) || 0;


            if (
                [
                    "masuk",
                    "income",
                    "pemasukan",
                    "jimpitan_transfer"
                ].includes(type)
            ) {

                saldo += amount;

            } else if (
                [
                    "keluar",
                    "expense",
                    "pengeluaran"
                ].includes(type)
            ) {

                saldo -= amount;

            }

        }
    );


    if ($("saldoKas")) {

        $("saldoKas").textContent =
            formatRupiah(saldo);

    }

}


/* =====================================================
   SALDO JIMPITAN
   ===================================================== */

async function loadSaldoJimpitan() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .rpc(
                "get_jimpitan_balance"
            );


        if (error) {
            throw error;
        }


        let saldo = 0;


        if (
            typeof data === "number"
        ) {

            saldo = data;

        } else if (
            Array.isArray(data)
        ) {

            const row =
                data[0] || {};


            saldo =
                Number(
                    row.balance ??
                    row.saldo ??
                    row.total ??
                    0
                );

        } else if (
            data &&
            typeof data === "object"
        ) {

            saldo =
                Number(
                    data.balance ??
                    data.saldo ??
                    data.total ??
                    0
                );

        }


        if ($("saldoJimpitan")) {

            $("saldoJimpitan").textContent =
                formatRupiah(saldo);

        }


    } catch (error) {

        console.error(
            "Gagal memuat saldo jimpitan:",
            error
        );


        if ($("saldoJimpitan")) {

            $("saldoJimpitan").textContent =
                "Rp 0";

        }

    }

}


/* =====================================================
   JIMPITAN BELUM DIAMBIL
   ===================================================== */

async function loadJimpitanBelumDiambil() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    try {

        const {
            data,
            error
        } = await supabaseClient
            .rpc(
                "get_jimpitan_monitoring",
                {
                    p_date: today
                }
            );


        if (error) {
            throw error;
        }


        let jumlah = 0;


        if (Array.isArray(data)) {

            /*
             * Menghitung data yang belum diambil.
             * Menyesuaikan beberapa kemungkinan
             * nama field dari RPC.
             */

            jumlah =
                data.filter(row => {

                    const status =
                        String(
                            row.status ||
                            row.collection_status ||
                            row.jimpitan_status ||
                            ""
                        ).toLowerCase();


                    return (
                        status === "belum" ||
                        status === "belum_diambil" ||
                        status === "pending" ||
                        status === ""
                    );

                }).length;

        }


        if ($("jimpitanBelumDiambil")) {

            $("jimpitanBelumDiambil")
                .textContent = jumlah;

        }


    } catch (error) {

        console.error(
            "Gagal memuat monitoring jimpitan:",
            error
        );


        if ($("jimpitanBelumDiambil")) {

            $("jimpitanBelumDiambil")
                .textContent = "0";

        }

    }

}


/* =====================================================
   AKTIVITAS TERBARU
   ===================================================== */

async function loadAktivitas() {

    const activityList =
        $("activityList");


    if (!activityList) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
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
            throw error;
        }


        const activities =
            data || [];


        if ($("jumlahAktivitas")) {

            $("jumlahAktivitas")
                .textContent =
                activities.length;

        }


        if (!activities.length) {

            activityList.innerHTML = `
                <div class="activity-empty">
                    Belum ada aktivitas terbaru.
                </div>
            `;

            return;

        }


        activityList.innerHTML =
            activities
                .map(
                    item =>
                        renderActivity(item)
                )
                .join("");


    } catch (error) {

        console.error(
            "Gagal memuat aktivitas:",
            error
        );


        if ($("jumlahAktivitas")) {

            $("jumlahAktivitas")
                .textContent = "0";

        }


        activityList.innerHTML = `
            <div class="activity-empty">
                Belum ada aktivitas terbaru.
            </div>
        `;

    }

}


function renderActivity(item) {

    const title =
        escapeHtml(
            item.title ||
            item.notification_title ||
            "Aktivitas SIDAT"
        );


    const message =
        escapeHtml(
            item.message ||
            item.body ||
            item.description ||
            ""
        );


    const date =
        item.created_at
            ? formatDateTime(
                item.created_at
            )
            : "";


    return `
        <div class="activity-item">

            <div class="activity-icon">

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >

                    <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                    ></path>

                    <path
                        d="M10 21h4"
                    ></path>

                </svg>

            </div>


            <div class="activity-content">

                <strong>
                    ${title}
                </strong>

                ${
                    message
                        ? `<span>${message}</span>`
                        : ""
                }

                ${
                    date
                        ? `<small>${date}</small>`
                        : ""
                }

            </div>

        </div>
    `;

}


/* =====================================================
   FORMAT TANGGAL
   ===================================================== */

function formatDateTime(value) {

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
            new Date(value)
        );

    } catch {

        return "";

    }

}


/* =====================================================
   HTML ESCAPE
   ===================================================== */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================================
   BACK BUTTON
   Jangan logout ketika tombol kembali ditekan.
   ===================================================== */

function setupBackProtection() {

    history.pushState(
        null,
        "",
        window.location.href
    );


    window.addEventListener(
        "popstate",
        () => {

            history.pushState(
                null,
                "",
                window.location.href
            );


            const keluar =
                confirm(
                    "Tutup aplikasi SIDAT?\n\n" +
                    "Anda tetap login sebagai BENDAHARA."
                );


            if (keluar) {

                /*
                 * Kembali ke Android/app.
                 * Tidak melakukan logout.
                 */

                if (
                    window.Capacitor &&
                    window.Capacitor.Plugins &&
                    window.Capacitor.Plugins.App
                ) {

                    window.Capacitor.Plugins.App.exitApp();

                }

            }

        }
    );

}


/* =====================================================
   AUTH STATE
   ===================================================== */

function setupAuthListener() {

    supabaseClient.auth
        .onAuthStateChange(
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


                    if (
                        session.refresh_token
                    ) {

                        localStorage.setItem(
                            "sidat_refresh_token",
                            session.refresh_token
                        );

                    }

                }

            }
        );

}


/* =====================================================
   INIT
   ===================================================== */

async function init() {

    showLoading();


    try {

        setupAuthListener();


        const auth =
            await loadSession();


        if (!auth) {
            return;
        }


        const profile =
            await validateRole(
                auth.user
            );


        if (!profile) {
            return;
        }


        await Promise.allSettled([

            loadProfilBendahara(
                auth.user,
                profile
            ),

            loadWilayah(),

            loadSaldoKas(),

            loadSaldoJimpitan(),

            loadJimpitanBelumDiambil(),

            loadAktivitas()

        ]);


        setupBackProtection();


    } catch (error) {

        console.error(
            "SIDAT Dashboard Bendahara:",
            error
        );


        showDashboardError(
            error.message ||
            "Gagal memuat dashboard."
        );

    } finally {

        hideLoading();

    }

}


/* =====================================================
   JALANKAN
   ===================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}

})();