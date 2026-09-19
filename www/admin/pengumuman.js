console.log("### SIDAT BUILD 2026-09-11 ###");
console.log("SIDAT: Pengumuman Admin memuat...");

// ==========================================
// SUPABASE
// ==========================================

let supabaseClient = null;

// ==========================================
// ELEMENT
// ==========================================

const formPengumuman =
document.getElementById(
"formPengumuman"
);

const judul =
document.getElementById(
"judul"
);

const jenis =
document.getElementById(
"jenis"
);

const targetType =
document.getElementById(
"targetType"
);

const targetWargaGroup =
document.getElementById(
"targetWargaGroup"
);

const targetWarga =
document.getElementById(
"targetWarga"
);

const isi =
document.getElementById(
"isi"
);

const charCount =
document.getElementById(
"charCount"
);

const btnKirim =
document.getElementById(
"btnKirim"
);

const btnRefresh =
document.getElementById(
"btnRefresh"
);

const formMessage =
document.getElementById(
"formMessage"
);

const loading =
document.getElementById(
"loading"
);

const emptyState =
document.getElementById(
"emptyState"
);

const listPengumuman =
document.getElementById(
"listPengumuman"
);

// ==========================================
// SVG HELPER
// ==========================================

function svgIcon(
type
) {

const icons = {

    general: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10v4"></path>
            <path d="M7 9l10-4v14L7 15z"></path>
            <path d="M7 15v4a2 2 0 0 0 2 2h1"></path>
            <path d="M20 9.5a3 3 0 0 1 0 5"></path>
        </svg>
    `,

    important: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l9 17H3L12 3z"></path>
            <path d="M12 9v4"></path>
            <path d="M12 16h.01"></path>
        </svg>
    `,

    activity: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="2"></rect>
            <path d="M8 3v4"></path>
            <path d="M16 3v4"></path>
            <path d="M4 10h16"></path>
            <path d="M8 14h3"></path>
            <path d="M8 17h5"></path>
        </svg>
    `,

    finance: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v10"></path>
            <path d="M15 9.5c0-1-1.3-1.5-3-1.5s-3 .5-3 1.5 1.3 1.5 3 1.5 3 .5 3 1.5-1.3 1.5-3 1.5-3-.5-3-1.5"></path>
        </svg>
    `,

    user: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5"></circle>
            <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5"></path>
        </svg>
    `,

    users: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3"></circle>
            <path d="M3.5 19c.6-3 2.4-4.5 5.5-4.5S13.9 16 14.5 19"></path>
            <path d="M15 5.5a3 3 0 0 1 0 5.8"></path>
            <path d="M17 14.8c2 .5 3.2 1.8 3.5 4.2"></path>
        </svg>
    `,

    clock: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
        </svg>
    `,

    toggle: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="7" width="18" height="10" rx="5"></rect>
            <circle cx="16" cy="12" r="3"></circle>
        </svg>
    `,

    delete: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16"></path>
            <path d="M9 7V4h6v3"></path>
            <path d="M7 7l1 13h8l1-13"></path>
            <path d="M10 11v5"></path>
            <path d="M14 11v5"></path>
        </svg>
    `,

    send: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4l16 8-16 8 3-8z"></path>
            <path d="M7 12h10"></path>
        </svg>
    `,

    loading: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a9 9 0 1 0 9 9"></path>
        </svg>
    `,

    error: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v5"></path>
            <path d="M12 16h.01"></path>
        </svg>
    `
};

return icons[type] || icons.general;

}

// ==========================================
// SUPABASE
// ==========================================

