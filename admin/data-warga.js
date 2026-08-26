// ==========================================
// SIDAT
// DATA WARGA ADMIN
// ==========================================
//
// KONSEP FINAL:
//
// 1 KK = 1 KEPALA KELUARGA
// 1 KK = 1 AKUN LOGIN
// 1 KK = 1 QR JIMPITAN
// 1 KK = 1 SALDO JIMPITAN
//
// Catatan:
// Saldo jimpitan TIDAK ditampilkan di halaman
// Data Warga. Saldo ditampilkan pada dashboard/
// halaman jimpitan.
//
// ==========================================

// ==========================================
// DATA IMPORT WARGA
// ==========================================

let dataImportWarga = [];

// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


if (!accessToken) {

    window.location.href =
        "../index.html";

}


// ==========================================
// DATA GLOBAL
// ==========================================

let semuaWarga = [];

let semuaKK = [];

let wargaTerpilih = null;

let kkTerpilih = null;

let filterAktif = "all";


// ==========================================
// HEADER SUPABASE
// ==========================================

function headersSupabase() {

    return {

        "apikey":
            SUPABASE_KEY,

        "Authorization":
            `Bearer ${accessToken}`,

        "Content-Type":
            "application/json",

        "Prefer":
            "return=representation"

    };

}


// ==========================================
// REQUEST SUPABASE
// ==========================================

async function supabaseRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    ...headersSupabase(),
                    ...(options.headers || {})
                }

            }
        );


    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            text ||
            `HTTP ${response.status}`
        );

    }


    const text =
        await response.text();


    if (!text) {

        return null;

    }


    try {

        return JSON.parse(
            text
        );

    } catch {

        return text;

    }

}


// ==========================================
// LOAD DATA UTAMA
// ==========================================

async function loadDataWarga() {

    const loading =
        document.getElementById(
            "loading"
        );

    const list =
        document.getElementById(
            "householdList"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (list) {

        list.innerHTML = "";

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    try {

        await Promise.all([

            loadResidents(),

            loadHouseholds()

        ]);


        updateSummary();

        tampilkanKK();


    } catch (error) {

        console.error(
            "Gagal memuat data warga:",
            error
        );


        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        if (list) {

            list.innerHTML = `

                <div class="empty-state">

                    <div>
                        ⚠️
                    </div>

                    <strong>
                        Gagal memuat data
                    </strong>

                    <span>
                        ${escapeHtml(
                            error.message
                        )}
                    </span>

                </div>

            `;

        }

    } finally {

        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }

    }

}


// ==========================================
// LOAD RESIDENTS
// ==========================================

async function loadResidents() {

    const url =
        `${SUPABASE_URL}/rest/v1/residents` +
        `?select=` +
        `id,` +
        `resident_code,` +
        `nik,` +
        `kk_number,` +
        `name,` +
        `birth_place,` +
        `birth_date,` +
        `gender,` +
        `address,` +
        `phone,` +
        `family_status,` +
        `photo_url,` +
        `qr_token,` +
        `jimpitan_balance,` +
        `is_active,` +
        `auth_email,` +
        `auth_id,` +
        `account_created,` +
        `created_at,` +
        `updated_at` +
        `&order=resident_code.asc`;


    semuaWarga =
        await supabaseRequest(
            url
        );


    if (
        !Array.isArray(
            semuaWarga
        )
    ) {

        semuaWarga = [];

    }

}


// ==========================================
// LOAD HOUSEHOLDS
// ==========================================

async function loadHouseholds() {

    const url =
        `${SUPABASE_URL}/rest/v1/households` +
        `?select=` +
        `id,` +
`kk_number,` +
`head_resident_id,` +
`qr_token,` +
`address,` +
`created_at` +
        `&order=kk_number.asc`;


    semuaKK =
        await supabaseRequest(
            url
        );


    if (
        !Array.isArray(
            semuaKK
        )
    ) {

        semuaKK = [];

    }

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary() {

    const jumlahWarga =
        document.getElementById(
            "jumlahWarga"
        );

    const jumlahKK =
        document.getElementById(
            "jumlahKK"
        );

    const jumlahKepala =
        document.getElementById(
            "jumlahKepala"
        );


    if (jumlahWarga) {

        jumlahWarga.textContent =
            semuaWarga.length;

    }


    if (jumlahKK) {

        jumlahKK.textContent =
            semuaKK.length;

    }


    const jumlahKepalaKeluarga =
        semuaKK.filter(
            kk =>
                !!kk.head_resident_id
        ).length;


    if (jumlahKepala) {

        jumlahKepala.textContent =
            jumlahKepalaKeluarga;

    }

}


// ==========================================
// GET KEPALA KK
// ==========================================

function getKepalaKK(
    kk
) {

    if (!kk) {

        return null;

    }


    return semuaWarga.find(
        warga =>
            warga.id ===
            kk.head_resident_id
    ) || null;

}


// ==========================================
// GET ANGGOTA KK
// ==========================================

function getAnggotaKK(
    kk
) {

    if (!kk) {

        return [];

    }


    return semuaWarga.filter(
        warga =>
            String(
                warga.kk_number || ""
            ).trim()
            ===
            String(
                kk.kk_number || ""
            ).trim()
    );

}


// ==========================================
// GABUNGKAN INFORMASI KK
// ==========================================

function buatDataKK(
    kk
) {

    const kepala =
        getKepalaKK(
            kk
        );


    const anggota =
        getAnggotaKK(
            kk
        );


    return {

        ...kk,

        kepala,

        anggota,

        jumlahAnggota:
            anggota.length,

        memilikiKepala:
            !!kepala

    };

}


// ==========================================
// TAMPILKAN KK
// ==========================================

function tampilkanKK() {

    const list =
        document.getElementById(
            "householdList"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (!list) {

        return;

    }


    list.innerHTML = "";


    let data =
        semuaKK.map(
            buatDataKK
        );


    const keyword =
        (
            document.getElementById(
                "searchInput"
            )?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    if (keyword) {

        data =
            data.filter(
                kk => {

                    const nomorKK =
                        String(
                            kk.kk_number ||
                            ""
                        )
                        .toLowerCase();


                    const namaKepala =
                        String(
                            kk.kepala?.name ||
                            ""
                        )
                        .toLowerCase();


                    const anggota =
                        kk.anggota
                            .map(
                                warga =>
                                    String(
                                        warga.name ||
                                        ""
                                    )
                                    .toLowerCase()
                            )
                            .join(" ");


                    return (

                        nomorKK.includes(
                            keyword
                        )

                        ||

                        namaKepala.includes(
                            keyword
                        )

                        ||

                        anggota.includes(
                            keyword
                        )

                    );

                }
            );

    }


    if (
        filterAktif ===
        "lengkap"
    ) {

        data =
            data.filter(
                kk =>
                    kk.memilikiKepala
            );

    }


    if (
        filterAktif ===
        "tanpa-kepala"
    ) {

        data =
            data.filter(
                kk =>
                    !kk.memilikiKepala
            );

    }


    if (
        data.length ===
        0
    ) {

        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    data.forEach(
        kk => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "household-card";


            const kepala =
                kk.kepala;


            const initial =
                kepala?.name
                    ?.trim()
                    ?.charAt(0)
                    ?.toUpperCase()
                ||
                "?";


            const statusClass =
                kk.memilikiKepala
                    ? "active"
                    : "inactive";


            const statusText =
                kk.memilikiKepala
                    ? "ADA KEPALA"
                    : "TANPA KEPALA";


            card.innerHTML = `

                <div class="household-header">

                    <div class="household-title">

                        <span>
                            KARTU KELUARGA
                        </span>

                        <strong>
                            KK ${escapeHtml(
                                kk.kk_number ||
                                "-"
                            )}
                        </strong>

                    </div>

                    <span
                        class="status ${statusClass}"
                    >
                        ${statusText}
                    </span>

                </div>


                <div class="household-body">

                    <div class="head-resident">

                        <div
                            class="head-resident-card"
                        >

                            <div
                                class="head-resident-avatar"
                            >
                                ${escapeHtml(
                                    initial
                                )}
                            </div>


                            <div
                                class="head-resident-info"
                            >

                                <strong>
                                    ${
                                        kepala
                                            ? escapeHtml(
                                                kepala.name
                                            )
                                            : "Kepala keluarga belum ditentukan"
                                    }
                                </strong>

                                <span>
                                    ${
                                        kepala
                                            ? `ID: ${escapeHtml(
                                                kepala.resident_code ||
                                                "-"
                                            )}`
                                            : "Belum ada kepala keluarga"
                                    }
                                </span>

                                <span>
                                    ${escapeHtml(
                                        kk.address ||
                                        kepala?.address ||
                                        "-"
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>


                    <div class="household-summary">

                        <span>
                            👥
                        </span>

                        <strong>
                            ${kk.jumlahAnggota}
                        </strong>

                        <small>
                            Anggota
                        </small>

                    </div>


                    <div class="household-actions">

    <button
    type="button"
    class="btn-primary"
    onclick="lihatKK(
        '${escapeAttribute(
            kk.id
        )}'
    )"
>
    👥 Lihat Anggota
</button>


<button
    type="button"
    class="btn-secondary"
    onclick="bukaQR(
        '${escapeAttribute(
            kk.id
        )}'
    )"
>
    📱 QR Jimpitan
</button>


${
    kepala
        ? (
            kepala.account_created === true ||
            !!kepala.auth_id

                ? `

                    <!-- ==========================
                         UBAH PIN
                    =========================== -->

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="bukaModalUbahPin(
                            '${escapeAttribute(
                                kepala.id
                            )}',
                            '${escapeAttribute(
                                kepala.name ||
                                "Kepala Keluarga"
                            )}'
                        )"
                    >
                        🔑 Ubah PIN
                    </button>


                    <!-- ==========================
                         STATUS AKUN
                    =========================== -->

                    <button
                        type="button"
                        class="btn-secondary"
                        disabled
                    >
                        ✅ Akun Aktif
                    </button>

                `

                : `

                    <!-- ==========================
                         BUAT AKUN
                    =========================== -->

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="bukaModalBuatAkun(
                            '${escapeAttribute(
                                kepala.id
                            )}',
                            '${escapeAttribute(
                                kepala.name ||
                                "Kepala Keluarga"
                            )}'
                        )"
                    >
                        🔐 Buat Akun
                    </button>

                `
        )
        : ""
}

</div>

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );

}


// ==========================================
// SEARCH
// ==========================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            tampilkanKK();

        }
    );

}


// ==========================================
// FILTER KK
// ==========================================

function filterKK(
    filter
) {

    filterAktif =
        filter;


    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.filter ===
                    filter
                );

            }
        );


    tampilkanKK();

}
// ==========================================
// MODAL BUAT AKUN KEPALA KELUARGA
// ==========================================

function bukaModalBuatAkun(
    residentId,
    nama
) {

    const existing =
        document.getElementById(
            "modalBuatAkun"
        );

    if (existing) {

        existing.remove();

    }


    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "modalBuatAkun";

    modal.className =
        "modal-overlay";


    modal.innerHTML = `

        <div class="modal-card">

            <div class="modal-header">

                <div>

                    <strong>
                        🔐 Buat Akun Warga
                    </strong>

                    <span>
                        ${escapeHtml(
                            nama
                        )}
                    </span>

                </div>

                <button
                    type="button"
                    class="modal-close"
                    onclick="tutupModalBuatAkun()"
                >
                    ✕
                </button>

            </div>


            <div class="modal-body">

                <input
                    type="hidden"
                    id="akunResidentId"
                    value="${escapeAttribute(
                        residentId
                    )}"
                >


                <label
                    for="akunPin"
                >
                    PIN Login
                </label>


                <input
                    type="password"
                    id="akunPin"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="Masukkan PIN 4-6 digit"
                    autocomplete="new-password"
                >


                <small>
                    PIN harus terdiri dari 4 sampai 6 digit.
                </small>


                <div
                    id="akunBuatError"
                    class="modal-error hidden"
                ></div>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="btn-secondary"
                    onclick="tutupModalBuatAkun()"
                >
                    Batal
                </button>


                <button
                    type="button"
                    class="btn-primary"
                    id="btnSimpanAkun"
                    onclick="buatAkunKepalaKK()"
                >
                    🔐 Buat Akun
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const pin =
        document.getElementById(
            "akunPin"
        );


    if (pin) {

        pin.focus();


        pin.addEventListener(
            "input",
            function () {

                this.value =
                    this.value.replace(
                        /\D/g,
                        ""
                    );

            }
        );

    }

}


