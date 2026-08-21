// ==========================================
// SIDAT
// RIWAYAT JIMPITAN
// Dibuat oleh Suwardi
// ==========================================

console.log(
    "SIDAT - Riwayat Jimpitan"
);


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
// DATA GLOBAL
// ==========================================

let semuaRiwayat = [];

let semuaWargaMonitoring = [];


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
// TANGGAL HARI INI
// ==========================================

function tanggalHariIni() {

    const sekarang =
        new Date();


    const tahun =
        sekarang.getFullYear();


    const bulan =
        String(
            sekarang.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const tanggal =
        String(
            sekarang.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${tahun}-${bulan}-${tanggal}`
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
// LOAD SALDO JIMPITAN
// Menggunakan RPC yang sudah ada
// ==========================================

async function loadSaldoJimpitan() {

    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_jimpitan_balance`,
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


        let saldo =
            0;


        // RPC bisa mengembalikan
        // angka langsung atau object.
        if (
            typeof result ===
            "number"
        ) {

            saldo =
                result;

        }

        else if (
            result &&
            typeof result ===
            "object"
        ) {

            saldo =
                Number(
                    result.saldo ??
                    result.balance ??
                    result.total ??
                    0
                );

        }


        const saldoElement =
            document.getElementById(
                "saldoJimpitan"
            );


        if (saldoElement) {

            saldoElement.textContent =
                formatRupiah(
                    saldo
                );

        }


        console.log(
            "Saldo jimpitan:",
            saldo
        );


    }

    catch (error) {

        console.error(
            "Load saldo jimpitan error:",
            error
        );


        const saldoElement =
            document.getElementById(
                "saldoJimpitan"
            );


        if (saldoElement) {

            saldoElement.textContent =
                "Rp 0";

        }

    }

}


// ==========================================
// LOAD RIWAYAT JIMPITAN
// Menggunakan RPC yang sudah ada
// ==========================================

async function loadRiwayat() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (container) {

        container.innerHTML = `
            <div class="empty">
                Memuat riwayat...
            </div>
        `;

    }


    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_jimpitan_history`,
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


        if (
            Array.isArray(result)
        ) {

            semuaRiwayat =
                result;

        }

        else {

            semuaRiwayat =
                [];

        }


        console.log(
            "Riwayat jimpitan:",
            semuaRiwayat
        );


        tampilkanRiwayat(
            semuaRiwayat
        );


    }

    catch (error) {

        console.error(
            "Load riwayat error:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="empty">

                    ⚠️ Gagal memuat riwayat.

                </div>
            `;

        }

    }

}


// ==========================================
// TAMPILKAN RIWAYAT
// ==========================================

