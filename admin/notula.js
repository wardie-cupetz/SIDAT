// ==========================================
// SIDAT - NOTULA RAPAT
// admin/notula.js
// ==========================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==========================================
// KONSTANTA
// ==========================================

const MEETING_TYPE_LABELS = {
    rapat_rt: "Rapat RT",
    rapat_pengurus: "Rapat Pengurus",
    rapat_kegiatan: "Rapat Kegiatan",
    rapat_khusus: "Rapat Khusus",
    lainnya: "Lainnya"
};

const STATUS_LABELS = {
    draft: "Draft",
    completed: "Selesai",
    cancelled: "Dibatalkan"
};

const ATTENDANCE_LABELS = {
    hadir: "Hadir",
    izin: "Izin",
    sakit: "Sakit",
    tidak_hadir: "Tidak Hadir"
};

const FOLLOW_UP_LABELS = {
    belum: "Belum",
    proses: "Proses",
    selesai: "Selesai"
};

// ==========================================
// STATE
// ==========================================

let notulaData = [];
let currentNotula = null;
let currentUser = null;

// ==========================================
// DOM
// ==========================================

const el = {};

function initDom() {
    el.pageMessage = document.getElementById("pageMessage");

    el.btnTambahNotula = document.getElementById("btnTambahNotula");
    el.notulaSearch = document.getElementById("notulaSearch");
    el.notulaLoading = document.getElementById("notulaLoading");
    el.notulaEmpty = document.getElementById("notulaEmpty");
    el.notulaList = document.getElementById("notulaList");

    el.notulaDetailSection = document.getElementById("notulaDetailSection");

    el.detailTitle = document.getElementById("detailTitle");
    el.detailSubtitle = document.getElementById("detailSubtitle");

    el.btnEditNotula = document.getElementById("btnEditNotula");
    el.btnCetakNotula = document.getElementById("btnCetakNotula");

    el.detailPrintTitle = document.getElementById("detailPrintTitle");
    el.detailPrintType = document.getElementById("detailPrintType");
    el.detailPrintDate = document.getElementById("detailPrintDate");
    el.detailPrintTime = document.getElementById("detailPrintTime");
    el.detailPrintLocation = document.getElementById("detailPrintLocation");
    el.detailPrintChairman = document.getElementById("detailPrintChairman");
    el.detailPrintSecretary = document.getElementById("detailPrintSecretary");

    el.detailAttendees = document.getElementById("detailAttendees");
    el.detailDiscussions = document.getElementById("detailDiscussions");
    el.detailDecisions = document.getElementById("detailDecisions");

    el.detailOpeningBlock = document.getElementById("detailOpeningBlock");
    el.detailOpeningNotes = document.getElementById("detailOpeningNotes");

    el.detailClosingBlock = document.getElementById("detailClosingBlock");
    el.detailClosingNotes = document.getElementById("detailClosingNotes");

    // Modal
    el.notulaModal = document.getElementById("notulaModal");
    el.notulaModalTitle = document.getElementById("notulaModalTitle");
    el.btnCloseNotulaModal = document.getElementById("btnCloseNotulaModal");

    el.notulaForm = document.getElementById("notulaForm");
    el.notulaId = document.getElementById("notulaId");

    el.notulaTitle = document.getElementById("notulaTitle");
    el.notulaType = document.getElementById("notulaType");
    el.notulaDate = document.getElementById("notulaDate");
    el.notulaStartTime = document.getElementById("notulaStartTime");
    el.notulaEndTime = document.getElementById("notulaEndTime");
    el.notulaLocation = document.getElementById("notulaLocation");
    el.notulaChairman = document.getElementById("notulaChairman");
    el.notulaSecretary = document.getElementById("notulaSecretary");
    el.notulaOpeningNotes = document.getElementById("notulaOpeningNotes");

    el.attendeesFormList = document.getElementById("attendeesFormList");
    el.btnTambahPeserta = document.getElementById("btnTambahPeserta");

    el.discussionsFormList = document.getElementById("discussionsFormList");
    el.btnTambahPembahasan = document.getElementById("btnTambahPembahasan");

    el.decisionsFormList = document.getElementById("decisionsFormList");
    el.btnTambahKeputusan = document.getElementById("btnTambahKeputusan");

    el.notulaClosingNotes = document.getElementById("notulaClosingNotes");

    el.notulaFormMessage = document.getElementById("notulaFormMessage");
    el.btnCancelNotula = document.getElementById("btnCancelNotula");
    el.btnSaveNotula = document.getElementById("btnSaveNotula");
}

// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    initDom();
    bindEvents();

    await checkAuth();
});

// ==========================================
// EVENTS
// ==========================================

