// ==========================================
// SIDAT
// ADMIN LAPORAN / ADUAN
// SISTEM INFORMASI DATA WARGA
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// SESSION
// ==========================================

const adminAccessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


// ==========================================
// DATA GLOBAL
// ==========================================

let semuaLaporan = [];

let laporanTerpilih = null;


// ==========================================
// ELEMENT
// ==========================================

const laporanContainer =
    document.getElementById(
        "laporanList"
    );

const loadingState =
    document.getElementById(
        "laporanLoading"
    );

const emptyState =
    document.getElementById(
        "laporanEmpty"
    );

const searchInput =
    document.getElementById(
        "searchLaporan"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

const detailModal =
    document.getElementById(
        "detailModal"
    );

const detailContent =
    document.getElementById(
        "detailContent"
    );

const closeDetailButton =
    document.getElementById(
        "closeDetailButton"
    );

// ==========================================
// EVENT FILTER
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterLaporan
    );

}

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterLaporan
    );

}

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterLaporan
    );

}

// ==========================================
// CEK SESSION
// ==========================================

if (
    !adminAccessToken
) {

    console.warn(
        "SIDAT: Session admin tidak ditemukan."
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
// FORMAT TANGGAL
// ==========================================

function formatTanggal(
    tanggal
) {

    if (
        !tanggal
    ) {

        return "-";

    }


    const date =
        new Date(
            tanggal
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "id-ID",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


// ==========================================
// STATUS LABEL
// ==========================================

function statusLabel(
    status
) {

    const value =
        String(
            status || ""
        )
        .toLowerCase();


    if (
        value ===
        "pending"
    ) {

        return "Menunggu";

    }


    if (
        value ===
        "diproses" ||
        value ===
        "proses"
    ) {

        return "Diproses";

    }


    if (
        value ===
        "selesai" ||
        value ===
        "completed"
    ) {

        return "Selesai";

    }




    return status ||
        "Menunggu";

}


// ==========================================
// STATUS CLASS
// ==========================================

function statusClass(
    status
) {

    const value =
        String(
            status || ""
        )
        .toLowerCase();


    if (
        value ===
        "pending"
    ) {

        return "status-pending";

    }


    if (
        value ===
        "diproses" ||
        value ===
        "proses"
    ) {

        return "status-diproses";

    }


    if (
        value ===
        "selesai" ||
        value ===
        "completed"
    ) {

        return "status-selesai";

    }


    return "status-pending";

}


// ==========================================
// SUPABASE REQUEST
// ==========================================

async function supabaseRequestAdmin(
    url,
    options = {}
) {

    const headers = {

        "apikey":
            SUPABASE_KEY,

        "Authorization":
            `Bearer ${adminAccessToken}`,

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };


    if (
        options.headers
    ) {

        Object.assign(
            headers,
            options.headers
        );

    }


    const response =
        await fetch(
            url,
            {

                ...options,

                headers:
                    headers

            }
        );


    const responseText =
        await response.text();


    if (
        !response.ok
    ) {

        console.error(
            "SIDAT SUPABASE ERROR:",
            response.status,
            responseText
        );


        throw new Error(
            responseText ||
            `Supabase Error ${response.status}`
        );

    }


    if (
        !responseText
    ) {

        return null;

    }


    try {

        return JSON.parse(
            responseText
        );

    } catch (
        error
    ) {

        return responseText;

    }

}


// ==========================================
// LOAD SEMUA LAPORAN
// ==========================================

async function loadLaporan() {

    console.log(
        "SIDAT: Mulai mengambil laporan..."
    );


    tampilkanLoading();


    try {

        /*
         * Ambil semua data laporan.
         *
         * Tidak menggunakan nested relation
         * agar tidak tergantung konfigurasi
         * foreign key Supabase.
         */

        const reports =
            await supabaseRequestAdmin(

                `${SUPABASE_URL}/rest/v1/reports` +
                `?select=*` +
                `&order=created_at.desc`

            );


        console.log(
            "SIDAT: Data reports:",
            reports
        );


        if (
            !Array.isArray(
                reports
            )
        ) {

            throw new Error(
                "Response reports bukan array."
            );

        }


        /*
         * Ambil seluruh resident_id
         * yang terdapat dalam laporan.
         */

        const residentIds =
            [
                ...new Set(

                    reports
                        .map(
                            laporan =>
                                laporan.resident_id
                        )
                        .filter(
                            id =>
                                id
                        )

                )
            ];


        let residents = [];


        // ======================================
        // LOAD DATA RESIDENTS
        // ======================================

        if (
            residentIds.length > 0
        ) {

            const encodedIds =
                residentIds
                    .map(
                        id =>
                            `"${id}"`
                    )
                    .join(
                        ","
                    );


            residents =
                await supabaseRequestAdmin(

                    `${SUPABASE_URL}/rest/v1/residents` +
                    `?select=id,resident_code,name` +
                    `&id=in.(${encodedIds})`

                );


            console.log(
                "SIDAT: Data residents:",
                residents
            );

        }


        // ======================================
        // GABUNGKAN DATA
        // ======================================

        semuaLaporan =
            reports.map(
                laporan => {

                    const resident =
                        residents.find(
                            warga =>
                                String(
                                    warga.id
                                ) ===
                                String(
                                    laporan.resident_id
                                )
                        );


                    return {

                        ...laporan,

                        resident_name:
                            resident?.name ||
                            "Warga",

                        resident_code:
                            resident?.resident_code ||
                            "-"

                    };

                }
            );


        console.log(
            "SIDAT: Semua laporan:",
            semuaLaporan
        );


        // ======================================
        // UPDATE FILTER
        // ======================================

        isiFilterKategori();


        // ======================================
        // UPDATE STATISTIK
        // ======================================

        updateStatistik();


        // ======================================
        // TAMPILKAN
        // ======================================

        filterLaporan();


    } catch (
        error
    ) {

        console.error(
            "SIDAT: Gagal memuat laporan:",
            error
        );


        tampilkanErrorLoad(
            error
        );

    }

}


// ==========================================
// LOADING
// ==========================================

function tampilkanLoading() {

    if (
        loadingState
    ) {

        loadingState.classList.remove(
            "hidden"
        );

    }


    if (
        emptyState
    ) {

        emptyState.classList.add(
            "hidden"
        );

    }


    if (
        laporanContainer
    ) {

        laporanContainer.innerHTML =
            "";

    }

}


// ==========================================
// ERROR LOAD
// ==========================================

function tampilkanErrorLoad(
    error
) {

    if (
        loadingState
    ) {

        loadingState.classList.add(
            "hidden"
        );

    }


    if (
        laporanContainer
    ) {

        laporanContainer.innerHTML = `

            <div
                class="laporan-error"
            >

                <div
                    class="laporan-error-icon"
                >
                    ⚠️
                </div>

                <strong>
                    Gagal memuat laporan
                </strong>

                <p>
                    Silakan coba lagi.
                </p>

                <button
                    type="button"
                    class="btn-reload"
                    onclick="loadLaporan()"
                >
                    🔄 Coba Lagi
                </button>

            </div>

        `;

    }


    console.error(
        "SIDAT detail error:",
        error?.message ||
        error
    );

}


// ==========================================
// UPDATE STATISTIK
// ==========================================

// ==========================================
// UPDATE STATISTIK
// ==========================================

function updateStatistik() {

    const total =
        semuaLaporan.length;


    // ======================================
    // MENUNGGU
    // ======================================

    const menunggu =
        semuaLaporan.filter(
            laporan => {

                const status =
                    String(
                        laporan.status ||
                        ""
                    )
                    .toLowerCase();

                return (
                    status ===
                    "pending"
                );

            }
        ).length;


    // ======================================
    // DIPROSES
    // ======================================

    const diproses =
        semuaLaporan.filter(
            laporan => {

                const status =
                    String(
                        laporan.status ||
                        ""
                    )
                    .toLowerCase();

                return (
                    status ===
                    "processing" ||
                    status ===
                    "diproses" ||
                    status ===
                    "proses"
                );

            }
        ).length;


    // ======================================
    // SELESAI
    // ======================================

    const selesai =
        semuaLaporan.filter(
            laporan => {

                const status =
                    String(
                        laporan.status ||
                        ""
                    )
                    .toLowerCase();

                return (
                    status ===
                    "completed" ||
                    status ===
                    "selesai" ||
                    status ===
                    "resolved"
                );

            }
        ).length;


    // ======================================
    // TAMPILKAN STATISTIK
    // ======================================

    setStatistik(
    ["totalLaporan"],
    total
);

setStatistik(
    ["totalPending"],
    menunggu
);

setStatistik(
    ["totalDiproses"],
    diproses
);

setStatistik(
    ["totalSelesai"],
    selesai
);


    console.log(
        "SIDAT STATISTIK LAPORAN:",
        {
            total,
            menunggu,
            diproses,
            selesai
        }
    );

}


// ==========================================
// SET STATISTIK
// ==========================================

function setStatistik(
    ids,
    value
) {

    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (
                element
            ) {

                element.textContent =
                    value;

            }

        }
    );

}


// ==========================================
// FILTER KATEGORI
// ==========================================

function isiFilterKategori() {

    if (
        !categoryFilter
    ) {

        return;

    }


    const nilaiLama =
        categoryFilter.value;


    const kategori =
        [
            ...new Set(

                semuaLaporan
                    .map(
                        laporan =>
                            laporan.category
                    )
                    .filter(
                        kategori =>
                            kategori
                    )

            )
        ]
        .sort();


    categoryFilter.innerHTML = `

        <option value="">
            Semua Kategori
        </option>

    `;


    kategori.forEach(
        kategori => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                kategori;


            option.textContent =
                kategori;


            categoryFilter.appendChild(
                option
            );

        }
    );


    if (
        kategori.includes(
            nilaiLama
        )
    ) {

        categoryFilter.value =
            nilaiLama;

    }

}


// ==========================================
// FILTER LAPORAN
// ==========================================

function filterLaporan() {

    const keyword =
        (
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const status =
        (
            statusFilter?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const kategori =
        (
            categoryFilter?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const hasil =
        semuaLaporan.filter(
            laporan => {

                const teks =
                    [

                        laporan.title,

                        laporan.description,

                        laporan.category,

                        laporan.resident_name,

                        laporan.resident_code

                    ]
                    .filter(
                        Boolean
                    )
                    .join(
                        " "
                    )
                    .toLowerCase();


                const cocokKeyword =
                    !keyword ||
                    teks.includes(
                        keyword
                    );


                const cocokStatus =
                    !status ||
                    String(
                        laporan.status ||
                        ""
                    )
                    .toLowerCase() ===
                    status;


                const cocokKategori =
                    !kategori ||
                    String(
                        laporan.category ||
                        ""
                    )
                    .toLowerCase() ===
                    kategori;


                return (
                    cocokKeyword &&
                    cocokStatus &&
                    cocokKategori
                );

            }
        );


    renderLaporan(
        hasil
    );

}


// ==========================================
// EXPORT GLOBAL SEMENTARA
// ==========================================

window.loadLaporan =
    loadLaporan;


window.filterLaporan =
    filterLaporan;


window.isiFilterKategori =
    isiFilterKategori;


window.updateStatistik =
    updateStatistik;


console.log(
    "SIDAT ADMIN LAPORAN JS AKTIF"
);
// ==========================================
// RENDER LAPORAN
// ==========================================

function renderLaporan(
    data
) {

    // ======================================
    // SEMBUNYIKAN LOADING
    // ======================================

    if (
        loadingState
    ) {

        loadingState.classList.add(
            "hidden"
        );

        loadingState.style.display =
            "none";

    }


    // ======================================
    // TAMPILKAN LIST
    // ======================================

    if (
        laporanContainer
    ) {

        laporanContainer.style.display =
            "block";

    }


    if (
        !laporanContainer
    ) {

        console.error(
            "SIDAT: laporanList tidak ditemukan."
        );

        return;

    }


    // ======================================
    // JIKA KOSONG
    // ======================================

    if (
        !data ||
        data.length === 0
    ) {

        laporanContainer.innerHTML = `

            <div
                class="laporan-kosong"
            >

                <div
                    class="laporan-kosong-icon"
                >
                    📭
                </div>

                <strong>
                    Belum ada laporan
                </strong>

                <p>
                    Tidak ada laporan yang
                    sesuai dengan filter.
                </p>

            </div>

        `;


        if (
            emptyState
        ) {

            emptyState.classList.remove(
                "hidden"
            );

            emptyState.style.display =
                "block";

        }


        return;

    }


    // ======================================
    // SEMBUNYIKAN EMPTY STATE
    // ======================================

    if (
        emptyState
    ) {

        emptyState.classList.add(
            "hidden"
        );

        emptyState.style.display =
            "none";

    }


    // ======================================
    // RENDER DATA
    // ======================================

    laporanContainer.innerHTML =
        data
            .map(
                laporan =>
                    buatKartuLaporan(
                        laporan
                    )
            )
            .join("");


    // ======================================
    // PASTIKAN LOADING TETAP HILANG
    // ======================================

    if (
        loadingState
    ) {

        loadingState.style.display =
            "none";

    }

}


// ==========================================
// BUAT KARTU LAPORAN
// ==========================================

function buatKartuLaporan(
    laporan
) {

    const fotoHTML =
        laporan.photo_url
            ? `

                <div
                    class="laporan-card-photo"
                >

                    <img
                        src="${escapeHTML(
                            laporan.photo_url
                        )}"
                        alt="Foto laporan"
                        loading="lazy"
                        onclick="
                            event.stopPropagation();
                            bukaFotoLaporan(
                                '${escapeHTML(
                                    laporan.photo_url
                                )}'
                            );
                        "
                        onerror="
                            this.parentElement.style.display='none'
                        "
                    >

                </div>

            `
            : "";


    return `

        <article
            class="laporan-card"
            onclick="
                bukaDetailLaporan(
                    '${escapeHTML(
                        laporan.id
                    )}'
                )
            "
        >

            ${fotoHTML}


            <div
                class="laporan-card-body"
            >

                <div
                    class="laporan-card-top"
                >

                    <span
                        class="
                            status
                            ${statusClass(
                                laporan.status
                            )}
                        "
                    >

                        ${escapeHTML(
                            statusLabel(
                                laporan.status
                            )
                        )}

                    </span>


                    <span
                        class="laporan-date"
                    >

                        ${formatTanggal(
                            laporan.created_at
                        )}

                    </span>

                </div>


                <div
                    class="laporan-category"
                >

                    ${escapeHTML(
                        laporan.category ||
                        "Umum"
                    )}

                </div>


                <h3>

                    ${escapeHTML(
                        laporan.title ||
                        "Tanpa judul"
                    )}

                </h3>


                <p
                    class="
                        laporan-description
                    "
                >

                    ${escapeHTML(
                        laporan.description ||
                        "-"
                    )}

                </p>


                <div
                    class="
                        laporan-pelapor
                    "
                >

                    <span>
                        👤
                    </span>


                    <strong>
                        ${escapeHTML(
                            laporan.resident_name ||
                            "Warga"
                        )}
                    </strong>


                    <small>
                        ID:
                        ${escapeHTML(
                            laporan.resident_code ||
                            "-"
                        )}
                    </small>

                </div>


                <button
                    type="button"
                    class="btn-detail"
                    onclick="
                        event.stopPropagation();
                        bukaDetailLaporan(
                            '${escapeHTML(
                                laporan.id
                            )}'
                        );
                    "
                >

                    👁
                    Lihat Detail

                </button>

            </div>

        </article>

    `;

}


// ==========================================
// DETAIL LAPORAN
// ==========================================

function bukaDetailLaporan(
    id
) {

    const laporan =
        semuaLaporan.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    // ======================================
    // CEK DATA
    // ======================================

    if (
        !laporan
    ) {

        console.error(
            "SIDAT: Laporan tidak ditemukan:",
            id
        );

        return;

    }


    // ======================================
    // SIMPAN LAPORAN TERPILIH
    // ======================================

    laporanTerpilih =
        laporan;


    console.log(
        "SIDAT: Buka detail laporan:",
        laporan
    );


    // ======================================
    // CEK MODAL
    // ======================================

    if (
        !detailModal
    ) {

        console.error(
            "SIDAT: detailModal tidak ditemukan."
        );

        return;

    }


    // ======================================
    // DETAIL CONTENT
    // ======================================

    if (
        detailContent
    ) {


        // ==================================
        // FOTO
        // ==================================

        const fotoHTML =
            laporan.photo_url

                ? `

                    <div
                        class="detail-photo"
                    >

                        <img
                            src="${escapeHTML(
                                laporan.photo_url
                            )}"
                            alt="Foto bukti laporan"
                            onclick="
                                bukaFotoLaporan(
                                    '${escapeHTML(
                                        laporan.photo_url
                                    )}'
                                )
                            "
                            onerror="
                                this.parentElement.style.display='none'
                            "
                        >

                    </div>

                `

                : `

                    <div
                        class="detail-no-photo"
                    >

                        📷

                        <span>
                            Tidak ada foto bukti
                        </span>

                    </div>

                `;


        // ==================================
        // TANGGAPAN ADMIN
        // ==================================

        const adminNoteHTML =
            laporan.admin_note

                ? `

                    <div
                        class="
                            detail-section
                            admin-note
                        "
                    >

                        <div
                            class="detail-label"
                        >

                            💬
                            Tanggapan Admin

                        </div>

                        <p>

                            ${escapeHTML(
                                laporan.admin_note
                            )}

                        </p>

                    </div>

                `

                : `

                    <div
                        class="
                            detail-section
                            admin-note
                            empty-note
                        "
                    >

                        <div
                            class="detail-label"
                        >

                            💬
                            Tanggapan Admin

                        </div>

                        <p>

                            Belum ada tanggapan
                            dari admin.

                        </p>

                    </div>

                `;


        // ==================================
        // ISI DETAIL
        // ==================================

        detailContent.innerHTML = `

            ${fotoHTML}


            <!-- ==========================
                 PELAPOR
            =========================== -->

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Pelapor
                </div>

                <strong>

                    👤

                    ${escapeHTML(
                        laporan.resident_name ||
                        "Warga"
                    )}

                </strong>

                <small>

                    ID:

                    ${escapeHTML(
                        laporan.resident_code ||
                        "-"
                    )}

                </small>

            </div>


            <!-- ==========================
                 KATEGORI
            =========================== -->

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Kategori
                </div>

                <strong>

                    ${escapeHTML(
                        laporan.category ||
                        "-"
                    )}

                </strong>

            </div>


            <!-- ==========================
                 JUDUL
            =========================== -->

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Judul
                </div>

                <strong>

                    ${escapeHTML(
                        laporan.title ||
                        "-"
                    )}

                </strong>

            </div>


            <!-- ==========================
                 ISI LAPORAN
            =========================== -->

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Isi Laporan
                </div>

                <p
                    class="detail-description"
                >

                    ${escapeHTML(
                        laporan.description ||
                        "-"
                    )}

                </p>

            </div>


            <!-- ==========================
                 STATUS SAAT INI
            =========================== -->

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Status Saat Ini
                </div>

                <span
                    class="
                        status
                        ${statusClass(
                            laporan.status
                        )}
                    "
                >

                    ${escapeHTML(
                        statusLabel(
                            laporan.status
                        )
                    )}

                </span>

            </div>


            <!-- ==========================
                 TANGGAL
            =========================== -->

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Tanggal Laporan
                </div>

                <strong>

                    ${formatTanggal(
                        laporan.created_at
                    )}

                </strong>

            </div>


            ${adminNoteHTML}

        `;

    }


    // ======================================
    // ISI FORM ADMIN
    // ======================================

    const detailStatus =
        document.getElementById(
            "detailStatus"
        );


    const detailAdminNote =
        document.getElementById(
            "detailAdminNote"
        );


    // ======================================
    // STATUS
    // ======================================

// ======================================
// STATUS
// ======================================

if (detailStatus) {

    const status =
        String(
            laporan.status ||
            "pending"
        ).toLowerCase();


    if (
        status === "processing" ||
        status === "diproses" ||
        status === "proses"
    ) {

        detailStatus.value =
            "processing";

    }

    else if (
        status === "completed" ||
        status === "resolved" ||
        status === "selesai"
    ) {

        detailStatus.value =
            "completed";

    }

    else {

        detailStatus.value =
            "pending";

    }

}


    // ======================================
    // TANGGAPAN ADMIN
    // ======================================

    if (
        detailAdminNote
    ) {

        detailAdminNote.value =
            laporan.admin_note ||
            "";

    }


    // ======================================
    // TAMPILKAN MODAL
    // ======================================

    detailModal.classList.remove(
        "hidden"
    );


    detailModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    // ======================================
    // FOCUS STATUS
    // ======================================

    setTimeout(
        () => {

            if (
                detailStatus
            ) {

                detailStatus.focus();

            }

        },
        100
    );

}


// ==========================================
// FOTO LAPORAN
// ==========================================

function bukaFotoLaporan(
    url
) {

    if (
        !url
    ) {

        return;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "foto-preview-modal";


    modal.innerHTML = `

        <div
            class="foto-preview-overlay"
        ></div>


        <div
            class="foto-preview-box"
        >

            <button
                type="button"
                class="foto-preview-close"
                aria-label="Tutup foto"
            >
                ×
            </button>


            <img
                src="${escapeHTML(
                    url
                )}"
                alt="Foto laporan"
            >

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const close =
        modal.querySelector(
            ".foto-preview-close"
        );


    const overlay =
        modal.querySelector(
            ".foto-preview-overlay"
        );


    close?.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );


    overlay?.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                modal.remove();

            }

        }
    );

}


// ==========================================
// TUTUP DETAIL
// ==========================================

function tutupDetail() {

    if (
        detailModal
    ) {

        detailModal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );


    laporanTerpilih =
        null;

}
// ==========================================
// SIMPAN PERUBAHAN LAPORAN
// ==========================================

async function simpanPerubahanLaporan() {

    if (!laporanTerpilih) {

        console.error(
            "SIDAT: Tidak ada laporan yang dipilih."
        );

        return;

    }


    // ======================================
    // AMBIL INPUT DARI HTML
    // ======================================

    const statusInput =
        document.getElementById(
            "detailStatus"
        );


    const noteInput =
        document.getElementById(
            "detailAdminNote"
        );


    const saveButton =
        document.getElementById(
            "saveReportButton"
        );


    // ======================================
    // CEK ELEMENT
    // ======================================

    if (!statusInput) {

        console.error(
            "SIDAT: #detailStatus tidak ditemukan."
        );

        tampilkanNotifikasi(
            "Elemen status laporan tidak ditemukan.",
            "error"
        );

        return;

    }


    if (!noteInput) {

        console.error(
            "SIDAT: #detailAdminNote tidak ditemukan."
        );

        tampilkanNotifikasi(
            "Elemen tanggapan admin tidak ditemukan.",
            "error"
        );

        return;

    }


    // ======================================
    // AMBIL NILAI
    // ======================================

    const status =
        statusInput.value ||
        "pending";


    const adminNote =
        noteInput.value.trim() ||
        "";


    console.log(
        "SIDAT: Menyimpan perubahan:",
        {
            id:
                laporanTerpilih.id,

            status:
                status,

            admin_note:
                adminNote
        }
    );


    // ======================================
    // VALIDASI STATUS
    // ======================================

    const statusValid = [
        "pending",
        "processing",
        "completed",
    ];


    if (
        !statusValid.includes(
            status
        )
    ) {

        tampilkanNotifikasi(
            "Status laporan tidak valid.",
            "error"
        );

        return;

    }


    try {

        // ==================================
        // TOMBOL LOADING
        // ==================================

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "⏳ Menyimpan...";

        }


        // ==================================
        // UPDATE SUPABASE
        // ==================================

        const hasil =
            await supabaseRequestAdmin(

                `${SUPABASE_URL}/rest/v1/reports` +
                `?id=eq.${encodeURIComponent(
                    laporanTerpilih.id
                )}`,

                {

                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=representation"

                    },

                    body:
                        JSON.stringify({

                            status:
                                status,

                            admin_note:
                                adminNote,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })

                }

            );


        console.log(
            "SIDAT: Perubahan laporan berhasil:",
            hasil
        );
        // ==========================================
// NOTIFIKASI LAPORAN BARU
// SEMUA WARGA + ADMIN
// ==========================================

try {

    const notificationPayload = {

        title:
            "📢 Laporan Baru",

        message:
            `Warga mengirim laporan baru: "${title}".`,

        target_type:
            "all",

        target_resident_id:
            null,

        is_read:
            false,

        created_by:
            null,

        created_at:
            new Date().toISOString()

    };


    console.log(
        "SIDAT: Membuat notifikasi laporan baru:",
        notificationPayload
    );


    const notificationResponse =
        await supabaseRequest(

            `${SUPABASE_URL}/rest/v1/notifications`,

            {

                method:
                    "POST",

                headers: {

                    "Prefer":
                        "return=minimal"

                },

                body:
                    JSON.stringify(
                        notificationPayload
                    )

            }

        );


    console.log(
        "SIDAT: Notifikasi laporan baru berhasil dibuat:",
        notificationResponse
    );


}
catch (
    notificationError
) {

    console.error(
        "SIDAT: Gagal membuat notifikasi laporan baru:",
        notificationError
    );

}

// ==========================================
// BUAT NOTIFIKASI UNTUK WARGA
// ==========================================

try {

    const statusText = {

    pending:
        "Menunggu",

    processing:
        "Diproses",

    completed:
        "Selesai"

};


    const namaStatus =
        statusText[status] ||
        status;


    const judulLaporan =
        laporanTerpilih.title ||
        "Laporan warga";


    let pesan =
        `Laporan "${judulLaporan}" ` +
        `telah diperbarui menjadi ` +
        `"${namaStatus}".`;


    if (
        adminNote
    ) {

        pesan +=
            ` Tanggapan admin: ${adminNote}`;

    }


    const notificationPayload = {

        title:
            "📢 Laporan Diperbarui",

        message:
            pesan,

        target_type:
            "resident",

        target_resident_id:
            laporanTerpilih.resident_id,

        is_read:
            false,

        created_by:
            window.currentUser?.id ||
            null,

        created_at:
            new Date().toISOString()

    };


    console.log(
        "SIDAT: Membuat notifikasi:",
        notificationPayload
    );


    await supabaseRequestAdmin(

        `${SUPABASE_URL}/rest/v1/notifications`,

        {

            method:
                "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "Prefer":
                    "return=minimal"

            },

            body:
                JSON.stringify(
                    notificationPayload
                )

        }

    );


    console.log(
        "SIDAT: Notifikasi berhasil dibuat."
    );

}

catch (
    notificationError
) {

    console.error(
        "SIDAT: Gagal membuat notifikasi:",
        notificationError
    );

}


        // ==================================
        // UPDATE DATA LOKAL
        // ==================================

        const index =
            semuaLaporan.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        laporanTerpilih.id
                    )
            );


        if (
            index !== -1
        ) {

            semuaLaporan[index] = {

                ...semuaLaporan[index],

                status:
                    status,

                admin_note:
                    adminNote,

                updated_at:
                    new Date()
                        .toISOString()

            };


            laporanTerpilih =
                semuaLaporan[index];

        }


        // ==================================
        // UPDATE STATISTIK
        // ==================================

        updateStatistik();


        // ==================================
        // UPDATE LIST
        // ==================================

        filterLaporan();


        // ==================================
        // PESAN BERHASIL
        // ==================================

        tampilkanNotifikasi(
            "Perubahan laporan berhasil disimpan.",
            "success"
        );


        // ==================================
        // TUTUP MODAL
        // ==================================

        tutupDetail();


    }

    catch (
        error
    ) {

        console.error(
            "SIDAT: Gagal menyimpan perubahan laporan:",
            error
        );


        tampilkanNotifikasi(
            "Gagal menyimpan perubahan laporan.",
            "error"
        );

    }

    finally {

        // ================================
        // KEMBALIKAN TOMBOL
        // ================================

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Simpan Perubahan";

        }

    }

}


// ==========================================
// HAPUS LAPORAN
// ==========================================

async function hapusLaporan() {

    if (
        !laporanTerpilih
    ) {

        return;

    }


    const yakin =
        window.confirm(

            "Hapus laporan ini?\n\n" +
            "Data yang sudah dihapus tidak dapat dikembalikan."

        );


    if (
        !yakin
    ) {

        return;

    }


    const deleteButton =
        document.querySelector(
            ".detail-admin-actions .btn-delete"
        );


    try {

        if (
            deleteButton
        ) {

            deleteButton.disabled =
                true;

            deleteButton.textContent =
                "⏳ Menghapus...";

        }


        await supabaseRequestAdmin(

            `${SUPABASE_URL}/rest/v1/reports` +
            `?id=eq.${encodeURIComponent(
                laporanTerpilih.id
            )}`,

            {

                method:
                    "DELETE"

            }

        );


        const id =
            laporanTerpilih.id;


        semuaLaporan =
            semuaLaporan.filter(
                item =>
                    String(
                        item.id
                    ) !==
                    String(
                        id
                    )
            );


        laporanTerpilih =
            null;


        tutupDetail();


        updateStatistik();


        filterLaporan();


        tampilkanNotifikasi(
            "Laporan berhasil dihapus.",
            "success"
        );


    } catch (
        error
    ) {

        console.error(
            "SIDAT: Gagal menghapus laporan:",
            error
        );


        tampilkanNotifikasi(
            "Gagal menghapus laporan.",
            "error"
        );


        if (
            deleteButton
        ) {

            deleteButton.disabled =
                false;

            deleteButton.textContent =
                "🗑 Hapus";

        }

    }

}


// ==========================================
// NOTIFIKASI
// ==========================================

function tampilkanNotifikasi(
    pesan,
    tipe = "success"
) {

    let element =
        document.getElementById(
            "actionMessage"
        );


    if (
        !element
    ) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "actionMessage";


        document.body.appendChild(
            element
        );

    }


    element.className =
        `action-message ${tipe}`;


    element.textContent =
        pesan;


    element.classList.add(
        "show"
    );


    clearTimeout(
        element._timer
    );


    element._timer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            3000
        );

}


// ==========================================
// RESET FILTER
// ==========================================

function resetFilterLaporan() {

    if (
        searchInput
    ) {

        searchInput.value =
            "";

    }


    if (
        statusFilter
    ) {

        statusFilter.value =
            "";

    }


    if (
        categoryFilter
    ) {

        categoryFilter.value =
            "";

    }


    filterLaporan();

}


// ==========================================
// EVENT SEARCH
// ==========================================

if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        filterLaporan
    );

}


// ==========================================
// EVENT STATUS
// ==========================================

if (
    statusFilter
) {

    statusFilter.addEventListener(
        "change",
        filterLaporan
    );

}


// ==========================================
// EVENT KATEGORI
// ==========================================

if (
    categoryFilter
) {

    categoryFilter.addEventListener(
        "change",
        filterLaporan
    );

}


// ==========================================
// EVENT RESET
// ==========================================

const resetFilterButton =
    document.getElementById(
        "resetFilter"
    );


if (
    resetFilterButton
) {

    resetFilterButton.addEventListener(
        "click",
        resetFilterLaporan
    );

}


// ==========================================
// EVENT TUTUP MODAL
// ==========================================

if (
    closeDetailButton
) {

    closeDetailButton.addEventListener(
        "click",
        tutupDetail
    );

}


// ==========================================
// TUTUP DENGAN ESC
// ==========================================

document.addEventListener(
    "keydown",
    function (
        event
    ) {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                detailModal &&
                !detailModal.classList.contains(
                    "hidden"
                )
            ) {

                tutupDetail();

            }

        }

    }
);


// ==========================================
// EXPORT GLOBAL
// ==========================================

window.renderLaporan =
    renderLaporan;


window.buatKartuLaporan =
    buatKartuLaporan;


window.bukaDetailLaporan =
    bukaDetailLaporan;


window.bukaFotoLaporan =
    bukaFotoLaporan;


window.tutupDetail =
    tutupDetail;


window.simpanPerubahanLaporan =
    simpanPerubahanLaporan;


window.hapusLaporan =
    hapusLaporan;


window.tampilkanNotifikasi =
    tampilkanNotifikasi;


window.resetFilterLaporan =
    resetFilterLaporan;


console.log(
    "SIDAT: Bagian 2 admin-laporan.js aktif."
);
// ==========================================
// START ADMIN LAPORAN
// ==========================================

function initAdminLaporan() {

    console.log(
        "SIDAT: INIT ADMIN LAPORAN"
    );


    // ======================================
    // CEK SUPABASE CONFIG
    // ======================================

    if (
        typeof SUPABASE_URL ===
            "undefined" ||
        typeof SUPABASE_KEY ===
            "undefined"
    ) {

        console.error(
            "SIDAT: SUPABASE_URL atau SUPABASE_KEY tidak tersedia."
        );

        if (
            loadingState
        ) {

            loadingState.classList.add(
                "hidden"
            );

        }

        if (
            laporanContainer
        ) {

            laporanContainer.innerHTML = `

                <div
                    class="laporan-error"
                >

                    <div>
                        ⚠️
                    </div>

                    <strong>
                        Konfigurasi Supabase tidak ditemukan
                    </strong>

                    <p>
                        Periksa supabase-config.js
                    </p>

                </div>

            `;

        }

        return;

    }


    // ======================================
    // LOAD LAPORAN
    // ======================================

    loadLaporan();

}


// ==========================================
// DOM READY
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAdminLaporan
    );

} else {

    initAdminLaporan();

}


// ==========================================
// EXPORT
// ==========================================

window.initAdminLaporan =
    initAdminLaporan;


console.log(
    "SIDAT: ADMIN LAPORAN SIAP."
);