// ==========================================
// TUTUP MODAL BUAT AKUN
// ==========================================

function tutupModalBuatAkun() {

    const modal =
        document.getElementById(
            "modalBuatAkun"
        );


    if (modal) {

        modal.remove();

    }

}
// ==========================================
// BUAT AKUN KEPALA KELUARGA
// ==========================================

async function buatAkunKepalaKK() {

    const residentId =
        document.getElementById(
            "akunResidentId"
        )?.value;


    const pinInput =
        document.getElementById(
            "akunPin"
        );


    const button =
        document.getElementById(
            "btnSimpanAkun"
        );


    const errorBox =
        document.getElementById(
            "akunBuatError"
        );


    const pin =
        pinInput?.value
            ?.trim() ||
        "";


    if (!residentId) {

        alert(
            "ID warga tidak ditemukan."
        );

        return;

    }


    if (
        !/^\d{4,6}$/.test(
            pin
        )
    ) {

        if (errorBox) {

            errorBox.textContent =
                "PIN harus terdiri dari 4 sampai 6 digit.";

            errorBox.classList.remove(
                "hidden"
            );

        } else {

            alert(
                "PIN harus terdiri dari 4 sampai 6 digit."
            );

        }

        return;

    }


    const accessToken =
        localStorage.getItem(
            "sidat_access_token"
        );


    if (!accessToken) {

        alert(
            "Session admin tidak ditemukan. Silakan login kembali."
        );

        return;

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Membuat Akun...";

    }


    if (errorBox) {

        errorBox.classList.add(
            "hidden"
        );

        errorBox.textContent =
            "";

    }


    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/functions/v1/create-resident-account`,
                {
                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,


                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            resident_id:
                                residentId,

                            pin:
                                pin

                        })

                }
            );


        const result =
            await response.json()
                .catch(
                    () => ({})
                );


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal membuat akun warga."
            );

        }


        // ==========================================
        // BERHASIL
        // ==========================================

        tutupModalBuatAkun();


        alert(
            "Akun kepala keluarga berhasil dibuat."
        );


        // Muat ulang data warga
        // agar tombol berubah menjadi
        // "Akun Aktif"

        await loadDataWarga();


    } catch (error) {

        console.error(
            "Gagal membuat akun warga:",
            error
        );


        if (errorBox) {

            errorBox.textContent =
                error.message ||
                "Gagal membuat akun warga.";

            errorBox.classList.remove(
                "hidden"
            );

        } else {

            alert(
                error.message ||
                "Gagal membuat akun warga."
            );

        }


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "🔐 Buat Akun";

        }

    }

}


// ==========================================
// GENERATE RESIDENT CODE
// ==========================================

function generateResidentCode() {

    let terbesar =
        0;


    semuaWarga.forEach(
        warga => {

            const code =
                String(
                    warga.resident_code ||
                    ""
                );


            const match =
                code.match(
                    /^RT(\d+)$/
                );


            if (match) {

                const nomor =
                    parseInt(
                        match[1],
                        10
                    );


                if (
                    nomor >
                    terbesar
                ) {

                    terbesar =
                        nomor;

                }

            }

        }
    );


    return (
        "RT" +
        String(
            terbesar + 1
        )
        .padStart(
            3,
            "0"
        )
    );

}


// ==========================================
// BUKA TAMBAH WARGA
// ==========================================

function bukaTambahWarga(
    kkNumber = ""
) {

    const modal =
        document.getElementById(
            "wargaModal"
        );


    if (!modal) {

        return;

    }


    wargaTerpilih =
        null;


    resetFormWarga();


    const radioManual =
        document.querySelector(
            'input[name="sumberData"][value="manual"]'
        );


    if (radioManual) {

        radioManual.checked =
            true;

    }


    ubahSumberData(
        "manual"
    );


    isiPilihanKK(
        kkNumber
    );


    modal.classList.remove(
        "hidden"
    );

}


// ==========================================
// TAMBAH ANGGOTA DARI KK
// ==========================================

function tambahAnggotaDariKK() {

    if (!kkTerpilih) {

        return;

    }


    tutupDetailKK();


    bukaTambahWarga(
        kkTerpilih.kk_number
    );


    const status =
        document.getElementById(
            "wargaFamilyStatus"
        );


    if (status) {

        status.value =
            "Anggota Keluarga";

    }


    ubahStatusKeluarga();

}


// ==========================================
// RESET FORM WARGA
// ==========================================

function resetFormWarga() {

    const ids = [

        "wargaNama",

        "wargaNik",

        "wargaPhone",

        "wargaBirthPlace",

        "wargaBirthDate",

        "wargaGender",

        "wargaFamilyStatus",

        "wargaKK",

        "wargaKKManual",

        "wargaAddress",

        "selectedResidentId",

        "existingResidentSearch"

    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    "";

            }

        }
    );


    const error =
        document.getElementById(
            "wargaFormError"
        );


    if (error) {

        error.textContent =
            "";

        error.classList.add(
            "hidden"
        );

    }


    const existingList =
        document.getElementById(
            "existingResidentList"
        );


    if (existingList) {

        existingList.innerHTML =
            "";

    }


    const manualSection =
        document.getElementById(
            "manualResidentSection"
        );


    if (manualSection) {

        manualSection.classList.remove(
            "hidden"
        );

    }


    const existingSection =
        document.getElementById(
            "existingResidentSection"
        );


    if (existingSection) {

        existingSection.classList.add(
            "hidden"
        );

    }


    const manualKK =
        document.getElementById(
            "kkManualSection"
        );


    if (manualKK) {

        manualKK.classList.add(
            "hidden"
        );

    }


    const selectKK =
        document.getElementById(
            "kkSelectSection"
        );


    if (selectKK) {

        selectKK.classList.add(
            "hidden"
        );

    }


    const accountInfo =
        document.getElementById(
            "accountInfo"
        );


    if (accountInfo) {

        accountInfo.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// UBAH SUMBER DATA
// ==========================================

function ubahSumberData(
    sumber
) {

    const manual =
        document.getElementById(
            "manualResidentSection"
        );

    const existing =
        document.getElementById(
            "existingResidentSection"
        );


    if (
        sumber ===
        "existing"
    ) {

        if (manual) {

            manual.classList.add(
                "hidden"
            );

        }


        if (existing) {

            existing.classList.remove(
                "hidden"
            );

        }


        tampilkanPilihanWarga();

    } else {

        if (manual) {

            manual.classList.remove(
                "hidden"
            );

        }


        if (existing) {

            existing.classList.add(
                "hidden"
            );

        }

    }

}


// ==========================================
// TAMPILKAN PILIHAN WARGA
// ==========================================

function tampilkanPilihanWarga(
    keyword = ""
) {

    const list =
        document.getElementById(
            "existingResidentList"
        );


    if (!list) {

        return;

    }


    const kata =
        String(
            keyword
        )
        .trim()
        .toLowerCase();


    let data =
        semuaWarga.filter(
            warga =>
                warga.is_active !== false
        );


    if (kata) {

        data =
            data.filter(
                warga => {

                    const nama =
                        String(
                            warga.name ||
                            ""
                        )
                        .toLowerCase();


                    const id =
                        String(
                            warga.resident_code ||
                            ""
                        )
                        .toLowerCase();


                    const nik =
                        String(
                            warga.nik ||
                            ""
                        )
                        .toLowerCase();


                    return (

                        nama.includes(
                            kata
                        )

                        ||

                        id.includes(
                            kata
                        )

                        ||

                        nik.includes(
                            kata
                        )

                    );

                }
            );

    }


    list.innerHTML =
        "";


    if (
        data.length ===
        0
    ) {

        list.innerHTML = `

            <div class="empty-state">

                <strong>
                    Warga tidak ditemukan
                </strong>

                <span>
                    Coba gunakan nama, NIK, atau ID.
                </span>

            </div>

        `;

        return;

    }


    data.forEach(
        warga => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "existing-resident-card";


            const sudahPunyaKK =
                !!warga.kk_number;


            card.innerHTML = `

                <div
                    class="existing-resident-info"
                >

                    <strong>
                        ${escapeHtml(
                            warga.name ||
                            "Tanpa Nama"
                        )}
                    </strong>

                    <span>
                        ID:
                        ${escapeHtml(
                            warga.resident_code ||
                            "-"
                        )}
                    </span>

                    <span>
                        ${
                            sudahPunyaKK
                                ? `KK: ${escapeHtml(
                                    warga.kk_number
                                )}`
                                : "Belum masuk KK"
                        }
                    </span>

                </div>


                <button
                    type="button"
                    onclick="pilihWargaExisting(
                        '${escapeAttribute(
                            warga.id
                        )}'
                    )"
                >
                    Pilih
                </button>

            `;


            list.appendChild(
                card
            );

        }
    );

}

// ==========================================
// SEARCH EXISTING RESIDENT
// ==========================================

const existingSearch =
    document.getElementById(
        "existingResidentSearch"
    );


if (existingSearch) {

    existingSearch.addEventListener(
        "input",
        function () {

            tampilkanPilihanWarga(
                this.value
            );

        }
    );

}


// ==========================================
// PILIH WARGA EXISTING
// ==========================================

function pilihWargaExisting(
    id
) {

    const warga =
        semuaWarga.find(
            item =>
                item.id ===
                id
        );


    if (!warga) {

        alert(
            "Data warga tidak ditemukan."
        );

        return;

    }


    document.getElementById(
        "selectedResidentId"
    ).value =
        warga.id;


    const nama =
        document.getElementById(
            "wargaNama"
        );


    const nik =
        document.getElementById(
            "wargaNik"
        );


    const phone =
        document.getElementById(
            "wargaPhone"
        );


    const birthPlace =
        document.getElementById(
            "wargaBirthPlace"
        );


    const birthDate =
        document.getElementById(
            "wargaBirthDate"
        );


    const gender =
        document.getElementById(
            "wargaGender"
        );


    const address =
        document.getElementById(
            "wargaAddress"
        );


    if (nama) {

        nama.value =
            warga.name || "";

    }


    if (nik) {

        nik.value =
            warga.nik || "";

    }


    if (phone) {

        phone.value =
            warga.phone || "";

    }


    if (birthPlace) {

        birthPlace.value =
            warga.birth_place || "";

    }


    if (birthDate) {

        birthDate.value =
            warga.birth_date || "";

    }


    if (gender) {

        gender.value =
            warga.gender || "";

    }


    if (address) {

        address.value =
            warga.address || "";

    }


    const search =
        document.getElementById(
            "existingResidentSearch"
        );


    if (search) {

        search.value =
            warga.name || "";

    }


    alert(
        `${warga.name} dipilih.`
    );

}


// ==========================================
// ISI PILIHAN KK
// ==========================================

function isiPilihanKK(
    selectedKK = ""
) {

    const select =
        document.getElementById(
            "wargaKK"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Pilih KK
        </option>

    `;


    semuaKK.forEach(
        kk => {

            const kepala =
                getKepalaKK(
                    kk
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                kk.kk_number;


            option.textContent =
                kepala

                    ? `${kk.kk_number} - ${kepala.name}`

                    : `${kk.kk_number} - Tanpa Kepala`;


            select.appendChild(
                option
            );

        }
    );


    select.value =
        selectedKK || "";

}