function bindEvents() {
    el.btnTambahNotula?.addEventListener("click", () => {
        openNotulaModal();
    });

    el.notulaSearch?.addEventListener("input", () => {
        renderNotulaList();
    });

    el.btnEditNotula?.addEventListener("click", () => {
        if (currentNotula) {
            openNotulaModal(currentNotula);
        }
    });

    el.btnCetakNotula?.addEventListener("click", async () => {

        if (!currentNotula) return;


        /*
         * =====================================================
         * APK ANDROID
         * =====================================================
         * Gunakan Android Print Framework melalui PrintBridge.
         */

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.PrintBridge &&
            window.SIDATPrint &&
            typeof window.SIDATPrint.printHTML === "function"
        ) {

            const detailSection =
                document.getElementById("notulaDetailSection");

            if (!detailSection) {

                alert(
                    "Dokumen cetak Notula tidak ditemukan."
                );

                return;

            }


            /*
             * Ambil seluruh stylesheet yang sedang digunakan
             * agar hasil cetak APK mengikuti hasil cetak Web.
             */

            const styles =
                Array.from(
                    document.querySelectorAll(
                        'link[rel="stylesheet"], style'
                    )
                )
                .map(
                    element =>
                        element.outerHTML
                )
                .join("\n");


            /*
             * Gunakan struktur DETAIL NOTULA yang sama
             * seperti halaman Web.
             */

            const laporan = `
<!DOCTYPE html>

<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    ${styles}

</head>

<body>

    <main class="app">

        <div class="content">

            ${detailSection.outerHTML}

        </div>

    </main>

</body>

</html>
`;


            try {

                await window.SIDATPrint.printHTML(
                    laporan,
                    "SIDAT - Notula Rapat"
                );

            } catch (error) {

                console.error(
                    "SIDAT CETAK NOTULA NATIVE ERROR:",
                    error
                );

                alert(
                    "Gagal membuka cetak Android: " +
                    (
                        error?.message ||
                        error ||
                        "Kesalahan tidak diketahui."
                    )
                );

            }

            return;

        }


        /*
         * =====================================================
         * WEB BROWSER
         * =====================================================
         * Tetap menggunakan mekanisme cetak browser lama.
         */

        window.print();

    });

    el.btnCloseNotulaModal?.addEventListener("click", closeNotulaModal);

    el.btnCancelNotula?.addEventListener("click", closeNotulaModal);

    el.notulaModal?.querySelector(".modal-overlay")
        ?.addEventListener("click", closeNotulaModal);

    el.notulaForm?.addEventListener("submit", handleNotulaSubmit);

    el.btnTambahPeserta?.addEventListener("click", () => {
        addAttendeeRow();
    });

    el.btnTambahPembahasan?.addEventListener("click", () => {
        addDiscussionRow();
    });

    el.btnTambahKeputusan?.addEventListener("click", () => {
        addDecisionRow();
    });
}

// ==========================================
// AUTH
// ==========================================

async function checkAuth() {
    try {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

        if (!user) {
            showPageMessage(
                "Sesi login tidak ditemukan. Silakan login kembali.",
                "error"
            );
            return;
        }

        currentUser = user;

        await loadNotula();
    } catch (error) {
        console.error("Auth error:", error);

        showPageMessage(
            "Gagal memeriksa sesi login.",
            "error"
        );
    }
}

// ==========================================
// LOAD NOTULA
// ==========================================

async function loadNotula() {
    setLoading(true);

    try {
        const { data, error } = await supabaseClient
            .from("meeting_minutes")
            .select(`
                id,
                title,
                meeting_type,
                meeting_date,
                start_time,
                end_time,
                location,
                chairman_name,
                secretary_name,
                opening_notes,
                closing_notes,
                status,
                created_by,
                created_at,
                updated_at
            `)
            .order("meeting_date", {
                ascending: false
            })
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        notulaData = data || [];

        renderNotulaList();

        if (notulaData.length > 0) {
            await openNotulaDetail(notulaData[0].id);
        } else {
            clearDetail();
        }

    } catch (error) {
        console.error("Load notula error:", error);

        showPageMessage(
            "Gagal memuat arsip notula.",
            "error"
        );
    } finally {
        setLoading(false);
    }
}

// ==========================================
// RENDER LIST
// ==========================================

