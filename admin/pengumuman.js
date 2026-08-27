console.log("### SIDAT BUILD 2026-08-27 16:45 ###");
// ==========================================
// SIDAT
// PENGUMUMAN & NOTIFIKASI ADMIN
// ==========================================

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
// INIT SUPABASE
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

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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
                text: "🚨 Penting",
                className:
                    "badge-important"
            };

        case "activity":
            return {
                text: "📅 Kegiatan",
                className:
                    "badge-activity"
            };

        case "finance":
            return {
                text: "💰 Keuangan",
                className:
                    "badge-finance"
            };

        default:
            return {
                text: "📢 Umum",
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

        return "👤 Warga tertentu";

    }

    return "👥 Semua warga";

}


// ==========================================
// LOAD WARGA
// ==========================================

async function loadWarga() {

    if (!targetWarga) {
        return;
    }


    targetWarga.innerHTML =
        `<option value="">
            Memuat data warga...
        </option>`;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("profiles")

            .select(
                "id,nama_lengkap,id_warga"
            )

            .order(
                "nama_lengkap",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        targetWarga.innerHTML =
            `<option value="">
                Pilih warga
            </option>`;


        if (
            !data ||
            data.length === 0
        ) {

            targetWarga.innerHTML =
                `<option value="">
                    Belum ada data warga
                </option>`;

            return;
        }


        data.forEach(
            warga => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    warga.id;


                const nama =
                    warga.nama_lengkap ||
                    "Tanpa Nama";


                const idWarga =
                    warga.id_warga
                        ? ` (${warga.id_warga})`
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


        targetWarga.innerHTML =
            `<option value="">
                Gagal memuat data warga
            </option>`;

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
                    ⚠️
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
            ? "● Aktif"
            : "○ Nonaktif";


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

                🕒
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
                data-id="${item.id}"
                data-active="${item.is_active}"
            >
                ${item.is_active
                    ? "Nonaktifkan"
                    : "Aktifkan"}
            </button>


            <button
                type="button"
                class="btn-action btn-delete"
                data-action="delete"
                data-id="${item.id}"
            >
                Hapus
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
        targetWarga.value || null;


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

    btnKirim.textContent =
        "⏳ Mengirim...";


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
        created_by: userData.user.id
    })
    .select()
    .single();




console.log("INSERT RESULT:", announcement, error);
        if (error) {
            throw error;
        }
console.log("LEWAT SETELAH INSERT");
await new Promise(resolve => setTimeout(resolve, 500));

const {
    data: notification,
    error: notificationError
} = await supabaseClient
    .from("notifications")
    .select("id")
    .eq("created_by", userData.user.id)
    .eq("title", title)
    .order("created_at", {
        ascending: false
    })
    .limit(1)
    .single();

console.log("notification =", notification);
console.log("notificationError =", notificationError);


if (notification) {

    const {
        data: sessionData
    } = await supabaseClient.auth.getSession();

    const accessToken =
        sessionData.session?.access_token;

    console.log("Memanggil Edge Function", notification.id);
    const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-push-notification`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "apikey": SUPABASE_KEY
            },
            body: JSON.stringify({
                notification_id: notification.id
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

        btnKirim.textContent =
            "📢 Kirim Pengumuman";

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
await new Promise(resolve =>
    setTimeout(resolve, 500)
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
                    ⚠️
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