// ==========================================
// UBAH STATUS KELUARGA
// ==========================================

function ubahStatusKeluarga() {

    const status =
        document.getElementById(
            "wargaFamilyStatus"
        )?.value;


    const manualKK =
        document.getElementById(
            "kkManualSection"
        );


    const selectKK =
        document.getElementById(
            "kkSelectSection"
        );


    if (
        status ===
        "Kepala Keluarga"
    ) {

        if (manualKK) {

            manualKK.classList.remove(
                "hidden"
            );

        }


        if (selectKK) {

            selectKK.classList.add(
                "hidden"
            );

        }

    } else {

        if (manualKK) {

            manualKK.classList.add(
                "hidden"
            );

        }


        if (selectKK) {

            selectKK.classList.remove(
                "hidden"
            );

        }

    }

}
// ==========================================
// TUTUP MODAL WARGA
// ==========================================

function tutupWargaModal() {

    document
        .getElementById(
            "wargaModal"
        )
        ?.classList.add(
            "hidden"
        );

}


// ==========================================
// SIMPAN FORM WARGA
// ==========================================

async function simpanFormWarga() {

    const errorBox =
        document.getElementById(
            "wargaFormError"
        );


    const button =
        document.getElementById(
            "btnSimpanWarga"
        );


    function tampilkanError(
        message
    ) {

        if (errorBox) {

            errorBox.textContent =
                message;

            errorBox.classList.remove(
                "hidden"
            );

        }

    }


    if (errorBox) {

        errorBox.textContent =
            "";

        errorBox.classList.add(
            "hidden"
        );

    }


    const nama =
        document.getElementById(
            "wargaNama"
        )
        ?.value
        .trim();


    const gender =
        document.getElementById(
            "wargaGender"
        )?.value;


    const familyStatus =
        document.getElementById(
            "wargaFamilyStatus"
        )?.value;


    const selectedResidentId =
        document.getElementById(
            "selectedResidentId"
        )?.value;


    const nomorKK =
        document.getElementById(
            "wargaKK"
        )?.value;


    const nomorKKBaru =
        document.getElementById(
            "wargaKKManual"
        )?.value
        .trim();


    const sumber =
        document.querySelector(
            'input[name="sumberData"]:checked'
        )?.value
        ||
        "manual";


    if (!nama) {

        tampilkanError(
            "Nama lengkap wajib diisi."
        );

        return;

    }


    if (
        gender !== "L" &&
        gender !== "P"
    ) {

        tampilkanError(
            "Jenis kelamin wajib dipilih."
        );

        return;

    }


    if (!familyStatus) {

        tampilkanError(
            "Status dalam keluarga wajib dipilih."
        );

        return;

    }


    if (
        familyStatus ===
        "Kepala Keluarga"
    ) {

        if (!nomorKKBaru) {

            tampilkanError(
                "Nomor KK baru wajib diisi untuk Kepala Keluarga."
            );

            return;

        }


        if (
            !/^\d{16}$/.test(
                nomorKKBaru
            )
        ) {

            tampilkanError(
                "Nomor KK harus terdiri dari 16 digit."
            );

            return;

        }


        const sudahAda =
            semuaKK.some(
                kk =>
                    String(
                        kk.kk_number
                    )
                    .trim()
                    ===
                    nomorKKBaru
            );


        if (sudahAda) {

            tampilkanError(
                "Nomor KK tersebut sudah terdaftar."
            );

            return;

        }

    } else {

        if (!nomorKK) {

            tampilkanError(
                "Silakan pilih KK yang sudah terdaftar."
            );

            return;

        }

    }


    if (
        sumber ===
        "existing" &&
        !selectedResidentId
    ) {

        tampilkanError(
            "Silakan pilih warga yang sudah ada."
        );

        return;

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Menyimpan...";

    }


    try {

        let residentId =
            selectedResidentId ||
            null;


        // ==================================
        // JIKA WARGA BARU
        // ==================================

        if (!residentId) {

            residentId =
                await buatWargaBaru();

        }


        // ==================================
        // UPDATE DATA WARGA
        // ==================================

        await updateDataWarga(
            residentId
        );


        // ==================================
        // JIKA KEPALA KELUARGA
        // BUAT HOUSEHOLD
        // ==================================

        if (
            familyStatus ===
            "Kepala Keluarga"
        ) {

            await buatHouseholdBaru(
                residentId,
                nomorKKBaru
            );

        }


        // ==================================
        // JIKA ANGGOTA
        // MASUKKAN KE KK
        // ==================================

        else {

            await masukkanKeKK(
                residentId,
                nomorKK
            );

        }


        alert(
            "Data warga berhasil disimpan."
        );


        tutupWargaModal();


        await loadDataWarga();


    } catch (error) {

        console.error(
            "Gagal menyimpan warga:",
            error
        );


        tampilkanError(
            "Gagal menyimpan warga: " +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Simpan Warga";

        }

    }

}

// ==========================================
// BUAT WARGA BARU
// ==========================================

async function buatWargaBaru() {

    const residentCode =
        generateResidentCode();


    const body = {

        resident_code:
            residentCode,

        name:
            getValue(
                "wargaNama"
            ),

        nik:
            getValue(
                "wargaNik"
            ) ||
            null,

        birth_place:
            getValue(
                "wargaBirthPlace"
            ) ||
            null,

        birth_date:
            getValue(
                "wargaBirthDate"
            ) ||
            null,

        gender:
            getValue(
                "wargaGender"
            ),

        phone:
            getValue(
                "wargaPhone"
            ) ||
            null,

        kk_number:
            null,

        family_status:
            null,

        address:
            getValue(
                "wargaAddress"
            ) ||
            null,

        jimpitan_balance:
            0,

        is_active:
            true,

        account_created:
            false

    };


    const data =
        await supabaseRequest(
            `${SUPABASE_URL}/rest/v1/residents`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        body
                    )
            }
        );


    if (
        !Array.isArray(
            data
        ) ||
        !data[0]?.id
    ) {

        throw new Error(
            "Data warga baru tidak berhasil dibuat."
        );

    }


    return data[0].id;

}


// ==========================================
// UPDATE DATA WARGA
// ==========================================

async function updateDataWarga(
    residentId
) {

    const body = {

        name:
            getValue(
                "wargaNama"
            ),

        nik:
            getValue(
                "wargaNik"
            ) ||
            null,

        birth_place:
            getValue(
                "wargaBirthPlace"
            ) ||
            null,

        birth_date:
            getValue(
                "wargaBirthDate"
            ) ||
            null,

        gender:
            getValue(
                "wargaGender"
            ),

        phone:
            getValue(
                "wargaPhone"
            ) ||
            null,

        family_status:
            getValue(
                "wargaFamilyStatus"
            ),

        address:
            getValue(
                "wargaAddress"
            ) ||
            null,

        updated_at:
            new Date().toISOString()

    };


    await supabaseRequest(
        `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
            residentId
        )}`,
        {
            method:
                "PATCH",

            body:
                JSON.stringify(
                    body
                )
        }
    );

}


// ==========================================
// BUAT HOUSEHOLD BARU
// ==========================================

async function buatHouseholdBaru(
    residentId,
    kkNumber
) {

    const address =
        getValue(
            "wargaAddress"
        ) ||
        null;


    const response =
        await supabaseRequest(
            `${SUPABASE_URL}/rest/v1/households`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify({

                        kk_number:
                            kkNumber,

                        head_resident_id:
                            residentId,

                        address:
                            address

                    })
            }
        );


    const kk =
        Array.isArray(
            response
        )
            ? response[0]
            : response;


    // Pastikan residents punya KK
    await supabaseRequest(
        `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
            residentId
        )}`,
        {
            method:
                "PATCH",

            body:
                JSON.stringify({

                    kk_number:
                        kkNumber,

                    family_status:
                        "Kepala Keluarga",

                    updated_at:
                        new Date().toISOString()

                })
        }
    );


    return kk;

}


// ==========================================
// MASUKKAN KE KK
// ==========================================

async function masukkanKeKK(
    residentId,
    kkNumber
) {

    const kk =
        semuaKK.find(
            item =>
                String(
                    item.kk_number
                )
                .trim()
                ===
                String(
                    kkNumber
                )
                .trim()
        );


    if (!kk) {

        throw new Error(
            "Data KK tidak ditemukan."
        );

    }


    await supabaseRequest(
        `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
            residentId
        )}`,
        {
            method:
                "PATCH",

            body:
                JSON.stringify({

                    kk_number:
                        kk.kk_number,

                    updated_at:
                        new Date().toISOString()

                })
        }
    );

}


// ==========================================
// LIHAT KK
// ==========================================

