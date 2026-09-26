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
// SVG
// ==========================================

const SVG_USER = `
<svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    aria-hidden="true"
    style="
        width:14px;
        height:14px;
        min-width:14px;
        min-height:14px;
        max-width:14px;
        max-height:14px;
        flex:0 0 14px;
        display:block;
    "
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
>
    <circle
        cx="12"
        cy="8"
        r="3"
    ></circle>
    <path
        d="M5 20a7 7 0 0 1 14 0"
    ></path>
</svg>
`;

const SVG_EYE = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
    ></path>
    <circle
        cx="12"
        cy="12"
        r="2.5"
    ></circle>
</svg>
`;


const SVG_CAMERA = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        d="M4 7h3l1.5-2h7L17 7h3v12H4z"
    ></path>
    <circle
        cx="12"
        cy="13"
        r="3.5"
    ></circle>
</svg>
`;


const SVG_COMMENT = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h-.5A2.5 2.5 0 0 1 3 14.5v-9"
    ></path>
</svg>
`;


const SVG_SAVE = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        d="M5 4h12l2 2v14H5z"
    ></path>
    <path
        d="M8 4v6h8V4"
    ></path>
    <path
        d="M8 16h8"
    ></path>
</svg>
`;


const SVG_RELOAD = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path d="M20 11a8 8 0 0 0-14.9-4"></path>
    <path d="M5 3v4h4"></path>
    <path d="M4 13a8 8 0 0 0 14.9 4"></path>
    <path d="M19 21v-4h-4"></path>
</svg>
`;


const SVG_WARNING = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        d="M12 3 2.8 20h18.4L12 3Z"
    ></path>
    <path d="M12 9v5"></path>
    <path d="M12 17.5v.1"></path>
</svg>
`;


const SVG_INBOX = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path d="M4 5h16v14H4z"></path>
    <path d="M4 14h4l1.5 2h5L16 14h4"></path>
</svg>
`;


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

if (!adminAccessToken) {

    console.warn(
        "SIDAT: Session admin tidak ditemukan."
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatTanggal(tanggal) {

    if (!tanggal) {
        return "-";
    }

    const date =
        new Date(tanggal);

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
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==========================================
// STATUS LABEL
// ==========================================

function statusLabel(status) {

    const value =
        String(
            status || ""
        ).toLowerCase();

    if (value === "pending") {
        return "Menunggu";
    }

    if (
        value === "diproses" ||
        value === "proses" ||
        value === "processing"
    ) {
        return "Diproses";
    }

    if (
        value === "selesai" ||
        value === "completed" ||
        value === "resolved"
    ) {
        return "Selesai";
    }

    return status || "Menunggu";

}


// ==========================================
// STATUS CLASS
// ==========================================

function statusClass(status) {

    const value =
        String(
            status || ""
        ).toLowerCase();

    if (value === "pending") {
        return "status-pending";
    }

    if (
        value === "diproses" ||
        value === "proses" ||
        value === "processing"
    ) {
        return "status-diproses";
    }

    if (
        value === "selesai" ||
        value === "completed" ||
        value === "resolved"
    ) {
        return "status-selesai";
    }

    return "status-pending";

}


// ==========================================
// SUPABASE REQUEST ADMIN
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


    if (options.headers) {

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
                headers
            }
        );


    const responseText =
        await response.text();


    if (!response.ok) {

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


    if (!responseText) {
        return null;
    }


    try {

        return JSON.parse(
            responseText
        );

    } catch (error) {

        return responseText;

    }

}


// ==========================================
// LOAD LAPORAN
// ==========================================

async function loadLaporan() {

    tampilkanLoading();

    try {

        const reports =
            await supabaseRequestAdmin(

                `${SUPABASE_URL}/rest/v1/reports` +
                `?select=*` +
                `&order=created_at.desc`

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


        if (
            residentIds.length > 0
        ) {

            const encodedIds =
                residentIds
                    .map(
                        id =>
                            `"${id}"`
                    )
                    .join(",");


            residents =
                await supabaseRequestAdmin(

                    `${SUPABASE_URL}/rest/v1/residents` +
                    `?select=id,resident_code,name` +
                    `&id=in.(${encodedIds})`

                );

        }


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


        isiFilterKategori();

        updateStatistik();

        filterLaporan();


    } catch (error) {

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

    if (loadingState) {

        loadingState.classList.remove(
            "hidden"
        );

        loadingState.style.display =
            "block";

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

        emptyState.style.display =
            "none";

    }


    if (laporanContainer) {

        laporanContainer.innerHTML =
            "";

    }

}


// ==========================================
// ERROR LOAD
// ==========================================

function tampilkanErrorLoad(error) {

    if (loadingState) {

        loadingState.classList.add(
            "hidden"
        );

        loadingState.style.display =
            "none";

    }


    if (laporanContainer) {

        laporanContainer.innerHTML = `

            <div class="laporan-error">

                <div class="laporan-error-icon">
                    ${SVG_WARNING}
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
                    ${SVG_RELOAD}
                    Coba Lagi
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

