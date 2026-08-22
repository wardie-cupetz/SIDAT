// ==========================================
// SIDAT
// DASHBOARD WARGA
// SISTEM DATA WARGA
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );

const wargaData =
    localStorage.getItem(
        "sidat_user"
    );


// ==========================================
// CEK LOGIN
// ==========================================

if (
    !accessToken ||
    !wargaData
) {

    window.location.href =
        "../index.html";

}


// ==========================================
// DATA WARGA
// ==========================================

let warga = null;


try {

    warga =
        JSON.parse(
            wargaData
        );

} catch (error) {

    console.error(
        "Data warga tidak valid:",
        error
    );

    logoutWarga();

}


// ==========================================
// FORMAT RUPIAH
// ==========================================

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
// SUPABASE REST REQUEST
// ==========================================

async function supabaseGet(
    table,
    query = ""
) {

    const response =
        await fetch(
            `${SUPABASE_URL}/rest/v1/${table}${query}`,
            {

                method:
                    "GET",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"

                }

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            errorText ||
            `Gagal mengambil data ${table}`
        );

    }


    return await response.json();

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTMLDashboard(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


// ==========================================
// FORMAT WAKTU PENGUMUMAN
// ==========================================

function formatWaktuPengumuman(
    tanggal
) {

    if (!tanggal) {

        return "";

    }


    const waktu =
        new Date(
            tanggal
        );


    const sekarang =
        new Date();


    const selisih =
        Math.floor(
            (
                sekarang -
                waktu
            ) / 60000
        );


    if (
        selisih < 1
    ) {

        return "Baru saja";

    }


    if (
        selisih < 60
    ) {

        return `${selisih} menit`;

    }


    const jam =
        Math.floor(
            selisih / 60
        );


    if (
        jam < 24
    ) {

        return `${jam} jam`;

    }


    const hari =
        Math.floor(
            jam / 24
        );


    if (
        hari === 1
    ) {

        return "Kemarin";

    }


    return `${hari} hari`;

}


// ==========================================
// LOAD PROFIL TERBARU
// ==========================================

async function loadProfilTerbaru() {

    try {

        if (!warga) {
            return;
        }


        if (!warga.resident_id) {

            console.warn(
                "SIDAT: resident_id tidak ditemukan."
            );

            return;
        }


        console.log(
            "SIDAT: Mengambil profil:",
            warga.resident_id
        );


        const query =
            "?select=id,resident_code,name,photo_url,phone,jimpitan_balance,is_active" +
            "&id=eq." +
            encodeURIComponent(
                warga.resident_id
            ) +
            "&limit=1";


        const data =
            await supabaseGet(
                "residents",
                query
            );


        if (
            !data ||
            data.length === 0
        ) {

            console.warn(
                "SIDAT: Data residents tidak ditemukan."
            );

            return;
        }


        const profil =
            data[0];


        console.log(
            "SIDAT: DATA PROFIL TERBARU:",
            profil
        );


        console.log(
            "SIDAT: PHOTO URL:",
            profil.photo_url
        );


        warga = {

            ...warga,

            ...profil

        };


        tampilkanDataWarga();


    } catch (error) {

        console.error(
            "SIDAT: Gagal memuat profil terbaru:",
            error
        );

    }

}


// ==========================================
// TAMPILKAN DATA WARGA
// ==========================================

function tampilkanDataWarga() {

    if (!warga) {
        return;
    }


    const nama =
        document.getElementById(
            "wargaName"
        );


    if (nama) {

        nama.textContent =
            warga.name || "Warga";

    }


    const kode =
        document.getElementById(
            "wargaCode"
        );


    if (kode) {

        kode.textContent =
            warga.resident_code || "-";

    }


    const profilePhoto =
        document.getElementById(
            "profilePhoto"
        );


    if (!profilePhoto) {
        return;
    }


    if (
        warga.photo_url &&
        String(
            warga.photo_url
        ).trim() !== ""
    ) {

        console.log(
            "SIDAT FOTO DARI DATABASE:",
            warga.photo_url
        );


        profilePhoto.src =
            warga.photo_url;


        return;

    }


    profilePhoto.src =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
            warga.name || "Warga"
        ) +
        "&background=dcfce7&color=14532d&size=128";

}