function lihatKK(
    householdId
) {

    const kk =
        semuaKK.find(
            item =>
                item.id ===
                householdId
        );


    if (!kk) {

        alert(
            "Data KK tidak ditemukan."
        );

        return;

    }


    kkTerpilih =
        kk;


    const kepala =
        getKepalaKK(
            kk
        );


    const anggota =
        getAnggotaKK(
            kk
        );


    const nomor =
        document.getElementById(
            "detailKKNumber"
        );


    const alamat =
        document.getElementById(
            "detailKKAddress"
        );


    const head =
        document.getElementById(
            "headResident"
        );


    const count =
        document.getElementById(
            "memberCount"
        );


    const memberList =
        document.getElementById(
            "familyMemberList"
        );


    if (nomor) {

        nomor.textContent =
            `KK ${kk.kk_number || "-"}`;

    }


    if (alamat) {

        alamat.textContent =
            kk.address ||
            kepala?.address ||
            "-";

    }


    if (count) {

        count.textContent =
            `${anggota.length} orang`;

    }
// ==================================
    // KEPALA
    // ==================================

    if (head) {

        if (kepala) {

            const initial =
                (kepala.name || "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase();


            head.innerHTML = `

                <div class="head-resident-card">

                    <div class="head-resident-avatar">

                        ${escapeHtml(
                            initial
                        )}

                    </div>


                    <div class="head-resident-info">

                        <strong>

                            ${escapeHtml(
                                kepala.name ||
                                "-"
                            )}

                        </strong>

                        <span>

                            ID:
                            ${escapeHtml(
                                kepala.resident_code ||
                                "-"
                            )}

                        </span>

                        <span>

                            👑 Kepala Keluarga

                        </span>

                        <span>

                            ${
                                kepala.account_created
                                    ? "🔐 Akun login tersedia"
                                    : "🔐 Akun login belum dibuat"
                            }

                        </span>

                    </div>


                    <div class="head-resident-actions">

                        <button
                            type="button"
                            class="btn-edit-small"
                            onclick="bukaEditWarga(
                                '${escapeAttribute(
                                    kepala.id
                                )}'
                            )"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            type="button"
                            class="btn-qr-small"
                            onclick="bukaQR(
                                '${escapeAttribute(
                                    kk.id
                                )}'
                            )"
                        >
                            📱 QR
                        </button>

                    </div>

                </div>

            `;

        } else {

            head.innerHTML = `

                <div class="head-resident-card">

                    <div class="head-resident-avatar">
                        ?
                    </div>

                    <div class="head-resident-info">

                        <strong>
                            Kepala keluarga belum ditentukan
                        </strong>

                        <span>
                            KK ini belum memiliki kepala keluarga.
                        </span>

                    </div>

                </div>

            `;

        }

    }


    // ==================================
    // ANGGOTA
    // ==================================

    if (memberList) {

        memberList.innerHTML =
            "";


        const anggotaSelainKepala =
            anggota.filter(
                warga =>
                    warga.id !==
                    kk.head_resident_id
            );


        if (
            anggotaSelainKepala.length ===
            0
        ) {

            memberList.innerHTML = `

                <div class="member-empty">

                    Belum ada anggota selain kepala keluarga.

                </div>

            `;

        } else {

            anggotaSelainKepala.forEach(
                warga => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "family-member-card";


                    const initial =
                        (warga.name || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase();


                    item.innerHTML = `

                        <div
                            class="member-avatar"
                        >
                            ${escapeHtml(
                                initial
                            )}
                        </div>


                        <div
                            class="member-info"
                        >

                            <strong>

                                ${escapeHtml(
                                    warga.name ||
                                    "-"
                                )}

                            </strong>

                            <span>

                                ${escapeHtml(
                                    warga.family_status ||
                                    "Anggota Keluarga"
                                )}

                            </span>

                            <span>

                                ID:
                                ${escapeHtml(
                                    warga.resident_code ||
                                    "-"
                                )}

                            </span>

                        </div>


                        <div
                            class="member-actions"
                        >

                            <button
                                type="button"
                                class="btn-edit-small"
                                onclick="bukaEditWarga(
                                    '${escapeAttribute(
                                        warga.id
                                    )}'
                                )"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"
                                class="btn-move-small"
                                onclick="bukaPindahKK(
                                    '${escapeAttribute(
                                        warga.id
                                    )}'
                                )"
                            >
                                ↔️ Pindah
                            </button>


                            <button
                                type="button"
                                class="btn-delete-small"
                                onclick="keluarkanDariKK(
                                    '${escapeAttribute(
                                        warga.id
                                    )}'
                                )"
                            >
                                Keluar KK
                            </button>

                        </div>

                    `;


                    memberList.appendChild(
                        item
                    );

                }
            );

        }

    }


    document
        .getElementById(
            "householdModal"
        )
        ?.classList.remove(
            "hidden"
        );

}


// ==========================================
// TUTUP DETAIL KK
// ==========================================

function tutupDetailKK() {

    document
        .getElementById(
            "householdModal"
        )
        ?.classList.add(
            "hidden"
        );


    kkTerpilih =
        null;

}


// ==========================================
// EDIT WARGA
// ==========================================

function bukaEditWarga(
    residentId
) {

    const warga =
        semuaWarga.find(
            item =>
                item.id ===
                residentId
        );


    if (!warga) {

        alert(
            "Data warga tidak ditemukan."
        );

        return;

    }


    wargaTerpilih =
        warga;


    setValue(
        "editResidentId",
        warga.id
    );


    setValue(
        "editNama",
        warga.name
    );


    setValue(
        "editNik",
        warga.nik
    );


    setValue(
        "editPhone",
        warga.phone
    );


    setValue(
        "editBirthPlace",
        warga.birth_place
    );


    setValue(
        "editBirthDate",
        warga.birth_date
    );


    setValue(
        "editGender",
        warga.gender ||
        "L"
    );


    setValue(
        "editFamilyStatus",
        warga.family_status ||
        "Anggota Keluarga"
    );


    setValue(
        "editAddress",
        warga.address
    );


    const error =
        document.getElementById(
            "editFormError"
        );


    if (error) {

        error.textContent =
            "";

        error.classList.add(
            "hidden"
        );

    }


    document
        .getElementById(
            "editResidentModal"
        )
        ?.classList.remove(
            "hidden"
        );

}


// ==========================================
// TUTUP EDIT WARGA
// ==========================================

function tutupEditWarga() {

    document
        .getElementById(
            "editResidentModal"
        )
        ?.classList.add(
            "hidden"
        );


    wargaTerpilih =
        null;

}
// ==========================================
// SIMPAN EDIT WARGA
// ==========================================

async function simpanEditWarga() {

    const id =
        document.getElementById(
            "editResidentId"
        )?.value;


    if (!id) {

        return;

    }


    const nama =
        getValue(
            "editNama"
        )
        .trim();


    const gender =
        getValue(
            "editGender"
        );


    const status =
        getValue(
            "editFamilyStatus"
        );


    const errorBox =
        document.getElementById(
            "editFormError"
        );


    const button =
        document.getElementById(
            "btnSimpanEdit"
        );


    function error(
        message
    ) {

        if (errorBox) {

            errorBox.textContent =
                message;

            errorBox.classList.remove(
                "hidden"
            );

        }

    }


    if (errorBox) {

        errorBox.textContent =
            "";

        errorBox.classList.add(
            "hidden"
        );

    }


    if (!nama) {

        error(
            "Nama lengkap wajib diisi."
        );

        return;

    }


    if (
        gender !== "L" &&
        gender !== "P"
    ) {

        error(
            "Jenis kelamin tidak valid."
        );

        return;

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Menyimpan...";

    }


    try {

        const warga =
            semuaWarga.find(
                item =>
                    item.id ===
                    id
            );


        if (!warga) {

            throw new Error(
                "Data warga tidak ditemukan."
            );

        }


        const kkSebagaiKepala =
            semuaKK.find(
                kk =>
                    kk.head_resident_id ===
                    id
            );


        // Kepala keluarga tidak boleh
        // diubah menjadi anggota begitu saja
        // karena household masih menunjuk dirinya.

        if (
            kkSebagaiKepala &&
            status !==
                "Kepala Keluarga"
        ) {

            error(
                "Warga ini adalah kepala keluarga. Ubah kepala keluarga terlebih dahulu melalui pengaturan KK."
            );

            return;

        }


        // Jika warga ingin dijadikan kepala,
        // harus sudah memiliki household.

        if (
            status ===
            "Kepala Keluarga" &&
            !kkSebagaiKepala
        ) {

            error(
                "Warga belum menjadi kepala dari sebuah KK. Gunakan menu Buat KK Baru atau pindahkan warga ke KK baru."
            );

            return;

        }


        const body = {

            name:
                nama,

            nik:
                getValue(
                    "editNik"
                )
                .trim()
                ||
                null,

            phone:
                getValue(
                    "editPhone"
                )
                .trim()
                ||
                null,

            birth_place:
                getValue(
                    "editBirthPlace"
                )
                .trim()
                ||
                null,

            birth_date:
                getValue(
                    "editBirthDate"
                )
                ||
                null,

            gender:
                gender,

            family_status:
                status,

            address:
                getValue(
                    "editAddress"
                )
                .trim()
                ||
                null,

            updated_at:
                new Date().toISOString()

        };


        await supabaseRequest(
            `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
                id
            )}`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify(
                        body
                    )
            }
        );


        alert(
            "Data warga berhasil diperbarui."
        );


        tutupEditWarga();


        await loadDataWarga();


        if (kkTerpilih) {

            const kkBaru =
                semuaKK.find(
                    kk =>
                        kk.id ===
                        kkTerpilih.id
                );


            if (kkBaru) {

                lihatKK(
                    kkBaru.id
                );

            }

        }


    } catch (error) {

        console.error(
            "Gagal edit warga:",
            error
        );


        error(
            "Gagal memperbarui data: " +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Simpan Perubahan";

        }

    }

}
// ==========================================
// PINDAH KK
// ==========================================

function bukaPindahKK(
    residentId
) {

    const warga =
        semuaWarga.find(
            item =>
                item.id ===
                residentId
        );


    if (!warga) {

        alert(
            "Data warga tidak ditemukan."
        );

        return;

    }


    // Kepala tidak dipindahkan lewat
    // menu anggota.

    const kkKepala =
        semuaKK.find(
            kk =>
                kk.head_resident_id ===
                residentId
        );


    if (kkKepala) {

        alert(
            "Kepala keluarga tidak dapat dipindahkan sebagai anggota. Tentukan kepala keluarga pengganti terlebih dahulu."
        );

        return;

    }


    setValue(
        "moveResidentId",
        residentId
    );


    const info =
        document.getElementById(
            "moveResidentInfo"
        );


    if (info) {

        info.innerHTML = `

            <div class="member-avatar">

                ${escapeHtml(
                    (
                        warga.name ||
                        "?"
                    )
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                )}

            </div>


            <div>

                <strong>
                    ${escapeHtml(
                        warga.name ||
                        "-"
                    )}
                </strong>

                <span>
                    ID:
                    ${escapeHtml(
                        warga.resident_code ||
                        "-"
                    )}
                </span>

            </div>

        `;

    }


    isiPilihanPindahKK();


    const existing =
        document.querySelector(
            'input[name="moveType"][value="existing"]'
        );


    if (existing) {

        existing.checked =
            true;

    }


    ubahTujuanPindah(
        "existing"
    );


    const error =
        document.getElementById(
            "moveFormError"
        );


    if (error) {

        error.textContent =
            "";

        error.classList.add(
            "hidden"
        );

    }


    document
        .getElementById(
            "moveResidentModal"
        )
        ?.classList.remove(
            "hidden"
        );

}


// ==========================================
// ISI PILIHAN PINDAH KK
// ==========================================