function initSupabase() {

if (
    typeof window.supabase ===
    "undefined"
) {
    throw new Error(
        "Library Supabase belum dimuat."
    );
}

if (
    typeof SUPABASE_URL ===
    "undefined" ||

    typeof SUPABASE_KEY ===
    "undefined"
) {
    throw new Error(
        "Konfigurasi Supabase belum ditemukan."
    );
}

supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log(
    "SIDAT: Supabase Pengumuman siap."
);

}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
value
) {

if (
    value === null ||
    value === undefined
) {
    return "";
}

return String(value)
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

if (!tanggal) {
    return "-";
}

return new Date(
    tanggal
).toLocaleString(
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
// LABEL JENIS
// ==========================================

function labelJenis(
type
) {

switch (type) {

    case "important":
        return {
            text: "Penting",
            icon: svgIcon("important"),
            className:
                "badge-important"
        };

    case "activity":
        return {
            text: "Kegiatan",
            icon: svgIcon("activity"),
            className:
                "badge-activity"
        };

    case "finance":
        return {
            text: "Keuangan",
            icon: svgIcon("finance"),
            className:
                "badge-finance"
        };

    default:
        return {
            text: "Umum",
            icon: svgIcon("general"),
            className:
                "badge-general"
        };
}

}

// ==========================================
// LABEL TARGET
// ==========================================

function labelTarget(
item
) {

if (
    item.target_type ===
    "selected"
) {

    return `
        <span class="badge-icon">
            ${svgIcon("user")}
        </span>
        Warga tertentu
    `;

}

return `
    <span class="badge-icon">
        ${svgIcon("users")}
    </span>
    Semua warga
`;

}

// ==========================================
// LOAD WARGA
// ==========================================

async function loadWarga() {

    if (!targetWarga) {
        return;
    }

    targetWarga.innerHTML = `
        <option value="">
            Memuat data warga...
        </option>
    `;

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("residents")

            .select(`
                id,
                resident_code,
                name,
                auth_id
            `)

            .not(
                "auth_id",
                "is",
                null
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        targetWarga.innerHTML = `
            <option value="">
                Pilih warga
            </option>
        `;

        if (
            !data ||
            data.length === 0
        ) {

            targetWarga.innerHTML = `
                <option value="">
                    Belum ada akun warga
                </option>
            `;

            return;
        }

        data.forEach(
            warga => {

                const option =
                    document.createElement(
                        "option"
                    );

                /*
                 * target_user_id pada announcements
                 * menggunakan UUID akun Auth warga.
                 */
                option.value =
                    warga.auth_id;

                const nama =
                    warga.name ||
                    "Tanpa Nama";

                const idWarga =
                    warga.resident_code
                        ? ` (${warga.resident_code})`
                        : "";

                option.textContent =
                    nama + idWarga;

                targetWarga.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Gagal memuat warga:",
            error
        );

        targetWarga.innerHTML = `
            <option value="">
                Gagal memuat data warga
            </option>
        `;

    }

}

// ==========================================
// LOAD PENGUMUMAN
// ==========================================

async function loadPengumuman() {

loading.classList.remove(
    "hidden"
);

emptyState.classList.add(
    "hidden"
);

listPengumuman.innerHTML =
    "";

try {

    const {
        data,
        error
    } = await supabaseClient

        .from("announcements")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {
        throw error;
    }

    loading.classList.add(
        "hidden"
    );

    if (
        !data ||
        data.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }

    data.forEach(
        item => {

            listPengumuman.appendChild(
                buatItemPengumuman(
                    item
                )
            );

        }
    );

} catch (error) {

    loading.classList.add(
        "hidden"
    );

    console.error(
        "Gagal memuat pengumuman:",
        error
    );

    listPengumuman.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ${svgIcon("error")}
            </div>

            <h3>
                Gagal memuat pengumuman
            </h3>

            <p>
                ${escapeHTML(
                    error.message
                )}
            </p>

        </div>

    `;

}

}

// ==========================================
// BUAT ITEM PENGUMUMAN
// ==========================================

function buatItemPengumuman(
item
) {

const wrapper =
    document.createElement(
        "article"
    );

wrapper.className =
    "announcement-item";

const jenisData =
    labelJenis(
        item.type
    );

const statusText =
    item.is_active
        ? "Aktif"
        : "Nonaktif";

const statusClass =
    item.is_active
        ? "badge-active"
        : "badge-inactive";

wrapper.innerHTML = `

    <div class="announcement-head">

        <h3 class="announcement-title">
            ${escapeHTML(
                item.title
            )}
        </h3>

    </div>


    <div class="announcement-meta">

        <span class="badge ${jenisData.className}">
            <span class="badge-icon">
                ${jenisData.icon}
            </span>
            ${jenisData.text}
        </span>

        <span class="badge ${statusClass}">
            ${statusText}
        </span>

        <span class="badge badge-general">
            ${labelTarget(item)}
        </span>

    </div>


    <div class="announcement-content">
        ${escapeHTML(
            item.content
        )}
    </div>


    <div class="announcement-meta">

        <span class="badge badge-general">

            <span class="badge-icon">
                ${svgIcon("clock")}
            </span>

            ${formatTanggal(
                item.created_at
            )}

        </span>

    </div>


    <div class="announcement-actions">

        <button
            type="button"
            class="btn-action btn-toggle"
            data-action="toggle"
            data-id="${escapeHTML(item.id)}"
            data-active="${item.is_active}"
        >

            <span class="button-icon">
                ${svgIcon("toggle")}
            </span>

            <span>
                ${item.is_active
                    ? "Nonaktifkan"
                    : "Aktifkan"}
            </span>

        </button>


        <button
            type="button"
            class="btn-action btn-delete"
            data-action="delete"
            data-id="${escapeHTML(item.id)}"
        >

            <span class="button-icon">
                ${svgIcon("delete")}
            </span>

            <span>
                Hapus
            </span>

        </button>

    </div>

`;

return wrapper;

}

// ==========================================
// KIRIM PENGUMUMAN
// ==========================================

async function kirimPengumuman(
event
) {

event.preventDefault();

const title =
    judul.value.trim();

const content =
    isi.value.trim();

const type =
    jenis.value;

const target =
    targetType.value;

const targetUser =
    targetWarga.value ||
    null;

if (!title) {

    tampilkanPesan(
        "Judul pengumuman wajib diisi.",
        "error"
    );

    judul.focus();

    return;

}

if (!content) {

    tampilkanPesan(
        "Isi pengumuman wajib diisi.",
        "error"
    );

    isi.focus();

    return;

}

if (
    target ===
    "selected" &&
    !targetUser
) {

    tampilkanPesan(
        "Silakan pilih warga terlebih dahulu.",
        "error"
    );

    targetWarga.focus();

    return;

}

btnKirim.disabled =
    true;

btnKirim.innerHTML = `
    ${svgIcon("loading")}
    <span>Mengirim...</span>
`;

try {

    const {
        data: userData,
        error: userError
    } =
        await supabaseClient.auth
            .getUser();

    if (userError) {
        throw userError;
    }

    if (
        !userData ||
        !userData.user
    ) {

        throw new Error(
            "Sesi login tidak ditemukan. Silakan login kembali."
        );

    }

    const {
        data: announcement,
        error
    } = await supabaseClient
        .from("announcements")
        .insert({
            title: title,
            content: content,
            type: type,
            target_type: target,
            target_user_id:
                target === "selected"
                    ? targetUser
                    : null,
            is_active: true,
            created_by:
                userData.user.id
        })
        .select()
        .single();

    console.log(
        "INSERT RESULT:",
        announcement,
        error
    );

    if (error) {
        throw error;
    }

    console.log(
        "LEWAT SETELAH INSERT"
    );

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                500
            )
    );

    const {
        data: notification,
        error: notificationError
    } = await supabaseClient
        .from("notifications")
        .select("id")
        .eq(
            "created_by",
            userData.user.id
        )
        .eq(
            "title",
            title
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(1)
        .single();

    console.log(
        "notification =",
        notification
    );

    console.log(
        "notificationError =",
        notificationError
    );

    if (notification) {

        const {
            data: sessionData
        } =
            await supabaseClient.auth
                .getSession();

        const accessToken =
            sessionData
                .session
                ?.access_token;

        console.log(
            "Memanggil Edge Function",
            notification.id
        );

        const response =
            await fetch(
                `${SUPABASE_URL}/functions/v1/send-push-notification`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "apikey":
                            SUPABASE_KEY
                    },

                    body:
                        JSON.stringify({
                            notification_id:
                                notification.id
                        })
                }
            );

        console.log(
            "Push Result:",
            await response.json()
        );

    }

    tampilkanPesan(
        "Pengumuman berhasil dikirim kepada warga.",
        "success"
    );

    formPengumuman.reset();

    targetWargaGroup.classList.add(
        "hidden"
    );

    charCount.textContent =
        "0";

    await loadPengumuman();

} catch (error) {

    console.error(
        "Gagal mengirim pengumuman:",
        error
    );

    tampilkanPesan(
        "Gagal mengirim: " +
        error.message,
        "error"
    );

} finally {

    btnKirim.disabled =
        false;

    btnKirim.innerHTML = `
        ${svgIcon("send")}
        <span>Kirim Pengumuman</span>
    `;

}

}

// ==========================================
// TOGGLE STATUS
// ==========================================

async function togglePengumuman(
id,
statusSekarang
) {

const statusBaru =
    !statusSekarang;

try {

    const {
        error
    } = await supabaseClient

        .from("announcements")

        .update({

            is_active:
                statusBaru,

            updated_at:
                new Date()
                    .toISOString()

        })

        .eq(
            "id",
            id
        );

    if (error) {
        throw error;
    }

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                500
            )
    );

    await loadPengumuman();

} catch (error) {

    console.error(
        "Gagal mengubah status:",
        error
    );

    alert(
        "Gagal mengubah status pengumuman:\n" +
        error.message
    );

}

}

// ==========================================
// HAPUS PENGUMUMAN
// ==========================================

async function hapusPengumuman(
id
) {

const yakin =
    confirm(
        "Hapus pengumuman ini?"
    );

if (!yakin) {
    return;
}

try {

    const {
        error
    } = await supabaseClient

        .from("announcements")

        .delete()

        .eq(
            "id",
            id
        );

    if (error) {
        throw error;
    }

    await loadPengumuman();

} catch (error) {

    console.error(
        "Gagal menghapus:",
        error
    );

    alert(
        "Gagal menghapus pengumuman:\n" +
        error.message
    );

}

}

// ==========================================
// PESAN FORM
// ==========================================

function tampilkanPesan(
message,
type
) {

formMessage.textContent =
    message;

formMessage.className =
    "form-message " +
    type;

setTimeout(
    () => {

        formMessage.className =
            "form-message";

    },
    5000
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
// EVENT TARGET
// ==========================================

targetType.addEventListener(
"change",
() => {

    if (
        targetType.value ===
        "selected"
    ) {

        targetWargaGroup.classList.remove(
            "hidden"
        );

        loadWarga();

    } else {

        targetWargaGroup.classList.add(
            "hidden"
        );

        targetWarga.value =
            "";

    }

}

);

// ==========================================
// CHARACTER COUNT
// ==========================================

isi.addEventListener(
"input",
() => {

    charCount.textContent =
        isi.value.length;

}

);

// ==========================================
// FORM SUBMIT
// ==========================================

formPengumuman.addEventListener(
"submit",
kirimPengumuman
);

// ==========================================
// REFRESH
// ==========================================

btnRefresh.addEventListener(
"click",
loadPengumuman
);

// ==========================================
// EVENT LIST
// ==========================================

listPengumuman.addEventListener(
"click",
event => {

    const button =
        event.target.closest(
            "button[data-action]"
        );

    if (!button) {
        return;
    }

    const action =
        button.dataset.action;

    const id =
        button.dataset.id;

    if (
        action ===
        "toggle"
    ) {

        const active =
            button.dataset.active ===
            "true";

        togglePengumuman(
            id,
            active
        );

    }

    if (
        action ===
        "delete"
    ) {

        hapusPengumuman(
            id
        );

    }

}

);

// ==========================================
// INIT
// ==========================================

function initPengumuman() {

try {

    initSupabase();

    loadPengumuman();

    console.log(
        "SIDAT: Pengumuman Admin siap."
    );

} catch (error) {

    console.error(
        "Pengumuman init error:",
        error
    );

    loading.classList.add(
        "hidden"
    );

    listPengumuman.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ${svgIcon("error")}
            </div>

            <h3>
                Pengumuman gagal dimuat
            </h3>

            <p>
                ${escapeHTML(
                    error.message
                )}
            </p>

        </div>

    `;

}

}

if (
document.readyState ===
"loading"
) {

document.addEventListener(
    "DOMContentLoaded",
    initPengumuman
);

} else {

initPengumuman();

}