function updateStatistik() {

    const total =
        semuaLaporan.length;


    const menunggu =
        semuaLaporan.filter(
            laporan =>
                String(
                    laporan.status ||
                    ""
                ).toLowerCase() ===
                "pending"
        ).length;


    const diproses =
        semuaLaporan.filter(
            laporan => {

                const status =
                    String(
                        laporan.status ||
                        ""
                    ).toLowerCase();

                return (
                    status === "processing" ||
                    status === "diproses" ||
                    status === "proses"
                );

            }
        ).length;


    const selesai =
        semuaLaporan.filter(
            laporan => {

                const status =
                    String(
                        laporan.status ||
                        ""
                    ).toLowerCase();

                return (
                    status === "completed" ||
                    status === "selesai" ||
                    status === "resolved"
                );

            }
        ).length;


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

            if (element) {

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

    if (!categoryFilter) {
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
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const cocokKeyword =
                    !keyword ||
                    teks.includes(
                        keyword
                    );


                const laporanStatus =
                    String(
                        laporan.status ||
                        ""
                    )
                    .toLowerCase();


                const cocokStatus =
                    !status ||
                    laporanStatus ===
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
// RENDER LAPORAN
// ==========================================

function renderLaporan(data) {

    if (loadingState) {

        loadingState.classList.add(
            "hidden"
        );

        loadingState.style.display =
            "none";

    }


    if (!laporanContainer) {

        console.error(
            "SIDAT: laporanList tidak ditemukan."
        );

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        laporanContainer.innerHTML = `

            <div class="laporan-kosong">

                <div class="laporan-kosong-icon">
                    ${SVG_INBOX}
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


        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

            emptyState.style.display =
                "block";

        }


        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

        emptyState.style.display =
            "none";

    }


    laporanContainer.innerHTML =
        data
            .map(
                laporan =>
                    buatKartuLaporan(
                        laporan
                    )
            )
            .join("");

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

                <div class="laporan-card-photo">

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

            <div class="laporan-card-body">

                <div class="laporan-card-top">

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

                    <span class="laporan-date">
                        ${formatTanggal(
                            laporan.created_at
                        )}
                    </span>

                </div>


                <div class="laporan-category">
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


                <p class="laporan-description">
                    ${escapeHTML(
                        laporan.description ||
                        "-"
                    )}
                </p>


                <div class="laporan-pelapor">

                    ${SVG_USER}

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

                    ${SVG_EYE}

                    Lihat Detail

                </button>

            </div>

        </article>

    `;

}


// ==========================================
// DETAIL LAPORAN
// ==========================================

function bukaDetailLaporan(id) {

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


    if (!laporan) {

        console.error(
            "SIDAT: Laporan tidak ditemukan:",
            id
        );

        return;

    }


    laporanTerpilih =
        laporan;


    if (!detailModal) {

        console.error(
            "SIDAT: detailModal tidak ditemukan."
        );

        return;

    }


    if (detailContent) {

        const fotoHTML =
            laporan.photo_url

                ? `

                    <div class="detail-photo">

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

                    <div class="detail-no-photo">

                        ${SVG_CAMERA}

                        <span>
                            Tidak ada foto bukti
                        </span>

                    </div>

                `;


        const adminNoteHTML =
            laporan.admin_note

                ? `

                    <div
                        class="
                            detail-section
                            admin-note
                        "
                    >

                        <div class="detail-label">
                            ${SVG_COMMENT}
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

                        <div class="detail-label">
                            ${SVG_COMMENT}
                            Tanggapan Admin
                        </div>

                        <p>
                            Belum ada tanggapan
                            dari admin.
                        </p>

                    </div>

                `;


        detailContent.innerHTML = `

            ${fotoHTML}


            <div class="detail-section">

                <div class="detail-label">
                    Pelapor
                </div>

                <strong>
                    ${SVG_USER}

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


            <div class="detail-section">

                <div class="detail-label">
                    Kategori
                </div>

                <strong>
                    ${escapeHTML(
                        laporan.category ||
                        "-"
                    )}
                </strong>

            </div>


            <div class="detail-section">

                <div class="detail-label">
                    Judul
                </div>

                <strong>
                    ${escapeHTML(
                        laporan.title ||
                        "-"
                    )}
                </strong>

            </div>


            <div class="detail-section">

                <div class="detail-label">
                    Isi Laporan
                </div>

                <p class="detail-description">
                    ${escapeHTML(
                        laporan.description ||
                        "-"
                    )}
                </p>

            </div>


            <div class="detail-section">

                <div class="detail-label">
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


            <div class="detail-section">

                <div class="detail-label">
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


    const detailStatus =
        document.getElementById(
            "detailStatus"
        );


    const detailAdminNote =
        document.getElementById(
            "detailAdminNote"
        );


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

        } else if (
            status === "completed" ||
            status === "resolved" ||
            status === "selesai"
        ) {

            detailStatus.value =
                "completed";

        } else {

            detailStatus.value =
                "pending";

        }

    }


    if (detailAdminNote) {

        detailAdminNote.value =
            laporan.admin_note ||
            "";

    }


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


    setTimeout(
        () => {

            if (detailStatus) {
                detailStatus.focus();
            }

        },
        100
    );

}


// ==========================================
// FOTO LAPORAN
// ==========================================

function bukaFotoLaporan(url) {

    if (!url) {
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


        <div class="foto-preview-box">

            <button
                type="button"
                class="foto-preview-close"
                aria-label="Tutup foto"
            >
                <svg viewBox="0 0 24 24">
                    <path d="M6 6l12 12"></path>
                    <path d="M18 6L6 18"></path>
                </svg>
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


    document.addEventListener(
        "keydown",
        function tutupFotoEscape(event) {

            if (
                event.key === "Escape"
            ) {

                modal.remove();

                document.removeEventListener(
                    "keydown",
                    tutupFotoEscape
                );

            }

        }
    );

}


// ==========================================
// TUTUP DETAIL
// ==========================================

function tutupDetail() {

    if (detailModal) {

        detailModal.classList.add(
            "hidden"
        );

        detailModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );


    laporanTerpilih =
        null;

}


// ==========================================
// SIMPAN PERUBAHAN
// ==========================================

async function simpanPerubahanLaporan() {

    if (!laporanTerpilih) {

        console.error(
            "SIDAT: Tidak ada laporan yang dipilih."
        );

        return;

    }


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


    if (!statusInput) {

        tampilkanNotifikasi(
            "Elemen status laporan tidak ditemukan.",
            "error"
        );

        return;

    }


    if (!noteInput) {

        tampilkanNotifikasi(
            "Elemen tanggapan admin tidak ditemukan.",
            "error"
        );

        return;

    }


    const status =
        statusInput.value ||
        "pending";


    const adminNote =
        noteInput.value.trim() ||
        "";


    const statusValid = [
        "pending",
        "processing",
        "completed"
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

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.innerHTML = `
                ${SVG_RELOAD}
                Menyimpan...
            `;

        }


        const hasil =
            await supabaseRequestAdmin(

                `${SUPABASE_URL}/rest/v1/reports` +
                `?id=eq.${encodeURIComponent(
                    laporanTerpilih.id
                )}`,

                {

                    method: "PATCH",

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


        // ==================================
        // NOTIFIKASI UPDATE KEPADA WARGA
        // ==================================
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


            if (adminNote) {

                pesan +=
                    ` Tanggapan admin: ${adminNote}`;

            }


            const notificationPayload = {

                title:
                    "📢 Laporan Diperbarui",

                message:
                    pesan,

                target_type:
                    "all",

                target_resident_id:
                    null,

                is_read:
                    false,

                created_by:
                    window.currentUser?.id ||
                    null,

                created_at:
                    new Date().toISOString(),

                report_id:
                    laporanTerpilih.id

            };


            console.log(
                "SIDAT: Membuat notifikasi update laporan:",
                notificationPayload
            );


            const notification =
                await supabaseRequestAdmin(

                    `${SUPABASE_URL}/rest/v1/notifications`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=representation"

                        },

                        body:
                            JSON.stringify(
                                notificationPayload
                            )

                    }

                );


            const notificationId =
                Array.isArray(notification)
                    ? notification[0]?.id
                    : notification?.id;


            if (!notificationId) {

                console.warn(
                    "SIDAT: notification_id tidak ditemukan."
                );

            } else {

                try {

                    const session =
                        await getValidSession();


                    const pushResponse =
                        await fetch(

                            `${SUPABASE_URL}` +
                            `/functions/v1/` +
                            `send-push-notification`,

                            {

                                method:
                                    "POST",

                                headers: {

                                    apikey:
                                        SUPABASE_KEY,

                                    Authorization:
                                        `Bearer ${
                                            session.access_token
                                        }`,

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        notification_id:
                                            notificationId

                                    })

                            }

                        );


                    const pushText =
                        await pushResponse.text();


                    let pushData = null;

                    try {

                        pushData =
                            pushText
                                ? JSON.parse(pushText)
                                : null;

                    } catch {

                        pushData =
                            pushText;

                    }


                    if (!pushResponse.ok) {

                        console.error(
                            "SIDAT: Push update laporan gagal:",
                            pushResponse.status,
                            pushData
                        );

                    } else {

                        console.log(
                            "SIDAT: Push update laporan berhasil:",
                            pushData
                        );

                    }

                } catch (pushError) {

                    console.warn(
                        "SIDAT: Push update laporan gagal:",
                        pushError
                    );

                }

            }

        } catch (notificationError) {

            console.error(
                "SIDAT: Gagal membuat notifikasi update laporan:",
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


        updateStatistik();

        filterLaporan();


        tampilkanNotifikasi(
            "Perubahan laporan berhasil disimpan.",
            "success"
        );


        tutupDetail();


    } catch (error) {

        console.error(
            "SIDAT: Gagal menyimpan perubahan laporan:",
            error
        );


        tampilkanNotifikasi(
            "Gagal menyimpan perubahan laporan.",
            "error"
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML = `
                ${SVG_SAVE}
                Simpan Perubahan
            `;

        }

    }

}


// ==========================================
// HAPUS LAPORAN
// ==========================================

async function hapusLaporan() {

    if (!laporanTerpilih) {
        return;
    }


    const yakin =
        window.confirm(
            "Hapus laporan ini?\n\n" +
            "Data yang sudah dihapus tidak dapat dikembalikan."
        );


    if (!yakin) {
        return;
    }


    try {

        await supabaseRequestAdmin(

            `${SUPABASE_URL}/rest/v1/reports` +
            `?id=eq.${encodeURIComponent(
                laporanTerpilih.id
            )}`,

            {
                method: "DELETE"
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


    } catch (error) {

        console.error(
            "SIDAT: Gagal menghapus laporan:",
            error
        );


        tampilkanNotifikasi(
            "Gagal menghapus laporan.",
            "error"
        );

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


    if (!element) {

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

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }

    if (categoryFilter) {
        categoryFilter.value = "";
    }

    filterLaporan();

}


// ==========================================
// KEMBALI ADMIN
// ==========================================

function kembaliAdmin() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// REFRESH
// ==========================================

const refreshButton =
    document.getElementById(
        "refreshButton"
    );


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadLaporan
    );

}


// ==========================================
// RESET FILTER
// ==========================================

const resetFilterButton =
    document.getElementById(
        "resetFilter"
    );


if (resetFilterButton) {

    resetFilterButton.addEventListener(
        "click",
        resetFilterLaporan
    );

}


// ==========================================
// TUTUP MODAL
// ==========================================

if (closeDetailButton) {

    closeDetailButton.addEventListener(
        "click",
        tutupDetail
    );

}


// ==========================================
// ESCAPE
// ==========================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
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
// GLOBAL
// ==========================================

window.loadLaporan =
    loadLaporan;

window.filterLaporan =
    filterLaporan;

window.isiFilterKategori =
    isiFilterKategori;

window.updateStatistik =
    updateStatistik;

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

window.kembaliAdmin =
    kembaliAdmin;


// ==========================================
// INIT
// ==========================================

function initAdminLaporan() {

    console.log(
        "SIDAT: INIT ADMIN LAPORAN"
    );


    if (
        typeof SUPABASE_URL ===
            "undefined" ||
        typeof SUPABASE_KEY ===
            "undefined"
    ) {

        if (loadingState) {

            loadingState.classList.add(
                "hidden"
            );

        }


        if (laporanContainer) {

            laporanContainer.innerHTML = `

                <div class="laporan-error">

                    <div class="laporan-error-icon">
                        ${SVG_WARNING}
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


window.initAdminLaporan =
    initAdminLaporan;


console.log(
    "SIDAT: ADMIN LAPORAN SIAP."
);