function isiPilihanPindahKK() {

    const select =
        document.getElementById(
            "moveKK"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Pilih KK tujuan
        </option>

    `;


    const residentId =
        getValue(
            "moveResidentId"
        );


    const warga =
        semuaWarga.find(
            item =>
                item.id ===
                residentId
        );


    semuaKK.forEach(
        kk => {

            if (
                warga &&
                kk.kk_number ===
                warga.kk_number
            ) {

                return;

            }


            const kepala =
                getKepalaKK(
                    kk
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                kk.kk_number;


            option.textContent =
                kepala
                    ? `${kk.kk_number} - ${kepala.name}`
                    : `${kk.kk_number} - Tanpa Kepala`;


            select.appendChild(
                option
            );

        }
    );

}
// ==========================================
// UBAH TUJUAN PINDAH
// ==========================================

function ubahTujuanPindah(
    type
) {

    const existing =
        document.getElementById(
            "moveExistingSection"
        );


    const baru =
        document.getElementById(
            "moveNewSection"
        );


    if (
        type ===
        "new"
    ) {

        existing?.classList.add(
            "hidden"
        );

        baru?.classList.remove(
            "hidden"
        );

    } else {

        existing?.classList.remove(
            "hidden"
        );

        baru?.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// TUTUP PINDAH KK
// ==========================================

function tutupPindahKK() {

    document
        .getElementById(
            "moveResidentModal"
        )
        ?.classList.add(
            "hidden"
        );

}


// ==========================================
// SIMPAN PINDAH KK
// ==========================================

async function simpanPindahKK() {

    const residentId =
        getValue(
            "moveResidentId"
        );


    const type =
        document.querySelector(
            'input[name="moveType"]:checked'
        )?.value
        ||
        "existing";


    const errorBox =
        document.getElementById(
            "moveFormError"
        );


    const button =
        document.getElementById(
            "btnSimpanPindah"
        );


    function error(
        message
    ) {

        if (errorBox) {

            errorBox.textContent =
                message;

            errorBox.classList.remove(
                "hidden"
            );

        }

    }


    if (!residentId) {

        error(
            "Warga yang dipindahkan belum dipilih."
        );

        return;

    }


    if (
        type ===
        "existing"
    ) {

        const tujuan =
            getValue(
                "moveKK"
            );


        if (!tujuan) {

            error(
                "Pilih KK tujuan."
            );

            return;

        }

    } else {

        const kkBaru =
            getValue(
                "moveNewKK"
            )
            .trim();


        if (
            !/^\d{16}$/.test(
                kkBaru
            )
        ) {

            error(
                "Nomor KK baru harus terdiri dari 16 digit."
            );

            return;

        }


        const sudahAda =
            semuaKK.some(
                kk =>
                    String(
                        kk.kk_number
                    )
                    .trim()
                    ===
                    kkBaru
            );


        if (sudahAda) {

            error(
                "Nomor KK tersebut sudah terdaftar."
            );

            return;

        }

    }


    if (errorBox) {

        errorBox.textContent =
            "";

        errorBox.classList.add(
            "hidden"
        );

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Memindahkan...";

    }


    try {

        if (
            type ===
            "existing"
        ) {

            const tujuan =
                getValue(
                    "moveKK"
                );


            await supabaseRequest(
                `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
                    residentId
                )}`,
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify({

                            kk_number:
                                tujuan,

                            updated_at:
                                new Date().toISOString()

                        })

                }
            );


            alert(
                "Warga berhasil dipindahkan ke KK tujuan."
            );

        } else {

            const kkBaru =
                getValue(
                    "moveNewKK"
                )
                .trim();


            const warga =
                semuaWarga.find(
                    item =>
                        item.id ===
                        residentId
                );


            if (!warga) {

                throw new Error(
                    "Data warga tidak ditemukan."
                );

            }


            // Buat KK baru
            await supabaseRequest(
                `${SUPABASE_URL}/rest/v1/households`,
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            kk_number:
                                kkBaru,

                            head_resident_id:
                                residentId,

                            address:
                                warga.address ||
                                null

                        })

                }
            );


            // Jadikan warga kepala
            await supabaseRequest(
                `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
                    residentId
                )}`,
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify({

                            kk_number:
                                kkBaru,

                            family_status:
                                "Kepala Keluarga",

                            updated_at:
                                new Date().toISOString()

                        })

                }
            );


            alert(
                "Warga berhasil dibuatkan KK baru sebagai Kepala Keluarga."
            );

        }


        tutupPindahKK();


        await loadDataWarga();


    } catch (error) {

        console.error(
            "Gagal memindahkan warga:",
            error
        );


        error(
            "Gagal memindahkan warga: " +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Pindahkan Warga";

        }

    }

}
// ==========================================
// KELUARKAN DARI KK
// ==========================================
//
// Penting:
// Data warga TIDAK DIHAPUS.
// Hanya kk_number dan family_status
// yang dikosongkan.
//
// Ini sesuai konsep:
// warga dapat keluar dari KK
// dan suatu saat membuat KK sendiri.
//

async function keluarkanDariKK(
    residentId
) {

    const warga =
        semuaWarga.find(
            item =>
                item.id ===
                residentId
        );


    if (!warga) {

        alert(
            "Data warga tidak ditemukan."
        );

        return;

    }


    const kkSebagaiKepala =
        semuaKK.find(
            kk =>
                kk.head_resident_id ===
                residentId
        );


    if (kkSebagaiKepala) {

        alert(
            "Kepala keluarga tidak dapat dikeluarkan dari KK. Tentukan kepala keluarga pengganti terlebih dahulu."
        );

        return;

    }


    const yakin =
        confirm(
            `Keluarkan ${warga.name} dari KK ${warga.kk_number || ""}?\n\nData warga tetap tersimpan dan tidak akan dihapus.`
        );


    if (!yakin) {

        return;

    }


    try {

        await supabaseRequest(
            `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(
                residentId
            )}`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({

                        kk_number:
                            null,

                        family_status:
                            null,

                        updated_at:
                            new Date().toISOString()

                    })

            }
        );


        alert(
            "Warga berhasil dikeluarkan dari KK."
        );


        await loadDataWarga();


        if (kkTerpilih) {

            const kk =
                semuaKK.find(
                    item =>
                        item.id ===
                        kkTerpilih.id
                );


            if (kk) {

                lihatKK(
                    kk.id
                );

            }

        }


    } catch (error) {

        console.error(
            "Gagal mengeluarkan warga:",
            error
        );


        alert(
            "Gagal mengeluarkan warga: " +
            error.message
        );

    }

}


// ==========================================
// EDIT KEPALA KELUARGA
// ==========================================
//
// Karena perubahan kepala keluarga berkaitan
// dengan akun login, kita tidak memindahkan
// kepala secara otomatis dari tombol ini.
//
// Untuk saat ini tombol membuka informasi
// kepada admin.
//

function editKepalaKeluarga() {

    if (!kkTerpilih) {

        return;

    }


    const kepala =
        getKepalaKK(
            kkTerpilih
        );


    if (!kepala) {

        alert(
            "KK ini belum memiliki kepala keluarga."
        );

        return;

    }


    alert(
        "Edit data Kepala Keluarga dilakukan melalui tombol Edit pada data kepala.\n\nPerubahan kepala keluarga akan membutuhkan proses pengaturan akun login agar tetap hanya ada 1 akun per KK."
    );

}


// ==========================================
// LIHAT KK DARI WARGA
// ==========================================

function lihatKKDariWarga(
    residentId
) {

    const warga =
        semuaWarga.find(
            item =>
                item.id ===
                residentId
        );


    if (!warga) {

        alert(
            "Data warga tidak ditemukan."
        );

        return;

    }


    if (!warga.kk_number) {

        alert(
            "Warga ini belum masuk KK."
        );

        return;

    }


    const kk =
        semuaKK.find(
            item =>
                String(
                    item.kk_number
                )
                ===
                String(
                    warga.kk_number
                )
        );


    if (!kk) {

        alert(
            "Data KK belum ditemukan."
        );

        return;

    }


    lihatKK(
        kk.id
    );

}


// ==========================================
// QR DATA
// ==========================================

// ==========================================
// QR DATA
// ==========================================

function buatQRData(
    kk
) {

    if (!kk) {

        return "";

    }


    const token =
        String(
            kk.qr_token ||
            ""
        ).trim();


    console.log(
        "QR TOKEN YANG DIGUNAKAN:",
        token
    );


    return token;

}


// ==========================================
// BUKA QR
// ==========================================

function bukaQR(
    householdId
) {

    const kk =
        semuaKK.find(
            item =>
                item.id ===
                householdId
        );


    if (!kk) {

        alert(
            "Data KK tidak ditemukan."
        );

        return;

    }


    const kepala =
        getKepalaKK(
            kk
        );


    if (!kepala) {

        alert(
            "KK ini belum memiliki kepala keluarga."
        );

        return;

    }


    kkTerpilih =
        kk;


    wargaTerpilih =
        kepala;


    const token =
        buatQRData(
            kk
        );
        console.log(
    "QR TOKEN YANG DIGENERATE:",
    token
);


    setText(
        "qrName",
        kepala.name ||
        "-"
    );


    setText(
        "qrCode",
        `KK: ${
            kk.kk_number ||
            "-"
        }`
    );


    setText(
        "qrToken",
        token
    );


    const container =
        document.getElementById(
            "qrcode"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        typeof QRCode ===
        "undefined"
    ) {

        alert(
            "Library QR belum termuat."
        );

        return;

    }


    new QRCode(
        container,
        {

            text:
                token,

            width:
                200,

            height:
                200,

            correctLevel:
                QRCode.CorrectLevel.H

        }
    );


    document
        .getElementById(
            "qrModal"
        )
        ?.classList.remove(
            "hidden"
        );

}


// ==========================================
// TUTUP QR
// ==========================================

function tutupQR() {

    document
        .getElementById(
            "qrModal"
        )
        ?.classList.add(
            "hidden"
        );


    const qr =
        document.getElementById(
            "qrcode"
        );


    if (qr) {

        qr.innerHTML =
            "";

    }


    wargaTerpilih =
        null;

}


// ==========================================
// CETAK QR
// ==========================================

function cetakQR() {

    if (
        !kkTerpilih ||
        !wargaTerpilih
    ) {

        alert(
            "Data KK belum dipilih."
        );

        return;

    }


    const qrElement =
        document.getElementById(
            "qrcode"
        );


    const image =
        qrElement?.querySelector(
            "img"
        );


    const canvas =
        qrElement?.querySelector(
            "canvas"
        );


    let qrData =
        "";


    if (image) {

        qrData =
            image.src;

    } else if (canvas) {

        qrData =
            canvas.toDataURL(
                "image/png"
            );

    }


    if (!qrData) {

        alert(
            "QR belum siap."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Popup diblokir browser. Izinkan popup untuk mencetak QR."
        );

        return;

    }


    const nama =
        wargaTerpilih.name ||
        "Kepala Keluarga";


    const nomorKK =
        kkTerpilih.kk_number ||
        "-";


    const token =
        buatQRData(
            kkTerpilih
        );


    printWindow.document.write(`

        <!DOCTYPE html>

        <html lang="id">

        <head>

            <meta charset="UTF-8">

            <title>
                QR Jimpitan KK
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    text-align:
                        center;

                    padding:
                        30px;

                }


                h1 {

                    font-size:
                        24px;

                }


                h2 {

                    margin:
                        5px 0;

                }


                p {

                    margin:
                        6px;

                }


                img {

                    width:
                        250px;

                    height:
                        250px;

                    margin:
                        20px;

                }


                .token {

                    font-size:
                        11px;

                    word-break:
                        break-all;

                }


                .footer {

                    margin-top:
                        30px;

                    font-size:
                        11px;

                    color:
                        #666;

                }

            </style>

        </head>


        <body>

            <h1>
                QR JIMPITAN
            </h1>


            <h2>
                ${escapeHtml(
                    nama
                )}
            </h2>


            <p>
                KK:
                ${escapeHtml(
                    nomorKK
                )}
            </p>


            <img
                src="${qrData}"
                alt="QR Jimpitan"
            >


            <div class="token">

                ${escapeHtml(
                    token
                )}

            </div>


            <div class="footer">

                SIDAT<br>
                Dibuat oleh Suwardi

            </div>


            <script>

                window.onload =
                    function() {

                        window.print();

                    };

            <!-- SUPABASE -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- CONFIG -->
           <script src="../js/supbase-config.js"></script>