function renderNotulaList() {
    if (!el.notulaList) return;

    const keyword = (
        el.notulaSearch?.value || ""
    ).trim().toLowerCase();

    let filtered = notulaData;

    if (keyword) {
        filtered = notulaData.filter(item => {
            const text = [
                item.title,
                MEETING_TYPE_LABELS[item.meeting_type],
                item.location,
                item.chairman_name,
                item.secretary_name,
                STATUS_LABELS[item.status]
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(keyword);
        });
    }

    el.notulaList.innerHTML = "";

    if (filtered.length === 0) {
        el.notulaEmpty?.classList.remove("hidden");
        return;
    }

    el.notulaEmpty?.classList.add("hidden");

    filtered.forEach(item => {
        const card = document.createElement("button");

        card.type = "button";
        card.className = "notula-card";

        if (
            currentNotula &&
            currentNotula.id === item.id
        ) {
            card.classList.add("active");
        }

        const dateText = formatDate(item.meeting_date);

        const typeText =
            MEETING_TYPE_LABELS[item.meeting_type] ||
            item.meeting_type ||
            "Kegiatan";

        const statusText =
            STATUS_LABELS[item.status] ||
            item.status ||
            "Draft";

        card.innerHTML = `
            <div class="notula-card-main">
                <strong>${escapeHtml(item.title || "Tanpa Judul")}</strong>

                <span class="notula-card-meta">
                    ${escapeHtml(typeText)}
                </span>

                <span class="notula-card-meta">
                    ${escapeHtml(dateText)}
                    ${item.location
                        ? ` • ${escapeHtml(item.location)}`
                        : ""
                    }
                </span>
            </div>

            <span class="status-badge status-${escapeHtml(item.status || "draft")}">
                ${escapeHtml(statusText)}
            </span>
        `;

        card.addEventListener("click", () => {
            openNotulaDetail(item.id);
        });

        el.notulaList.appendChild(card);
    });
}

// ==========================================
// DETAIL
// ==========================================

async function openNotulaDetail(id) {
    try {
        const { data: meeting, error: meetingError } =
            await supabaseClient
                .from("meeting_minutes")
                .select(`
                    id,
                    title,
                    meeting_type,
                    meeting_date,
                    start_time,
                    end_time,
                    location,
                    chairman_name,
                    secretary_name,
                    opening_notes,
                    closing_notes,
                    status,
                    created_by,
                    created_at,
                    updated_at
                `)
                .eq("id", id)
                .single();

        if (meetingError) {
            throw meetingError;
        }

        const [
            attendeesResult,
            discussionsResult,
            decisionsResult
        ] = await Promise.all([
            supabaseClient
                .from("meeting_attendees")
                .select(`
                    id,
                    meeting_id,
                    resident_id,
                    participant_name,
                    attendance_status,
                    notes,
                    created_at
                `)
                .eq("meeting_id", id)
                .order("created_at", {
                    ascending: true
                }),

            supabaseClient
                .from("meeting_discussions")
                .select(`
                    id,
                    meeting_id,
                    discussion_order,
                    topic,
                    discussion,
                    created_at
                `)
                .eq("meeting_id", id)
                .order("discussion_order", {
                    ascending: true
                }),

            supabaseClient
                .from("meeting_decisions")
                .select(`
                    id,
                    meeting_id,
                    decision_order,
                    decision,
                    responsible_person,
                    target_date,
                    follow_up_status,
                    notes,
                    created_at
                `)
                .eq("meeting_id", id)
                .order("decision_order", {
                    ascending: true
                })
        ]);

        if (attendeesResult.error) {
            throw attendeesResult.error;
        }

        if (discussionsResult.error) {
            throw discussionsResult.error;
        }

        if (decisionsResult.error) {
            throw decisionsResult.error;
        }

        currentNotula = {
            ...meeting,
            attendees: attendeesResult.data || [],
            discussions: discussionsResult.data || [],
            decisions: decisionsResult.data || []
        };

        renderDetail();
        renderNotulaList();

    } catch (error) {
        console.error("Open detail error:", error);

        showPageMessage(
            "Gagal memuat detail notula.",
            "error"
        );
    }
}

// ==========================================
// RENDER DETAIL
// ==========================================

function renderDetail() {
    if (!currentNotula) {
        clearDetail();
        return;
    }

    const n = currentNotula;
  const wilayah = JSON.parse(
    localStorage.getItem("sidat_wilayah_data") || "{}"
);

const wilayahEl =
    document.getElementById("detailPrintWilayah");

if (wilayahEl) {
    wilayahEl.innerHTML = `
        RT ${escapeHtml(wilayah.rt || "-")}
        / RW ${escapeHtml(wilayah.rw || "-")}<br>

        Dusun ${escapeHtml(wilayah.nama_dusun || "-")}
        • Desa ${escapeHtml(wilayah.nama_desa || "-")}<br>

        Kec. ${escapeHtml(wilayah.kecamatan || "-")}
        • Kab. ${escapeHtml(wilayah.kabupaten || "-")}
        • ${escapeHtml(wilayah.provinsi || "-")}
    `;
}

    el.notulaDetailSection?.classList.remove("hidden");

    if (el.detailTitle) {
        el.detailTitle.textContent =
            n.title || "Tanpa Judul";
    }

    if (el.detailSubtitle) {
        const type =
            MEETING_TYPE_LABELS[n.meeting_type] ||
            n.meeting_type ||
            "Kegiatan";

        el.detailSubtitle.textContent =
            `${type} • ${formatDate(n.meeting_date)}`;
    }

    // Print header
    setText(
        el.detailPrintTitle,
        n.title || "-"
    );

    setText(
        el.detailPrintType,
        MEETING_TYPE_LABELS[n.meeting_type] ||
        n.meeting_type ||
        "-"
    );

    setText(
        el.detailPrintDate,
        formatDate(n.meeting_date)
    );

    setText(
        el.detailPrintTime,
        formatTimeRange(
            n.start_time,
            n.end_time
        )
    );

    setText(
        el.detailPrintLocation,
        n.location || "-"
    );

    setText(
        el.detailPrintChairman,
        n.chairman_name || "-"
    );

    setText(
        el.detailPrintSecretary,
        n.secretary_name || "-"
    );

    renderDetailAttendees();
    renderDetailDiscussions();
    renderDetailDecisions();
    renderOpeningClosing();
}

// ==========================================
// DETAIL PESERTA
// ==========================================

function renderDetailAttendees() {
    if (!el.detailAttendees) return;

    const attendees =
        currentNotula?.attendees || [];

    el.detailAttendees.innerHTML = "";

    if (attendees.length === 0) {
        el.detailAttendees.innerHTML =
            `<div class="detail-empty">Belum ada peserta.</div>`;
        return;
    }

    const table = document.createElement("table");

    table.className = "detail-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>No.</th>
                <th>Nama Peserta</th>
                <th>Kehadiran</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody =
        table.querySelector("tbody");

    attendees.forEach((item, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(item.participant_name || "-")}</td>
            <td>
                ${escapeHtml(
                    ATTENDANCE_LABELS[item.attendance_status] ||
                    item.attendance_status ||
                    "-"
                )}
            </td>
            <td>${escapeHtml(item.notes || "-")}</td>
        `;

        tbody.appendChild(tr);
    });

    el.detailAttendees.appendChild(table);
}

// ==========================================
// DETAIL PEMBAHASAN
// ==========================================

function renderDetailDiscussions() {
    if (!el.detailDiscussions) return;

    const discussions =
        currentNotula?.discussions || [];

    el.detailDiscussions.innerHTML = "";

    if (discussions.length === 0) {
        el.detailDiscussions.innerHTML =
            `<div class="detail-empty">Belum ada pembahasan.</div>`;
        return;
    }

    const table = document.createElement("table");

    table.className = "detail-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>No.</th>
                <th>Seksi / Agenda</th>
                <th>Pembahasan</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    discussions.forEach((item, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                ${index + 1}
            </td>

            <td>
                ${escapeHtml(item.topic || "-")}
            </td>

            <td>
                ${formatMultiline(item.discussion || "-")}
            </td>
        `;

        tbody.appendChild(tr);
    });

    el.detailDiscussions.appendChild(table);
}

