// ==========================================
// SIDAT
// JIMPITAN TRANSFER
// Dibuat oleh Suwardi
// ==========================================

console.log(
    "SIDAT - Transfer Jimpitan"
);


// ==========================================
// ICON SVG
// ==========================================

const SVG_INFO = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 10v6"></path>
    <circle
        cx="12"
        cy="7"
        r="1"
        fill="currentColor"
        stroke="none"
    ></circle>
</svg>
`;

const SVG_CALENDAR = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
    ></rect>
    <path d="M8 3v4"></path>
    <path d="M16 3v4"></path>
    <path d="M4 9h16"></path>
</svg>
`;

const SVG_USER = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <circle
        cx="12"
        cy="8"
        r="3"
    ></circle>
    <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"></path>
</svg>
`;

const SVG_SUCCESS = `
<svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="
        width:24px;
        height:24px;
        min-width:24px;
        min-height:24px;
        max-width:24px;
        max-height:24px;
        display:inline-block;
        vertical-align:middle;
        flex:none;
    "
>
    <path d="M5 12.5l4.2 4.2L19 7"></path>
</svg>
`;
const SVG_ERROR = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 8v5"></path>
    <path d="M12 16h.01"></path>
</svg>
`;


// ==========================================
// DATA
// ==========================================

let transaksiJimpitan = [];

let transaksiTerpilih = new Set();


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


// ==========================================
// CEK SESSION
// ==========================================

if (!accessToken) {

    console.warn(
        "SIDAT: access token tidak ditemukan."
    );

}


// ==========================================
// HEADER SUPABASE
// ==========================================

function supabaseHeaders() {

    return {

        "apikey":
            SUPABASE_KEY,

        "Authorization":
            `Bearer ${accessToken}`,

        "Content-Type":
            "application/json"

    };

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
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }
    ).format(
        Number(nominal) || 0
    );

}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatTanggal(
    tanggal
) {

    if (!tanggal) {

        return "-";

    }


    const date =
        new Date(
            tanggal + "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return tanggal;

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}
// ==========================================
// FILTER & REKAP KELOMPOK HARI
// ==========================================

const NAMA_HARI = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
];


let transaksiJimpitanSemua = [];

let tanggalFilterMulai = "";

let tanggalFilterAkhir = "";


// ==========================================
// AMBIL HARI DARI TANGGAL
// ==========================================

function getNamaHari(
    tanggal
) {

    if (!tanggal) {

        return null;

    }


    const date =
        new Date(
            tanggal + "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return NAMA_HARI[
        date.getDay()
    ];

}


// ==========================================
// FILTER TRANSAKSI BERDASARKAN PERIODE
// ==========================================

function getTransaksiDalamPeriode() {

    return transaksiJimpitanSemua.filter(
        transaksi => {

            const tanggal =
                String(
                    transaksi.transaction_date || ""
                );


            if (!tanggal) {

                return false;

            }


            if (
                tanggalFilterMulai &&
                tanggal < tanggalFilterMulai
            ) {

                return false;

            }


            if (
                tanggalFilterAkhir &&
                tanggal > tanggalFilterAkhir
            ) {

                return false;

            }


            return true;

        }
    );

}


// ==========================================
// REKAP JIMPITAN PER HARI
// ==========================================