<!-- DATA WARGA -->
            <script src="data-warga.js"></script>

        </body>

        </html>

    `);


    printWindow.document.close();

}
// ==========================================
// SALIN TOKEN
// ==========================================

async function salinToken() {

    if (!kkTerpilih) {

        return;

    }


    const token =
        buatQRData(
            kkTerpilih
        );


    try {

        await navigator.clipboard.writeText(
            token
        );


        alert(
            "QR Token KK berhasil disalin."
        );


    } catch {

        alert(
            "Token KK:\n" +
            token
        );

    }

}


// ==========================================
// HELPER GET VALUE
// ==========================================

function getValue(
    id
) {

    return (
        document.getElementById(
            id
        )?.value
        ??
        ""
    );

}


// ==========================================
// HELPER SET VALUE
// ==========================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ??
            "";

    }

}


// ==========================================
// HELPER TEXT
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ??
            "";

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
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


// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(
    value
) {

    return String(
        value ??
        ""
    )

    .replace(
        /\\/g,
        "\\\\"
    )

    .replace(
        /'/g,
        "\\'"
    );

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
        Number(
            nominal
        ) ||
        0
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
// EXPORT GLOBAL
// ==========================================

window.loadDataWarga =
    loadDataWarga;

window.bukaTambahWarga =
    bukaTambahWarga;

window.tutupWargaModal =
    tutupWargaModal;

window.simpanFormWarga =
    simpanFormWarga;

window.ubahSumberData =
    ubahSumberData;

window.ubahStatusKeluarga =
    ubahStatusKeluarga;

window.pilihWargaExisting =
    pilihWargaExisting;

window.filterKK =
    filterKK;

window.lihatKK =
    lihatKK;

window.lihatKKDariWarga =
    lihatKKDariWarga;

window.tutupDetailKK =
    tutupDetailKK;

window.tambahAnggotaDariKK =
    tambahAnggotaDariKK;

window.bukaEditWarga =
    bukaEditWarga;

window.tutupEditWarga =
    tutupEditWarga;

window.simpanEditWarga =
    simpanEditWarga;

window.bukaPindahKK =
    bukaPindahKK;

window.tutupPindahKK =
    tutupPindahKK;

window.ubahTujuanPindah =
    ubahTujuanPindah;

window.simpanPindahKK =
    simpanPindahKK;

window.keluarkanDariKK =
    keluarkanDariKK;

window.editKepalaKeluarga =
    editKepalaKeluarga;

window.bukaQR =
    bukaQR;

window.tutupQR =
    tutupQR;

window.cetakQR =
    cetakQR;

window.salinToken =
    salinToken;

window.kembaliDashboard =
    kembaliDashboard;


// ==========================================
// START
// ==========================================

loadDataWarga();
// ==========================================
// SIDAT
// EXPORT DATA WARGA
// ==========================================

function exportDataWarga() {

    try {

        // ==================================
        // CEK DATA
        // ==================================

        if (
            !Array.isArray(
                semuaWarga
            ) ||
            semuaWarga.length === 0
        ) {

            alert(
                "Belum ada data warga yang dapat di-export."
            );

            return;

        }


        // ==================================
        // HEADER CSV
        // ==================================

        const headers = [

            "resident_code",
            "nik",
            "kk_number",
            "name",
            "birth_place",
            "birth_date",
            "gender",
            "address",
            "house_number",
            "phone",
            "family_status",
            "is_active"

        ];


        // ==================================
        // ESCAPE CSV
        // ==================================

        function escapeCSV(
            value
        ) {

            if (
                value === null ||
                value === undefined
            ) {

                return "";

            }


            const text =
                String(
                    value
                );


            return `"${text.replace(
                /"/g,
                '""'
            )}"`;

        }


        // ==================================
        // BUAT BARIS DATA
        // ==================================

        const rows =
            semuaWarga.map(
                warga => {

                    return [

                        warga.resident_code,

                        warga.nik,

                        warga.kk_number,

                        warga.name,

                        warga.birth_place,

                        warga.birth_date,

                        warga.gender,

                        warga.address,

                        warga.house_number,

                        warga.phone,

                        warga.family_status,

                        warga.is_active

                    ]
                    .map(
                        escapeCSV
                    )
                    .join(",");

                }
            );


        // ==================================
        // GABUNG CSV
        // ==================================

        const csv =
            [
                headers
                    .map(
                        escapeCSV
                    )
                    .join(","),

                ...rows

            ]
            .join("\r\n");


        // ==================================
        // BOM
        // Supaya Excel membaca UTF-8
        // ==================================

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


        // ==================================
        // NAMA FILE
        // ==================================

        const sekarang =
            new Date();


        const tahun =
            sekarang.getFullYear();


        const bulan =
            String(
                sekarang.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            );


        const tanggal =
            String(
                sekarang.getDate()
            )
            .padStart(
                2,
                "0"
            );


        const namaFile =
            `SIDAT_Data_Warga_${tahun}-${bulan}-${tanggal}.csv`;


        // ==================================
        // DOWNLOAD
        // ==================================

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


        link.remove();


        URL.revokeObjectURL(
            url
        );


        // ==================================
        // INFORMASI
        // ==================================

        alert(
            `Export berhasil.\n\n` +
            `Jumlah warga: ${semuaWarga.length}\n` +
            `File: ${namaFile}`
        );


    } catch (error) {

        console.error(
            "EXPORT DATA WARGA ERROR:",
            error
        );


        alert(
            "Gagal melakukan export data warga:\n" +
            error.message
        );

    }

}


// ==========================================
// EXPORT
// ==========================================

window.exportDataWarga =
    exportDataWarga;
    
// ==========================================
// EXPORT DATA WARGA - EXCEL
// ==========================================

function exportDataWargaExcel() {

    try {

        // ==================================
        // CEK SHEETJS
        // ==================================

        if (
            typeof XLSX === "undefined"
        ) {

            alert(
                "Library Excel belum tersedia.\n\n" +
                "Silakan refresh halaman SIDAT."
            );

            return;

        }


        // ==================================
        // CEK DATA
        // ==================================

        if (
            !Array.isArray(
                semuaWarga
            ) ||
            semuaWarga.length === 0
        ) {

            alert(
                "Belum ada data warga yang dapat di-export."
            );

            return;

        }


        // ==================================
        // DATA EXCEL
        // ==================================

        const headers = [

            "resident_code",
            "nik",
            "kk_number",
            "name",
            "birth_place",
            "birth_date",
            "gender",
            "address",
            "house_number",
            "phone",
            "family_status",
            "is_active"

        ];


        const data = [

            headers,

            ...semuaWarga.map(
                warga => [

                    warga.resident_code ?? "",

                    warga.nik ?? "",

                    warga.kk_number ?? "",

                    warga.name ?? "",

                    warga.birth_place ?? "",

                    warga.birth_date ?? "",

                    warga.gender ?? "",

                    warga.address ?? "",

                    warga.house_number ?? "",

                    warga.phone ?? "",

                    warga.family_status ?? "",

                    warga.is_active ?? ""

                ]
            )

        ];


        // ==================================
        // BUAT WORKSHEET
        // ==================================

        const worksheet =
            XLSX.utils.aoa_to_sheet(
                data
            );


        // ==================================
        // LEBAR KOLOM
        // ==================================

        worksheet["!cols"] = [

            { wch: 16 },
            { wch: 18 },
            { wch: 20 },
            { wch: 30 },
            { wch: 20 },
            { wch: 15 },
            { wch: 10 },
            { wch: 40 },
            { wch: 15 },
            { wch: 18 },
            { wch: 20 },
            { wch: 12 }

        ];


        // ==================================
        // BUAT WORKBOOK
        // ==================================

        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Data Warga"
        );


        // ==================================
        // NAMA FILE
        // ==================================

        const sekarang =
            new Date();


        const tahun =
            sekarang.getFullYear();


        const bulan =
            String(
                sekarang.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            );


        const tanggal =
            String(
                sekarang.getDate()
            )
            .padStart(
                2,
                "0"
            );


        const namaFile =
            `SIDAT_Data_Warga_${tahun}-${bulan}-${tanggal}.xlsx`;


        // ==================================
        // DOWNLOAD
        // ==================================

        XLSX.writeFile(
            workbook,
            namaFile
        );


        // ==================================
        // INFORMASI
        // ==================================

        alert(
            `Export Excel berhasil.\n\n` +
            `Jumlah warga: ${semuaWarga.length}\n` +
            `File: ${namaFile}`
        );


    } catch (error) {

        console.error(
            "EXPORT EXCEL DATA WARGA ERROR:",
            error
        );


        alert(
            "Gagal melakukan export Excel data warga:\n" +
            error.message
        );

    }

}


// ==========================================
// EXPORT EXCEL
// ==========================================

window.exportDataWargaExcel =
    exportDataWargaExcel;
    // ==========================================
// IMPORT DATA WARGA
// BUKA MODAL
// ==========================================

function bukaImportWarga() {

    const modal =
        document.getElementById(
            "importWargaModal"
        );

    if (!modal) {

        console.error(
            "Modal import warga tidak ditemukan."
        );

        return;

    }


    // Reset file

    const fileInput =
        document.getElementById(
            "importWargaFile"
        );

    if (fileInput) {

        fileInput.value = "";

    }


    // Reset status

    const status =
        document.getElementById(
            "importStatus"
        );

    if (status) {

        status.innerHTML = "";

        status.classList.add(
            "hidden"
        );

    }


    // Reset error

    const error =
        document.getElementById(
            "importError"
        );

    if (error) {

        error.innerHTML = "";

        error.classList.add(
            "hidden"
        );

    }


    // Reset preview

    const previewSection =
        document.getElementById(
            "importPreviewSection"
        );

    if (previewSection) {

        previewSection.classList.add(
            "hidden"
        );

    }


    const preview =
        document.getElementById(
            "importPreview"
        );

    if (preview) {

        preview.innerHTML = "";

    }


    // Reset summary

    const total =
        document.getElementById(
            "importTotal"
        );

    const valid =
        document.getElementById(
            "importValid"
        );

    const duplicate =
        document.getElementById(
            "importDuplicate"
        );


    if (total) {

        total.textContent = "0";

    }


    if (valid) {

        valid.textContent = "0";

    }


    if (duplicate) {

        duplicate.textContent = "0";

    }


    // Disable tombol import

    const button =
        document.getElementById(
            "btnProsesImport"
        );

    if (button) {

        button.disabled = true;

    }


    // Buka modal

    modal.classList.remove(
        "hidden"
    );

}


// ==========================================
// TUTUP MODAL IMPORT
// ==========================================

function tutupImportWarga() {

    const modal =
        document.getElementById(
            "importWargaModal"
        );

    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );

}


// ==========================================
// EXPORT GLOBAL
// ==========================================

window.bukaImportWarga =
    bukaImportWarga;


window.tutupImportWarga =
    tutupImportWarga;
    

    // ==========================================
// IMPORT DATA WARGA
// FILE INPUT
// ==========================================

const importWargaFile =
    document.getElementById(
        "importWargaFile"
    );


if (importWargaFile) {

    importWargaFile.addEventListener(
        "change",
        async function () {

            const file =
                this.files?.[0];


            if (!file) {

                return;

            }


            await bacaFileImportWarga(
                file
            );

        }
    );

}


// ==========================================
// BACA FILE CSV
// ==========================================