function tampilkanRiwayat(
    data
) {

    const container =
        document.getElementById(
            "historyList"
        );


    if (!container) {

        return;

    }


    const jumlahElement =
        document.getElementById(
            "jumlahTransaksi"
        );


    if (jumlahElement) {

        jumlahElement.textContent =
            `${data.length} transaksi`;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">

                Belum ada transaksi jimpitan.

            </div>
        `;

        return;

    }


    container.innerHTML =
        data.map(
            transaksi => {

                const tanggal =
                    transaksi.transaction_date ??
                    transaksi.taken_at ??
                    transaksi.tanggal ??
                    "";


                const namaWarga =
                    transaksi.resident_name ??
                    transaksi.name ??
                    transaksi.warga_name ??
                    "-";


                const namaPetugas =
                    transaksi.collector_name ??
                    transaksi.petugas_name ??
                    "Petugas";


                const nominal =
                    transaksi.amount ??
                    transaksi.nominal ??
                    0;


                const sudahTransfer =
                    transaksi.transferred_to_cash === true;


                const statusHTML =
                    sudahTransfer

                        ? `
                            <span
                                class="history-status status-transferred"
                            >
                                ✓ Sudah masuk kas
                            </span>
                          `

                        : `
                            <span
                                class="history-status status-pending"
                            >
                                ⏳ Belum ditransfer ke kas
                            </span>
                          `;


                const notes =
                    transaksi.notes ??
                    "";


                const notesHTML =
                    notes

                        ? `
                            <div
                                class="history-notes"
                            >
                                ${escapeHTML(
                                    notes
                                )}
                            </div>
                          `

                        : "";


                return `

                    <article
                        class="history-item"
                    >

                        <div
                            class="history-top"
                        >

                            <div>

                                <div
                                    class="history-date"
                                >
                                    ${formatTanggal(
                                        String(
                                            tanggal
                                        ).substring(
                                            0,
                                            10
                                        )
                                    )}
                                </div>


                                <div
                                    class="history-person"
                                >

                                    <div>
                                        👤 Petugas:
                                        <strong>
                                            ${escapeHTML(
                                                namaPetugas
                                            )}
                                        </strong>
                                    </div>


                                    <div>
                                        🏠 Warga:
                                        <strong>
                                            ${escapeHTML(
                                                namaWarga
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </div>


                            <div
                                class="history-amount"
                            >
                                ${formatRupiah(
                                    nominal
                                )}
                            </div>

                        </div>


                        ${statusHTML}


                        ${notesHTML}

                    </article>

                `;

            }
        ).join("");

}


// ==========================================
// FILTER RIWAYAT BERDASARKAN TANGGAL
// ==========================================

function filterRiwayatTanggal(
    tanggal
) {

    if (!tanggal) {

        tampilkanRiwayat(
            semuaRiwayat
        );

        return;

    }


    const hasil =
        semuaRiwayat.filter(
            transaksi => {

                const tanggalTransaksi =
                    String(
                        transaksi.transaction_date ??
                        transaksi.taken_at ??
                        transaksi.tanggal ??
                        ""
                    ).substring(
                        0,
                        10
                    );


                return (
                    tanggalTransaksi ===
                    tanggal
                );

            }
        );


    tampilkanRiwayat(
        hasil
    );

}


// ==========================================
// RESET FILTER
// ==========================================

function resetFilter() {

    const filterTanggal =
        document.getElementById(
            "filterTanggal"
        );


    if (filterTanggal) {

        filterTanggal.value =
            "";

    }


    tampilkanRiwayat(
        semuaRiwayat
    );


    const searchInput =
        document.getElementById(
            "searchWarga"
        );


    if (searchInput) {

        searchInput.value =
            "";

    }


    const statusInput =
        document.getElementById(
            "filterStatus"
        );


    if (statusInput) {

        statusInput.value =
            "semua";

    }


    loadMonitoringJimpitan();

}
// ==========================================
// LOAD MONITORING JIMPITAN
// ==========================================

async function loadMonitoringJimpitan() {

    const list =
        document.getElementById(
            "monitoringList"
        );


    if (!list) {

        return;

    }


    try {

        const filterTanggal =
            document.getElementById(
                "filterTanggal"
            );


        const tanggal =
            filterTanggal &&
            filterTanggal.value

                ? filterTanggal.value

                : tanggalHariIni();


        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_jimpitan_monitoring`,
                {
                    method: "POST",

                    headers:
                        supabaseHeaders(),

                    body:
                        JSON.stringify({
                            p_date:
                                tanggal
                        })
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


        semuaWargaMonitoring =
            Array.isArray(result)
                ? result
                : [];


        console.log(
            "Monitoring jimpitan:",
            semuaWargaMonitoring
        );


        renderMonitoring();

    }

    catch (error) {

        console.error(
            "Monitoring error:",
            error
        );


        list.innerHTML = `
            <div class="monitoring-empty">

                ⚠️ Gagal memuat data monitoring.

            </div>
        `;

    }

}


// ==========================================
// RENDER MONITORING
// ==========================================

function renderMonitoring() {

    const list =
        document.getElementById(
            "monitoringList"
        );


    if (!list) {

        return;

    }


    const searchInput =
        document.getElementById(
            "searchWarga"
        );


    const statusInput =
        document.getElementById(
            "filterStatus"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const status =
        statusInput
            ? statusInput.value
            : "semua";


    // ======================================
    // STATISTIK
    // ======================================

    const total =
        semuaWargaMonitoring.length;


    const sudah =
        semuaWargaMonitoring.filter(
            warga =>
                warga.sudah_diambil === true
        ).length;


    const belum =
        total - sudah;


    const totalElement =
        document.getElementById(
            "totalWargaHariIni"
        );


    const sudahElement =
        document.getElementById(
            "sudahDiambil"
        );


    const belumElement =
        document.getElementById(
            "belumDiambil"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (sudahElement) {

        sudahElement.textContent =
            sudah;

    }


    if (belumElement) {

        belumElement.textContent =
            belum;

    }


    // ======================================
    // FILTER PENCARIAN
    // ======================================

    const hasil =
        semuaWargaMonitoring.filter(
            warga => {

                const nama =
                    String(
                        warga.resident_name ||
                        ""
                    ).toLowerCase();


                const kode =
                    String(
                        warga.resident_code ||
                        ""
                    ).toLowerCase();


                const cocokSearch =
                    !search ||
                    nama.includes(search) ||
                    kode.includes(search);


                const sudahDiambil =
                    warga.sudah_diambil === true;


                let cocokStatus =
                    true;


                if (
                    status === "sudah"
                ) {

                    cocokStatus =
                        sudahDiambil;

                }


                if (
                    status === "belum"
                ) {

                    cocokStatus =
                        !sudahDiambil;

                }


                return (
                    cocokSearch &&
                    cocokStatus
                );

            }
        );


    // ======================================
    // KOSONG
    // ======================================

    if (
        hasil.length === 0
    ) {

        list.innerHTML = `
            <div class="monitoring-empty">

                🔎 Data warga tidak ditemukan.

            </div>
        `;

        return;

    }


    // ======================================
    // TAMPILKAN DATA
    // ======================================

    list.innerHTML = "";


    hasil.forEach(
        warga => {

            const sudah =
                warga.sudah_diambil === true;


            const nama =
                escapeHTML(
                    warga.resident_name ||
                    "-"
                );


            const kode =
                escapeHTML(
                    warga.resident_code ||
                    "-"
                );


            const petugas =
                escapeHTML(
                    warga.collector_name ||
                    "Petugas"
                );


            const nominal =
                Number(
                    warga.amount || 0
                );


            const initial =
                String(
                    warga.resident_name ||
                    "?"
                )
                .trim()
                .charAt(0)
                .toUpperCase();


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "monitoring-item";


            // =================================
            // SUDAH DIAMBIL
            // =================================

            if (sudah) {

                item.innerHTML = `

                    <div class="monitoring-main">

                        <div
                            class="monitoring-avatar"
                        >
                            ${escapeHTML(
                                initial
                            )}
                        </div>


                        <div
                            class="monitoring-info-box"
                        >

                            <strong>
                                ${nama}
                            </strong>

                            <span>
                                ID: ${kode}
                            </span>

                        </div>


                        <span
                            class="status-badge status-sudah"
                        >
                            ✅ Sudah Diambil
                        </span>

                    </div>


                    <div
                        class="monitoring-detail"
                    >

                        Jimpitan:

                        <strong>
                            ${formatRupiah(
                                nominal
                            )}
                        </strong>

                        &nbsp;•&nbsp;

                        Petugas:

                        <strong>
                            ${petugas}
                        </strong>

                    </div>

                `;

            }


            // =================================
            // BELUM DIAMBIL
            // =================================

            else {

                item.innerHTML = `

                    <div class="monitoring-main">

                        <div
                            class="monitoring-avatar"
                        >
                            ${escapeHTML(
                                initial
                            )}
                        </div>


                        <div
                            class="monitoring-info-box"
                        >

                            <strong>
                                ${nama}
                            </strong>

                            <span>
                                ID: ${kode}
                            </span>

                        </div>


                        <span
                            class="status-badge status-belum"
                        >
                            ⏳ Belum Diambil
                        </span>

                    </div>


                    <div
                        class="monitoring-detail"
                    >

                        Belum ada transaksi
                        jimpitan pada tanggal ini.

                    </div>

                `;

            }


            list.appendChild(
                item
            );

        }
    );

}


// ==========================================
// EVENT SEARCH
// ==========================================

const searchWarga =
    document.getElementById(
        "searchWarga"
    );


if (searchWarga) {

    searchWarga.addEventListener(
        "input",
        function () {

            renderMonitoring();

        }
    );

}


// ==========================================
// EVENT STATUS
// ==========================================

const filterStatus =
    document.getElementById(
        "filterStatus"
    );


if (filterStatus) {

    filterStatus.addEventListener(
        "change",
        function () {

            renderMonitoring();

        }
    );

}


// ==========================================
// EVENT TANGGAL
// ==========================================

const filterTanggal =
    document.getElementById(
        "filterTanggal"
    );


if (filterTanggal) {

    filterTanggal.addEventListener(
        "change",
        async function () {

            const tanggal =
                this.value;


            filterRiwayatTanggal(
                tanggal
            );


            await loadMonitoringJimpitan();

        }
    );

}


// ==========================================
// KEMBALI
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// INISIALISASI
// ==========================================

async function initRiwayatJimpitan() {

    console.log(
        "SIDAT: memulai halaman Riwayat Jimpitan..."
    );


    await loadSaldoJimpitan();


    await loadRiwayat();


    // Monitoring default hari ini
    if (filterTanggal) {

        filterTanggal.value =
            tanggalHariIni();

    }


    await loadMonitoringJimpitan();


    console.log(
        "SIDAT: halaman Riwayat Jimpitan siap."
    );

}


// ==========================================
// JALANKAN
// ==========================================

initRiwayatJimpitan();