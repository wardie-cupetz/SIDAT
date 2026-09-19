/* =========================================================
SIDAT - WARGA
LAPORAN & ADUAN
========================================================= */

(function () {
"use strict";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const REPORT_PHOTO_BUCKET = "report-photos";
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

let semuaLaporan = [];
let laporanTerpilih = null;
let selectedPhotoFile = null;
let currentSession = null;


function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatTanggal(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}


function statusLabel(status) {
    const map = {
        pending: "Menunggu",
        process: "Diproses",
        resolved: "Selesai",
        rejected: "Ditolak"
    };

    return map[status] || "Menunggu";
}


function statusClass(status) {
    const allowed = [
        "pending",
        "process",
        "resolved",
        "rejected"
    ];

    return allowed.includes(status)
        ? status
        : "pending";
}


function svgIcon(type, className = "") {
    const cls = className
        ? ` class="${className}"`
        : "";

    const icons = {

        person: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5"></circle>
                <path d="M5 21c.8-4 3-6 7-6s6.2 2 7 6"></path>
            </svg>
        `,

        calendar: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v15H4z"></path>
                <path d="M8 3v4"></path>
                <path d="M16 3v4"></path>
                <path d="M4 9h16"></path>
            </svg>
        `,

        image: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v14H4z"></path>
                <circle cx="9" cy="10" r="1.5"></circle>
                <path d="M4 16l4-4 3 3 3-3 6 6"></path>
            </svg>
        `,

        message: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v11H8l-4 4z"></path>
                <path d="M8 9h8"></path>
                <path d="M8 12h5"></path>
            </svg>
        `,

        arrow: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 18l6-6-6-6"></path>
            </svg>
        `,

        warning: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l9 17H3z"></path>
                <path d="M12 9v5"></path>
                <circle cx="12" cy="17" r=".8"></circle>
            </svg>
        `,

        check: `
            <svg${cls} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M8 12l3 3 5-6"></path>
            </svg>
        `

    };

    return icons[type] || "";
}


async function getValidSession() {
    let result =
        await supabaseClient.auth.getSession();

    if (result.error) {
        throw result.error;
    }

    let session =
        result.data?.session || null;

    if (!session) {
        return null;
    }

    const expiresAt =
        Number(session.expires_at || 0);

    const now =
        Math.floor(Date.now() / 1000);

    if (
        expiresAt &&
        expiresAt - now <= 60
    ) {
        const refreshResult =
            await supabaseClient.auth.refreshSession();

        if (
            !refreshResult.error &&
            refreshResult.data?.session
        ) {
            session =
                refreshResult.data.session;
        }
    }

    if (session?.access_token) {
        localStorage.setItem(
            "sidat_access_token",
            session.access_token
        );
    }

    return session;
}


async function pastikanLogin() {
    currentSession =
        await getValidSession();

    if (!currentSession) {
        window.location.href =
            "login.html";

        return false;
    }

    return true;
}


async function getResidentId() {
    const wargaRaw =
        localStorage.getItem(
            "sidat_user"
        );

    let warga = null;

    try {
        warga = wargaRaw
            ? JSON.parse(wargaRaw)
            : null;
    } catch (error) {
        warga = null;
    }

    if (warga?.resident_id) {
        return warga.resident_id;
    }

    const result =
        await supabaseClient.rpc(
            "get_my_resident_id"
        );

    if (result.error) {
        throw result.error;
    }

    if (!result.data) {
        throw new Error(
            "ID warga tidak ditemukan."
        );
    }

    return result.data;
}


async function getAuthUser() {
    const result =
        await supabaseClient.auth.getUser();

    if (result.error) {
        throw result.error;
    }

    return result.data?.user || null;
}


async function getSupabaseHeaders(extra = {}) {
    const session =
        await getValidSession();

    if (!session?.access_token) {
        throw new Error(
            "Sesi login tidak tersedia."
        );
    }

    return {
        apikey: SUPABASE_KEY,
        Authorization:
            `Bearer ${session.access_token}`,
        ...extra
    };
}


async function supabaseRequest(
    path,
    options = {}
) {
    const headers =
        await getSupabaseHeaders(
            options.headers || {}
        );

    const response =
        await fetch(
            `${SUPABASE_URL}${path}`,
            {
                ...options,
                headers
            }
        );

    const text =
        await response.text();

    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (error) {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error_description ||
            data?.hint ||
            data?.details ||
            "Permintaan ke Supabase gagal.";

        throw new Error(message);
    }

    return data;
}


async function loadLaporan() {
    const list =
        document.getElementById(
            "laporanList"
        );

    if (list) {
        list.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Memuat laporan...</p>
            </div>
        `;
    }

    try {

        if (!(await pastikanLogin())) {
            return;
        }

        const reports =
            await supabaseRequest(
                "/rest/v1/reports" +
                "?select=id,resident_id,category,title," +
                "description,photo_url,status,admin_note," +
                "created_at,updated_at" +
                "&order=created_at.desc"
            );

        const safeReports =
            Array.isArray(reports)
                ? reports
                : [];

        const residentIds = [
            ...new Set(
                safeReports
                    .map(item => item.resident_id)
                    .filter(Boolean)
            )
        ];

        let residents = [];

        if (residentIds.length > 0) {

            residents =
                await supabaseRequest(
                    "/rest/v1/residents" +
                    "?select=id,name,resident_code" +
                    `&id=in.(${residentIds.join(",")})`
                );
        }

        const residentMap =
            new Map(
                (
                    Array.isArray(residents)
                        ? residents
                        : []
                ).map(item => [
                    item.id,
                    item
                ])
            );

        semuaLaporan =
            safeReports.map(report => {

                const resident =
                    residentMap.get(
                        report.resident_id
                    );

                return {
                    ...report,
                    resident_name:
                        resident?.name ||
                        "Warga",
                    resident_code:
                        resident?.resident_code ||
                        "-"
                };
            });

        tampilkanLaporan(
            semuaLaporan
        );

    } catch (error) {

        console.error(
            "Gagal memuat laporan:",
            error
        );

        if (list) {
            list.innerHTML = `
                <div class="empty-state error-state">

                    <div class="empty-state-icon">
                        ${svgIcon("warning")}
                    </div>

                    <h3>
                        Gagal memuat laporan
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Terjadi kesalahan."
                        )}
                    </p>

                    <button
                        type="button"
                        class="retry-button"
                        onclick="loadLaporan()"
                    >
                        Coba Lagi
                    </button>

                </div>
            `;
        }
    }
}


function tampilkanLaporan(
    laporanArray
) {
    const list =
        document.getElementById(
            "laporanList"
        );

    if (!list) {
        return;
    }

    if (
        !Array.isArray(laporanArray) ||
        laporanArray.length === 0
    ) {
        list.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    ${svgIcon("message")}
                </div>

                <h3>Belum ada laporan</h3>

                <p>
                    Belum ada laporan yang sesuai
                    dengan pencarian atau filter.
                </p>

            </div>
        `;

        return;
    }

    list.innerHTML =
        laporanArray
            .map(buatKartuLaporan)
            .join("");
}