async function bacaFileImportWarga(file) {

    const errorBox =
        document.getElementById("importError");

    const statusBox =
        document.getElementById("importStatus");

    const previewSection =
        document.getElementById("importPreviewSection");

    const preview =
        document.getElementById("importPreview");

    const button =
        document.getElementById("btnProsesImport");


    // ==========================================
    // RESET
    // ==========================================

    if (errorBox) {

        errorBox.innerHTML = "";
        errorBox.classList.add("hidden");

    }

    if (previewSection) {

        previewSection.classList.add("hidden");

    }

    if (preview) {

        preview.innerHTML = "";

    }

    if (button) {

        button.disabled = true;

    }


    // ==========================================
    // CEK FILE
    // ==========================================

    if (!file) {

        tampilkanErrorImport(
            "File belum dipilih."
        );

        return;

    }


    const namaFile =
    file.name
        .toLowerCase();

const isCSV =
    namaFile.endsWith(".csv");

const isExcel =
    namaFile.endsWith(".xlsx") ||
    namaFile.endsWith(".xls");


if (!isCSV && !isExcel) {

    tampilkanErrorImport(
        "File harus berformat CSV, XLSX, atau XLS."
    );

    return;

}


    try {

        if (statusBox) {

            statusBox.innerHTML = `
                <strong>
                    Membaca file...
                </strong>

                <p>
                    ${escapeHtml(file.name)}
                </p>
            `;

            statusBox.classList.remove("hidden");

        }


        // ==========================================
        // BACA FILE
        // ==========================================

                // ==========================================
        // BACA FILE
        // CSV / EXCEL
        // ==========================================

        let rows;


        if (isCSV) {

            // ======================================
            // CSV
            // ======================================

            const text =
                await file.text();


            if (!text.trim()) {

                throw new Error(
                    "File CSV kosong."
                );

            }


            console.log(
                "CSV RAW:",
                text.substring(0, 1000)
            );


            rows =
                parseCSV(text);


            console.log(
                "CSV ROWS:",
                rows
            );

        } else {

            // ======================================
            // EXCEL
            // ======================================

            if (
                typeof XLSX === "undefined"
            ) {

                throw new Error(
                    "Library Excel belum tersedia. Silakan refresh halaman."
                );

            }


            const arrayBuffer =
                await file.arrayBuffer();


            if (
                !arrayBuffer ||
                arrayBuffer.byteLength === 0
            ) {

                throw new Error(
                    "File Excel kosong."
                );

            }


            console.log(
                "EXCEL FILE:",
                file.name
            );


            const workbook =
                XLSX.read(
                    arrayBuffer,
                    {
                        type: "array"
                    }
                );


            if (
                !workbook.SheetNames ||
                workbook.SheetNames.length === 0
            ) {

                throw new Error(
                    "File Excel tidak memiliki sheet."
                );

            }


            const namaSheet =
                workbook.SheetNames[0];


            const worksheet =
                workbook.Sheets[
                    namaSheet
                ];


            rows =
                XLSX.utils.sheet_to_json(
                    worksheet,
                    {
                        header: 1,
                        defval: "",
                        raw: false
                    }
                );


            console.log(
                "EXCEL SHEET:",
                namaSheet
            );


            console.log(
                "EXCEL ROWS:",
                rows
            );

        }


        // ==========================================
        // CEK HASIL BACA
        // ==========================================

        if (
            !rows ||
            rows.length < 2
        ) {

            throw new Error(
                isCSV
                    ? "CSV tidak memiliki data warga."
                    : "Excel tidak memiliki data warga."
            );

        }


        // ==========================================
        // HEADER
        // ==========================================

        const headers =
            rows[0].map(
                header =>
                    String(
                        header || ""
                    )
                    .replace(
                        /^\uFEFF/,
                        ""
                    )
                    .trim()
                    .toLowerCase()
            );


        console.log(
    isCSV
        ? "CSV HEADERS:"
        : "EXCEL HEADERS:",
    headers
);


        // ==========================================
        // HEADER WAJIB
        // ==========================================

        const requiredHeaders = [

            "resident_code",
            "kk_number",
            "name",
            "gender",
            "family_status"

        ];


        const missingHeaders =
            requiredHeaders.filter(
                header =>
                    !headers.includes(
                        header
                    )
            );


        if (
            missingHeaders.length > 0
        ) {

            throw new Error(
                "Kolom wajib tidak ditemukan: " +
                missingHeaders.join(", ")
            );

        }


        // ==========================================
        // UBAH ROW MENJADI OBJECT
        // ==========================================

        const data =
            rows
                .slice(1)
                .map(
                    row => {

                        const item = {};

                        headers.forEach(
                            (
                                header,
                                index
                            ) => {

                                item[header] =
                                    String(
                                        row[index] ?? ""
                                    )
                                    .trim();

                            }
                        );


                        return item;

                    }
                )
                .filter(
                    item =>
                        Object.values(item)
                            .some(
                                value =>
                                    String(
                                        value || ""
                                    ).trim()
                            )
                );


        console.log(
            "DATA IMPORT:",
            data
        );


        // ==========================================
        // CEK DATA
        // ==========================================

        if (
            data.length === 0
        ) {

            throw new Error(
                "CSV berhasil dibaca tetapi tidak ditemukan baris data warga."
            );

        }


        // ==========================================
        // SIMPAN GLOBAL
        // ==========================================

        dataImportWarga =
            data;


        console.log(
            "dataImportWarga tersimpan:",
            dataImportWarga
        );


        // ==========================================
        // VALIDASI
        // ==========================================

        const hasilValidasi =
            validasiDataImportWarga(
                data
            );


        // ==========================================
        // PREVIEW
        // ==========================================

        tampilkanPreviewImportWarga(
            data,
            hasilValidasi
        );


        // ==========================================
        // STATUS
        // ==========================================

        if (statusBox) {

            statusBox.innerHTML = `
                <strong>
                    File berhasil dibaca.
                </strong>

                <p>
                    ${data.length}
                    data warga ditemukan.
                </p>
            `;

        }


    } catch (error) {

        console.error(
            "BACA CSV ERROR:",
            error
        );


        tampilkanErrorImport(
            error.message ||
            "Gagal membaca file CSV."
        );

    }

}


// ==========================================
// PARSER CSV
// ==========================================

function parseCSV(
    text
) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes =
        false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


        const next =
            text[i + 1];


        // ==================================
        // QUOTE
        // ==================================

        if (
            char === '"'
        ) {

            if (
                insideQuotes &&
                next === '"'
            ) {

                value += '"';

                i++;

                continue;

            }


            insideQuotes =
                !insideQuotes;

            continue;

        }


        // ==================================
        // COMMA
        // ==================================

        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(
                value
            );

            value = "";

            continue;

        }


        // ==================================
        // NEW LINE
        // ==================================

        if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }


            row.push(
                value
            );

            rows.push(
                row
            );

            row = [];

            value = "";

            continue;

        }


        value += char;

    }


    // ==================================
    // BARIS TERAKHIR
    // ==================================

    if (
        value !== "" ||
        row.length > 0
    ) {

        row.push(
            value
        );

        rows.push(
            row
        );

    }


    return rows;

}


// ==========================================
// VALIDASI DATA IMPORT
// ==========================================

function validasiDataImportWarga(
    data
) {

    const hasil = {

        valid: 0,

        duplicate: 0,

        invalid: 0,

        errors: [],

        validRows: []

    };


    const kodeSet =
        new Set();


    data.forEach(
        (
            warga,
            index
        ) => {

            const baris =
                index + 2;


            const kode =
                String(
                    warga.resident_code ||
                    ""
                )
                .trim()
                .toUpperCase();


            const nama =
                String(
                    warga.name ||
                    ""
                )
                .trim();


            const gender =
                String(
                    warga.gender ||
                    ""
                )
                .trim()
                .toUpperCase();


            const status =
                String(
                    warga.family_status ||
                    ""
                )
                .trim();


            // ==============================
            // KODE WARGA
            // ==============================

            if (!kode) {

                hasil.invalid++;

                hasil.errors.push(
                    `Baris ${baris}: ID warga kosong.`
                );

                return;

            }


            if (
                kodeSet.has(
                    kode
                )
            ) {

                hasil.duplicate++;

                hasil.errors.push(
                    `Baris ${baris}: ID warga ${kode} duplikat dalam file.`
                );

                return;

            }


            kodeSet.add(
                kode
            );


            // ==============================
            // NAMA
            // ==============================

            if (!nama) {

                hasil.invalid++;

                hasil.errors.push(
                    `Baris ${baris}: Nama warga kosong.`
                );

                return;

            }


            // ==============================
            // GENDER
            // ==============================

            if (
                gender !== "L" &&
                gender !== "P"
            ) {

                hasil.invalid++;

                hasil.errors.push(
                    `Baris ${baris}: Jenis kelamin harus L atau P.`
                );

                return;

            }


            // ==============================
            // STATUS
            // ==============================

            if (!status) {

                hasil.invalid++;

                hasil.errors.push(
                    `Baris ${baris}: Status keluarga kosong.`
                );

                return;

            }


            hasil.valid++;

            hasil.validRows.push(
                warga
            );

        }
    );


    return hasil;

}


// ==========================================
// TAMPILKAN PREVIEW
// ==========================================

function tampilkanPreviewImportWarga(
    data,
    hasil
) {

    const section =
        document.getElementById(
            "importPreviewSection"
        );


    const preview =
        document.getElementById(
            "importPreview"
        );


    const total =
        document.getElementById(
            "importTotal"
        );


    const valid =
        document.getElementById(
            "importValid"
        );


    const duplicate =
        document.getElementById(
            "importDuplicate"
        );


    const button =
        document.getElementById(
            "btnProsesImport"
        );


    if (total) {

        total.textContent =
            data.length;

    }


    if (valid) {

        valid.textContent =
            hasil.valid;

    }


    if (duplicate) {

        duplicate.textContent =
            hasil.duplicate;

    }


    // ==================================
    // PREVIEW MAKSIMAL 50 BARIS
    // ==================================

    const previewData =
        data.slice(
            0,
            50
        );


    let html = `
        <table>

            <thead>

                <tr>
    `;


    const headers = [

        "resident_code",
        "nik",
        "kk_number",
        "name",
        "birth_place",
        "birth_date",
        "gender",
        "address",
        "house_number",
        "phone",
        "family_status",
        "is_active"

    ];


    headers.forEach(
        header => {

            html += `
                <th>
                    ${escapeHtml(
                        header
                    )}
                </th>
            `;

        }
    );


    html += `
                </tr>

            </thead>

            <tbody>
    `;


    previewData.forEach(
        warga => {

            html += `
                <tr>
            `;


            headers.forEach(
                header => {

                    html += `
                        <td>
                            ${escapeHtml(
                                warga[header] ||
                                ""
                            )}
                        </td>
                    `;

                }
            );


            html += `
                </tr>
            `;

        }
    );


    html += `
            </tbody>

        </table>
    `;


    if (preview) {

        preview.innerHTML =
            html;

    }


    if (section) {

        section.classList.remove(
            "hidden"
        );

    }


    // ==================================
    // TOMBOL IMPORT
    // ==================================

    if (button) {

        button.disabled =
            hasil.valid === 0 ||
            hasil.invalid > 0 ||
            hasil.duplicate > 0;

    }

}


// ==========================================
// ERROR IMPORT
// ==========================================

function tampilkanErrorImport(
    message
) {

    const errorBox =
        document.getElementById(
            "importError"
        );


    if (!errorBox) {

        return;

    }


    errorBox.innerHTML = `
        ${escapeHtml(
            message
        )}
    `;


    errorBox.classList.remove(
        "hidden"
    );

}
// ==========================================
// PROSES IMPORT DATA WARGA
// ==========================================

// ==========================================
// PROSES IMPORT WARGA
// ==========================================

