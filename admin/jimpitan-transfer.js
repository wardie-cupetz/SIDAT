// ==========================================
// SIDAT
// JIMPITAN TRANSFER
// Dibuat oleh Suwardi
// ==========================================

console.log(
    "SIDAT - Transfer Jimpitan"
);


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


        transaksiJimpitan =
            Array.isArray(result)
                ? result
                : [];


        // Transaksi yang sudah tidak ada
        // dari hasil query dibuang dari pilihan.
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
                    ⚠️ Gagal memuat transaksi.
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

                ✅ Semua jimpitan
                sudah ditransfer ke kas RT.

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

                        <span>
                            📅 ${tanggal}
                        </span>

                        <span>
                            👤 ${petugas}
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


    // ======================================
    // TOTAL BELUM TRANSFER
    // ======================================

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


    // ======================================
    // TOTAL DIPILIH
    // ======================================

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


    // ======================================
    // TOMBOL TRANSFER
    // ======================================

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

        button.textContent =
            "⏳ Memproses transfer...";

    }


    try {

        // ==================================
        // Ambil user admin yang sedang login
        // ==================================

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


        // ==================================
        // Panggil RPC transfer
        // ==================================

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
                ✅ <strong>
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


        // ==================================
        // Bersihkan pilihan
        // ==================================

        transaksiTerpilih.clear();


        // ==================================
        // Muat ulang data
        // ==================================

        await loadTransaksi();


    }

    catch (error) {

        console.error(
            "Transfer jimpitan error:",
            error
        );


        showMessage(
            `
                ⚠️ <strong>
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

            button.textContent =
                "💰 Transfer ke Kas RT";

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