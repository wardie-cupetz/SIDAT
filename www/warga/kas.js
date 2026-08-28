// ==========================================
// SIDAT
// KAS RT
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


// ==========================================
// ELEMENT
// ==========================================

const saldoKas =
    document.getElementById(
        "saldoKas"
    );

const totalPemasukan =
    document.getElementById(
        "totalPemasukan"
    );

const totalPengeluaran =
    document.getElementById(
        "totalPengeluaran"
    );

const filterJenis =
    document.getElementById(
        "filterJenis"
    );

const filterBulan =
    document.getElementById(
        "filterBulan"
    );

const transactionList =
    document.getElementById(
        "transactionList"
    );

const loading =
    document.getElementById(
        "loading"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


// ==========================================
// DATA TRANSAKSI
// ==========================================

let semuaTransaksi = [];

let transaksiTampil = [];


// ==========================================
// CEK SESSION
// ==========================================

if (!accessToken) {

    console.warn(
        "SIDAT KAS: Session tidak ditemukan."
    );

    window.location.href =
        "../index.html";

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
// ESCAPE HTML
// ==========================================

function escapeHTML(
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
// CEK KAS MASUK
// ==========================================

function isKasMasuk(
    type
) {

    const value =
        String(
            type || ""
        )
        .trim()
        .toLowerCase();


    return (

        value === "income" ||

        value === "masuk" ||

        value === "pemasukan" ||

        value ===
            "jimpitan_transfer"

    );

}


// ==========================================
// CEK KAS KELUAR
// ==========================================

function isKasKeluar(
    type
) {

    const value =
        String(
            type || ""
        )
        .trim()
        .toLowerCase();


    return (

        value === "expense" ||

        value === "keluar" ||

        value === "pengeluaran"

    );

}


// ==========================================
// FORMAT JENIS TRANSAKSI
// ==========================================

function namaJenisTransaksi(
    type
) {

    const value =
        String(
            type || ""
        )
        .trim()
        .toLowerCase();


    if (
        isKasMasuk(
            value
        )
    ) {

        return "Pemasukan";

    }


    if (
        isKasKeluar(
            value
        )
    ) {

        return "Pengeluaran";

    }


    return "Transaksi";

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
            `${tanggal}T00:00:00`
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
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    );

}


// ==========================================
// KEMBALI DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "../warga/dashboard.html";

}


// ==========================================
// TAMPILKAN LOADING
// ==========================================

function tampilkanLoading(
    tampil
) {

    if (!loading) {

        return;

    }


    if (tampil) {

        loading.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// TAMPILKAN ERROR
// ==========================================

function tampilkanError(
    pesan
) {

    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

    }


    if (errorMessage) {

        errorMessage.textContent =
            pesan ||
            "Terjadi kesalahan.";

    }

}


// ==========================================
// SEMBUNYIKAN ERROR
// ==========================================

function sembunyikanError() {

    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// LOAD TRANSAKSI KAS
// ==========================================

async function muatKas() {

    console.log(
        "SIDAT KAS: Memuat transaksi..."
    );


    tampilkanLoading(
        true
    );

    sembunyikanError();


    try {

        if (!accessToken) {

            throw new Error(
                "Session warga tidak ditemukan."
            );

        }


        const url =
            `${SUPABASE_URL}/rest/v1/cash_transactions` +
            `?select=` +
            `id,` +
            `transaction_type,` +
            `category,` +
            `amount,` +
            `description,` +
            `transaction_date` +
            `&order=transaction_date.desc,created_at.desc`;


        console.log(
            "SIDAT KAS URL:",
            url
        );


        const response =
            await fetch(
                url,
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


        console.log(
            "SIDAT KAS STATUS:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                `Gagal memuat transaksi (${response.status})`
            );

        }


        const data =
            await response.json();


        console.log(
            "SIDAT KAS DATA:",
            data
        );


        semuaTransaksi =
            Array.isArray(
                data
            )
                ? data
                : [];


        console.log(
            "SIDAT KAS JUMLAH DATA:",
            semuaTransaksi.length
        );


        if (
            semuaTransaksi.length > 0
        ) {

            console.log(
                "SIDAT KAS DATA PERTAMA:",
                semuaTransaksi[0]
            );

        }


        // ==================================
        // TERAPKAN FILTER
        // ==================================

        terapkanFilter();


    } catch (error) {

        console.error(
            "SIDAT KAS ERROR:",
            error
        );


        semuaTransaksi =
            [];

        transaksiTampil =
            [];


        updateSummary(
            []
        );


        tampilkanTransaksi(
            []
        );


        tampilkanError(
            error.message
        );


    } finally {

        tampilkanLoading(
            false
        );

    }

}


// ==========================================
// TERAPKAN FILTER
// ==========================================

function terapkanFilter() {

    const jenis =
        filterJenis
            ? filterJenis.value
            : "";


    const bulan =
        filterBulan
            ? filterBulan.value
            : "";


    transaksiTampil =
        semuaTransaksi.filter(
            transaksi => {

                // ==================================
                // FILTER JENIS
                // ==================================

                if (
                    jenis === "masuk"
                ) {

                    if (
                        !isKasMasuk(
                            transaksi.transaction_type
                        )
                    ) {

                        return false;

                    }

                }


                if (
                    jenis === "keluar"
                ) {

                    if (
                        !isKasKeluar(
                            transaksi.transaction_type
                        )
                    ) {

                        return false;

                    }

                }


                // ==================================
                // FILTER BULAN
                // ==================================

                if (
                    bulan
                ) {

                    const tanggal =
                        String(
                            transaksi.transaction_date ||
                            ""
                        );


                    if (
                        !tanggal.startsWith(
                            bulan
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    console.log(
        "SIDAT KAS FILTER:",
        {
            jenis:
                jenis ||
                "semua",

            bulan:
                bulan ||
                "semua",

            jumlah:
                transaksiTampil.length
        }
    );


    // ==================================
    // UPDATE RINGKASAN
    // ==================================

    updateSummary(
        transaksiTampil
    );


    // ==================================
    // UPDATE RIWAYAT
    // ==================================

    tampilkanTransaksi(
        transaksiTampil
    );


    // ==================================
    // EMPTY STATE
    // ==================================

    if (emptyState) {

        if (
            transaksiTampil.length === 0
        ) {

            emptyState.classList.remove(
                "hidden"
            );

        } else {

            emptyState.classList.add(
                "hidden"
            );

        }

    }

}


// ==========================================
// UPDATE RINGKASAN
// ==========================================

function updateSummary(
    data
) {

    let masuk =
        0;

    let keluar =
        0;


    if (
        !Array.isArray(
            data
        )
    ) {

        data =
            [];

    }


    data.forEach(
        transaksi => {

            const amount =
                Number(
                    transaksi.amount
                ) || 0;


            if (
                isKasMasuk(
                    transaksi.transaction_type
                )
            ) {

                masuk +=
                    amount;

            }


            else if (
                isKasKeluar(
                    transaksi.transaction_type
                )
            ) {

                keluar +=
                    amount;

            }

        }
    );


    const saldo =
        masuk -
        keluar;


    console.log(
        "SIDAT KAS MASUK:",
        masuk
    );


    console.log(
        "SIDAT KAS KELUAR:",
        keluar
    );


    console.log(
        "SIDAT SALDO:",
        saldo
    );


    if (
        totalPemasukan
    ) {

        totalPemasukan.textContent =
            formatRupiah(
                masuk
            );

    }


    if (
        totalPengeluaran
    ) {

        totalPengeluaran.textContent =
            formatRupiah(
                keluar
            );

    }


    if (
        saldoKas
    ) {

        saldoKas.textContent =
            formatRupiah(
                saldo
            );

    }

}


// ==========================================
// TAMPILKAN TRANSAKSI
// ==========================================

function tampilkanTransaksi(
    data
) {

    if (!transactionList) {

        return;

    }


    transactionList.innerHTML =
        "";


    if (
        !Array.isArray(
            data
        ) ||
        data.length === 0
    ) {

        return;

    }


    data.forEach(
        transaksi => {

            const masuk =
                isKasMasuk(
                    transaksi.transaction_type
                );


            const keluar =
                isKasKeluar(
                    transaksi.transaction_type
                );


            let classJenis =
                "";


            let tanda =
                "";


            if (masuk) {

                classJenis =
                    "income";

                tanda =
                    "+";

            }


            else if (keluar) {

                classJenis =
                    "expense";

                tanda =
                    "-";

            }


            const category =
                transaksi.category ||
                "Tanpa kategori";


            const description =
                transaksi.description ||
                "";


            const amount =
                Number(
                    transaksi.amount
                ) || 0;


            const tanggal =
                formatTanggal(
                    transaksi.transaction_date
                );


            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "transaction-item";


            item.innerHTML = `

                <div class="tx-top">

                    <div class="tx-title">

                        ${escapeHTML(
                            category
                        )}

                    </div>


                    <div
                        class="tx-amount ${classJenis}"
                    >

                        ${tanda}
                        ${formatRupiah(
                            amount
                        )}

                    </div>

                </div>


                <div class="tx-meta">

                    <span>
                        ${namaJenisTransaksi(
                            transaksi.transaction_type
                        )}
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        ${tanggal}
                    </span>

                </div>


                ${
                    description
                        ? `
                            <div class="tx-desc">

                                ${escapeHTML(
                                    description
                                )}

                            </div>
                        `
                        : ""
                }

            `;


            transactionList.appendChild(
                item
            );

        }
    );

}


// ==========================================
// RESET FILTER
// ==========================================

function resetFilter() {

    if (
        filterJenis
    ) {

        filterJenis.value =
            "";

    }


    if (
        filterBulan
    ) {

        filterBulan.value =
            "";

    }


    terapkanFilter();

}


// ==========================================
// AKTIFKAN FILTER
// ==========================================

function aktifkanFilter() {

    if (
        filterJenis
    ) {

        filterJenis.addEventListener(
            "change",
            terapkanFilter
        );

    }


    if (
        filterBulan
    ) {

        filterBulan.addEventListener(
            "change",
            terapkanFilter
        );

    }

}


// ==========================================
// INIT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "SIDAT KAS: Dashboard kas dimulai."
        );


        aktifkanFilter();


        muatKas();

    }
);


// ==========================================
// EXPORT
// ==========================================

window.muatKas =
    muatKas;

window.resetFilter =
    resetFilter;

window.kembaliDashboard =
    kembaliDashboard;

window.terapkanFilter =
    terapkanFilter;