function buatKartuLaporan(laporan) {
    const status =
        statusClass(
            laporan.status
        );

    const photo =
        laporan.photo_url
            ? `
                <div class="report-photo">
                    <img
                        src="${escapeHTML(
                            laporan.photo_url
                        )}"
                        alt="Foto laporan"
                        loading="lazy"
                    >
                </div>
            `
            : "";

    return `
        <article
            class="laporan-item"
            data-id="${escapeHTML(
                laporan.id
            )}"
            onclick="bukaDetailLaporan('${escapeHTML(
                laporan.id
            )}')"
        >

            ${photo}

            <div class="laporan-item-body">

                <div class="laporan-item-top">

                    <span class="category-badge">
                        ${escapeHTML(
                            laporan.category ||
                            "Lainnya"
                        )}
                    </span>

                    <span
                        class="status-badge status-${status}"
                    >
                        ${statusLabel(
                            laporan.status
                        )}
                    </span>

                </div>


                <h3 class="laporan-title">
                    ${escapeHTML(
                        laporan.title ||
                        "Tanpa judul"
                    )}
                </h3>


                <p class="laporan-description">
                    ${escapeHTML(
                        laporan.description ||
                        ""
                    )}
                </p>


                <div class="laporan-meta">

                    <div class="laporan-meta-left">

                        <span class="meta-item">
                            ${svgIcon("person")}
                            <span>
                                ${escapeHTML(
                                    laporan.resident_name ||
                                    "Warga"
                                )}
                            </span>
                        </span>

                        <span class="resident-code">
                            ${escapeHTML(
                                laporan.resident_code ||
                                "-"
                            )}
                        </span>

                    </div>


                    <span class="meta-item">
                        ${svgIcon("calendar")}
                        <span>
                            ${formatTanggal(
                                laporan.created_at
                            )}
                        </span>
                    </span>

                </div>


                <div class="laporan-item-arrow">
                    ${svgIcon("arrow")}
                </div>

            </div>

        </article>
    `;
}


