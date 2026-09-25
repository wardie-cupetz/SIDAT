/* =========================================================
   SIDAT - RIWAYAT JIMPITAN WARGA
   Versi: Final - Session Supabase Dinamis
   ========================================================= */

(function () {
    "use strict";

    let semuaRiwayat = [];
    let semuaWargaMonitoring = [];

    let supabaseClient = null;

    /* =========================================================
       INIT SUPABASE
       ========================================================= */

    function initSupabase() {
        if (
            typeof supabase === "undefined" ||
            typeof SUPABASE_URL === "undefined" ||
            typeof SUPABASE_KEY === "undefined"
        ) {
            throw new Error(
                "Konfigurasi Supabase belum tersedia."
            );
        }

        if (!supabaseClient) {
            supabaseClient = supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );
        }

        return supabaseClient;
    }

    /* =========================================================
       SESSION SUPABASE
       ========================================================= */

    async function getValidAccessToken() {
        const client = initSupabase();

        const {
            data,
            error
        } = await client.auth.getSession();

        if (error) {
            throw error;
        }

        let session = data ? data.session : null;

        if (!session) {
            throw new Error(
                "Session login tidak ditemukan. Silakan login kembali."
            );
        }

        const expiresAt = Number(
            session.expires_at || 0
        );

        const sekarang = Math.floor(
            Date.now() / 1000
        );

        /*
         * Refresh jika token akan kedaluwarsa
         * dalam waktu 60 detik.
         */
        if (
            expiresAt &&
            expiresAt <= sekarang + 60
        ) {
            const refresh =
                await client.auth.refreshSession();

            if (refresh.error) {
                throw refresh.error;
            }

            session = refresh.data
                ? refresh.data.session
                : null;

            if (!session) {
                throw new Error(
                    "Session gagal diperbarui."
                );
            }
        }

        /*
         * Sinkronkan kembali token terbaru
         * ke localStorage agar bagian SIDAT
         * lain yang masih membutuhkannya tetap
         * mendapatkan token terbaru.
         */
        localStorage.setItem(
            "sidat_access_token",
            session.access_token
        );

        return session.access_token;
    }

    /* =========================================================
       HEADER SUPABASE
       ========================================================= */

    async function supabaseHeaders() {
        const accessToken =
            await getValidAccessToken();

        return {
            "apikey": SUPABASE_KEY,
            "Authorization":
                "Bearer " + accessToken,
            "Content-Type":
                "application/json",
            "Accept":
                "application/json"
        };
    }

    /* =========================================================
       FORMAT RUPIAH
       ========================================================= */

    function formatRupiah(value) {
        const angka = Number(value || 0);

        return "Rp " +
            angka.toLocaleString(
                "id-ID"
            );
    }

    /* =========================================================
       FORMAT TANGGAL
       ========================================================= */

    function formatTanggal(value) {
        if (!value) {
            return "-";
        }

        const tanggal =
            new Date(value);

        if (Number.isNaN(
            tanggal.getTime()
        )) {
            return value;
        }

        return tanggal.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    }
    /* =========================================================
       REKAP JIMPITAN BELUM DITRANSFER
       ========================================================= */

    const NAMA_HARI = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu"
    ];

    let tanggalRekapMulai = "";
    let tanggalRekapAkhir = "";

    function getNamaHariRekap(tanggal) {
        if (!tanggal) {
            return null;
        }

        const date = new Date(
            String(tanggal).slice(0, 10) +
            "T00:00:00"
        );

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return NAMA_HARI[date.getDay()];
    }

    function getJimpitanBelumTransfer() {
        return semuaRiwayat.filter(function (item) {

            /*
             * Hanya jimpitan yang sudah diambil
             * tetapi belum ditransfer ke Kas RT.
             */
            const sudahDiambil =
                Boolean(
                    item.taken_at ||
                    item.transaction_date ||
                    item.tanggal ||
                    item.created_at
                );

            const belumTransfer =
                !Boolean(
                    item.transferred_to_cash
                );

            return (
                sudahDiambil &&
                belumTransfer
            );
        });
    }

    function getJimpitanRekapPeriode() {

        const data =
            getJimpitanBelumTransfer();

        return data.filter(function (item) {

            const tanggal =
                String(
                    item.transaction_date ??
                    item.taken_at ??
                    item.tanggal ??
                    item.created_at ??
                    ""
                ).slice(0, 10);

            if (!tanggal) {
                return false;
            }

            if (
                tanggalRekapMulai &&
                tanggal < tanggalRekapMulai
            ) {
                return false;
            }

            if (
                tanggalRekapAkhir &&
                tanggal > tanggalRekapAkhir
            ) {
                return false;
            }

            return true;
        });
    }

    function renderRekapJimpitanWarga() {

        const container =
            document.getElementById(
                "wargaDailySummaryList"
            );

        if (!container) {
            return;
        }

        const data =
            getJimpitanRekapPeriode();

        const rekap = {
            Senin:  { jumlah: 0, total: 0 },
            Selasa: { jumlah: 0, total: 0 },
            Rabu:   { jumlah: 0, total: 0 },
            Kamis:  { jumlah: 0, total: 0 },
            Jumat:  { jumlah: 0, total: 0 },
            Sabtu:  { jumlah: 0, total: 0 },
            Minggu: { jumlah: 0, total: 0 }
        };

        data.forEach(function (item) {

            const tanggal =
                item.transaction_date ??
                item.taken_at ??
                item.tanggal ??
                item.created_at;

            const hari =
                getNamaHariRekap(tanggal);

            if (!hari || !rekap[hari]) {
                return;
            }

            rekap[hari].jumlah += 1;

            rekap[hari].total +=
                Number(item.amount || 0);
        });

        const warnaHari = {
            Senin: "senin",
            Selasa: "selasa",
            Rabu: "rabu",
            Kamis: "kamis",
            Jumat: "jumat",
            Sabtu: "sabtu",
            Minggu: "minggu"
        };

        if (!data.length) {

            container.innerHTML = `
                <div class="warga-daily-summary-empty">
                    <span>
                        Tidak ada jimpitan yang belum
                        ditransfer ke Kas RT pada periode ini.
                    </span>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        [
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
            "Minggu"
        ].forEach(function (hari) {

            const item =
                rekap[hari];

            const card =
                document.createElement("div");

            card.className =
                `warga-daily-summary-card ${warnaHari[hari]}`;

            card.innerHTML = `

                <div class="warga-daily-summary-info">

                    <strong>
                        ${hari}
                    </strong>

                    <span>
                        ${item.jumlah} transaksi
                    </span>

                </div>

                <div class="warga-daily-summary-amount">
                    ${formatRupiah(item.total)}
                </div>

            `;

            container.appendChild(card);
        });
    }

    function renderFilterRekapJimpitanWarga() {

        const historyList =
            document.getElementById(
                "historyList"
            );

        if (!historyList) {
            return;
        }

        /*
         * Jangan membuat ulang jika sudah ada.
         */
        if (
            document.getElementById(
                "wargaJimpitanRekap"
            )
        ) {
            return;
        }

        const section =
            document.createElement("section");

        section.id =
            "wargaJimpitanRekap";

        section.className =
            "warga-jimpitan-rekap";

        section.innerHTML = `

            <div class="warga-rekap-header">

                <div>
                    <h2>
                        Rekap Jimpitan
                    </h2>

                    <span>
                        Total jimpitan yang belum
                        ditransfer ke Kas RT
                    </span>
                </div>

            </div>

            <div class="warga-rekap-filter">

                <div class="warga-rekap-field">

                    <label for="wargaFilterTanggalMulai">
                        Tanggal Mulai
                    </label>

                    <input
                        type="date"
                        id="wargaFilterTanggalMulai"
                    >

                </div>

                <div class="warga-rekap-field">

                    <label for="wargaFilterTanggalAkhir">
                        Tanggal Akhir
                    </label>

                    <input
                        type="date"
                        id="wargaFilterTanggalAkhir"
                    >

                </div>

            </div>

            <button
                type="button"
                id="btnTerapkanFilterWargaJimpitan"
                class="warga-rekap-filter-button"
            >
                Terapkan Filter
            </button>

            <div
                id="wargaPeriodeRekapInfo"
                class="warga-periode-rekap-info"
            >
                Semua periode
            </div>

            <div
                id="wargaDailySummaryList"
                class="warga-daily-summary-list"
            ></div>

        `;

        historyList.parentNode.insertBefore(
            section,
            historyList
        );

        const btn =
            document.getElementById(
                "btnTerapkanFilterWargaJimpitan"
            );

        if (btn) {

            btn.addEventListener(
                "click",
                terapkanFilterRekapWarga
            );
        }

        renderRekapJimpitanWarga();
    }

    function terapkanFilterRekapWarga() {

        const mulai =
            document.getElementById(
                "wargaFilterTanggalMulai"
            )?.value || "";

        const akhir =
            document.getElementById(
                "wargaFilterTanggalAkhir"
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

        tanggalRekapMulai =
            mulai;

        tanggalRekapAkhir =
            akhir;

        const info =
            document.getElementById(
                "wargaPeriodeRekapInfo"
            );

        if (info) {

            if (!mulai && !akhir) {

                info.textContent =
                    "Semua periode";

            } else {

                const teksMulai =
                    mulai
                        ? formatTanggal(mulai)
                        : "Awal data";

                const teksAkhir =
                    akhir
                        ? formatTanggal(akhir)
                        : "Akhir data";

                info.textContent =
                    `${teksMulai} – ${teksAkhir}`;
            }
        }

        renderRekapJimpitanWarga();

    }
  
    /* =========================================================
       TANGGAL HARI INI
       ========================================================= */

    function tanggalHariIni() {
        const sekarang =
            new Date();

        const tahun =
            sekarang.getFullYear();

        const bulan =
            String(
                sekarang.getMonth() + 1
            ).padStart(2, "0");

        const hari =
            String(
                sekarang.getDate()
            ).padStart(2, "0");

        return `${tahun}-${bulan}-${hari}`;
    }

    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHTML(value) {
        return String(
            value == null
                ? ""
                : value
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

    /* =========================================================
       LOAD SALDO JIMPITAN
       ========================================================= */

    async function loadSaldoJimpitan() {
        const saldoElement =
            document.getElementById(
                "saldoJimpitan"
            );

        if (!saldoElement) {
            return;
        }

        try {
            const headers =
                await supabaseHeaders();

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/rpc/get_jimpitan_balance",
                    {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify({})
                    }
                );

            if (!response.ok) {
                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Gagal mengambil saldo jimpitan."
                );
            }

            const data =
                await response.json();

            let saldo = 0;

            if (typeof data === "number") {
                saldo = data;
            } else if (
                data &&
                typeof data.balance !== "undefined"
            ) {
                saldo = data.balance;
            } else if (
                data &&
                typeof data.saldo !== "undefined"
            ) {
                saldo = data.saldo;
            } else if (
                Array.isArray(data) &&
                data.length
            ) {
                const row = data[0];

                saldo =
                    Number(
                        row.balance ??
                        row.saldo ??
                        row.jimpitan_balance ??
                        0
                    );
            }

            saldoElement.textContent =
                formatRupiah(saldo);

        } catch (error) {
            console.error(
                "SIDAT saldo jimpitan:",
                error
            );

            saldoElement.textContent =
                "Rp 0";
        }
    }

    /* =========================================================
       LOAD RIWAYAT
       ========================================================= */

    async function loadRiwayat() {
        const historyList =
            document.getElementById(
                "historyList"
            );

        if (historyList) {
            historyList.innerHTML =
                '<div class="loading">Memuat riwayat...</div>';
        }

        try {
            const headers =
                await supabaseHeaders();

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/rpc/get_jimpitan_history",
                    {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify({})
                    }
                );

            if (!response.ok) {
                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Gagal mengambil riwayat jimpitan."
                );
            }

            const data =
                await response.json();

            semuaRiwayat =
    Array.isArray(data)
        ? data
        : [];

tampilkanRiwayat(
    semuaRiwayat
);

renderFilterRekapJimpitanWarga();
renderRekapJimpitanWarga();

        } catch (error) {
            console.error(
                "SIDAT riwayat jimpitan:",
                error
            );

            if (historyList) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-title">
                            Riwayat belum dapat dimuat
                        </div>
                        <div class="empty-text">
                            ${escapeHTML(
                                error.message ||
                                "Terjadi kesalahan."
                            )}
                        </div>
                    </div>
                `;
            }

            const jumlah =
                document.getElementById(
                    "jumlahTransaksi"
                );

            if (jumlah) {
                jumlah.textContent =
                    "0 transaksi";
            }
        }
    }

    /* =========================================================
       TAMPILKAN RIWAYAT
       ========================================================= */

    function tampilkanRiwayat(data) {
        const historyList =
            document.getElementById(
                "historyList"
            );

        const jumlah =
            document.getElementById(
                "jumlahTransaksi"
            );

        if (!historyList) {
            return;
        }

        if (!Array.isArray(data) ||
            data.length === 0) {

            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-title">
                        Belum ada transaksi jimpitan
                    </div>
                    <div class="empty-text">
                        Riwayat transaksi jimpitan
                        akan tampil di sini.
                    </div>
                </div>
            `;

            if (jumlah) {
                jumlah.textContent =
                    "0 transaksi";
            }

            return;
        }

        if (jumlah) {
            jumlah.textContent =
                `${data.length} transaksi`;
        }

        historyList.innerHTML =
            data.map(
                function (item) {
                    const tanggal =
                        item.transaction_date ??
                        item.taken_at ??
                        item.tanggal ??
                        item.created_at;

                    const collector =
                        item.collector_name ??
                        item.collector_nama ??
                        item.collector_code ??
                        "-";

                    const resident =
                        item.resident_name ??
                        item.resident_nama ??
                        item.name ??
                        "-";

                    const residentCode =
                        item.resident_code ??
                        item.kode_warga ??
                        "";

                    const amount =
                        item.amount ?? 0;

                    const notes =
                        item.notes ??
                        "";

                    const transferred =
                        Boolean(
                            item.transferred_to_cash
                        );

                    return `
                        <article class="history-item">

                            <div class="history-item-top">

                                <div class="history-date">
                                    ${escapeHTML(
                                        formatTanggal(
                                            tanggal
                                        )
                                    )}
                                </div>

                                <div class="history-amount">
                                    ${escapeHTML(
                                        formatRupiah(
                                            amount
                                        )
                                    )}
                                </div>

                            </div>

                            <div class="history-person">

                                <div class="history-person-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                                        />
                                        <path
                                            d="M4 21a8 8 0 0 1 16 0"
                                        />
                                    </svg>
                                </div>

                                <div class="history-person-info">

                                    <strong>
                                        ${escapeHTML(
                                            resident
                                        )}
                                    </strong>

                                    ${
                                        residentCode
                                            ? `
                                                <span>
                                                    ${escapeHTML(
                                                        residentCode
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                            <div class="history-detail">

                                <div class="history-detail-row">

                                    <span>
                                        Petugas
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            collector
                                        )}
                                    </strong>

                                </div>

                                <div class="history-detail-row">

                                    <span>
                                        Status Kas RT
                                    </span>

                                    <strong class="${
                                        transferred
                                            ? "status-success"
                                            : "status-pending"
                                    }">

                                        ${
                                            transferred
                                                ? "Sudah masuk kas"
                                                : "Belum ditransfer ke kas"
                                        }

                                    </strong>

                                </div>

                                ${
                                    notes
                                        ? `
                                            <div class="history-detail-row">

                                                <span>
                                                    Catatan
                                                </span>

                                                <strong>
                                                    ${escapeHTML(
                                                        notes
                                                    )}
                                                </strong>

                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
    }

    /* =========================================================
       FILTER RIWAYAT BERDASARKAN TANGGAL
       ========================================================= */

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
                function (item) {

                    const tanggalItem =
                        item.transaction_date ??
                        item.taken_at ??
                        item.tanggal;

                    if (!tanggalItem) {
                        return false;
                    }

                    return String(
                        tanggalItem
                    ).slice(0, 10) ===
                    tanggal;
                }
            );

        tampilkanRiwayat(
            hasil
        );
    }

    /* =========================================================
       RESET FILTER
       ========================================================= */

    function resetFilter() {
        const tanggal =
            document.getElementById(
                "filterTanggal"
            );

        const search =
            document.getElementById(
                "searchWarga"
            );

        const status =
            document.getElementById(
                "filterStatus"
            );

        if (tanggal) {
            tanggal.value =
                tanggalHariIni();
        }

        if (search) {
            search.value = "";
        }

        if (status) {
            status.value = "semua";
        }

        filterRiwayatTanggal(
            tanggal
                ? tanggal.value
                : ""
        );

        loadMonitoringJimpitan();
    }

    /* =========================================================
       LOAD MONITORING JIMPITAN
       ========================================================= */

    async function loadMonitoringJimpitan() {
        const tanggalElement =
            document.getElementById(
                "filterTanggal"
            );

        const tanggal =
            tanggalElement &&
            tanggalElement.value
                ? tanggalElement.value
                : tanggalHariIni();

        const monitoringList =
            document.getElementById(
                "monitoringList"
            );

        if (monitoringList) {
            monitoringList.innerHTML =
                '<div class="loading">Memuat monitoring...</div>';
        }

        try {
            const headers =
                await supabaseHeaders();

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/rpc/get_jimpitan_monitoring",
                    {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify({
                            p_date: tanggal
                        })
                    }
                );

            if (!response.ok) {
                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Gagal mengambil monitoring jimpitan."
                );
            }

            const data =
                await response.json();

            semuaWargaMonitoring =
                Array.isArray(data)
                    ? data
                    : [];

            renderMonitoring();

        } catch (error) {
            console.error(
                "SIDAT monitoring jimpitan:",
                error
            );

            semuaWargaMonitoring = [];

            if (monitoringList) {
                monitoringList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-title">
                            Monitoring belum dapat dimuat
                        </div>
                        <div class="empty-text">
                            ${escapeHTML(
                                error.message ||
                                "Terjadi kesalahan."
                            )}
                        </div>
                    </div>
                `;
            }

            updateDailySummary();
        }
    }

    /* =========================================================
       RENDER MONITORING
       ========================================================= */

    function renderMonitoring() {
        const monitoringList =
            document.getElementById(
                "monitoringList"
            );

        if (!monitoringList) {
            return;
        }

        const searchElement =
            document.getElementById(
                "searchWarga"
            );

        const statusElement =
            document.getElementById(
                "filterStatus"
            );

        const search =
            searchElement
                ? searchElement.value
                    .trim()
                    .toLowerCase()
                : "";

        const status =
            statusElement
                ? statusElement.value
                : "semua";

        let data =
            Array.isArray(
                semuaWargaMonitoring
            )
                ? semuaWargaMonitoring
                : [];

        /*
         * Filter pencarian.
         */
        if (search) {
            data =
                data.filter(
                    function (item) {

                        const nama =
                            String(
                                item.resident_name ??
                                item.resident_nama ??
                                item.name ??
                                ""
                            )
                            .toLowerCase();

                        const kode =
                            String(
                                item.resident_code ??
                                item.kode_warga ??
                                ""
                            )
                            .toLowerCase();

                        return (
                            nama.includes(search) ||
                            kode.includes(search)
                        );
                    }
                );
        }

        /*
         * Filter status.
         */
        if (status === "sudah") {
            data =
                data.filter(
                    function (item) {
                        return Boolean(
                            item.sudah_diambil ??
                            item.taken ??
                            item.is_taken
                        );
                    }
                );
        }

        if (status === "belum") {
            data =
                data.filter(
                    function (item) {
                        return !Boolean(
                            item.sudah_diambil ??
                            item.taken ??
                            item.is_taken
                        );
                    }
                );
        }

        updateDailySummary();

        if (!data.length) {
            monitoringList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-title">
                        Data warga tidak ditemukan
                    </div>
                    <div class="empty-text">
                        Tidak ada data yang sesuai
                        dengan filter saat ini.
                    </div>
                </div>
            `;

            return;
        }

        monitoringList.innerHTML =
            data.map(
                function (item) {

                    const nama =
                        item.resident_name ??
                        item.resident_nama ??
                        item.name ??
                        "-";

                    const kode =
                        item.resident_code ??
                        item.kode_warga ??
                        "";

                    const sudahDiambil =
                        Boolean(
                            item.sudah_diambil ??
                            item.taken ??
                            item.is_taken
                        );

                    const amount =
                        item.amount ??
                        item.jimpitan_amount ??
                        0;

                    const collector =
                        item.collector_name ??
                        item.collector_nama ??
                        item.collector_code ??
                        "";

                    const initial =
                        String(nama)
                            .trim()
                            .charAt(0)
                            .toUpperCase();

                    return `
                        <article class="monitoring-item">

                            <div class="monitoring-avatar">
                                ${escapeHTML(
                                    initial || "?"
                                )}
                            </div>

                            <div class="monitoring-content">

                                <div class="monitoring-name">
                                    ${escapeHTML(
                                        nama
                                    )}
                                </div>

                                ${
                                    kode
                                        ? `
                                            <div class="monitoring-code">
                                                ${escapeHTML(
                                                    kode
                                                )}
                                            </div>
                                        `
                                        : ""
                                }

                                <div class="monitoring-status ${
                                    sudahDiambil
                                        ? "status-sudah"
                                        : "status-belum"
                                }">

                                    <span
                                        class="status-dot"
                                        aria-hidden="true"
                                    ></span>

                                    <span>
                                        ${
                                            sudahDiambil
                                                ? "Sudah Diambil"
                                                : "Belum Diambil"
                                        }
                                    </span>

                                </div>

                                ${
                                    sudahDiambil
                                        ? `
                                            <div class="monitoring-meta">

                                                <span>
                                                    ${escapeHTML(
                                                        formatRupiah(
                                                            amount
                                                        )
                                                    )}
                                                </span>

                                                ${
                                                    collector
                                                        ? `
                                                            <span>
                                                                Petugas:
                                                                ${escapeHTML(
                                                                    collector
                                                                )}
                                                            </span>
                                                        `
                                                        : ""
                                                }

                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
    }

    /* =========================================================
       RINGKASAN HARIAN
       ========================================================= */

    function updateDailySummary() {
        const totalElement =
            document.getElementById(
                "totalWargaHarian"
            );

        const sudahElement =
            document.getElementById(
                "sudahDiambil"
            );

        const belumElement =
            document.getElementById(
                "belumDiambil"
            );

        const jumlah =
            Array.isArray(
                semuaWargaMonitoring
            )
                ? semuaWargaMonitoring.length
                : 0;

        let sudah = 0;

        if (Array.isArray(
            semuaWargaMonitoring
        )) {
            sudah =
                semuaWargaMonitoring.filter(
                    function (item) {
                        return Boolean(
                            item.sudah_diambil ??
                            item.taken ??
                            item.is_taken
                        );
                    }
                ).length;
        }

        const belum =
            Math.max(
                0,
                jumlah - sudah
            );

        if (totalElement) {
            totalElement.textContent =
                jumlah;
        }

        if (sudahElement) {
            sudahElement.textContent =
                sudah;
        }

        if (belumElement) {
            belumElement.textContent =
                belum;
        }
    }

    /* =========================================================
       EVENT LISTENER
       ========================================================= */

    function pasangEventListener() {
        const search =
            document.getElementById(
                "searchWarga"
            );

        if (search) {
            search.addEventListener(
                "input",
                function () {
                    renderMonitoring();
                }
            );
        }

        const status =
            document.getElementById(
                "filterStatus"
            );

        if (status) {
            status.addEventListener(
                "change",
                function () {
                    renderMonitoring();
                }
            );
        }

        const tanggal =
            document.getElementById(
                "filterTanggal"
            );

        if (tanggal) {
            tanggal.addEventListener(
                "change",
                async function () {

                    filterRiwayatTanggal(
                        tanggal.value
                    );

                    await loadMonitoringJimpitan();
                }
            );
        }
    }

    /* =========================================================
       KEMBALI DASHBOARD
       ========================================================= */

    function kembaliDashboard() {
        window.location.href =
            "dashboard.html";
    }

    /* =========================================================
       EXPOSE FUNCTION
       ========================================================= */

    window.resetFilter =
        resetFilter;

    window.kembaliDashboard =
        kembaliDashboard;

    window.loadRiwayat =
        loadRiwayat;

    window.loadMonitoringJimpitan =
        loadMonitoringJimpitan;

    /* =========================================================
       INIT
       ========================================================= */

    async function initRiwayatJimpitan() {
        try {
            initSupabase();

            const tanggal =
                document.getElementById(
                    "filterTanggal"
                );

            if (tanggal &&
                !tanggal.value) {

                tanggal.value =
                    tanggalHariIni();
            }

            pasangEventListener();

            await Promise.all([
                loadSaldoJimpitan(),
                loadRiwayat()
            ]);

            /*
             * Setelah tanggal default terpasang,
             * monitoring mengambil data tanggal hari ini.
             */
            await loadMonitoringJimpitan();

        } catch (error) {
            console.error(
                "SIDAT init riwayat jimpitan:",
                error
            );
        }
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initRiwayatJimpitan
        );
    } else {
        initRiwayatJimpitan();
    }

})();