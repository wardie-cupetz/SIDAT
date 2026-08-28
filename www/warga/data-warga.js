// ==========================================
// SIDAT
// DATA WARGA - AKUN WARGA
// Sistem Data Warga
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
// DATA
// ==========================================

let semuaKeluarga = [];

let hasilPencarian = [];


// ==========================================
// ELEMENT
// ==========================================

const residentList =
    document.getElementById(
        "residentList"
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

const totalWarga =
    document.getElementById(
        "totalWarga"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );


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
// FORMAT NOMOR HP
// ==========================================

function formatPhone(
    phone
) {

    if (
        phone === null ||
        phone === undefined
    ) {

        return "-";

    }


    const value =
        String(
            phone
        ).trim();


    if (!value) {

        return "-";

    }


    return value;

}


// ==========================================
// NORMALISASI MEMBERS
// ==========================================

function normalisasiMembers(
    members
) {

    // RPC mengembalikan members
    // sebagai JSON array.
    //
    // Tetapi untuk keamanan kita cek
    // beberapa kemungkinan format.

    if (
        Array.isArray(
            members
        )
    ) {

        return members;

    }


    if (
        typeof members ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    members
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed;

            }

        } catch (error) {

            console.warn(
                "Members bukan JSON valid:",
                members
            );

        }

    }


    return [];

}


// ==========================================
// LOAD DATA WARGA
// ==========================================