function renderRekapHarian() {

    const container =
        document.getElementById(
            "dailySummaryList"
        );


    if (!container) {

        return;

    }


    const data =
        getTransaksiDalamPeriode();


    const totalPerHari = {

        Senin: 0,

        Selasa: 0,

        Rabu: 0,

        Kamis: 0,

        Jumat: 0,

        Sabtu: 0,

        Minggu: 0

    };


    data.forEach(
        transaksi => {

            const hari =
                getNamaHari(
                    transaksi.transaction_date
                );


            if (!hari) {

                return;

            }


            totalPerHari[hari] +=
                Number(
                    transaksi.amount || 0
                );

        }
    );


    const warnaHari = {

        Senin: "senin",

        Selasa: "selasa",

        Rabu: "rabu",

        Kamis: "kamis",

        Jumat: "jumat",

        Sabtu: "sabtu",

        Minggu: "minggu"

    };


    const jumlahTransaksiPerHari = {

        Senin: 0,

        Selasa: 0,

        Rabu: 0,

        Kamis: 0,

        Jumat: 0,

        Sabtu: 0,

        Minggu: 0

    };


    data.forEach(
        transaksi => {

            const hari =
                getNamaHari(
                    transaksi.transaction_date
                );


            if (!hari) {

                return;

            }


            jumlahTransaksiPerHari[hari]++;

        }
    );


    if (data.length === 0) {

        container.innerHTML = `

            <div class="daily-summary-empty">

                ${SVG_INFO}

                <span>
                    Tidak ada jimpitan belum ditransfer
                    pada periode yang dipilih.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    const urutanHari = [
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
        "Minggu"
    ];


    urutanHari.forEach(
        hari => {

            const nominal =
                totalPerHari[hari];


            const jumlah =
                jumlahTransaksiPerHari[hari];


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `daily-summary-card ${warnaHari[hari]}`;


            card.innerHTML = `

                <div class="daily-summary-icon">

                    ${SVG_CALENDAR}

                </div>


                <div class="daily-summary-info">

                    <strong>
                        ${hari}
                    </strong>

                    <span>
                        ${jumlah} transaksi
                    </span>

                </div>


                <div class="daily-summary-amount">

                    ${formatRupiah(nominal)}

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// ==========================================
// TERAPKAN FILTER PERIODE
// ==========================================

function terapkanFilterJimpitan() {

    const mulai =
        document.getElementById(
            "filterTanggalMulai"
        )?.value || "";


    const akhir =
        document.getElementById(
            "filterTanggalAkhir"
        )?.value || "";


    if (
        mulai &&
        akhir &&
        mulai > akhir
    ) {

        showMessage(
            `
                ${SVG_ERROR}

                <strong>
                    Periode tanggal tidak valid.
                </strong>

                <br>

                Tanggal mulai tidak boleh
                lebih besar dari tanggal akhir.
            `,
            "error"
        );

        return;

    }


    tanggalFilterMulai =
        mulai;


    tanggalFilterAkhir =
        akhir;


    transaksiJimpitan =
        getTransaksiDalamPeriode();


    /*
     * Bersihkan pilihan transaksi yang
     * berada di luar periode.
     */

    transaksiTerpilih =
        new Set(
            [
                ...transaksiTerpilih
            ].filter(
                id =>
                    transaksiJimpitan.some(
                        transaksi =>
                            transaksi.id === id
                    )
            )
        );


    renderTransaksi();

    updateRingkasan();

    renderRekapHarian();

    updateInfoPeriode();


    const section =
        document.querySelector(
            ".daily-summary-section"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ==========================================
// INFORMASI PERIODE
// ==========================================

function updateInfoPeriode() {

    const element =
        document.getElementById(
            "periodeFilterInfo"
        );


    if (!element) {

        return;

    }


    if (
        !tanggalFilterMulai &&
        !tanggalFilterAkhir
    ) {

        element.textContent =
            "Semua periode";

        return;

    }


    const mulai =
        tanggalFilterMulai
            ? formatTanggal(
                tanggalFilterMulai
            )
            : "Awal data";


    const akhir =
        tanggalFilterAkhir
            ? formatTanggal(
                tanggalFilterAkhir
            )
            : "Akhir data";


    element.textContent =
        `${mulai} – ${akhir}`;

}


// ==========================================
// LOAD TRANSAKSI
// ==========================================

async function loadTransaksi() {

    const list =
        document.getElementById(
            "transactionList"
        );


    if (list) {

        list.innerHTML = `
            <div class="loading">
                Memuat transaksi...
            </div>
        `;

    }


    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_untransferred_jimpitan`,
                {
                    method: "POST",
                    headers:
                        supabaseHeaders(),
                    body:
                        JSON.stringify({})
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


        const result =
            await response.json();


        transaksiJimpitanSemua =
    Array.isArray(result)
        ? result
        : [];


transaksiJimpitan =
    getTransaksiDalamPeriode();

        transaksiTerpilih =
            new Set(
                [
                    ...transaksiTerpilih
                ].filter(
                    id =>
                        transaksiJimpitan.some(
                            item =>
                                item.id === id
                        )
                )
            );


        renderTransaksi();

updateRingkasan();

renderRekapHarian();

updateInfoPeriode();


        console.log(
            "Transaksi belum ditransfer:",
            transaksiJimpitan
        );

    }

    catch (error) {

        console.error(
            "Load transaksi jimpitan error:",
            error
        );


        if (list) {

            list.innerHTML = `
                <div class="empty">
                    ${SVG_ERROR}
                    <span>
                        Gagal memuat transaksi.
                    </span>

                    <br><br>

                    ${escapeHTML(
                        error.message ||
                        "Terjadi kesalahan."
                    )}
                </div>
            `;

        }

    }

}


// ==========================================
// RENDER TRANSAKSI
// ==========================================

function renderTransaksi() {

    const list =
        document.getElementById(
            "transactionList"
        );


    if (!list) {

        return;

    }


    if (
    transaksiJimpitan.length === 0
) {
    list.innerHTML = `
        <div class="empty">
            <span class="empty-success-icon">
                ${SVG_SUCCESS}
            </span>

            <span>
                Semua jimpitan
                sudah ditransfer ke kas RT.
            </span>
        </div>
    `;

        return;

    }


    list.innerHTML = "";


    transaksiJimpitan.forEach(
        transaksi => {

            const id =
                transaksi.id;


            const checked =
                transaksiTerpilih.has(
                    id
                );


            const nama =
                escapeHTML(
                    transaksi.resident_name ||
                    "-"
                );


            const kode =
                escapeHTML(
                    transaksi.resident_code ||
                    "-"
                );


            const petugas =
                escapeHTML(
                    transaksi.collector_name ||
                    "Petugas"
                );


            const tanggal =
                formatTanggal(
                    transaksi.transaction_date
                );


            const nominal =
                Number(
                    transaksi.amount || 0
                );


            const item =
                document.createElement(
                    "label"
                );


            item.className =
                "transaction-item" +
                (
                    checked
                        ? " selected"
                        : ""
                );


            item.innerHTML = `

                <input
                    type="checkbox"
                    class="transaction-checkbox"
                    data-id="${escapeHTML(id)}"
                    ${checked ? "checked" : ""}
                >


                <div
                    class="transaction-info"
                >

                    <div
                        class="transaction-name"
                    >
                        ${nama}
                    </div>


                    <div
                        class="transaction-meta"
                    >

                        <span>
                            ID: ${kode}
                        </span>

                        <span class="meta-icon-item">
                            ${SVG_CALENDAR}
                            ${tanggal}
                        </span>

                        <span class="meta-icon-item">
                            ${SVG_USER}
                            ${petugas}
                        </span>

                    </div>

                </div>


                <div
                    class="transaction-amount"
                >
                    ${formatRupiah(
                        nominal
                    )}
                </div>

            `;


            const checkbox =
                item.querySelector(
                    ".transaction-checkbox"
                );


            checkbox.addEventListener(
                "change",
                function () {

                    if (
                        this.checked
                    ) {

                        transaksiTerpilih.add(
                            id
                        );

                        item.classList.add(
                            "selected"
                        );

                    }

                    else {

                        transaksiTerpilih.delete(
                            id
                        );

                        item.classList.remove(
                            "selected"
                        );

                    }


                    updateRingkasan();

                }
            );


            list.appendChild(
                item
            );

        }
    );

}


// ==========================================
// UPDATE RINGKASAN
// ==========================================

function updateRingkasan() {

    const total =
        transaksiJimpitan.reduce(
            (
                jumlah,
                transaksi
            ) => {

                return (
                    jumlah +
                    Number(
                        transaksi.amount || 0
                    )
                );

            },
            0
        );


    const terpilih =
        transaksiJimpitan.filter(
            transaksi =>
                transaksiTerpilih.has(
                    transaksi.id
                )
        );


    const totalDipilih =
        terpilih.reduce(
            (
                jumlah,
                transaksi
            ) => {

                return (
                    jumlah +
                    Number(
                        transaksi.amount || 0
                    )
                );

            },
            0
        );


    const totalElement =
        document.getElementById(
            "totalBelumTransfer"
        );


    if (totalElement) {

        totalElement.textContent =
            formatRupiah(
                total
            );

    }


    const jumlahElement =
        document.getElementById(
            "jumlahBelumTransfer"
        );


    if (jumlahElement) {

        jumlahElement.textContent =
            `${transaksiJimpitan.length} transaksi`;

    }


    const dipilihElement =
        document.getElementById(
            "totalDipilih"
        );


    if (dipilihElement) {

        dipilihElement.textContent =
            formatRupiah(
                totalDipilih
            );

    }


    const jumlahDipilihElement =
        document.getElementById(
            "jumlahDipilih"
        );


    if (jumlahDipilihElement) {

        jumlahDipilihElement.textContent =
            `${terpilih.length} transaksi`;

    }


    const button =
        document.getElementById(
            "btnTransfer"
        );


    if (button) {

        button.disabled =
            terpilih.length === 0;

    }

}


// ==========================================
// PILIH SEMUA
// ==========================================

function pilihSemua() {

    if (
        transaksiJimpitan.length === 0
    ) {

        return;

    }


    const semuaSudahDipilih =
        transaksiJimpitan.every(
            transaksi =>
                transaksiTerpilih.has(
                    transaksi.id
                )
        );


    if (
        semuaSudahDipilih
    ) {

        transaksiTerpilih.clear();

    }

    else {

        transaksiJimpitan.forEach(
            transaksi => {

                transaksiTerpilih.add(
                    transaksi.id
                );

            }
        );

    }


    renderTransaksi();

    updateRingkasan();

}
// ==========================================
// TOMBOL TERAPKAN FILTER
// ==========================================

const btnTerapkanFilterJimpitan =
    document.getElementById(
        "btnTerapkanFilterJimpitan"
    );


if (btnTerapkanFilterJimpitan) {

    btnTerapkanFilterJimpitan.addEventListener(
        "click",
        terapkanFilterJimpitan
    );

}

// ==========================================
// TOMBOL PILIH SEMUA
// ==========================================

const btnPilihSemua =
    document.getElementById(
        "btnPilihSemua"
    );


if (btnPilihSemua) {

    btnPilihSemua.addEventListener(
        "click",
        pilihSemua
    );

}


// ==========================================
// PESAN
// ==========================================

function showMessage(
    message,
    type
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    if (!box) {

        return;

    }


    box.hidden =
        false;


    box.className =
        `message-box ${type}`;


    box.innerHTML =
        message;


    box.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


// ==========================================
// TRANSFER KE KAS
// ==========================================

async function transferKeKas() {

    if (
        transaksiTerpilih.size === 0
    ) {

        showMessage(
            "Pilih minimal satu transaksi.",
            "error"
        );

        return;

    }


    const ids =
        [
            ...transaksiTerpilih
        ];


    const dataTerpilih =
        transaksiJimpitan.filter(
            transaksi =>
                transaksiTerpilih.has(
                    transaksi.id
                )
        );


    const total =
        dataTerpilih.reduce(
            (
                jumlah,
                transaksi
            ) => {

                return (
                    jumlah +
                    Number(
                        transaksi.amount || 0
                    )
                );

            },
            0
        );


    const konfirmasi =
        confirm(
            `Transfer ${formatRupiah(total)} ke Kas RT?\n\n` +
            `${dataTerpilih.length} transaksi akan dipindahkan.`
        );


    if (!konfirmasi) {

        return;

    }


    const button =
        document.getElementById(
            "btnTransfer"
        );


    if (button) {

        button.disabled =
            true;

        button.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M12 3v4"></path>
                <path d="M12 17v4"></path>
                <path d="M3 12h4"></path>
                <path d="M17 12h4"></path>
            </svg>

            <span>
                Memproses transfer...
            </span>
        `;

    }


    try {

        const userResponse =
            await fetch(
                `${SUPABASE_URL}/auth/v1/user`,
                {
                    method: "GET",
                    headers:
                        supabaseHeaders()
                }
            );


        if (!userResponse.ok) {

            throw new Error(
                "Session admin tidak valid."
            );

        }


        const adminUser =
            await userResponse.json();


        if (
            !adminUser ||
            !adminUser.id
        ) {

            throw new Error(
                "ID admin tidak ditemukan."
            );

        }


        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/transfer_jimpitan_to_cash`,
                {
                    method: "POST",

                    headers:
                        supabaseHeaders(),

                    body:
                        JSON.stringify({

                            p_transaction_ids:
                                ids,

                            p_admin_id:
                                adminUser.id

                        })
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            let errorMessage =
                errorText;


            try {

                const errorJSON =
                    JSON.parse(
                        errorText
                    );


                errorMessage =
                    errorJSON.message ||
                    errorJSON.error ||
                    errorText;

            }

            catch (_) {

                // Gunakan pesan asli

            }


            throw new Error(
                errorMessage ||
                `Transfer gagal. HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "Transfer berhasil:",
            result
        );


        showMessage(
            `
                ${SVG_SUCCESS}

                <strong>
                    Transfer berhasil.
                </strong>

                <br>

                ${formatRupiah(total)}
                telah masuk ke Kas RT.

                <br>

                ${dataTerpilih.length}
                transaksi diproses.
            `,
            "success"
        );


        transaksiTerpilih.clear();


        await loadTransaksi();


    }

    catch (error) {

        console.error(
            "Transfer jimpitan error:",
            error
        );


        showMessage(
            `
                ${SVG_ERROR}

                <strong>
                    Transfer gagal.
                </strong>

                <br>

                ${escapeHTML(
                    error.message ||
                    "Terjadi kesalahan."
                )}
            `,
            "error"
        );

    }


    finally {

        if (button) {

            button.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <rect
                        x="3"
                        y="6"
                        width="18"
                        height="13"
                        rx="2"
                    ></rect>

                    <path d="M3 10h18"></path>

                    <path d="M12 12v5"></path>

                    <path d="M9.5 14.5L12 17l2.5-2.5"></path>
                </svg>

                <span>
                    Transfer ke Kas RT
                </span>
            `;

        }


        updateRingkasan();

    }

}


// ==========================================
// EVENT TRANSFER
// ==========================================

const btnTransfer =
    document.getElementById(
        "btnTransfer"
    );


if (btnTransfer) {

    btnTransfer.addEventListener(
        "click",
        transferKeKas
    );

}


// ==========================================
// KEMBALI DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// INIT
// ==========================================

async function initTransferJimpitan() {

    console.log(
        "SIDAT: memuat transfer jimpitan..."
    );


    await loadTransaksi();


    console.log(
        "SIDAT: transfer jimpitan siap."
    );

}


initTransferJimpitan();
// =========================================================
// CETAK REKAP JIMPITAN
// REKAP HANYA BERDASARKAN KELOMPOK HARI
// =========================================================

function cetakRekapJimpitan() {

    try {

        // ==========================================
        // FILTER PERIODE
        // ==========================================

        const mulai =
            document.getElementById(
                "filterTanggalMulai"
            )?.value || "";

        const akhir =
            document.getElementById(
                "filterTanggalAkhir"
            )?.value || "";


        if (
            mulai &&
            akhir &&
            mulai > akhir
        ) {

            alert(
                "Tanggal mulai tidak boleh lebih besar dari tanggal akhir."
            );

            return;

        }


        // ==========================================
        // DATA BELUM TRANSFER
        // ==========================================

        const data =
            getTransaksiDalamPeriode();


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            alert(
                "Tidak ada jimpitan belum ditransfer pada periode yang dipilih."
            );

            return;

        }


        // ==========================================
        // DATA WILAYAH
        // ==========================================

        let wilayahLaporan = null;


        try {

            const cacheWilayah =
                localStorage.getItem(
                    "sidat_wilayah_data"
                );


            if (cacheWilayah) {

                wilayahLaporan =
                    JSON.parse(
                        cacheWilayah
                    );

            }

        } catch (error) {

            console.warn(
                "SIDAT: gagal membaca cache wilayah:",
                error
            );

        }


        if (
            !wilayahLaporan &&
            typeof wilayahData !== "undefined" &&
            wilayahData
        ) {

            wilayahLaporan =
                wilayahData;

        }


        if (!wilayahLaporan) {

            wilayahLaporan = {};

        }


        // ==========================================
        // REKAP PER HARI
        // ==========================================

        const rekapHari = {

            Senin: {
                jumlah: 0,
                total: 0
            },

            Selasa: {
                jumlah: 0,
                total: 0
            },

            Rabu: {
                jumlah: 0,
                total: 0
            },

            Kamis: {
                jumlah: 0,
                total: 0
            },

            Jumat: {
                jumlah: 0,
                total: 0
            },

            Sabtu: {
                jumlah: 0,
                total: 0
            },

            Minggu: {
                jumlah: 0,
                total: 0
            }

        };


        data.forEach(
            transaksi => {

                const hari =
                    getNamaHari(
                        transaksi.transaction_date
                    );


                if (
                    !rekapHari[hari]
                ) {

                    return;

                }


                rekapHari[hari].jumlah += 1;

                rekapHari[hari].total +=
                    Number(
                        transaksi.amount
                    ) || 0;

            }
        );


        // ==========================================
        // URUTAN HARI
        // ==========================================

        const urutanHari = [

            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
            "Minggu"

        ];


        // ==========================================
        // BARIS TABEL
        // HANYA HARI YANG MEMILIKI DATA
        // ==========================================

        let rows = "";


        urutanHari.forEach(
            hari => {

                const item =
                    rekapHari[hari];


                if (
                    item.jumlah === 0
                ) {

                    return;

                }


                rows += `

                    <tr>

                        <td>
                            ${hari}
                        </td>

                        <td class="center">
                            ${item.jumlah}
                        </td>

                        <td class="right">
                            ${formatRupiah(
                                item.total
                            )}
                        </td>

                    </tr>

                `;

            }
        );


        // ==========================================
        // TOTAL
        // ==========================================

        const totalJimpitan =
            data.reduce(
                (
                    total,
                    transaksi
                ) => {

                    return (
                        total +
                        (
                            Number(
                                transaksi.amount
                            ) || 0
                        )
                    );

                },
                0
            );


        const jumlahTransaksi =
            data.length;


        // ==========================================
        // PERIODE
        // ==========================================

        let periode =
            "Seluruh Periode";


        if (
            mulai &&
            akhir
        ) {

            periode =
                `${formatTanggal(
                    mulai
                )} - ${formatTanggal(
                    akhir
                )}`;

        } else if (mulai) {

            periode =
                `Mulai ${formatTanggal(
                    mulai
                )}`;

        } else if (akhir) {

            periode =
                `Sampai ${formatTanggal(
                    akhir
                )}`;

        }


        // ==========================================
        // TANGGAL CETAK
        // ==========================================

        const tanggalCetak =
            new Date().toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );


        // ==========================================
        // HTML LAPORAN
        // ==========================================

        const laporan = `

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>
Laporan Rekap Jimpitan
</title>

<style>

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
}

body {

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color:
        #111827;

    margin:
        15mm;

    font-size:
        11px;

}


/* ==========================================
   KOP
   ========================================== */

.header {

    text-align:
        center;

    margin-bottom:
        15px;

}

.header h1 {

    margin:
        0 0 5px 0;

    font-size:
        20px;

    font-weight:
        700;

}

.wilayah {

    margin:
        3px 0;

    font-size:
        11px;

}

.garis {

    width:
        100%;

    border-bottom:
        2px solid #111827;

    margin-top:
        9px;

}


/* ==========================================
   INFORMASI
   ========================================== */

.info {

    margin:
        12px 0;

    font-size:
        11px;

}

.info-row {

    margin-bottom:
        4px;

}


/* ==========================================
   JUDUL REKAP
   ========================================== */

.judul-rekap {

    margin:
        15px 0 8px 0;

    font-size:
        12px;

    font-weight:
        700;

}


/* ==========================================
   TABEL
   ========================================== */

table {

    width:
        100%;

    border-collapse:
        collapse;

    font-size:
        11px;

}

th,
td {

    border:
        1px solid #9ca3af;

    padding:
        7px 8px;

}

th {

    background:
        #f3f4f6;

    text-align:
        center;

    font-weight:
        700;

}

td.center {

    text-align:
        center;

}

td.right {

    text-align:
        right;

    white-space:
        nowrap;

}

.total-row td {

    font-weight:
        700;

    border-top:
        2px solid #111827;

}


/* ==========================================
   TANDA TANGAN
   ========================================== */

.signature-area {

    margin-top:
        25px;

    width:
        100%;

}

.tanggal-cetak {

    text-align:
        right;

    margin-bottom:
        15px;

}

.signature-columns {

    position:
        relative;

    width:
        100%;

    height:
        105px;

}

.signature-left {

    position:
        absolute;

    left:
        0;

    top:
        0;

    width:
        50%;

    text-align:
        center;

}

.signature-right {

    position:
        absolute;

    right:
        0;

    top:
        0;

    width:
        50%;

    text-align:
        center;

}

.signature-title {

    font-weight:
        700;

}

.signature-space {

    height:
        52px;

}

.signature-name {

    white-space:
        nowrap;

}


/* ==========================================
   FOOTER
   ========================================== */

.print-footer {

    margin-top:
        8px;

    padding-top:
        4px;

    border-top:
        1px solid #d1d5db;

    text-align:
        center;

    font-size:
        8px;

    color:
        #6b7280;

}


/* ==========================================
   PRINT
   ========================================== */

@media print {

    @page {

        size:
            A4 portrait;

        margin:
            10mm;

    }

    html,
    body {

        margin:
            0;

        padding:
            0;

    }

}

</style>

</head>

<body>


<!-- ========================================
     KOP
     ======================================== -->

<div class="header">

    <h1>
        LAPORAN REKAP JIMPITAN
    </h1>


    <div class="wilayah">

        ${
            wilayahLaporan.rt
                ? "RT " +
                  String(
                      wilayahLaporan.rt
                  ).padStart(
                      2,
                      "0"
                  )
                : "RT 03"
        }

        ${
            wilayahLaporan.rw
                ? " / RW " +
                  String(
                      wilayahLaporan.rw
                  ).padStart(
                      2,
                      "0"
                  )
                : " / RW 02"
        }

    </div>


    <div class="wilayah">

        ${
            wilayahLaporan.nama_dusun
                ? "Dusun " +
                  escapeHTML(
                      wilayahLaporan.nama_dusun
                  )
                : "Dusun Morangan"
        }

        ${
            wilayahLaporan.nama_desa
                ? " • Desa " +
                  escapeHTML(
                      wilayahLaporan.nama_desa
                  )
                : " • Desa Karanganom"
        }

    </div>


    <div class="wilayah">

        ${
            wilayahLaporan.kecamatan
                ? "Kec. " +
                  escapeHTML(
                      wilayahLaporan.kecamatan
                  )
                : "Kec. Klaten Utara"
        }

        ${
            wilayahLaporan.kabupaten
                ? " • Kab. " +
                  escapeHTML(
                      wilayahLaporan.kabupaten
                  )
                : " • Kab. Klaten"
        }

        ${
            wilayahLaporan.provinsi
                ? " • " +
                  escapeHTML(
                      wilayahLaporan.provinsi
                  )
                : " • Jawa Tengah"
        }

    </div>


    <div class="garis"></div>

</div>


<!-- ========================================
     INFORMASI
     ======================================== -->

<div class="info">

    <div class="info-row">

        <strong>
            Periode:
        </strong>

        ${periode}

    </div>


    <div class="info-row">

        <strong>
            Jumlah Transaksi:
        </strong>

        ${jumlahTransaksi} transaksi

    </div>


    <div class="info-row">

        <strong>
            Status:
        </strong>

        Jimpitan belum ditransfer

    </div>

</div>


<!-- ========================================
     REKAP
     ======================================== -->

<div class="judul-rekap">

    REKAP BERDASARKAN KELOMPOK HARI

</div>


<table>

<thead>

<tr>

    <th>
        Kelompok Hari
    </th>

    <th>
        Jumlah Transaksi
    </th>

    <th>
        Total Jimpitan
    </th>

</tr>

</thead>


<tbody>

${rows}


<tr class="total-row">

    <td>
        TOTAL JIMPITAN
    </td>

    <td class="center">
        ${jumlahTransaksi}
    </td>

    <td class="right">
        ${formatRupiah(
            totalJimpitan
        )}
    </td>

</tr>

</tbody>

</table>


<!-- ========================================
     TANDA TANGAN
     ======================================== -->

<div class="signature-area">

    <div class="tanggal-cetak">

        ${
            wilayahLaporan.kabupaten
                ? escapeHTML(
                    wilayahLaporan.kabupaten
                  ) + ", "
                : "Klaten, "
        }

        ${tanggalCetak}

    </div>


    <div class="signature-columns">


        <div class="signature-left">

            <div>
                Mengetahui,
            </div>

            <div class="signature-title">
                Ketua RT
            </div>

            <div class="signature-space"></div>

            <div class="signature-name">
                (................................)
            </div>

        </div>


        <div class="signature-right">

            <div class="signature-title">
                Bendahara RT
            </div>

            <div class="signature-space"></div>

            <div class="signature-name">
                (................................)
            </div>

        </div>


    </div>

</div>


<!-- ========================================
     FOOTER
     ======================================== -->

<div class="print-footer">

    SIDAT • Sistem Informasi Data RT • Suwardi

</div>


</body>

</html>

`;


        // ==========================================
        // APK ANDROID
        // MENGIKUTI CETAK KAS RT
        // ==========================================

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.PrintBridge &&
            window.SIDATPrint &&
            typeof window.SIDATPrint.printHTML === "function"
        ) {

            window.SIDATPrint
                .printHTML(
                    laporan,
                    "SIDAT - Rekap Jimpitan RT"
                )
                .catch(
                    error => {

                        console.error(
                            "SIDAT CETAK JIMPITAN NATIVE ERROR:",
                            error
                        );

                        alert(
                            "Gagal membuka cetak Android: " +
                            (
                                error?.message ||
                                error ||
                                "Kesalahan tidak diketahui."
                            )
                        );

                    }
                );

            return;

        }


        // ==========================================
        // BROWSER
        // ==========================================

        const printWindow =
            window.open(
                "",
                "_blank"
            );


        if (!printWindow) {

            alert(
                "Popup diblokir browser. Izinkan popup untuk mencetak laporan."
            );

            return;

        }


        printWindow.document.open();

        printWindow.document.write(
            laporan
        );

        printWindow.document.close();


        printWindow.onload =
            function () {

                printWindow.focus();

                printWindow.print();

            };


    } catch (error) {

        console.error(
            "Cetak rekap jimpitan error:",
            error
        );

        alert(
            "Gagal membuat laporan rekap jimpitan."
        );

    }

}


// =========================================================
// PASTIKAN BISA DIPANGGIL DARI HTML ONCLICK
// =========================================================

window.cetakRekapJimpitan =
    cetakRekapJimpitan;