async function prosesImportWarga() {

    const button =
        document.getElementById(
            "btnProsesImport"
        );

    const statusBox =
        document.getElementById(
            "importStatus"
        );

    const errorBox =
        document.getElementById(
            "importError"
        );


    // ==========================================
    // CEK DATA
    // ==========================================

    if (
        !Array.isArray(dataImportWarga) ||
        dataImportWarga.length === 0
    ) {

        tampilkanErrorImport(
            "Belum ada data yang siap diimport."
        );

        return;

    }


    // ==========================================
    // KONFIRMASI
    // ==========================================

    if (
        !confirm(
            `Import ${dataImportWarga.length} data warga sekarang?`
        )
    ) {

        return;

    }


    // ==========================================
    // LOADING
    // ==========================================

    if (button) {

        button.disabled = true;

        button.textContent =
            "MEMPROSES...";

    }


    if (errorBox) {

        errorBox.innerHTML = "";

        errorBox.classList.add(
            "hidden"
        );

    }


    if (statusBox) {

        statusBox.innerHTML = `
            <strong>
                Sedang mengimport data...
            </strong>

            <p>
                Mohon jangan tutup halaman.
            </p>
        `;

        statusBox.classList.remove(
            "hidden"
        );

    }


    try {

        // ==========================================
        // AMBIL TOKEN SIDAT
        // ==========================================

        const accessToken =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!accessToken) {

            throw new Error(
                "Session admin tidak ditemukan. Silakan login kembali."
            );

        }


        console.log(
            "IMPORT FUNCTION URL:",
            `${SUPABASE_URL}/functions/v1/import-residents`
        );

        console.log(
            "ACCESS TOKEN ADA:",
            !!accessToken
        );

        console.log(
            "DATA DIKIRIM:",
            dataImportWarga
        );


        // ==========================================
        // PANGGIL EDGE FUNCTION
        // ==========================================

        const response =
            await fetch(
                `${SUPABASE_URL}/functions/v1/import-residents`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            residents:
                                dataImportWarga
                        })

                }
            );


        console.log(
            "IMPORT RESPONSE STATUS:",
            response.status
        );


        // ==========================================
        // BACA RESPONSE
        // ==========================================

        const responseText =
            await response.text();


        console.log(
            "IMPORT RAW RESPONSE:",
            responseText
        );


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (jsonError) {

            throw new Error(
                "Response Edge Function bukan JSON: " +
                responseText
            );

        }


        console.log(
            "IMPORT RESULT:",
            result
        );


        // ==========================================
        // HASIL EDGE FUNCTION
        // ==========================================

        const hasil =
            result.data ||
            result;


        if (!result.success) {

            throw new Error(
                result.message ||
                "Import data warga gagal."
            );

        }


        // ==========================================
        // TAMPILKAN HASIL
        // ==========================================

        if (statusBox) {

            statusBox.innerHTML = `

                <strong>
                    ✅ Import selesai
                </strong>

                <p>
                    Total data:
                    ${hasil.total ?? dataImportWarga.length}
                </p>

                <p>
                    Berhasil:
                    ${hasil.berhasil ?? 0}
                </p>

                <p>
                    Duplikat:
                    ${hasil.duplicate ?? 0}
                </p>

                <p>
                    Gagal:
                    ${hasil.gagal ?? 0}
                </p>

            `;

            statusBox.classList.remove(
                "hidden"
            );

        }


        // ==========================================
        // CEK ERROR PER BARIS
        // ==========================================

        if (
            Array.isArray(
                hasil.errors
            ) &&
            hasil.errors.length > 0
        ) {

            console.warn(
                "DETAIL ERROR IMPORT:",
                hasil.errors
            );

        }


        // ==========================================
        // RESET DATA IMPORT
        // ==========================================

        dataImportWarga = [];


        alert(
            "Import data warga selesai."
        );


        // ==========================================
        // REFRESH DATA WARGA
        // ==========================================

        if (
            typeof muatDataWarga ===
            "function"
        ) {

            await muatDataWarga();

        }


    } catch (error) {

        console.error(
            "IMPORT WARGA ERROR:",
            error
        );

        console.error(
            "ERROR MESSAGE:",
            error?.message
        );

        console.error(
            "ERROR STACK:",
            error?.stack
        );


        tampilkanErrorImport(
            error?.message ||
            "Terjadi kesalahan saat import warga."
        );


        if (statusBox) {

            statusBox.innerHTML = `
                <strong>
                    ❌ Import gagal
                </strong>
            `;

            statusBox.classList.remove(
                "hidden"
            );

        }


    } finally {

        // ==========================================
        // KEMBALIKAN TOMBOL
        // ==========================================

        if (button) {

            button.disabled = false;

            button.textContent =
                "Proses Import";

        }

    }

}
// ==========================================
// UBAH PIN KEPALA KELUARGA
// ==========================================

let residentUbahPinId = null;


// ==========================================
// BUKA MODAL UBAH PIN
// ==========================================

function bukaModalUbahPin(
    residentId,
    nama
) {

    const modal =
        document.getElementById(
            "ubahPinModal"
        );

    const namaBox =
        document.getElementById(
            "ubahPinNama"
        );

    const pinInput =
        document.getElementById(
            "pinBaru"
        );

    const konfirmasiInput =
        document.getElementById(
            "pinBaruKonfirmasi"
        );

    const errorBox =
        document.getElementById(
            "ubahPinError"
        );

    const statusBox =
        document.getElementById(
            "ubahPinStatus"
        );


    if (!modal) {

        console.error(
            "Modal ubah PIN tidak ditemukan."
        );

        return;

    }


    // ==========================================
    // SIMPAN ID WARGA
    // ==========================================

    residentUbahPinId =
        residentId;


    // ==========================================
    // TAMPILKAN NAMA
    // ==========================================

    if (namaBox) {

        namaBox.innerHTML =
            `
                <strong>
                    ${escapeHtml(
                        nama ||
                        "Kepala Keluarga"
                    )}
                </strong>
                <br>
                <small>
                    Masukkan PIN baru untuk akun warga.
                </small>
            `;

    }


    // ==========================================
    // RESET FORM
    // ==========================================

    if (pinInput) {

        pinInput.value = "";

    }


    if (konfirmasiInput) {

        konfirmasiInput.value = "";

    }


    if (errorBox) {

        errorBox.innerHTML = "";

        errorBox.classList.add(
            "hidden"
        );

    }


    if (statusBox) {

        statusBox.innerHTML = "";

        statusBox.classList.add(
            "hidden"
        );

    }


    // ==========================================
    // BUKA MODAL
    // ==========================================

    modal.classList.remove(
        "hidden"
    );


    // ==========================================
    // FOCUS
    // ==========================================

    setTimeout(
        () => {

            if (pinInput) {

                pinInput.focus();

            }

        },
        100
    );

}


// ==========================================
// TUTUP MODAL UBAH PIN
// ==========================================

function tutupModalUbahPin() {

    const modal =
        document.getElementById(
            "ubahPinModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );


    residentUbahPinId =
        null;

}


// ==========================================
// SIMPAN PIN BARU
// ==========================================

async function simpanPinBaru() {

    const button =
        document.getElementById(
            "btnSimpanPin"
        );

    const pinInput =
        document.getElementById(
            "pinBaru"
        );

    const konfirmasiInput =
        document.getElementById(
            "pinBaruKonfirmasi"
        );

    const errorBox =
        document.getElementById(
            "ubahPinError"
        );

    const statusBox =
        document.getElementById(
            "ubahPinStatus"
        );


    // ==========================================
    // RESET PESAN
    // ==========================================

    if (errorBox) {

        errorBox.innerHTML = "";

        errorBox.classList.add(
            "hidden"
        );

    }


    if (statusBox) {

        statusBox.innerHTML = "";

        statusBox.classList.add(
            "hidden"
        );

    }


    // ==========================================
    // CEK RESIDENT ID
    // ==========================================

    if (!residentUbahPinId) {

        tampilkanErrorUbahPin(
            "Data Kepala Keluarga tidak ditemukan."
        );

        return;

    }


    // ==========================================
    // AMBIL PIN
    // ==========================================

    const pin =
        String(
            pinInput?.value ||
            ""
        ).trim();


    const konfirmasi =
        String(
            konfirmasiInput?.value ||
            ""
        ).trim();


    // ==========================================
    // VALIDASI PIN
    // ==========================================

    if (
        !/^\d{4,6}$/.test(
            pin
        )
    ) {

        tampilkanErrorUbahPin(
            "PIN harus terdiri dari 4 sampai 6 digit."
        );

        return;

    }


    // ==========================================
    // KONFIRMASI PIN
    // ==========================================

    if (
        pin !==
        konfirmasi
    ) {

        tampilkanErrorUbahPin(
            "Konfirmasi PIN tidak sama."
        );

        return;

    }


    // ==========================================
    // AMBIL SESSION
    // ==========================================

    let accessToken = null;


    try {

        if (
            typeof supabaseClient !==
            "undefined" &&
            supabaseClient?.auth
        ) {

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (
                !sessionError &&
                sessionData?.session?.access_token
            ) {

                accessToken =
                    sessionData.session.access_token;

            }

        }

    } catch (error) {

        console.warn(
            "Gagal mengambil session Supabase:",
            error
        );

    }


    // ==========================================
    // FALLBACK LOCAL STORAGE
    // ==========================================

    if (!accessToken) {

        accessToken =
            localStorage.getItem(
                "sidat_access_token"
            );

    }


    if (!accessToken) {

        tampilkanErrorUbahPin(
            "Session admin tidak ditemukan. Silakan login kembali."
        );

        return;

    }


    // ==========================================
    // CEK SUPABASE URL
    // ==========================================

    if (
        typeof SUPABASE_URL ===
        "undefined"
    ) {

        tampilkanErrorUbahPin(
            "SUPABASE_URL belum tersedia."
        );

        return;

    }


    // ==========================================
    // LOADING
    // ==========================================

    if (button) {

        button.disabled = true;

        button.textContent =
            "MENYIMPAN...";

    }


    if (statusBox) {

        statusBox.innerHTML =
            `
                <strong>
                    Menyimpan PIN baru...
                </strong>
            `;

        statusBox.classList.remove(
            "hidden"
        );

    }


    try {

        // ==========================================
        // URL EDGE FUNCTION
        // ==========================================

        const functionUrl =
            `${SUPABASE_URL}/functions/v1/reset-resident-pin`;


        console.log(
            "RESET PIN FUNCTION:",
            functionUrl
        );


        console.log(
            "ACCESS TOKEN ADA:",
            !!accessToken
        );


        // ==========================================
        // REQUEST
        // ==========================================

        const response =
            await fetch(
                functionUrl,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            resident_id:
                                residentUbahPinId,

                            pin:
                                pin

                        })

                }
            );


        // ==========================================
        // RESPONSE TEXT
        // ==========================================

        const responseText =
            await response.text();


        console.log(
            "RESET PIN RESPONSE:",
            response.status,
            responseText
        );


        // ==========================================
        // PARSE JSON
        // ==========================================

        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch {

            throw new Error(
                "Response Edge Function bukan JSON: " +
                responseText
            );

        }


        // ==========================================
        // CEK HASIL
        // ==========================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal mengubah PIN."
            );

        }


        // ==========================================
        // BERHASIL
        // ==========================================

        if (statusBox) {

            statusBox.innerHTML =
                `
                    <strong>
                        ✅ PIN berhasil diubah.
                    </strong>

                    <p>
                        PIN baru sudah aktif dan dapat digunakan untuk login.
                    </p>
                `;

        }


        alert(
            "PIN Kepala Keluarga berhasil diubah."
        );


        // ==========================================
        // TUTUP MODAL
        // ==========================================

        tutupModalUbahPin();


    } catch (error) {

        console.error(
            "UBAH PIN ERROR:",
            error
        );


        tampilkanErrorUbahPin(
            error?.message ||
            "Gagal mengubah PIN."
        );


    } finally {

        // ==========================================
        // RESTORE BUTTON
        // ==========================================

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "🔑 Simpan PIN";

        }

    }

}


// ==========================================
// TAMPILKAN ERROR
// ==========================================

function tampilkanErrorUbahPin(
    message
) {

    const errorBox =
        document.getElementById(
            "ubahPinError"
        );


    if (!errorBox) {

        alert(
            message
        );

        return;

    }


    errorBox.innerHTML =
        `
            ❌
            ${escapeHtml(
                message ||
                "Terjadi kesalahan."
            )}
        `;


    errorBox.classList.remove(
        "hidden"
    );

}


// ==========================================
// EXPORT GLOBAL
// ==========================================

window.bukaModalUbahPin =
    bukaModalUbahPin;


window.tutupModalUbahPin =
    tutupModalUbahPin;


window.simpanPinBaru =
    simpanPinBaru;