async function muatDataWarga() {

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (residentList) {

        residentList.innerHTML =
            "";

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }


    try {

        // ==================================
        // CEK SESSION
        // ==================================

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            throw new Error(
                "Session login warga tidak ditemukan."
            );

        }


        // ==================================
        // PANGGIL RPC
        // ==================================

        const response =
            await fetch(

                `${SUPABASE_URL}/rest/v1/rpc/get_public_residents`,

                {

                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({})

                }

            );


        // ==================================
        // CEK RESPONSE
        // ==================================

        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "GET PUBLIC RESIDENTS ERROR:",
                errorText
            );


            throw new Error(
                errorText ||
                `Gagal mengambil data warga (${response.status}).`
            );

        }


        const data =
            await response.json();


        console.log(
            "DATA RPC WARGA:",
            data
        );


        // ==================================
        // VALIDASI
        // ==================================

        if (
            !Array.isArray(
                data
            )
        ) {

            throw new Error(
                "Format data warga tidak valid."
            );

        }


        // ==================================
        // SIMPAN DATA KELUARGA
        // ==================================

        semuaKeluarga =
            data
            .map(
                keluarga => {

                    return {

                        family_id:
                            keluarga.family_id ||
                            null,

                        members:
                            normalisasiMembers(
                                keluarga.members
                            )

                    };

                }
            )
            .filter(
                keluarga =>
                    keluarga.members.length >
                    0
            );


        // ==================================
        // HITUNG TOTAL WARGA
        // ==================================

        let jumlah =
            0;


        semuaKeluarga.forEach(
            keluarga => {

                jumlah +=
                    keluarga.members.length;

            }
        );


        if (totalWarga) {

            totalWarga.textContent =
                jumlah;

        }


        // ==================================
        // HASIL AWAL
        // ==================================

        hasilPencarian =
            [...semuaKeluarga];


        tampilkanDaftarWarga();


    } catch (error) {

        console.error(
            "Gagal memuat data warga:",
            error
        );


        if (errorMessage) {

            errorMessage.textContent =
                error.message ||
                "Terjadi kesalahan saat mengambil data warga.";

        }


        if (errorState) {

            errorState.classList.remove(
                "hidden"
            );

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
// DAPATKAN NAMA KEPALA
// ==========================================
//
// RPC saat ini hanya mengembalikan:
// name + phone.
//
// Jadi kepala keluarga ditentukan
// dari urutan pertama member.
//

function dapatkanNamaKepala(
    members
) {

    if (
        !members ||
        members.length === 0
    ) {

        return "Keluarga";

    }


    return (
        members[0]?.name ||
        "Keluarga"
    );

}


// ==========================================
// TAMPILKAN DAFTAR
// ==========================================

function tampilkanDaftarWarga() {

    if (!residentList) {

        return;

    }


    residentList.innerHTML =
        "";


    if (
        !hasilPencarian ||
        hasilPencarian.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    hasilPencarian.forEach(
        keluarga => {

            residentList
                .insertAdjacentHTML(
                    "beforeend",
                    buatKartuKeluarga(
                        keluarga
                    )
                );

        }
    );

}


// ==========================================
// BUAT KARTU KELUARGA
// ==========================================

function buatKartuKeluarga(
    keluarga
) {

    if (!keluarga) {

        return "";

    }


    const members =
        normalisasiMembers(
            keluarga.members
        );


    if (
        members.length === 0
    ) {

        return "";

    }


    const namaKepala =
        dapatkanNamaKepala(
            members
        );


    const jumlahAnggota =
        members.length;


    // ======================================
    // DAFTAR ANGGOTA
    // ======================================

    const anggotaHTML =
        members
        .map(
            member => {

                const nama =
                    member?.name ||
                    "Tanpa Nama";


                const phone =
                    formatPhone(
                        member?.phone
                    );


                let phoneHTML =
                    "";


                if (
                    phone !== "-"
                ) {

                    phoneHTML = `

                        <a
                            href="tel:${escapeHTML(
                                phone
                            )}"
                            class="member-phone"
                            onclick="event.stopPropagation()"
                        >

                            📱
                            ${escapeHTML(
                                phone
                            )}

                        </a>

                    `;

                } else {

                    phoneHTML = `

                        <span
                            class="member-phone"
                        >

                            📱 -

                        </span>

                    `;

                }


                return `

                    <div
                        class="member-item"
                    >

                        <div
                            class="member-avatar"
                        >

                            👤

                        </div>


                        <div
                            class="member-info"
                        >

                            <span
                                class="member-name"
                            >

                                ${escapeHTML(
                                    nama
                                )}

                            </span>

                        </div>


                        ${phoneHTML}

                    </div>

                `;

            }
        )
        .join("");


    // ======================================
    // LABEL JUMLAH
    // ======================================

    const labelJumlah =
        jumlahAnggota === 1
            ? "1 orang"
            : `${jumlahAnggota} anggota`;


    // ======================================
    // CARD
    // ======================================

    return `

        <article
            class="family-card"
        >

            <div
                class="family-header"
            >

                <div
                    class="family-title"
                >

                    <strong>

                        ${escapeHTML(
                            namaKepala
                        )}

                    </strong>

                    <span>
                        Kepala Keluarga
                    </span>

                </div>


                <span
                    class="family-badge"
                >

                    ${labelJumlah}

                </span>

            </div>


            <div
                class="member-list"
            >

                ${anggotaHTML}

            </div>

        </article>

    `;

}


// ==========================================
// PENCARIAN
// ==========================================

function lakukanPencarian() {

    if (!searchInput) {

        return;

    }


    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    if (clearSearch) {

        if (keyword) {

            clearSearch.classList.remove(
                "hidden"
            );

        } else {

            clearSearch.classList.add(
                "hidden"
            );

        }

    }


    // ======================================
    // KOSONG
    // ======================================

    if (!keyword) {

        hasilPencarian =
            [...semuaKeluarga];

        tampilkanDaftarWarga();

        return;

    }


    // ======================================
    // CARI NAMA ANGGOTA
    // ======================================

    hasilPencarian =
        semuaKeluarga.filter(
            keluarga => {

                const members =
                    normalisasiMembers(
                        keluarga.members
                    );


                return members.some(
                    member => {

                        const nama =
                            String(
                                member?.name ||
                                ""
                            )
                            .toLowerCase();


                        return nama.includes(
                            keyword
                        );

                    }
                );

            }
        );


    tampilkanDaftarWarga();

}


// ==========================================
// BERSIHKAN PENCARIAN
// ==========================================

function bersihkanPencarian() {

    if (!searchInput) {

        return;

    }


    searchInput.value =
        "";


    hasilPencarian =
        [...semuaKeluarga];


    if (clearSearch) {

        clearSearch.classList.add(
            "hidden"
        );

    }


    tampilkanDaftarWarga();


    searchInput.focus();

}


// ==========================================
// KEMBALI
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// EVENT SEARCH
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        lakukanPencarian
    );

}


// ==========================================
// EXPORT
// ==========================================

window.muatDataWarga =
    muatDataWarga;

window.bersihkanPencarian =
    bersihkanPencarian;

window.lakukanPencarian =
    lakukanPencarian;

window.kembaliDashboard =
    kembaliDashboard;


// ==========================================
// START
// ==========================================

muatDataWarga();