function terapkanFilter() {
    const keyword =
        (
            document.getElementById(
                "searchLaporan"
            )?.value || ""
        )
            .trim()
            .toLowerCase();

    const kategori =
        document.getElementById(
            "filterKategori"
        )?.value || "";

    const status =
        document.getElementById(
            "filterStatus"
        )?.value || "";

    const hasil =
        semuaLaporan.filter(
            laporan => {

                const text =
                    [
                        laporan.resident_name,
                        laporan.resident_code,
                        laporan.category,
                        laporan.title,
                        laporan.description
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                return (
                    (!keyword ||
                        text.includes(keyword)) &&
                    (!kategori ||
                        laporan.category === kategori) &&
                    (!status ||
                        laporan.status === status)
                );
            }
        );

    tampilkanLaporan(hasil);
}


function bersihkanPencarian() {
    const search =
        document.getElementById(
            "searchLaporan"
        );

    const kategori =
        document.getElementById(
            "filterKategori"
        );

    const status =
        document.getElementById(
            "filterStatus"
        );

    if (search) {
        search.value = "";
    }

    if (kategori) {
        kategori.value = "";
    }

    if (status) {
        status.value = "";
    }

    tampilkanLaporan(
        semuaLaporan
    );
}


function handlePhotoChange(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    hideFormMessages();

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        tampilkanFormError(
            "Format foto harus JPG, PNG, atau WEBP."
        );

        event.target.value = "";
        selectedPhotoFile = null;

        return;
    }

    if (
        file.size >
        MAX_PHOTO_SIZE
    ) {
        tampilkanFormError(
            "Ukuran foto maksimal 2 MB."
        );

        event.target.value = "";
        selectedPhotoFile = null;

        return;
    }

    selectedPhotoFile = file;

    const container =
        document.getElementById(
            "photoPreviewContainer"
        );

    const preview =
        document.getElementById(
            "photoPreview"
        );

    const info =
        document.getElementById(
            "photoInfo"
        );

    if (
        container &&
        preview &&
        info
    ) {

        const reader =
            new FileReader();

        reader.onload = function () {

            preview.src =
                reader.result;

            info.textContent =
                `${file.name} • ${formatFileSize(
                    file.size
                )}`;

            container.hidden =
                false;
        };

        reader.readAsDataURL(file);
    }
}


