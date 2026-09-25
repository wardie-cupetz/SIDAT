/* ==========================================
SIDAT - KAS RT
========================================== */

console.log(
"SIDAT: Kas RT memuat..."
);

let supabaseClient = null;

let semuaTransaksiKas = [];

/* ==========================================
INIT SUPABASE
========================================== */

function initSupabase() {

if (
    typeof SUPABASE_URL ===
    "undefined" ||
    typeof SUPABASE_KEY ===
    "undefined"
) {

    throw new Error(
        "Konfigurasi Supabase tidak ditemukan."
    );

}


if (
    typeof supabase ===
    "undefined" ||
    !supabase.createClient
) {

    throw new Error(
        "Library Supabase belum dimuat."
    );

}


supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

}

/* ==========================================
CEK CLIENT
========================================== */

function cekKasClient() {

if (
    !supabaseClient
) {

    throw new Error(
        "Supabase client belum siap."
    );

}

}

/* ==========================================
FORMAT RUPIAH
========================================== */

function formatRupiah(
value
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
    Number(value) || 0
);

}

/* ==========================================
FORMAT TANGGAL
========================================== */

function formatTanggal(
tanggal
) {

if (
    !tanggal
) {

    return "-";

}


return new Date(
    tanggal +
    "T00:00:00"
).toLocaleDateString(
    "id-ID",
    {
        day:
            "2-digit",

        month:
            "long",

        year:
            "numeric"
    }
);

}

/* ==========================================
FORMAT TANGGAL CSV
========================================== */

function formatTanggalCSV(
tanggal
) {

if (
    !tanggal
) {

    return "";

}


const parts =
    String(
        tanggal
    )
    .substring(
        0,
        10
    )
    .split("-");


if (
    parts.length !==
    3
) {

    return tanggal;

}


return (
    parts[2] +
    "/" +
    parts[1] +
    "/" +
    parts[0]
);

}

/* ==========================================
KEMBALI DASHBOARD
========================================== */

function kembaliDashboard() {

window.location.href =
    "dashboard.html";

}

/* ==========================================
ESCAPE HTML
========================================== */

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

/* ==========================================
LOAD SALDO KAS
========================================== */

async function loadSaldoKas() {

try {

    cekKasClient();


    const result =
        await supabaseClient.rpc(
            "get_cash_balance"
        );


    console.log(
        "Saldo kas:",
        result
    );


    if (
        result.error
    ) {

        throw result.error;

    }


    let data =
        result.data;


    if (
        data &&
        typeof data ===
            "object" &&
        data.data
    ) {

        data =
            data.data;

    }


    if (
        Array.isArray(
            data
        )
    ) {

        data =
            data[0] ||
            {};

    }


    const saldo =
        Number(
            data?.balance
        ) || 0;


    const masuk =
        Number(
            data?.income
        ) || 0;


    const keluar =
        Number(
            data?.expense
        ) || 0;


    const saldoElement =
        document.getElementById(
            "saldoKas"
        );


    const masukElement =
        document.getElementById(
            "totalMasuk"
        );


    const keluarElement =
        document.getElementById(
            "totalKeluar"
        );


    if (
        saldoElement
    ) {

        saldoElement.textContent =
            formatRupiah(
                saldo
            );

    }


    if (
        masukElement
    ) {

        masukElement.textContent =
            formatRupiah(
                masuk
            );

    }


    if (
        keluarElement
    ) {

        keluarElement.textContent =
            formatRupiah(
                keluar
            );

    }


} catch (
    error
) {

    console.error(
        "Load saldo kas error:",
        error
    );

}

}

/* ==========================================
LOAD RIWAYAT KAS
========================================== */