// ==========================================
// DETAIL KEPUTUSAN
// ==========================================

function renderDetailDecisions() {
    if (!el.detailDecisions) return;

    const decisions = currentNotula?.decisions || [];

    el.detailDecisions.innerHTML = "";

    if (decisions.length === 0) {
        el.detailDecisions.innerHTML =
            `<div class="detail-empty">Belum ada hasil keputusan.</div>`;
        return;
    }

    const table = document.createElement("table");

    table.className = "detail-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>No.</th>
                <th>Keputusan</th>
                <th>Penanggung Jawab</th>
                <th>Target</th>
                <th>Status</th>
                <th>Keterangan</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    decisions.forEach((item, index) => {

        let targetDate = "-";

        if (item.target_date) {
            const date = new Date(
                item.target_date + "T00:00:00"
            );

            if (!Number.isNaN(date.getTime())) {
                targetDate = date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                });
            } else {
                targetDate = item.target_date;
            }
        }

        const status =
            FOLLOW_UP_LABELS[item.follow_up_status] ||
            item.follow_up_status ||
            "-";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${index + 1}</td>

            <td>
                ${escapeHtml(item.decision || "-")}
            </td>

            <td>
                ${escapeHtml(item.responsible_person || "-")}
            </td>

            <td>
                ${escapeHtml(targetDate)}
            </td>

            <td>
                ${escapeHtml(status)}
            </td>

            <td>
                ${escapeHtml(item.notes || "-")}
            </td>
        `;

        tbody.appendChild(tr);
    });

    el.detailDecisions.appendChild(table);
}

// ==========================================
// PEMBUKA / PENUTUP
// ==========================================

function renderOpeningClosing() {
    const opening =
        (currentNotula?.opening_notes || "").trim();

    const closing =
        (currentNotula?.closing_notes || "").trim();

    if (opening) {
        el.detailOpeningBlock?.classList.remove("hidden");

        if (el.detailOpeningNotes) {
            el.detailOpeningNotes.innerHTML =
                formatMultiline(opening);
        }
    } else {
        el.detailOpeningBlock?.classList.add("hidden");
    }

    if (closing) {
        el.detailClosingBlock?.classList.remove("hidden");

        if (el.detailClosingNotes) {
            el.detailClosingNotes.innerHTML =
                formatMultiline(closing);
        }
    } else {
        el.detailClosingBlock?.classList.add("hidden");
    }
}

// ==========================================
// MODAL
// ==========================================

function openNotulaModal(notula = null) {
    clearFormMessage();

    if (notula) {
        el.notulaModalTitle.textContent =
            "Edit Notula";

        fillNotulaForm(notula);
    } else {
        el.notulaModalTitle.textContent =
            "Buat Notula";

        resetNotulaForm();
    }

    el.notulaModal?.classList.remove("hidden");

    document.body.classList.add("modal-open");

    setTimeout(() => {
        el.notulaTitle?.focus();
    }, 50);
}

function closeNotulaModal() {
    el.notulaModal?.classList.add("hidden");

    document.body.classList.remove("modal-open");

    clearFormMessage();
}

// ==========================================
// RESET FORM
// ==========================================

function resetNotulaForm() {
    el.notulaForm?.reset();

    el.notulaId.value = "";

    el.notulaType.value = "rapat_rt";

    el.notulaDate.value =
        getTodayLocalDate();

    el.notulaStartTime.value = "";
    el.notulaEndTime.value = "";

    el.attendeesFormList.innerHTML = "";
    el.discussionsFormList.innerHTML = "";
    el.decisionsFormList.innerHTML = "";

    // Tambahkan satu baris awal
    addAttendeeRow();
    addDiscussionRow();
    addDecisionRow();

    clearFormMessage();
}

// ==========================================
// FILL FORM EDIT
// ==========================================

function fillNotulaForm(notula) {
    el.notulaId.value =
        notula.id || "";

    el.notulaTitle.value =
        notula.title || "";

    el.notulaType.value =
        notula.meeting_type || "rapat_rt";

    el.notulaDate.value =
        notula.meeting_date || "";

    el.notulaStartTime.value =
        cleanTime(notula.start_time);

    el.notulaEndTime.value =
        cleanTime(notula.end_time);

    el.notulaLocation.value =
        notula.location || "";

    el.notulaChairman.value =
        notula.chairman_name || "";

    el.notulaSecretary.value =
        notula.secretary_name || "";

    el.notulaOpeningNotes.value =
        notula.opening_notes || "";

    el.notulaClosingNotes.value =
        notula.closing_notes || "";

    el.attendeesFormList.innerHTML = "";

    (notula.attendees || []).forEach(item => {
        addAttendeeRow(item);
    });

    if (
        !notula.attendees ||
        notula.attendees.length === 0
    ) {
        addAttendeeRow();
    }

    el.discussionsFormList.innerHTML = "";

    (notula.discussions || []).forEach(item => {
        addDiscussionRow(item);
    });

    if (
        !notula.discussions ||
        notula.discussions.length === 0
    ) {
        addDiscussionRow();
    }

    el.decisionsFormList.innerHTML = "";

    (notula.decisions || []).forEach(item => {
        addDecisionRow(item);
    });

    if (
        !notula.decisions ||
        notula.decisions.length === 0
    ) {
        addDecisionRow();
    }

    clearFormMessage();
}

// ==========================================
// PESERTA
// ==========================================

function addAttendeeRow(data = {}) {
    const row = document.createElement("div");

    row.className = "dynamic-form-card attendee-form-card";

    row.innerHTML = `
        <div class="dynamic-form-header">
            <strong class="dynamic-form-number">
                Peserta
            </strong>

            <button
                type="button"
                class="btn-remove-row"
                aria-label="Hapus peserta"
            >
                Hapus
            </button>
        </div>

        <div class="form-group">
            <label>Nama Peserta</label>
            <input
                type="text"
                class="attendee-name"
                placeholder="Nama peserta"
                value="${escapeAttribute(
                    data.participant_name || ""
                )}"
            >
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label>Status Kehadiran</label>

                <select class="attendee-status">
                    <option value="hadir">
                        Hadir
                    </option>

                    <option value="izin">
                        Izin
                    </option>

                    <option value="sakit">
                        Sakit
                    </option>

                    <option value="tidak_hadir">
                        Tidak Hadir
                    </option>
                </select>
            </div>

            <div class="form-group">
                <label>Keterangan</label>

                <input
                    type="text"
                    class="attendee-notes"
                    placeholder="Opsional"
                    value="${escapeAttribute(
                        data.notes || ""
                    )}"
                >
            </div>
        </div>
    `;

    const status =
        row.querySelector(".attendee-status");

    status.value =
        data.attendance_status || "hadir";

    row.querySelector(".btn-remove-row")
        .addEventListener("click", () => {
            row.remove();
            updateDynamicNumbers(
                el.attendeesFormList,
                "Peserta"
            );
        });

    el.attendeesFormList.appendChild(row);

    updateDynamicNumbers(
        el.attendeesFormList,
        "Peserta"
    );
}

// ==========================================
// PEMBAHASAN
// ==========================================

function addDiscussionRow(data = {}) {
    const row = document.createElement("div");

    row.className = "dynamic-form-card discussion-form-card";

    row.innerHTML = `
        <div class="dynamic-form-header">
            <strong class="dynamic-form-number">
                Pembahasan
            </strong>

            <button
                type="button"
                class="btn-remove-row"
                aria-label="Hapus pembahasan"
            >
                Hapus
            </button>
        </div>

        <div class="form-group">
            <label>Topik Pembahasan</label>

            <input
                type="text"
                class="discussion-topic"
                placeholder="Contoh: Kebersihan lingkungan"
                value="${escapeAttribute(
                    data.topic || ""
                )}"
            >
        </div>

        <div class="form-group">
            <label>Isi Pembahasan</label>

            <textarea
                class="discussion-text"
                rows="4"
                placeholder="Tuliskan jalannya pembahasan..."
            >${escapeHtml(
                data.discussion || ""
            )}</textarea>
        </div>
    `;

    row.querySelector(".btn-remove-row")
        .addEventListener("click", () => {
            row.remove();

            updateDynamicNumbers(
                el.discussionsFormList,
                "Pembahasan"
            );
        });

    el.discussionsFormList.appendChild(row);

    updateDynamicNumbers(
        el.discussionsFormList,
        "Pembahasan"
    );
}

// ==========================================
// KEPUTUSAN
// ==========================================

function addDecisionRow(data = {}) {
    const row = document.createElement("div");

    row.className = "dynamic-form-card decision-form-card";

    row.innerHTML = `
        <div class="dynamic-form-header">
            <strong class="dynamic-form-number">
                Keputusan
            </strong>

            <button
                type="button"
                class="btn-remove-row"
                aria-label="Hapus keputusan"
            >
                Hapus
            </button>
        </div>

        <div class="form-group">
            <label>Keputusan</label>

            <textarea
                class="decision-text"
                rows="3"
                placeholder="Tuliskan hasil keputusan..."
            >${escapeHtml(
                data.decision || ""
            )}</textarea>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label>Penanggung Jawab</label>

                <input
                    type="text"
                    class="decision-responsible"
                    placeholder="Nama penanggung jawab"
                    value="${escapeAttribute(
                        data.responsible_person || ""
                    )}"
                >
            </div>

            <div class="form-group">
                <label>Target Tanggal</label>

                <input
                    type="date"
                    class="decision-target-date"
                    value="${escapeAttribute(
                        data.target_date || ""
                    )}"
                >
            </div>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label>Status Tindak Lanjut</label>

                <select class="decision-status">
                    <option value="belum">
                        Belum
                    </option>

                    <option value="proses">
                        Proses
                    </option>

                    <option value="selesai">
                        Selesai
                    </option>
                </select>
            </div>

            <div class="form-group">
                <label>Keterangan</label>

                <input
                    type="text"
                    class="decision-notes"
                    placeholder="Opsional"
                    value="${escapeAttribute(
                        data.notes || ""
                    )}"
                >
            </div>
        </div>
    `;

    const status =
        row.querySelector(".decision-status");

    status.value =
        data.follow_up_status || "belum";

    row.querySelector(".btn-remove-row")
        .addEventListener("click", () => {
            row.remove();

            updateDynamicNumbers(
                el.decisionsFormList,
                "Keputusan"
            );
        });

    el.decisionsFormList.appendChild(row);

    updateDynamicNumbers(
        el.decisionsFormList,
        "Keputusan"
    );
}

// ==========================================
// NOMOR DINAMIS
// ==========================================

function updateDynamicNumbers(container, label) {
    if (!container) return;

    const rows =
        container.children;

    Array.from(rows).forEach(
        (row, index) => {
            const number =
                row.querySelector(
                    ".dynamic-form-number"
                );

            if (number) {
                number.textContent =
                    `${label} ${index + 1}`;
            }
        }
    );
}

// ==========================================
// SUBMIT NOTULA
// ==========================================

async function handleNotulaSubmit(event) {
    event.preventDefault();

    clearFormMessage();

    const title =
        el.notulaTitle.value.trim();

    const meetingDate =
        el.notulaDate.value;

    if (!title) {
        showFormMessage(
            "Judul notula wajib diisi.",
            "error"
        );

        el.notulaTitle.focus();
        return;
    }

    if (!meetingDate) {
        showFormMessage(
            "Tanggal rapat wajib diisi.",
            "error"
        );

        el.notulaDate.focus();
        return;
    }

    const startTime =
        cleanTime(el.notulaStartTime.value);

    const endTime =
        cleanTime(el.notulaEndTime.value);

    if (
        startTime &&
        endTime &&
        endTime <= startTime
    ) {
        showFormMessage(
            "Jam selesai harus lebih besar dari jam mulai.",
            "error"
        );

        return;
    }

    const attendees =
        collectAttendees();

    const discussions =
        collectDiscussions();

    const decisions =
        collectDecisions();

    // Validasi peserta
    for (let i = 0; i < attendees.length; i++) {
        if (!attendees[i].participant_name) {
            showFormMessage(
                `Nama peserta nomor ${i + 1} belum diisi.`,
                "error"
            );

            return;
        }
    }

    // Validasi pembahasan
    for (let i = 0; i < discussions.length; i++) {
        if (!discussions[i].topic) {
            showFormMessage(
                `Topik pembahasan nomor ${i + 1} belum diisi.`,
                "error"
            );

            return;
        }

        if (!discussions[i].discussion) {
            showFormMessage(
                `Isi pembahasan nomor ${i + 1} belum diisi.`,
                "error"
            );

            return;
        }
    }

    // Validasi keputusan
    for (let i = 0; i < decisions.length; i++) {
        if (!decisions[i].decision) {
            showFormMessage(
                `Keputusan nomor ${i + 1} belum diisi.`,
                "error"
            );

            return;
        }
    }

    setSaveLoading(true);

    try {
        const meetingPayload = {
            title,
            meeting_type:
                el.notulaType.value || "rapat_rt",

            meeting_date: meetingDate,

            start_time:
                startTime || null,

            end_time:
                endTime || null,

            location:
                el.notulaLocation.value.trim() ||
                null,

            chairman_name:
                el.notulaChairman.value.trim() ||
                null,

            secretary_name:
                el.notulaSecretary.value.trim() ||
                null,

            opening_notes:
                el.notulaOpeningNotes.value.trim() ||
                null,

            closing_notes:
                el.notulaClosingNotes.value.trim() ||
                null,

            status: "completed"
        };

        let meetingId =
            el.notulaId.value || null;

        // ==================================
        // UPDATE
        // ==================================

        if (meetingId) {
            const { error } =
                await supabaseClient
                    .from("meeting_minutes")
                    .update(meetingPayload)
                    .eq("id", meetingId);

            if (error) {
                throw error;
            }
        }

        // ==================================
        // INSERT
        // ==================================

        else {
            meetingPayload.created_by =
                currentUser?.id || null;

            const { data, error } =
                await supabaseClient
                    .from("meeting_minutes")
                    .insert(meetingPayload)
                    .select("id")
                    .single();

            if (error) {
                throw error;
            }

            meetingId =
                data.id;
        }

        // ==================================
        // CHILD DATA
        // ==================================
        //
        // Peserta, pembahasan, keputusan
        // merupakan isi lengkap notula.
        // Saat edit, kita sinkronkan ulang
        // isi child berdasarkan form terbaru.
        // ==================================

        await replaceAttendees(
            meetingId,
            attendees
        );

        await replaceDiscussions(
            meetingId,
            discussions
        );

        await replaceDecisions(
            meetingId,
            decisions
        );

        closeNotulaModal();

        await loadNotula();

        await openNotulaDetail(meetingId);

        showPageMessage(
            "Notula berhasil disimpan.",
            "success"
        );

    } catch (error) {
        console.error(
            "Save notula error:",
            error
        );

        showFormMessage(
            getFriendlySupabaseError(error),
            "error"
        );
    } finally {
        setSaveLoading(false);
    }
}

// ==========================================
// COLLECT PESERTA
// ==========================================

function collectAttendees() {
    const rows =
        el.attendeesFormList?.querySelectorAll(
            ".attendee-form-card"
        ) || [];

    return Array.from(rows)
        .map(row => ({
            participant_name:
                row.querySelector(
                    ".attendee-name"
                )?.value.trim() || "",

            attendance_status:
                row.querySelector(
                    ".attendee-status"
                )?.value || "hadir",

            notes:
                row.querySelector(
                    ".attendee-notes"
                )?.value.trim() || null
        }))
        .filter(item =>
            item.participant_name ||
            item.notes
        );
}

// ==========================================
// COLLECT PEMBAHASAN
// ==========================================

function collectDiscussions() {
    const rows =
        el.discussionsFormList?.querySelectorAll(
            ".discussion-form-card"
        ) || [];

    return Array.from(rows)
        .map((row, index) => ({
            discussion_order:
                index + 1,

            topic:
                row.querySelector(
                    ".discussion-topic"
                )?.value.trim() || "",

            discussion:
                row.querySelector(
                    ".discussion-text"
                )?.value.trim() || ""
        }))
        .filter(item =>
            item.topic ||
            item.discussion
        );
}

// ==========================================
// COLLECT KEPUTUSAN
// ==========================================

function collectDecisions() {
    const rows =
        el.decisionsFormList?.querySelectorAll(
            ".decision-form-card"
        ) || [];

    return Array.from(rows)
        .map((row, index) => ({
            decision_order:
                index + 1,

            decision:
                row.querySelector(
                    ".decision-text"
                )?.value.trim() || "",

            responsible_person:
                row.querySelector(
                    ".decision-responsible"
                )?.value.trim() || null,

            target_date:
                row.querySelector(
                    ".decision-target-date"
                )?.value || null,

            follow_up_status:
                row.querySelector(
                    ".decision-status"
                )?.value || "belum",

            notes:
                row.querySelector(
                    ".decision-notes"
                )?.value.trim() || null
        }))
        .filter(item =>
            item.decision ||
            item.responsible_person ||
            item.target_date ||
            item.notes
        );
}

// ==========================================
// REPLACE PESERTA
// ==========================================

async function replaceAttendees(
    meetingId,
    attendees
) {
    const { error: deleteError } =
        await supabaseClient
            .from("meeting_attendees")
            .delete()
            .eq("meeting_id", meetingId);

    if (deleteError) {
        throw deleteError;
    }

    if (!attendees.length) {
        return;
    }

    const rows =
        attendees.map(item => ({
            meeting_id: meetingId,
            participant_name:
                item.participant_name,
            attendance_status:
                item.attendance_status,
            notes:
                item.notes
        }));

    const { error } =
        await supabaseClient
            .from("meeting_attendees")
            .insert(rows);

    if (error) {
        throw error;
    }
}

// ==========================================
// REPLACE PEMBAHASAN
// ==========================================

async function replaceDiscussions(
    meetingId,
    discussions
) {
    const { error: deleteError } =
        await supabaseClient
            .from("meeting_discussions")
            .delete()
            .eq("meeting_id", meetingId);

    if (deleteError) {
        throw deleteError;
    }

    if (!discussions.length) {
        return;
    }

    const rows =
        discussions.map(item => ({
            meeting_id: meetingId,

            discussion_order:
                item.discussion_order,

            topic:
                item.topic,

            discussion:
                item.discussion
        }));

    const { error } =
        await supabaseClient
            .from("meeting_discussions")
            .insert(rows);

    if (error) {
        throw error;
    }
}

// ==========================================
// REPLACE KEPUTUSAN
// ==========================================

async function replaceDecisions(
    meetingId,
    decisions
) {
    const { error: deleteError } =
        await supabaseClient
            .from("meeting_decisions")
            .delete()
            .eq("meeting_id", meetingId);

    if (deleteError) {
        throw deleteError;
    }

    if (!decisions.length) {
        return;
    }

    const rows =
        decisions.map(item => ({
            meeting_id: meetingId,

            decision_order:
                item.decision_order,

            decision:
                item.decision,

            responsible_person:
                item.responsible_person,

            target_date:
                item.target_date,

            follow_up_status:
                item.follow_up_status,

            notes:
                item.notes
        }));

    const { error } =
        await supabaseClient
            .from("meeting_decisions")
            .insert(rows);

    if (error) {
        throw error;
    }
}

// ==========================================
// LOADING
// ==========================================

function setLoading(isLoading) {
    if (!el.notulaLoading) return;

    if (isLoading) {
        el.notulaLoading.classList.remove("hidden");
    } else {
        el.notulaLoading.classList.add("hidden");
    }
}

function setSaveLoading(isLoading) {
    if (!el.btnSaveNotula) return;

    el.btnSaveNotula.disabled =
        isLoading;

    if (isLoading) {
        el.btnSaveNotula.textContent =
            "Menyimpan...";
    } else {
        el.btnSaveNotula.textContent =
            "Simpan Notula";
    }
}

// ==========================================
// CLEAR DETAIL
// ==========================================

function clearDetail() {
    currentNotula = null;

    el.notulaDetailSection
        ?.classList.add("hidden");

    if (el.detailAttendees) {
        el.detailAttendees.innerHTML = "";
    }

    if (el.detailDiscussions) {
        el.detailDiscussions.innerHTML = "";
    }

    if (el.detailDecisions) {
        el.detailDecisions.innerHTML = "";
    }
}

// ==========================================
// MESSAGE
// ==========================================

function showPageMessage(
    message,
    type = "info"
) {
    if (!el.pageMessage) return;

    el.pageMessage.textContent =
        message;

    el.pageMessage.className =
        `page-message ${type}`;

    el.pageMessage.classList.remove(
        "hidden"
    );

    clearTimeout(
        showPageMessage.timer
    );

    showPageMessage.timer =
        setTimeout(() => {
            el.pageMessage?.classList.add(
                "hidden"
            );
        }, 5000);
}

function showFormMessage(
    message,
    type = "info"
) {
    if (!el.notulaFormMessage) return;

    el.notulaFormMessage.textContent =
        message;

    el.notulaFormMessage.className =
        `form-message ${type}`;
}

function clearFormMessage() {
    if (!el.notulaFormMessage) return;

    el.notulaFormMessage.textContent = "";

    el.notulaFormMessage.className =
        "form-message";
}

// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatDate(value) {
    if (!value) return "-";

    const date =
        new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
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
// FORMAT JAM
// ==========================================

function cleanTime(value) {
    if (!value) return "";

    return String(value)
        .substring(0, 5);
}

function formatTimeRange(
    start,
    end
) {
    const s =
        cleanTime(start);

    const e =
        cleanTime(end);

    if (s && e) {
        return `${s} – ${e} WIB`;
    }

    if (s) {
        return `${s} WIB`;
    }

    if (e) {
        return `${e} WIB`;
    }

    return "-";
}

// ==========================================
// TODAY
// ==========================================

function getTodayLocalDate() {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ==========================================
// MULTILINE
// ==========================================

function formatMultiline(value) {
    return escapeHtml(
        String(value || "-")
    )
        .replace(/\r?\n/g, "<br>");
}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(value) {
    return escapeHtml(value);
}

// ==========================================
// SET TEXT
// ==========================================

function setText(element, value) {
    if (!element) return;

    element.textContent =
        value ?? "-";
}

// ==========================================
// SUPABASE ERROR
// ==========================================

function getFriendlySupabaseError(error) {
    if (!error) {
        return "Terjadi kesalahan.";
    }

    if (
        error.code === "42501"
    ) {
        return (
            "Akses ditolak oleh database. " +
            "Pastikan role akun memiliki izin untuk mengelola notula."
        );
    }

    if (
        error.code === "23514"
    ) {
        return (
            "Data tidak sesuai dengan aturan database."
        );
    }

    if (
        error.code === "23503"
    ) {
        return (
            "Data terkait tidak ditemukan atau sudah dihapus."
        );
    }

    if (error.message) {
        return error.message;
    }

    return "Gagal menyimpan notula.";
}