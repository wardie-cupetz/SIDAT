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

    el.btnCetakNotula?.addEventListener("click", () => {
        if (!currentNotula) return;

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

    discussions.forEach((item, index) => {
        const article = document.createElement("article");

        article.className = "discussion-detail";

        article.innerHTML = `
            <div class="detail-number">
                ${index + 1}
            </div>

            <div class="detail-body">
                <h4>
                    ${escapeHtml(item.topic || "Tanpa topik")}
                </h4>

                <p>
                    ${formatMultiline(item.discussion || "-")}
                </p>
            </div>
        `;

        el.detailDiscussions.appendChild(article);
    });
}

// ==========================================
// DETAIL KEPUTUSAN
// ==========================================

function renderDetailDecisions() {
    if (!el.detailDecisions) return;

    const decisions =
        currentNotula?.decisions || [];

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

    const tbody =
        table.querySelector("tbody");

    decisions.forEach((item, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${index + 1}</td>

            <td>
                ${formatMultiline(item.decision || "-")}
            </td>

            <td>
                ${escapeHtml(
                    item.responsible_person || "-"
                )}
            </td>

            <td>
                ${item.target_date
                    ? escapeHtml(
                        formatDate(item.target_date)
                    )
                    : "-"
                }
            </td>

            <td>
                ${escapeHtml(
                    FOLLOW_UP_LABELS[item.follow_up_status] ||
                    item.follow_up_status ||
                    "-"
                )}
            </td>

            <td>
                ${formatMultiline(item.notes || "-")}
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
   