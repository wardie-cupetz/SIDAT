/* =========================================================
SIDAT - KAS RT
Versi FINAL
========================================================= */

"use strict";

/* =========================================================
SUPABASE
========================================================= */

const supabaseClient =
supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

/* =========================================================
ELEMENT
========================================================= */

const saldoKas =
document.getElementById("saldoKas");

const totalPemasukan =
document.getElementById("totalPemasukan");

const totalPengeluaran =
document.getElementById("totalPengeluaran");

const filterJenis =
document.getElementById("filterJenis");

const filterBulan =
document.getElementById("filterBulan");

const transactionList =
document.getElementById("transactionList");

const loading =
document.getElementById("loading");

const emptyState =
document.getElementById("emptyState");

const errorState =
document.getElementById("errorState");

const errorMessage =
document.getElementById("errorMessage");

/* =========================================================
DATA
========================================================= */

let semuaTransaksi = [];

let transaksiTampil = [];

/* =========================================================
SESSION
========================================================= */

async function getValidSession() {

const {
    data,
    error
} =
    await supabaseClient.auth.getSession();


if (error) {

    throw error;

}


let session =
    data?.session || null;


if (!session) {

    throw new Error(
        "Sesi warga tidak ditemukan. Silakan login kembali."
    );

}


const expiresAt =
    Number(
        session.expires_at || 0
    );


const sekarang =
    Math.floor(
        Date.now() / 1000
    );


/*
   Refresh jika masa berlaku token
   tinggal kurang dari 60 detik.
*/

if (
    expiresAt &&
    expiresAt - sekarang < 60
) {

    const {
        data: refreshData,
        error: refreshError
    } =
        await supabaseClient.auth.refreshSession();


    if (refreshError) {

        throw refreshError;

    }


    session =
        refreshData?.session ||
        null;


    if (!session) {

        throw new Error(
            "Sesi warga sudah berakhir."
        );

    }

}


localStorage.setItem(
    "sidat_access_token",
    session.access_token
);


return session;

}

/* =========================================================
FORMAT RUPIAH
========================================================= */

function formatRupiah(
nominal
) {

return new Intl.NumberFormat(
    "id-ID",
    {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }
).format(
    Number(nominal) || 0
);

}

/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHTML(
value
) {

return String(
    value ?? ""
)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

/* =========================================================
JENIS TRANSAKSI
========================================================= */

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
    value === "jimpitan_transfer"
);

}

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

/* =========================================================
NAMA JENIS TRANSAKSI
========================================================= */

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
    value === "jimpitan_transfer"
) {

    return "Transfer Jimpitan";

}


if (
    isKasMasuk(value)
) {

    return "Pemasukan";

}


if (
    isKasKeluar(value)
) {

    return "Pengeluaran";

}


return "Transaksi";

}

/* =========================================================
FORMAT TANGGAL
========================================================= */

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

    return String(tanggal);

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

/* =========================================================
KEMBALI DASHBOARD
========================================================= */

function kembaliDashboard() {

window.location.href =
    "dashboard.html";

}

/* =========================================================
LOADING
========================================================= */

function tampilkanLoading(
tampil
) {

if (!loading) {

    return;

}


loading.classList.toggle(
    "hidden",
    !tampil
);

}

/* =========================================================
ERROR
========================================================= */

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

function sembunyikanError() {

if (errorState) {

    errorState.classList.add(
        "hidden"
    );

}

}

/* =========================================================
LOAD KAS
========================================================= */