function formatFileSize(size) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(
            size / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        size /
        (1024 * 1024)
    ).toFixed(2)} MB`;
}


function hapusFoto() {
    selectedPhotoFile = null;

    const input =
        document.getElementById(
            "photoInput"
        );

    const container =
        document.getElementById(
            "photoPreviewContainer"
        );

    const preview =
        document.getElementById(
            "photoPreview"
        );

    const info =
        document.getElementById(
            "photoInfo"
        );

    if (input) {
        input.value = "";
    }

    if (preview) {
        preview.src = "";
    }

    if (info) {
        info.textContent = "";
    }

    if (container) {
        container.hidden = true;
    }
}


async function uploadFotoLaporan(
    file,
    residentId
) {
    const session =
        await getValidSession();

    if (!session?.access_token) {
        throw new Error(
            "Sesi login tidak tersedia."
        );
    }

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const safeExtension =
        [
            "jpg",
            "jpeg",
            "png",
            "webp"
        ].includes(extension)
            ? extension
            : "jpg";

    const filePath =
        `${residentId}/` +
        `${Date.now()}_` +
        `${Math.random()
            .toString(36)
            .slice(2, 8)}.` +
        safeExtension;

    const uploadUrl =
        `${SUPABASE_URL}` +
        `/storage/v1/object/` +
        `${REPORT_PHOTO_BUCKET}/` +
        `${filePath}`;

    const response =
        await fetch(
            uploadUrl,
            {
                method: "POST",

                headers: {
                    apikey:
                        SUPABASE_KEY,

                    Authorization:
                        `Bearer ${
                            session.access_token
                        }`,

                    "Content-Type":
                        file.type,

                    "x-upsert":
                        "false"
                },

                body: file
            }
        );

    if (!response.ok) {

        const text =
            await response.text();

        let message =
            "Gagal mengunggah foto.";

        try {
            const data =
                JSON.parse(text);

            message =
                data?.message ||
                data?.error ||
                message;
        } catch (error) {
            if (text) {
                message = text;
            }
        }

        throw new Error(message);
    }

    return (
        `${SUPABASE_URL}` +
        `/storage/v1/object/public/` +
        `${REPORT_PHOTO_BUCKET}/` +
        `${filePath}`
    );
}


async function buatNotifikasiAdminLaporan(
    laporan
) {
    try {

        const authUser =
            await getAuthUser();

        const authUserId =
            authUser?.id || null;

        const payload = {
            title: "Laporan Baru",

            message:
                `Ada laporan baru dari warga: "${laporan.title}".`,

            target_type:
                "admin",

            target_resident_id:
                null,

            is_read:
                false,

            created_by:
                authUserId,

            created_at:
                new Date().toISOString(),

            report_id:
                laporan.id
        };

        const notification =
            await supabaseRequest(
                "/rest/v1/notifications",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=representation"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const notificationId =
            Array.isArray(notification)
                ? notification[0]?.id
                : notification?.id;

        if (!notificationId) {
            return;
        }

        try {

            const session =
                await getValidSession();

            await fetch(
                `${SUPABASE_URL}` +
                `/functions/v1/` +
                `send-push-notification`,
                {
                    method: "POST",

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

        } catch (error) {

            console.warn(
                "Push admin gagal:",
                error
            );
        }

    } catch (error) {

        console.warn(
            "Notifikasi admin gagal:",
            error
        );
    }
}


async function buatNotifikasiSemuaWarga(
    laporan
) {
    try {

        const authUser =
            await getAuthUser();

        const authUserId =
            authUser?.id || null;

        const payload = {
            title: "Laporan Baru",

            message:
                `Ada laporan baru dari warga: "${laporan.title}".`,

            target_type:
                "all",

            target_resident_id:
                null,

            is_read:
                false,

            created_by:
                authUserId,

            created_at:
                new Date().toISOString(),

            report_id:
                laporan.id
        };

        const notification =
            await supabaseRequest(
                "/rest/v1/notifications",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=representation"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const notificationId =
            Array.isArray(notification)
                ? notification[0]?.id
                : notification?.id;

        if (!notificationId) {
            return;
        }

        try {

            const session =
                await getValidSession();

            await fetch(
                `${SUPABASE_URL}` +
                `/functions/v1/` +
                `send-push-notification`,
                {
                    method: "POST",

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

        } catch (error) {

            console.warn(
                "Push warga gagal:",
                error
            );
        }

    } catch (error) {

        console.warn(
            "Notifikasi warga gagal:",
            error
        );
    }
}


async function kirimLaporan(event) {
    event.preventDefault();

    const form =
        document.getElementById(
            "laporanForm"
        );

    const category =
        document.getElementById(
            "category"
        )?.value.trim();

    const title =
        document.getElementById(
            "title"
        )?.value.trim();

    const description =
        document.getElementById(
            "description"
        )?.value.trim();

    const button =
        document.getElementById(
            "submitButton"
        );

    const buttonText =
        document.getElementById(
            "submitButtonText"
        );

    hideFormMessages();

    if (!category) {
        tampilkanFormError(
            "Silakan pilih kategori laporan."
        );
        return;
    }

    if (
        !title ||
        title.length < 3
    ) {
        tampilkanFormError(
            "Judul laporan minimal 3 karakter."
        );
        return;
    }

    if (
        !description ||
        description.length < 10
    ) {
        tampilkanFormError(
            "Keterangan laporan minimal 10 karakter."
        );
        return;
    }

    try {

        if (!(await pastikanLogin())) {
            return;
        }

        const residentId =
            await getResidentId();

        if (!residentId) {
            throw new Error(
                "ID warga tidak ditemukan."
            );
        }

        if (button) {
            button.disabled = true;
            button.classList.add(
                "is-loading"
            );
        }

        if (buttonText) {
            buttonText.textContent =
                "Mengirim...";
        }

        let photoUrl = null;

        if (selectedPhotoFile) {
            photoUrl =
                await uploadFotoLaporan(
                    selectedPhotoFile,
                    residentId
                );
        }

        const payload = {
            resident_id:
                residentId,

            category:
                category,

            title:
                title,

            description:
                description,

            photo_url:
                photoUrl,

            status:
                "pending"
        };

        const result =
            await supabaseRequest(
                "/rest/v1/reports",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=representation"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const laporan =
            Array.isArray(result)
                ? result[0]
                : result;

        if (!laporan?.id) {
            throw new Error(
                "Laporan gagal disimpan."
            );
        }

        const notificationReport = {
            ...laporan,

            title:
                title,

            category:
                category,

            resident_id:
                residentId
        };

        /*
         * Notifikasi berjalan setelah
         * laporan berhasil tersimpan.
         * Kegagalan push tidak membatalkan laporan.
         */
        await Promise.allSettled([
            buatNotifikasiSemuaWarga(
                notificationReport
            ),

            buatNotifikasiAdminLaporan(
                notificationReport
            )
        ]);

        tampilkanFormSuccess(
            "Laporan berhasil dikirim."
        );

        if (form) {
            form.reset();
        }

        hapusFoto();

        updateCounters();

        await loadLaporan();

        setTimeout(() => {

            document
                .querySelector(
                    ".riwayat-card"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }, 200);

    } catch (error) {

        console.error(
            "Gagal mengirim laporan:",
            error
        );

        tampilkanFormError(
            error.message ||
            "Laporan gagal dikirim."
        );

    } finally {

        if (button) {
            button.disabled = false;

            button.classList.remove(
                "is-loading"
            );
        }

        if (buttonText) {
            buttonText.textContent =
                "Kirim Laporan";
        }
    }
}


function bukaDetailLaporan(id) {
    const laporan =
        semuaLaporan.find(
            item => item.id === id
        );

    if (!laporan) {
        return;
    }

    laporanTerpilih =
        laporan;

    const modal =
        document.getElementById(
            "detailModal"
        );

    const modalTitle =
        document.getElementById(
            "detailModalTitle"
        );

    const content =
        document.getElementById(
            "detailContent"
        );

    if (!modal || !content) {
        return;
    }

    if (modalTitle) {
        modalTitle.textContent =
            laporan.title ||
            "Laporan";
    }

    const photo =
        laporan.photo_url
            ? `
                <div class="detail-photo">
                    <img
                        src="${escapeHTML(
                            laporan.photo_url
                        )}"
                        alt="Foto laporan"
                    >
                </div>
            `
            : "";

    const adminNote =
        laporan.admin_note
            ? `
                <div class="detail-note">

                    <div class="detail-note-title">
                        ${svgIcon("message")}
                        <span>
                            Catatan Pengurus
                        </span>
                    </div>

                    <p>
                        ${escapeHTML(
                            laporan.admin_note
                        )}
                    </p>

                </div>
            `
            : "";

    content.innerHTML = `
        ${photo}

        <div class="detail-status-row">

            <span class="category-badge">
                ${escapeHTML(
                    laporan.category ||
                    "Lainnya"
                )}
            </span>

            <span
                class="status-badge status-${statusClass(
                    laporan.status
                )}"
            >
                ${statusLabel(
                    laporan.status
                )}
            </span>

        </div>


        <div class="detail-section">

            <div class="detail-info-row">

                ${svgIcon("person")}

                <div>
                    <span>Pelapor</span>

                    <strong>
                        ${escapeHTML(
                            laporan.resident_name ||
                            "Warga"
                        )}
                    </strong>
                </div>

            </div>


            <div class="detail-info-row">

                ${svgIcon("person")}

                <div>
                    <span>ID Warga</span>

                    <strong>
                        ${escapeHTML(
                            laporan.resident_code ||
                            "-"
                        )}
                    </strong>
                </div>

            </div>


            <div class="detail-info-row">

                ${svgIcon("calendar")}

                <div>
                    <span>Tanggal</span>

                    <strong>
                        ${formatTanggal(
                            laporan.created_at
                        )}
                    </strong>
                </div>

            </div>

        </div>


        <div class="detail-description">

            <div class="detail-description-title">
                Keterangan
            </div>

            <p>
                ${escapeHTML(
                    laporan.description ||
                    "-"
                )}
            </p>

        </div>


        ${adminNote}
    `;

    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );
}


function tutupDetail() {
    const modal =
        document.getElementById(
            "detailModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden = true;

    document.body.classList.remove(
        "modal-open"
    );

    laporanTerpilih = null;
}


function tampilkanFormError(
    message
) {
    const element =
        document.getElementById(
            "formError"
        );

    if (!element) {
        return;
    }

    element.innerHTML = `
        ${svgIcon("warning")}
        <span>
            ${escapeHTML(message)}
        </span>
    `;

    element.hidden = false;
}


function tampilkanFormSuccess(
    message
) {
    const element =
        document.getElementById(
            "formSuccess"
        );

    if (!element) {
        return;
    }

    element.innerHTML = `
        ${svgIcon("check")}
        <span>
            ${escapeHTML(message)}
        </span>
    `;

    element.hidden = false;
}


function hideFormMessages() {
    const error =
        document.getElementById(
            "formError"
        );

    const success =
        document.getElementById(
            "formSuccess"
        );

    if (error) {
        error.hidden = true;
        error.textContent = "";
    }

    if (success) {
        success.hidden = true;
        success.textContent = "";
    }
}


function updateCounters() {
    const title =
        document.getElementById(
            "title"
        );

    const description =
        document.getElementById(
            "description"
        );

    const titleCounter =
        document.getElementById(
            "titleCounter"
        );

    const descriptionCounter =
        document.getElementById(
            "descriptionCounter"
        );

    if (title && titleCounter) {
        titleCounter.textContent =
            `${title.value.length}/150`;
    }

    if (
        description &&
        descriptionCounter
    ) {
        descriptionCounter.textContent =
            `${description.value.length}/1000`;
    }
}


function kembaliDashboard() {
    window.location.href =
        "dashboard.html";
}


function init() {

    const form =
        document.getElementById(
            "laporanForm"
        );

    const photoInput =
        document.getElementById(
            "photoInput"
        );

    const removePhotoButton =
        document.getElementById(
            "removePhotoButton"
        );

    const searchInput =
        document.getElementById(
            "searchLaporan"
        );

    const filterKategori =
        document.getElementById(
            "filterKategori"
        );

    const filterStatus =
        document.getElementById(
            "filterStatus"
        );

    const closeDetailButton =
        document.getElementById(
            "btnCloseDetail"
        );


    if (form) {
        form.addEventListener(
            "submit",
            kirimLaporan
        );
    }


    if (photoInput) {
        photoInput.addEventListener(
            "change",
            handlePhotoChange
        );
    }


    if (removePhotoButton) {
        removePhotoButton.addEventListener(
            "click",
            hapusFoto
        );
    }


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            terapkanFilter
        );
    }


    if (filterKategori) {
        filterKategori.addEventListener(
            "change",
            terapkanFilter
        );
    }


    if (filterStatus) {
        filterStatus.addEventListener(
            "change",
            terapkanFilter
        );
    }


    if (closeDetailButton) {
        closeDetailButton.addEventListener(
            "click",
            tutupDetail
        );
    }


    const title =
        document.getElementById(
            "title"
        );

    const description =
        document.getElementById(
            "description"
        );

    if (title) {
        title.addEventListener(
            "input",
            updateCounters
        );
    }

    if (description) {
        description.addEventListener(
            "input",
            updateCounters
        );
    }


    const modal =
        document.getElementById(
            "detailModal"
        );

    if (modal) {
        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {
                    tutupDetail();
                }

            }
        );
    }


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {
                tutupDetail();
            }

        }
    );


    updateCounters();

    loadLaporan();
}


window.loadLaporan =
    loadLaporan;

window.tampilkanLaporan =
    tampilkanLaporan;

window.terapkanFilter =
    terapkanFilter;

window.bersihkanPencarian =
    bersihkanPencarian;

window.bukaDetailLaporan =
    bukaDetailLaporan;

window.tutupDetail =
    tutupDetail;

window.kembaliDashboard =
    kembaliDashboard;

window.kirimLaporan =
    kirimLaporan;

window.hapusFoto =
    hapusFoto;

window.buatNotifikasiAdminLaporan =
    buatNotifikasiAdminLaporan;


if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        init
    );
} else {
    init();
}

})();