async function loadRiwayatKas() {

const loading =
    document.getElementById(
        "loading"
    );


try {

    cekKasClient();


    const result =
        await supabaseClient
            .from(
                "cash_transactions"
            )
            .select(
                `
                id,
                transaction_type,
                category,
                amount,
                description,
                transaction_date,
                created_at
                `
            )
            .order(
                "transaction_date",
                {
                    ascending:
                        false
                }
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    console.log(
        "Riwayat kas:",
        result.data
    );


    if (
        result.error
    ) {

        throw result.error;

    }


    semuaTransaksiKas =
        result.data ||
        [];


    if (
        loading
    ) {

        loading.style.display =
            "none";

    }


    tampilkanTransaksi(
        semuaTransaksiKas
    );


    updateRingkasanFilter(
        semuaTransaksiKas
    );


} catch (
    error
) {

    console.error(
        "Load riwayat kas error:",
        error
    );


    if (
        loading
    ) {

        loading.textContent =
            "Gagal memuat transaksi kas.";

    }

}

}

/* ==========================================
TAMPILKAN TRANSAKSI
========================================== */

function tampilkanTransaksi(
data
) {

const container =
    document.getElementById(
        "riwayatKas"
    );


const empty =
    document.getElementById(
        "emptyState"
    );


if (
    !container
) {

    return;

}


container.innerHTML =
    "";


if (
    !data ||
    data.length ===
        0
) {

    if (
        empty
    ) {

        empty.style.display =
            "block";

    }


    return;

}


if (
    empty
) {

    empty.style.display =
        "none";

}


data.forEach(
    transaksi => {

        const isIncome =
            transaksi
                .transaction_type ===
                "income" ||

            transaksi
                .transaction_type ===
                "jimpitan_transfer";


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "transaction-card";


        const jenisLabel =
            transaksi
                .transaction_type ===
                "jimpitan_transfer"

                ? "Transfer Jimpitan"

                : (
                    transaksi
                        .transaction_type ===
                        "income"

                        ? "Kas Masuk"

                        : "Kas Keluar"
                );


        card.innerHTML = `

            <div
                class="transaction-top"
            >

                <div
                    class="transaction-title"
                >

                    ${escapeHTML(
                        transaksi.category ||
                        jenisLabel
                    )}

                </div>


                <div
                    class="transaction-amount ${
                        isIncome
                            ? "income"
                            : "expense"
                    }"
                >

                    ${
                        isIncome
                            ? "+"
                            : "-"
                    }

                    ${formatRupiah(
                        transaksi.amount
                    )}

                </div>

            </div>


            <div
                class="transaction-info"
            >

                ${escapeHTML(
                    transaksi.description ||
                    "-"
                )}

            </div>


            <div
                class="transaction-info"
            >

                ${formatTanggal(
                    transaksi.transaction_date
                )}

            </div>


            <div
                class="transaction-info"
            >

                ${jenisLabel}

            </div>

        `;


        container.appendChild(
            card
        );

    }
);

}

/* ==========================================
TERAPKAN FILTER
========================================== */

function terapkanFilterKas() {

const mulai =
    document.getElementById(
        "filterTanggalMulai"
    )?.value ||
    "";


const akhir =
    document.getElementById(
        "filterTanggalAkhir"
    )?.value ||
    "";


const jenis =
    document.getElementById(
        "filterJenisKas"
    )?.value ||
    "all";


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


let hasil =
    [...semuaTransaksiKas];


if (
    mulai
) {

    hasil =
        hasil.filter(
            transaksi =>
                transaksi
                    .transaction_date >=
                mulai
        );

}


if (
    akhir
) {

    hasil =
        hasil.filter(
            transaksi =>
                transaksi
                    .transaction_date <=
                akhir
        );

}


if (
    jenis !==
    "all"
) {

    hasil =
        hasil.filter(
            transaksi =>
                transaksi
                    .transaction_type ===
                jenis
        );

}


tampilkanTransaksi(
    hasil
);


updateRingkasanFilter(
    hasil
);


updateJudulFilter(
    mulai,
    akhir,
    jenis
);

}

/* ==========================================
UPDATE RINGKASAN FILTER
========================================== */

function updateRingkasanFilter(
data
) {

let masuk =
    0;


let keluar =
    0;


data.forEach(
    transaksi => {

        const nominal =
            Number(
                transaksi.amount
            ) || 0;


        if (
            transaksi
                .transaction_type ===
                "income" ||

            transaksi
                .transaction_type ===
                "jimpitan_transfer"
        ) {

            masuk +=
                nominal;

        }


        if (
            transaksi
                .transaction_type ===
                "expense"
        ) {

            keluar +=
                nominal;

        }

    }
);


const saldo =
    masuk -
    keluar;


const jumlah =
    document.getElementById(
        "jumlahFilter"
    );


const masukElement =
    document.getElementById(
        "filterMasuk"
    );


const keluarElement =
    document.getElementById(
        "filterKeluar"
    );


const saldoElement =
    document.getElementById(
        "filterSaldo"
    );


if (
    jumlah
) {

    jumlah.textContent =
        data.length;

}


if (
    masukElement
) {

    masukElement.textContent =
        formatRupiah(
            masuk
        );

}


if (
    keluarElement
) {

    keluarElement.textContent =
        formatRupiah(
            keluar
        );

}


if (
    saldoElement
) {

    saldoElement.textContent =
        formatRupiah(
            saldo
        );

}

}

/* ==========================================
UPDATE JUDUL FILTER
========================================== */

function updateJudulFilter(
mulai,
akhir,
jenis
) {

const judul =
    document.getElementById(
        "judulRiwayat"
    );


if (
    !judul
) {

    return;

}


let text =
    "Hasil filter";


if (
    mulai &&
    akhir
) {

    text +=
        ` • ${formatTanggal(
            mulai
        )} - ${formatTanggal(
            akhir
        )}`;

} else if (
    mulai
) {

    text +=
        ` • Mulai ${formatTanggal(
            mulai
        )}`;

} else if (
    akhir
) {

    text +=
        ` • Sampai ${formatTanggal(
            akhir
        )}`;

}


if (
    jenis ===
    "income"
) {

    text +=
        " • Kas Masuk";

}


if (
    jenis ===
    "expense"
) {

    text +=
        " • Kas Keluar";

}


if (
    jenis ===
    "jimpitan_transfer"
) {

    text +=
        " • Transfer Jimpitan";

}


if (
    !mulai &&
    !akhir &&
    jenis ===
        "all"
) {

    text =
        "Seluruh transaksi kas RT";

}


judul.textContent =
    text;

}

/* ==========================================
RESET FILTER
========================================== */

function resetFilterKas() {

const mulai =
    document.getElementById(
        "filterTanggalMulai"
    );


const akhir =
    document.getElementById(
        "filterTanggalAkhir"
    );


const jenis =
    document.getElementById(
        "filterJenisKas"
    );


if (
    mulai
) {

    mulai.value =
        "";

}


if (
    akhir
) {

    akhir.value =
        "";

}


if (
    jenis
) {

    jenis.value =
        "all";

}


tampilkanTransaksi(
    semuaTransaksiKas
);


updateRingkasanFilter(
    semuaTransaksiKas
);


const judul =
    document.getElementById(
        "judulRiwayat"
    );


if (
    judul
) {

    judul.textContent =
        "Seluruh transaksi kas RT";

}

}

/* ==========================================
EXPORT CSV
========================================== */

function exportKasCSV() {

try {

    const mulai =
        document.getElementById(
            "filterTanggalMulai"
        )?.value ||
        "";


    const akhir =
        document.getElementById(
            "filterTanggalAkhir"
        )?.value ||
        "";


    const jenis =
        document.getElementById(
            "filterJenisKas"
        )?.value ||
        "all";


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


    let data =
        [...semuaTransaksiKas];


    if (
        mulai
    ) {

        data =
            data.filter(
                transaksi =>
                    transaksi
                        .transaction_date >=
                    mulai
            );

    }


    if (
        akhir
    ) {

        data =
            data.filter(
                transaksi =>
                    transaksi
                        .transaction_date <=
                    akhir
            );

    }


    if (
        jenis !==
        "all"
    ) {

        data =
            data.filter(
                transaksi =>
                    transaksi
                        .transaction_type ===
                    jenis
            );

    }


    if (
        data.length ===
        0
    ) {

        alert(
            "Tidak ada transaksi sesuai filter yang dipilih."
        );

        return;

    }

/* ==========================================
   URUTKAN KEMBALI BERDASARKAN TANGGAL
   TERBARU
   ========================================== */

dataLaporan.sort(
    (
        a,
        b
    ) => {

        const tanggalA =
            String(
                a.transaction_date ||
                ""
            );

        const tanggalB =
            String(
                b.transaction_date ||
                ""
            );


        if (
            tanggalA !==
            tanggalB
        ) {

            return tanggalB.localeCompare(
                tanggalA
            );

        }


        const waktuA =
            new Date(
                a.created_at ||
                0
            ).getTime();

        const waktuB =
            new Date(
                b.created_at ||
                0
            ).getTime();


        return waktuB - waktuA;

    }
);


    const rows = [

        [
            "Tanggal",
            "Jenis Transaksi",
            "Kategori",
            "Nominal",
            "Keterangan"
        ]

    ];


    data.forEach(
        transaksi => {

            let jenisLabel =
                "Kas Keluar";


            if (
                transaksi
                    .transaction_type ===
                "income"
            ) {

                jenisLabel =
                    "Kas Masuk";

            }


            if (
                transaksi
                    .transaction_type ===
                "jimpitan_transfer"
            ) {

                jenisLabel =
                    "Transfer Jimpitan";

            }


            rows.push([

                formatTanggalCSV(
                    transaksi
                        .transaction_date
                ),

                jenisLabel,

                transaksi.category ||
                "",

                Number(
                    transaksi.amount
                ) || 0,

                transaksi.description ||
                ""

            ]);

        }
    );


    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value ??
                                    ""
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\r\n");


    const blob =
        new Blob(
            [
                "\uFEFF" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    let namaFile =
        "kas-rt";


    if (
        mulai &&
        akhir
    ) {

        namaFile +=
            `-${mulai}-sd-${akhir}`;

    } else if (
        mulai
    ) {

        namaFile +=
            `-mulai-${mulai}`;

    } else if (
        akhir
    ) {

        namaFile +=
            `-sampai-${akhir}`;

    } else {

        namaFile +=
            "-semua-periode";

    }


    if (
        jenis ===
        "income"
    ) {

        namaFile +=
            "-kas-masuk";

    }


    if (
        jenis ===
        "expense"
    ) {

        namaFile +=
            "-kas-keluar";

    }


    if (
        jenis ===
        "jimpitan_transfer"
    ) {

        namaFile +=
            "-transfer-jimpitan";

    }


    namaFile +=
        ".csv";


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        namaFile;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );


    console.log(
        "SIDAT: Export kas berhasil.",
        {
            file:
                namaFile,

            jumlah:
                data.length
        }
    );


    alert(
        `Export berhasil.\n${data.length} transaksi`
    );


} catch (
    error
) {

    console.error(
        "Export kas error:",
        error
    );


    alert(
        "Gagal melakukan export CSV."
    );

}

}

/* ==========================================
SIMPAN TRANSAKSI
========================================== */

async function simpanTransaksiKas(
event
) {

event.preventDefault();


const form =
    document.getElementById(
        "formKas"
    );


const button =
    document.getElementById(
        "btnSimpanKas"
    );


const jenis =
    document.getElementById(
        "jenisKas"
    )?.value ||
    "";


const kategori =
    document.getElementById(
        "kategoriKas"
    )?.value
        .trim() ||
    "";


const nominal =
    Number(
        document.getElementById(
            "nominalKas"
        )?.value ||
        0
    );


const tanggal =
    document.getElementById(
        "tanggalKas"
    )?.value ||
    "";


const keterangan =
    document.getElementById(
        "keteranganKas"
    )?.value
        .trim() ||
    "";


if (
    jenis !==
        "income" &&
    jenis !==
        "expense"
) {

    alert(
        "Jenis transaksi tidak valid."
    );

    return;

}


if (
    !kategori
) {

    alert(
        "Kategori transaksi wajib diisi."
    );

    return;

}


if (
    nominal <=
    0
) {

    alert(
        "Nominal harus lebih dari 0."
    );

    return;

}


if (
    !tanggal
) {

    alert(
        "Tanggal transaksi wajib diisi."
    );

    return;

}


try {

    cekKasClient();


    if (
        button
    ) {

        button.disabled =
            true;

        button.textContent =
            "Menyimpan...";

    }


    /*
     * Cek saldo sebelum
     * kas keluar.
     */

    if (
        jenis ===
        "expense"
    ) {

        const saldoResult =
            await supabaseClient.rpc(
                "get_cash_balance"
            );


        if (
            saldoResult.error
        ) {

            throw saldoResult.error;

        }


        let saldoData =
            saldoResult.data;


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


        const saldoSekarang =
            Number(
                saldoData?.balance
            ) || 0;


        if (
            nominal >
            saldoSekarang
        ) {

            alert(
                `Saldo kas tidak mencukupi.\n\nSaldo saat ini: ${formatRupiah(
                    saldoSekarang
                )}\nPengeluaran: ${formatRupiah(
                    nominal
                )}`
            );


            return;

        }

    }


    const result =
        await supabaseClient
            .from(
                "cash_transactions"
            )
            .insert([
                {

                    transaction_type:
                        jenis,

                    category:
                        kategori,

                    amount:
                        nominal,

                    description:
                        keterangan ||
                        null,

                    transaction_date:
                        tanggal

                }
            ])
            .select();


    console.log(
        "INSERT KAS DETAIL:",
        result
    );


    if (
        result.error
    ) {

        throw result.error;

    }


    alert(
        "Transaksi kas berhasil disimpan."
    );


    if (
        form
    ) {

        form.reset();

    }


    const tanggalElement =
        document.getElementById(
            "tanggalKas"
        );


    if (
        tanggalElement
    ) {

        tanggalElement.value =
            new Date()
                .toISOString()
                .split(
                    "T"
                )[0];

    }


    await loadSaldoKas();

    await loadRiwayatKas();


} catch (
    error
) {

    console.error(
        "Simpan transaksi kas error:",
        error
    );


    console.error(
        "ERROR CODE:",
        error?.code
    );


    console.error(
        "ERROR MESSAGE:",
        error?.message
    );


    console.error(
        "ERROR DETAILS:",
        error?.details
    );


    console.error(
        "ERROR HINT:",
        error?.hint
    );


    alert(
        error?.message ||
        "Gagal menyimpan transaksi kas."
    );


} finally {

    if (
        button
    ) {

        button.disabled =
            false;

        button.textContent =
            "Simpan Transaksi";

    }

}

}
/* ==========================================
CETAK LAPORAN KAS
========================================== */

function cetakLaporanKas() {

    try {

        const mulai =
            document.getElementById(
                "filterTanggalMulai"
            )?.value || "";

        const akhir =
            document.getElementById(
                "filterTanggalAkhir"
            )?.value || "";

        const jenis =
            document.getElementById(
                "filterJenisKas"
            )?.value || "all";


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


        let data =
    [...semuaTransaksiKas];


/* ==========================================
   DATA WILAYAH UNTUK KOP LAPORAN
   ========================================== */

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


/*
 * Jika data wilayah sudah tersedia
 * secara global, gunakan sebagai fallback.
 */

if (
    !wilayahLaporan &&
    typeof wilayahData !== "undefined" &&
    wilayahData
) {

    wilayahLaporan =
        wilayahData;

}

        if (mulai) {

            data =
                data.filter(
                    transaksi =>
                        transaksi.transaction_date >=
                        mulai
                );

        }


        if (akhir) {

            data =
                data.filter(
                    transaksi =>
                        transaksi.transaction_date <=
                        akhir
                );

        }


        if (jenis !== "all") {

            data =
                data.filter(
                    transaksi =>
                        transaksi.transaction_type ===
                        jenis
                );

        }


        if (data.length === 0) {

            alert(
                "Tidak ada transaksi sesuai filter yang dipilih."
            );

            return;

        }
      /* ==========================================
   DATA LAPORAN CETAK
   ========================================== */

const dataTransaksiAsli =
    [...data];

const dataLaporan = [];

const jimpitanPerTanggal = {};


/* ==========================================
   GABUNG TRANSFER JIMPITAN BERDASARKAN TANGGAL
   ========================================== */

dataTransaksiAsli.forEach(
    transaksi => {

        if (
            transaksi.transaction_type ===
            "jimpitan_transfer"
        ) {

            const tanggal =
                transaksi.transaction_date;


            if (
                !jimpitanPerTanggal[tanggal]
            ) {

                jimpitanPerTanggal[tanggal] = {

                    ...transaksi,

                    amount:
                        0,

                    description:
                        "Transfer jimpitan ke kas RT"

                };

            }


            jimpitanPerTanggal[tanggal].amount +=
                Number(
                    transaksi.amount
                ) || 0;


            return;

        }


        dataLaporan.push(
            transaksi
        );

    }
);


/* ==========================================
   MASUKKAN HASIL GABUNGAN JIMPITAN
   ========================================== */

Object.values(
    jimpitanPerTanggal
).forEach(
    transaksi => {

        dataLaporan.push(
            transaksi
        );

    }
);


/* ==========================================
   URUTKAN LAPORAN
   ========================================== */

dataLaporan.sort(
    (
        a,
        b
    ) => {

        const tanggalA =
            String(
                a.transaction_date ||
                ""
            );

        const tanggalB =
            String(
                b.transaction_date ||
                ""
            );


        if (
            tanggalA !==
            tanggalB
        ) {

            return tanggalB.localeCompare(
                tanggalA
            );

        }


        const waktuA =
            new Date(
                a.created_at ||
                0
            ).getTime();

        const waktuB =
            new Date(
                b.created_at ||
                0
            ).getTime();


        return waktuB - waktuA;

    }
);
      


        let totalMasuk = 0;
        let totalKeluar = 0;


        data.forEach(
            transaksi => {

                const nominal =
                    Number(
                        transaksi.amount
                    ) || 0;


                if (
                    transaksi.transaction_type ===
                        "income" ||

                    transaksi.transaction_type ===
                        "jimpitan_transfer"
                ) {

                    totalMasuk +=
                        nominal;

                }


                if (
                    transaksi.transaction_type ===
                    "expense"
                ) {

                    totalKeluar +=
                        nominal;

                }

            }
        );


        const saldoPeriode =
            totalMasuk -
            totalKeluar;


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


        let jenisLaporan =
            "Semua Transaksi";


        if (
            jenis ===
            "income"
        ) {

            jenisLaporan =
                "Kas Masuk";

        }

        if (
            jenis ===
            "expense"
        ) {

            jenisLaporan =
                "Kas Keluar";

        }

        if (
            jenis ===
            "jimpitan_transfer"
        ) {

            jenisLaporan =
                "Transfer Jimpitan";

        }


        let nomor = 1;


        const rows =
            dataLaporan.map(
                transaksi => {

                    const isIncome =
                        transaksi
                            .transaction_type ===
                            "income" ||

                        transaksi
                            .transaction_type ===
                            "jimpitan_transfer";


                    const masuk =
                        isIncome
                            ? formatRupiah(
                                transaksi.amount
                            )
                            : "-";


                    const keluar =
                        !isIncome
                            ? formatRupiah(
                                transaksi.amount
                            )
                            : "-";


                    const jenisTransaksi =
                        transaksi
                            .transaction_type ===
                            "jimpitan_transfer"

                            ? "Transfer Jimpitan"

                            : (
                                transaksi
                                    .transaction_type ===
                                "income"

                                    ? "Kas Masuk"

                                    : "Kas Keluar"
                            );


                    return `

                        <tr>

                            <td>
                                ${nomor++}
                            </td>

                            <td>
                                ${formatTanggal(
                                    transaksi.transaction_date
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    jenisTransaksi
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    transaksi.category ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    transaksi.description ||
                                    "-"
                                )}
                            </td>

                            <td class="nominal masuk">
                                ${masuk}
                            </td>

                            <td class="nominal keluar">
                                ${keluar}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


        const tanggalCetak =
            new Date()
                .toLocaleDateString(
                    "id-ID",
                    {
                        day:
                            "2-digit",

                        month:
                            "long",

                        year:
                            "numeric"
                    }
                );


        const laporan =
            `

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>
Laporan Kas RT
</title>


<style>

* {
    box-sizing: border-box;
}


body {

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color:
        #111827;

    margin:
        30px;

}


.header {

    text-align:
        center;

    margin-bottom:
        25px;

}


.header h1 {

    margin:
        0;

    font-size:
        22px;

}


.header h2 {

    margin:
        5px 0 0;

    font-size:
        18px;

}


.header p {

    margin:
        5px 0;

    font-size:
        13px;

}


.info {

    margin-bottom:
        20px;

    font-size:
        13px;

}


.info div {

    margin-bottom:
        5px;

}


.summary {

    display:
        grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:
        10px;

    margin-bottom:
        20px;

}


.summary-box {

    border:
        1px solid
        #d1d5db;

    padding:
        12px;

    text-align:
        center;

}


.summary-box span {

    display:
        block;

    font-size:
        11px;

    color:
        #6b7280;

}


.summary-box strong {

    display:
        block;

    margin-top:
        5px;

    font-size:
        14px;

}


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
        1px solid
        #9ca3af;

    padding:
        7px;

    vertical-align:
        top;

}


th {

    background:
        #f3f4f6;

    text-align:
        center;

}


.nominal {

    text-align:
        right;

    white-space:
        nowrap;

}


.masuk {

    color:
        #15803d;

}


.keluar {

    color:
        #dc2626;

}


.footer {

    margin-top:
        35px;

    display:
        flex;

    justify-content:
        flex-end;

}


.signature {

    width:
        220px;

    text-align:
        center;

}


.signature .space {

    height:
        70px;

}


@media print {

    body {

        margin:
            15mm;

    }


    .no-print {

        display:
            none;

    }

}
.print-footer {
    position: fixed;
    bottom: 8px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 9px;
    color: #6b7280;
    border-top: 1px solid #d1d5db;
    padding-top: 4px;
}
</style>

</head>


<body>


<div class="header">

    <h1>
        LAPORAN KAS
    </h1>

    <div class="wilayah">

        ${
            wilayahLaporan?.rt
                ? "RT " +
                  String(
                      wilayahLaporan.rt
                  ).padStart(
                      2,
                      "0"
                  )
                : ""
        }

        ${
            wilayahLaporan?.rw
                ? " / RW " +
                  String(
                      wilayahLaporan.rw
                  ).padStart(
                      2,
                      "0"
                  )
                : ""
        }

    </div>


    <div class="wilayah">

        ${
            wilayahLaporan?.nama_dusun
                ? "Dusun " +
                  escapeHTML(
                      wilayahLaporan.nama_dusun
                  )
                : ""
        }

        ${
            wilayahLaporan?.nama_desa
                ? " • Desa " +
                  escapeHTML(
                      wilayahLaporan.nama_desa
                  )
                : ""
        }

    </div>


    <div class="wilayah">

        ${
            wilayahLaporan?.kecamatan
                ? "Kec. " +
                  escapeHTML(
                      wilayahLaporan.kecamatan
                  )
                : ""
        }

        ${
            wilayahLaporan?.kabupaten
                ? " • Kab. " +
                  escapeHTML(
                      wilayahLaporan.kabupaten
                  )
                : ""
        }

        ${
            wilayahLaporan?.provinsi
                ? " • " +
                  escapeHTML(
                      wilayahLaporan.provinsi
                  )
                : ""
        }

    </div>
     <div style="
    width: 100%;
    border-bottom: 2px solid #111827;
    margin-top: 10px;
    margin-bottom: 12px;
"></div>
</div>

<div class="info">

    <div>
        <strong>
            Periode:
        </strong>

        ${periode}

    </div>


    <div>

        <strong>
            Jenis:
        </strong>

        ${jenisLaporan}

    </div>


    <div>

        <strong>
            Jumlah Transaksi:
        </strong>

        ${dataLaporan.length}

        transaksi

    </div>

</div>


<div class="summary">


    <div class="summary-box">

        <span>
            TOTAL MASUK
        </span>

        <strong>
            ${formatRupiah(
                totalMasuk
            )}
        </strong>

    </div>


    <div class="summary-box">

        <span>
            TOTAL KELUAR
        </span>

        <strong>
            ${formatRupiah(
                totalKeluar
            )}
        </strong>

    </div>


    <div class="summary-box">

        <span>
            SALDO PERIODE
        </span>

        <strong>
            ${formatRupiah(
                saldoPeriode
            )}
        </strong>

    </div>


</div>


<table>

<thead>

<tr>

    <th>
        No
    </th>

    <th>
        Tanggal
    </th>

    <th>
        Jenis
    </th>

    <th>
        Kategori
    </th>

    <th>
        Keterangan
    </th>

    <th>
        Masuk
    </th>

    <th>
        Keluar
    </th>

</tr>

</thead>


<tbody>

${rows}

</tbody>

</table>


<div style="
    position: relative;
    width: 100%;
    margin-top: 30px;
    min-height: 145px;
    box-sizing: border-box;
">

    <!-- TANGGAL -->
    <div style="
        width: 100%;
        text-align: right;
        margin-bottom: 18px;
        box-sizing: border-box;
    ">
        ${
            wilayahLaporan?.kabupaten
                ? escapeHTML(wilayahLaporan.kabupaten) + ", "
                : ""
        }${tanggalCetak}
    </div>

    <!-- TANDA TANGAN -->
    <div style="
        width: 100%;
        display: block;
        position: relative;
        height: 105px;
        box-sizing: border-box;
    ">

        <!-- KOLOM KIRI -->
        <div style="
            position: absolute;
            left: 0;
            top: 0;
            width: 50%;
            text-align: center;
            box-sizing: border-box;
        ">
            <div>
                Mengetahui,
            </div>

            <div style="
                font-weight: bold;
            ">
                Ketua RT
            </div>

            <div style="
                height: 55px;
            "></div>

            <div>
                (.................................)
            </div>
        </div>

        <!-- KOLOM KANAN -->
        <div style="
            position: absolute;
            right: 0;
            top: 0;
            width: 50%;
            text-align: center;
            box-sizing: border-box;
        ">
            <div style="
                font-weight: bold;
            ">
                Bendahara RT
            </div>

            <div style="
                height: 73px;
            "></div>

            <div>
                (.................................)
            </div>
        </div>

    </div>

</div>

<!-- FOOTER PALING BAWAH -->
<div class="print-footer">
    SIDAT • Sistem Informasi Data RT • Suwardi
</div>
</html>

`;


        /*
         * APK ANDROID
         * -----------------------------------------
         * Gunakan Android Print Framework melalui
         * Capacitor PrintBridge.
         */

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
                    "SIDAT - Laporan Kas RT"
                )
                .catch(
                    error => {

                        console.error(
                            "SIDAT CETAK KAS NATIVE ERROR:",
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


        /*
         * WEB BROWSER
         * -----------------------------------------
         * Tetap menggunakan mekanisme cetak lama.
         */

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


    } catch (
        error
    ) {

        console.error(
            "Cetak laporan kas error:",
            error
        );


        alert(
            "Gagal membuat laporan kas."
        );

    }

}
/* ==========================================
   LOAD WILAYAH KAS RT
   ========================================== */

async function loadWilayahKas() {

    try {

        const accessToken =
            localStorage.getItem(
                "sidat_access_token"
            );

        if (!accessToken) {

            console.warn(
                "SIDAT: access token tidak ditemukan saat memuat wilayah."
            );

            return;

        }

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/wilayah?select=id,nama_aplikasi,nama_dusun,nama_desa,rt,rw,nama_ketua_rt,kecamatan,kabupaten,provinsi,logo_url&limit=1`,
                {
                    method: "GET",

                    headers: {
                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                `Gagal memuat wilayah: HTTP ${response.status}`
            );

        }

        const rows =
            await response.json();

        if (
            !Array.isArray(rows) ||
            !rows.length
        ) {

            console.warn(
                "SIDAT: data wilayah tidak ditemukan."
            );

            return;

        }

        const wilayah =
            rows[0];

        localStorage.setItem(
            "sidat_wilayah_data",
            JSON.stringify(wilayah)
        );

        console.log(
            "SIDAT: Wilayah Kas RT berhasil dimuat.",
            wilayah
        );

    } catch (error) {

        console.error(
            "SIDAT: gagal memuat wilayah Kas RT:",
            error
        );

    }

}

/* ==========================================
INIT KAS
========================================== */

async function initKas() {

try {

    console.log(
        "SIDAT: memulai Kas RT..."
    );


    initSupabase();


    const form =
        document.getElementById(
            "formKas"
        );


    if (
        !form
    ) {

        throw new Error(
            "Form transaksi kas tidak ditemukan."
        );

    }


    if (
        !form.dataset
            .kasInitialized
    ) {

        form.addEventListener(
            "submit",
            simpanTransaksiKas
        );


        form.dataset
            .kasInitialized =
            "true";

    }


    const tanggal =
        document.getElementById(
            "tanggalKas"
        );


    if (
        tanggal &&
        !tanggal.value
    ) {

        tanggal.value =
            new Date()
                .toISOString()
                .split(
                    "T"
                )[0];

    }


    const btnFilter =
        document.getElementById(
            "btnTerapkanFilter"
        );


    const btnReset =
        document.getElementById(
            "btnResetFilter"
        );


    const btnExport =
        document.getElementById(
            "btnExportKas"
        );
const btnCetak =
    document.getElementById(
        "btnCetakKas"
    );

    if (
        btnFilter &&
        !btnFilter.dataset
            .initialized
    ) {

        btnFilter.addEventListener(
            "click",
            terapkanFilterKas
        );


        btnFilter.dataset
            .initialized =
            "true";

    }


    if (
        btnReset &&
        !btnReset.dataset
            .initialized
    ) {

        btnReset.addEventListener(
            "click",
            resetFilterKas
        );


        btnReset.dataset
            .initialized =
            "true";

    }


    if (
        btnExport &&
        !btnExport.dataset
            .initialized
    ) {

        btnExport.addEventListener(
            "click",
            exportKasCSV
        );


        btnExport.dataset
            .initialized =
            "true";

    }
    if (
    btnCetak &&
    !btnCetak.dataset
        .initialized
) {

    btnCetak.addEventListener(
        "click",
        cetakLaporanKas
    );

    btnCetak.dataset
        .initialized =
        "true";

}


    await Promise.all([

    loadWilayahKas(),

    loadSaldoKas(),

    loadRiwayatKas()

]);

    console.log(
        "SIDAT: Kas RT siap."
    );


} catch (
    error
) {

    console.error(
        "Kas RT init error:",
        error
    );


    console.error(
        "INIT ERROR MESSAGE:",
        error?.message
    );


    console.error(
        "INIT ERROR STACK:",
        error?.stack
    );

}

}

/* ==========================================
START
========================================== */

document.addEventListener(
"DOMContentLoaded",
initKas
);