// ==========================================
// TERAPKAN WILAYAH KE DASHBOARD
// ==========================================

function terapkanWilayah(
    wilayah
) {

    if (!wilayah) {

        console.warn(
            "SIDAT: Data wilayah kosong."
        );

        return;

    }


    console.log(
        "SIDAT: Menerapkan wilayah warga:",
        wilayah
    );


    // ======================================
    // NAMA WILAYAH
    // ======================================

    const namaWilayah =
        document.getElementById(
            "namaWilayah"
        );


    if (namaWilayah) {

        const rtRw =
            [];


        if (wilayah.rt) {

            rtRw.push(
                `RT ${wilayah.rt}`
            );

        }


        if (wilayah.rw) {

            rtRw.push(
                `RW ${wilayah.rw}`
            );

        }


        namaWilayah.textContent =
            rtRw.length
                ? rtRw.join(" / ")
                : "RT / RW";

    }


    // ======================================
    // KETUA RT
    // ======================================

    const namaKetua =
        document.getElementById(
            "namaKetua"
        );


    if (namaKetua) {

        namaKetua.textContent =
            wilayah.nama_ketua_rt
                ? `Ketua RT: ${wilayah.nama_ketua_rt}`
                : "Ketua RT";

    }


    // ======================================
    // LOGO HEADER
    // ======================================

    const brandLogo =
        document.querySelector(
            ".brand-logo"
        );


    if (
        brandLogo &&
        wilayah.logo_url
    ) {

        brandLogo.innerHTML = `

            <img
                src="${escapeHTMLDashboard(
                    wilayah.logo_url
                )}"
                alt="Logo RT"
            >

        `;

    }


    // ======================================
    // LOGO WILAYAH
    // ======================================

    const regionLogo =
        document.querySelector(
            ".region-logo"
        );


    if (
        regionLogo &&
        wilayah.logo_url
    ) {

        regionLogo.innerHTML = `

            <img
                src="${escapeHTMLDashboard(
                    wilayah.logo_url
                )}"
                alt="Logo RT"
            >

        `;

    }


    // ======================================
    // NAMA APLIKASI
    // ======================================

    if (
        wilayah.nama_aplikasi
    ) {

        document.title =
            `${wilayah.nama_aplikasi} - Dashboard Warga`;

    }


    // ======================================
    // THEME COLOR
    // TIDAK MENGUBAH TEMA CSS
    // HANYA META HP
    // ======================================

    const metaTheme =
        document.querySelector(
            'meta[name="theme-color"]'
        );


    if (metaTheme) {

        metaTheme.setAttribute(
            "content",
            "#15803d"
        );

    }


    console.log(
        "SIDAT: Wilayah warga berhasil diterapkan."
    );

}



// ==========================================
// LOAD STATISTIK WARGA
// ==========================================