async function muatKas() {

tampilkanLoading(true);

sembunyikanError();


try {

    const session =
        await getValidSession();


    const url =
        `${SUPABASE_URL}/rest/v1/cash_transactions` +
        `?select=` +
        `id,` +
        `transaction_type,` +
        `category,` +
        `amount,` +
        `description,` +
        `transaction_date,` +
        `created_at` +
        `&order=transaction_date.desc,created_at.desc`;


    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${session.access_token}`,

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
            `Gagal memuat transaksi (${response.status})`
        );

    }


    const data =
        await response.json();


    semuaTransaksi =
        Array.isArray(data)
            ? data
            : [];


    terapkanFilter();

} catch (error) {

    console.error(
        "SIDAT KAS ERROR:",
        error
    );


    semuaTransaksi = [];

    transaksiTampil = [];


    updateSummary([]);

    tampilkanTransaksi([]);


    if (
        error?.message?.toLowerCase()
            .includes("session") ||
        error?.message?.toLowerCase()
            .includes("sesi")
    ) {

        localStorage.removeItem(
            "sidat_access_token"
        );

        window.location.href =
            "../index.html";

        return;

    }


    tampilkanError(
        error?.message ||
        "Gagal memuat data Kas RT."
    );

} finally {

    tampilkanLoading(false);

}

}

/* =========================================================
FILTER
========================================================= */

function terapkanFilter() {

const jenis =
    filterJenis?.value || "";

const bulan =
    filterBulan?.value || "";


transaksiTampil =
    semuaTransaksi.filter(
        transaksi => {

            if (
                jenis === "masuk" &&
                !isKasMasuk(
                    transaksi.transaction_type
                )
            ) {

                return false;

            }


            if (
                jenis === "keluar" &&
                !isKasKeluar(
                    transaksi.transaction_type
                )
            ) {

                return false;

            }


            if (bulan) {

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


updateSummary(
    transaksiTampil
);


tampilkanTransaksi(
    transaksiTampil
);


if (emptyState) {

    emptyState.classList.toggle(
        "hidden",
        transaksiTampil.length !== 0
    );

}

}

/* =========================================================
SUMMARY
========================================================= */

function updateSummary(
data
) {

let masuk = 0;

let keluar = 0;


if (
    !Array.isArray(data)
) {

    data = [];

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

            masuk += amount;

        } else if (
            isKasKeluar(
                transaksi.transaction_type
            )
        ) {

            keluar += amount;

        }

    }
);


const saldo =
    masuk - keluar;


if (totalPemasukan) {

    totalPemasukan.textContent =
        formatRupiah(masuk);

}


if (totalPengeluaran) {

    totalPengeluaran.textContent =
        formatRupiah(keluar);

}


if (saldoKas) {

    saldoKas.textContent =
        formatRupiah(saldo);

    saldoKas.classList.toggle(
        "saldo-negative",
        saldo < 0
    );

}

}

/* =========================================================
TRANSACTION LIST
========================================================= */

function tampilkanTransaksi(
data
) {

if (!transactionList) {

    return;

}


transactionList.innerHTML = "";


if (
    !Array.isArray(data) ||
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


        let classJenis = "";

        let tanda = "";


        if (masuk) {

            classJenis = "income";

            tanda = "+";

        } else if (keluar) {

            classJenis = "expense";

            tanda = "-";

        }


        const type =
            String(
                transaksi.transaction_type ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            type === "jimpitan_transfer"
        ) {

            classJenis +=
                " transfer";

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


        item.dataset.type =
            masuk
                ? "income"
                : keluar
                    ? "expense"
                    : "other";


        item.innerHTML = `

            <div class="tx-top">

                <div class="tx-title">

                    <div class="tx-category-icon">

                        ${
                            type ===
                            "jimpitan_transfer"
                                ? `
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M7 7h10v10H7z"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linejoin="round"
                                        />

                                        <path
                                            d="M9 4v3M15 4v3M9 17v3M15 17v3"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                `
                                : masuk
                                    ? `
                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M12 19V5"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                            />

                                            <path
                                                d="M6.5 10.5 12 5l5.5 5.5"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    `
                                    : `
                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M12 5v14"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                            />

                                            <path
                                                d="m6.5 13.5 5.5 5.5 5.5-5.5"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    `
                        }

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(category)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                namaJenisTransaksi(
                                    transaksi.transaction_type
                                )
                            )}
                        </span>

                    </div>

                </div>


                <div
                    class="tx-amount ${classJenis}"
                >
                    ${tanda}
                    ${formatRupiah(amount)}
                </div>

            </div>


            <div class="tx-meta">

                <span class="tx-date">

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
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.7"
                        />

                        <path
                            d="M8 3v4M16 3v4M4 10h16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.7"
                            stroke-linecap="round"
                        />
                    </svg>

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

/* =========================================================
RESET FILTER
========================================================= */

function resetFilter() {

if (filterJenis) {

    filterJenis.value = "";

}


if (filterBulan) {

    filterBulan.value = "";

}


terapkanFilter();

}

/* =========================================================
EVENTS
========================================================= */

function aktifkanFilter() {

filterJenis?.addEventListener(
    "change",
    terapkanFilter
);


filterBulan?.addEventListener(
    "change",
    terapkanFilter
);

}

/* =========================================================
INIT
========================================================= */

document.addEventListener(
"DOMContentLoaded",
() => {

    aktifkanFilter();

    muatKas();

}

);

/* =========================================================
GLOBAL
========================================================= */

window.muatKas =
muatKas;

window.resetFilter =
resetFilter;

window.kembaliDashboard =
kembaliDashboard;

window.terapkanFilter =
terapkanFilter;