async function loadStatistikWarga() {

    try {

        const response =
            await fetch(

                `${SUPABASE_URL}/rest/v1/rpc/get_resident_statistics`,

                {

                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({})

                }

            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Gagal mengambil statistik warga"
            );

        }


        const data =
            await response.json();


        console.log(
            "Statistik warga:",
            data
        );


        const totalWarga =
            document.getElementById(
                "totalWarga"
            );


        const totalKK =
            document.getElementById(
                "totalKK"
            );


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


        if (totalWarga) {

            totalWarga.textContent =
                Number(
                    statistik?.total_warga
                ) || 0;

        }


        if (totalKK) {

            totalKK.textContent =
                Number(
                    statistik?.total_kk
                ) || 0;

        }


    } catch (error) {

        console.error(
            "Gagal mengambil statistik warga:",
            error
        );


        const totalWarga =
            document.getElementById(
                "totalWarga"
            );


        const totalKK =
            document.getElementById(
                "totalKK"
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


// ==========================================
// LOAD SALDO JIMPITAN
// ==========================================

async function loadSaldoJimpitan() {

    try {

        const response =
            await fetch(

                `${SUPABASE_URL}/rest/v1/rpc/get_jimpitan_balance`,

                {

                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({})

                }

            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Gagal mengambil saldo jimpitan"
            );

        }


        const data =
            await response.json();


        console.log(
            "Saldo jimpitan total:",
            data
        );


        const saldoJimpitan =
            document.getElementById(
                "saldoJimpitan"
            );


        let saldo =
            data;


        if (
            Array.isArray(
                saldo
            )
        ) {

            saldo =
                saldo[0] || 0;

        }


        if (
            typeof saldo ===
            "object" &&
            saldo !== null
        ) {

            saldo =
                saldo.balance ??
                saldo.saldo ??
                saldo.get_jimpitan_balance ??
                0;

        }


        if (saldoJimpitan) {

            saldoJimpitan.textContent =
                formatRupiah(
                    saldo
                );

        }


    } catch (error) {

        console.error(
            "Gagal mengambil saldo jimpitan:",
            error
        );


        const saldoJimpitan =
            document.getElementById(
                "saldoJimpitan"
            );


        if (saldoJimpitan) {

            saldoJimpitan.textContent =
                formatRupiah(
                    0
                );

        }

    }

}


// ==========================================
// LOAD SALDO KAS RT
// ==========================================

async function loadSaldoKas() {

    try {

        const data =
            await supabaseGet(
                "cash_transactions",
                "?select=transaction_type,amount"
            );


        let saldo =
            0;


        data.forEach(
            transaksi => {

                const amount =
                    Number(
                        transaksi.amount
                    ) || 0;


                const type =
                    String(
                        transaksi.transaction_type ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                if (

                    type === "masuk" ||

                    type === "income" ||

                    type === "pemasukan" ||

                    type === "jimpitan_transfer"

                ) {

                    saldo +=
                        amount;

                }


                else if (

                    type === "keluar" ||

                    type === "expense" ||

                    type === "pengeluaran"

                ) {

                    saldo -=
                        amount;

                }

            }
        );


        console.log(
            "SIDAT DASHBOARD - SALDO KAS RT:",
            saldo
        );


        const saldoKas =
            document.getElementById(
                "saldoKas"
            );


        if (saldoKas) {

            saldoKas.textContent =
                formatRupiah(
                    saldo
                );

        }


    } catch (error) {

        console.error(
            "Gagal mengambil saldo kas:",
            error
        );


        const saldoKas =
            document.getElementById(
                "saldoKas"
            );


        if (saldoKas) {

            saldoKas.textContent =
                formatRupiah(
                    0
                );

        }

    }

}
// ==========================================
// LOAD WILAYAH SIDAT
// ==========================================

async function loadWilayah() {

    try {

        console.log(
            "SIDAT: Memuat identitas wilayah warga..."
        );


        const data =
            await supabaseGet(
                "wilayah",
                "?select=id,nama_aplikasi,nama_dusun,nama_desa,rt,rw,nama_ketua_rt,kecamatan,kabupaten,provinsi,logo_url&limit=1"
            );


        console.log(
            "SIDAT DATA WILAYAH WARGA:",
            data
        );


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            console.warn(
                "SIDAT: Data wilayah belum tersedia."
            );

            return;

        }


        const wilayah =
            data[0];


        // ======================================
        // NAMA RT / RW
        // ======================================

        const namaWilayah =
            document.getElementById(
                "namaWilayah"
            );


        if (namaWilayah) {

            const rtRw = [];


            if (wilayah.rt) {

                rtRw.push(
                    `RT ${wilayah.rt}`
                );

            }


            if (wilayah.rw) {

                rtRw.push(
                    `RW ${wilayah.rw}`
                );

            }


            namaWilayah.textContent =
                rtRw.length
                    ? rtRw.join(" / ")
                    : "RT / RW";

        }


        // ======================================
        // NAMA KETUA RT
        // ======================================

        const namaKetua =
            document.getElementById(
                "namaKetua"
            );


        if (namaKetua) {

            namaKetua.textContent =
                wilayah.nama_ketua_rt
                    ? `Ketua RT: ${wilayah.nama_ketua_rt}`
                    : "Ketua RT";

        }


        // ======================================
        // INFORMASI WILAYAH LENGKAP
        // ======================================

        let wilayahLengkap =
            [];


        if (wilayah.nama_dusun) {

            wilayahLengkap.push(
                `Dusun ${wilayah.nama_dusun}`
            );

        }


        if (wilayah.nama_desa) {

            wilayahLengkap.push(
                `Desa ${wilayah.nama_desa}`
            );

        }


        if (wilayah.kecamatan) {

            wilayahLengkap.push(
                `Kec. ${wilayah.kecamatan}`
            );

        }


        if (wilayah.kabupaten) {

            wilayahLengkap.push(
                `Kab. ${wilayah.kabupaten}`
            );

        }


        if (wilayah.provinsi) {

            wilayahLengkap.push(
                wilayah.provinsi
            );

        }


        // ======================================
        // BUAT ELEMENT INFORMASI WILAYAH
        // ======================================

        let detailWilayah =
            document.getElementById(
                "detailWilayah"
            );


        if (!detailWilayah) {

            detailWilayah =
                document.createElement(
                    "p"
                );


            detailWilayah.id =
                "detailWilayah";


            detailWilayah.className =
                "detail-wilayah";


            const regionInfo =
                document.querySelector(
                    ".region-info"
                );


            if (regionInfo) {

                regionInfo.appendChild(
                    detailWilayah
                );

            }

        }


        if (detailWilayah) {

            detailWilayah.textContent =
                wilayahLengkap.length
                    ? wilayahLengkap.join(" • ")
                    : "Informasi wilayah belum diatur.";

        }


        // ======================================
        // LOGO HEADER
        // ======================================

        const brandLogo =
            document.querySelector(
                ".brand-logo"
            );


        if (
            brandLogo &&
            wilayah.logo_url &&
            String(
                wilayah.logo_url
            ).trim() !== ""
        ) {

            brandLogo.innerHTML = `

                <img
                    src="${escapeHTMLDashboard(
                        wilayah.logo_url
                    )}"
                    alt="Logo RT"
                >

            `;

        }


        // ======================================
        // LOGO WILAYAH
        // ======================================

        const regionLogo =
            document.querySelector(
                ".region-logo"
            );


        if (
            regionLogo &&
            wilayah.logo_url &&
            String(
                wilayah.logo_url
            ).trim() !== ""
        ) {

            regionLogo.innerHTML = `

                <img
                    src="${escapeHTMLDashboard(
                        wilayah.logo_url
                    )}"
                    alt="Logo RT"
                >

            `;

        }


        // ======================================
        // NAMA APLIKASI
        // ======================================

        const titleElement =
            document.querySelector(
                ".brand h1"
            );


        if (titleElement) {

            titleElement.textContent =
                wilayah.nama_aplikasi ||
                "SIDAT";

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
            "SIDAT: Wilayah lengkap berhasil diterapkan."
        );


    } catch (error) {

        console.error(
            "SIDAT LOAD WILAYAH ERROR:",
            error
        );

    }

}


// ==========================================
// LOAD PREVIEW PENGUMUMAN
// ==========================================

async function loadPreviewPengumuman() {

    const container =
        document.getElementById(
            "previewPengumuman"
        );


    const badge =
        document.getElementById(
            "badgePengumuman"
        );


    if (!container) {

        console.log(
            "Element previewPengumuman tidak ditemukan."
        );

        return;

    }


    try {

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            throw new Error(
                "Session warga tidak ditemukan."
            );

        }


        const response =
            await fetch(

                `${SUPABASE_URL}/rest/v1/announcements?select=id,title,content,created_at,is_active&is_active=eq.true&order=created_at.desc&limit=3`,

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    }

                }

            );


        console.log(
            "STATUS PENGUMUMAN:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                `Gagal memuat pengumuman (${response.status})`
            );

        }


        const data =
            await response.json();


        console.log(
            "PENGUMUMAN WARGA:",
            data
        );


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `

                <div class="pengumuman-kosong">

                    Belum ada pengumuman baru.

                </div>

            `;


            if (badge) {

                badge.classList.add(
                    "hidden"
                );

            }

            return;

        }


        container.innerHTML =
            data
                .map(
                    item => {

                        return `

                            <div
                                class="preview-item-pengumuman"
                                onclick="bukaPengumumanWarga()"
                            >

                                <div
                                    class="preview-item-icon"
                                >
                                    📢
                                </div>


                                <div
                                    class="preview-item-content"
                                >

                                    <strong>
                                        ${escapeHTMLDashboard(
                                            item.title
                                        )}
                                    </strong>


                                    <p>
                                        ${escapeHTMLDashboard(
                                            item.content
                                        )}
                                    </p>

                                </div>


                                <div
                                    class="preview-item-time"
                                >

                                    ${formatWaktuPengumuman(
                                        item.created_at
                                    )}

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        if (badge) {

            badge.textContent =
                data.length > 9
                    ? "9+"
                    : data.length;


            badge.classList.remove(
                "hidden"
            );

        }


    } catch (error) {

        console.error(
            "Gagal memuat pengumuman:",
            error
        );

    }

}


// ==========================================
// LOAD BADGE IKON NOTIFIKASI
// MENGGUNAKAN notification_reads
// ==========================================

async function loadBadgeIkonNotifikasi() {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) {

        console.log(
            "SIDAT: notificationBadge tidak ditemukan."
        );

        return;

    }


    try {

        // ==================================
        // SESSION
        // ==================================

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            console.log(
                "SIDAT: Session warga tidak ditemukan."
            );

            return;

        }


        // ==================================
        // AMBIL DATA WARGA
        // ==================================

        const dataWarga =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) ||
                "{}"
            );


        const userId =
            dataWarga.id ||
            null;


        const residentId =
            dataWarga.resident_id ||
            dataWarga.residentId ||
            dataWarga.id_resident ||
            null;


        console.log(
            "SIDAT BADGE USER ID:",
            userId
        );


        console.log(
            "SIDAT BADGE RESIDENT ID:",
            residentId
        );


        if (!userId) {

            console.warn(
                "SIDAT: User ID tidak ditemukan."
            );

            badge.classList.add(
                "hidden"
            );

            return;

        }


        // ==================================
        // AMBIL NOTIFIKASI
        // ==================================

        let urlNotifikasi =
            `${SUPABASE_URL}` +
            `/rest/v1/notifications` +
            `?select=id,target_type,target_resident_id`;


        // ----------------------------------
        // NOTIFIKASI UNTUK:
        // 1. SEMUA WARGA
        // 2. WARGA TERTENTU
        // ----------------------------------

        if (residentId) {

            urlNotifikasi +=
                `&or=` +
                `(target_type.eq.all,` +
                `and(` +
                `target_type.eq.resident,` +
                `target_resident_id.eq.${encodeURIComponent(
                    residentId
                )}` +
                `))`;

        }

        else {

            urlNotifikasi +=
                `&target_type=eq.all`;

        }


        console.log(
            "SIDAT URL BADGE NOTIFIKASI:",
            urlNotifikasi
        );


        const notificationResponse =
            await fetch(

                urlNotifikasi,

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


        if (
            !notificationResponse.ok
        ) {

            const errorText =
                await notificationResponse.text();


            console.error(
                "SIDAT ERROR BADGE NOTIFIKASI:",
                errorText
            );

            throw new Error(
                errorText ||
                "Gagal mengambil notifikasi."
            );

        }


        const notifications =
            await notificationResponse.json();


        if (
            !Array.isArray(
                notifications
            )
        ) {

            throw new Error(
                "Format data notifikasi tidak valid."
            );

        }


        console.log(
            "SIDAT TOTAL NOTIFIKASI:",
            notifications.length
        );


        // ==================================
        // JIKA TIDAK ADA NOTIFIKASI
        // ==================================

        if (
            notifications.length ===
            0
        ) {

            badge.textContent =
                "0";

            badge.classList.add(
                "hidden"
            );

            return;

        }


        // ==================================
        // AMBIL STATUS BACA USER
        // ==================================

        const urlReads =
            `${SUPABASE_URL}` +
            `/rest/v1/notification_reads` +
            `?select=notification_id` +
            `&user_id=eq.${encodeURIComponent(
                userId
            )}`;


        console.log(
            "SIDAT URL BADGE READS:",
            urlReads
        );


        const readsResponse =
            await fetch(

                urlReads,

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


        if (
            !readsResponse.ok
        ) {

            const errorText =
                await readsResponse.text();


            console.error(
                "SIDAT ERROR BADGE READS:",
                errorText
            );

            throw new Error(
                errorText ||
                "Gagal mengambil status baca."
            );

        }


        const reads =
            await readsResponse.json();


        // ==================================
        // BUAT SET NOTIFIKASI SUDAH DIBACA
        // ==================================

        const sudahDibaca =
            new Set(

                Array.isArray(
                    reads
                )

                    ? reads.map(
                        item =>
                            String(
                                item.notification_id
                            )
                    )

                    : []

            );


        console.log(
            "SIDAT NOTIFIKASI SUDAH DIBACA:",
            [
                ...sudahDibaca
            ]
        );


        // ==================================
        // HITUNG BELUM DIBACA
        // ==================================

        const belumDibaca =
            notifications.filter(
                item =>
                    !sudahDibaca.has(
                        String(
                            item.id
                        )
                    )
            );


        const jumlah =
            belumDibaca.length;


        console.log(
            "SIDAT NOTIFIKASI BELUM DIBACA:",
            jumlah
        );


        // ==================================
        // TAMPILKAN BADGE
        // ==================================

        if (
            jumlah > 0
        ) {

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

    catch (
        error
    ) {

        console.error(
            "SIDAT: Gagal memuat badge ikon notifikasi:",
            error
        );


        badge.textContent =
            "0";


        badge.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// BUKA PENGUMUMAN
// ==========================================

function bukaPengumumanWarga() {

    window.location.href =
        "pengumuman.html";

}


function bukaNotifikasi() {

    window.location.href =
        "notifikasi.html";

}


// ==========================================
// TOMBOL LIHAT SEMUA PENGUMUMAN
// ==========================================

function pasangTombolPengumuman() {

    const tombol =
        document.getElementById(
            "btnLihatPengumuman"
        );


    if (!tombol) {

        return;

    }


    tombol.addEventListener(
        "click",
        function() {

            window.location.href =
                "pengumuman.html";

        }
    );

}


// ==========================================
// MENU PROFIL
// ==========================================

function bukaProfil() {

    window.location.href =
        "profil.html";

}


// ==========================================
// DATA WARGA
// ==========================================

function bukaDataWarga() {

    window.location.href =
        "data-warga.html";

}


// ==========================================
// RIWAYAT JIMPITAN
// ==========================================

function bukaRiwayatJimpitan() {

    window.location.href =
        "riwayat-jimpitan.html";

}


// ==========================================
// SCAN QR
// ==========================================

function bukaScanQR() {

    window.location.href =
        "scan-jimpitan.html";

}


// ==========================================
// LAPORAN
// ==========================================

function bukaLaporan() {

    window.location.href =
        "laporan.html";

}


// ==========================================
// KAS
// ==========================================

function bukaSaldoKas() {

    window.location.href =
        "kas.html";

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutWarga() {

    localStorage.removeItem(
        "sidat_access_token"
    );


    localStorage.removeItem(
        "sidat_user"
    );


    localStorage.removeItem(
        "sidat_warga"
    );


    localStorage.removeItem(
        "sidat_wilayah_data"
    );


    window.location.href =
        "../index.html";

}


// ==========================================
// PASANG EVENT LOGOUT
// ==========================================

function pasangEventLogout() {

    const tombol =
        document.querySelectorAll(
            '[onclick*="logoutWarga"]'
        );


    tombol.forEach(
        button => {

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    logoutWarga();

                }
            );

        }
    );

}


// ==========================================
// INIT DASHBOARD
// ==========================================

async function initDashboard() {

    console.log(
        "Memuat Dashboard SIDAT..."
    );


    // ======================================
    // DATA WARGA
    // ======================================

    tampilkanDataWarga();


    await loadProfilTerbaru();

    // ======================================
    // PUSH NOTIFICATION
    // ======================================

    if (typeof daftarkanPushNotification === "function") {

        await daftarkanPushNotification();

    }


    // ======================================
    // EVENT
    // ======================================

    pasangEventLogout();

    pasangTombolPengumuman();


    // ======================================
    // LOAD DATA DASHBOARD
    // ======================================

    await Promise.allSettled([

        loadWilayah(),

        loadStatistikWarga(),

        loadSaldoJimpitan(),

        loadSaldoKas(),

        loadPreviewPengumuman(),

        loadBadgeIkonNotifikasi()

    ]);


    console.log(
        "SIDAT: Dashboard Warga siap."
    );

}


// ==========================================
// START
// ==========================================

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