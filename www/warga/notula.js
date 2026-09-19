// ==========================================
// SIDAT - NOTULA WARGA
// warga/notula.js
// ==========================================

"use strict";


// ==========================================
// SUPABASE
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
let currentSession = null;


// ==========================================
// DOM
// ==========================================

const el = {};


// ==========================================
// INIT DOM
// ==========================================

function initDom() {

    el.pageMessage =
        document.getElementById("pageMessage");

    el.btnBack =
        document.getElementById("btnBack");

    el.btnBackToList =
        document.getElementById("btnBackToList");

    el.notulaSearch =
        document.getElementById("notulaSearch");

    el.notulaLoading =
        document.getElementById("notulaLoading");

    el.notulaEmpty =
        document.getElementById("notulaEmpty");

    el.notulaListSection =
        document.getElementById("notulaListSection");

    el.notulaList =
        document.getElementById("notulaList");

    el.notulaDetailSection =
        document.getElementById("notulaDetailSection");

    el.detailType =
        document.getElementById("detailType");

    el.detailTitle =
        document.getElementById("detailTitle");

    el.detailDate =
        document.getElementById("detailDate");

    el.detailTime =
        document.getElementById("detailTime");

    el.detailLocation =
        document.getElementById("detailLocation");

    el.detailChairman =
        document.getElementById("detailChairman");

    el.detailSecretary =
        document.getElementById("detailSecretary");

    el.detailStatus =
        document.getElementById("detailStatus");

    el.detailAttendees =
        document.getElementById("detailAttendees");

    el.detailDiscussions =
        document.getElementById("detailDiscussions");

    el.detailDecisions =
        document.getElementById("detailDecisions");

    el.detailOpeningBlock =
        document.getElementById("detailOpeningBlock");

    el.detailOpeningNotes =
        document.getElementById("detailOpeningNotes");

    el.detailClosingBlock =
        document.getElementById("detailClosingBlock");

    el.detailClosingNotes =
        document.getElementById("detailClosingNotes");
}


// ==========================================
// INIT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initDom();

        bindEvents();

        await initPage();

    }
);


// ==========================================
// EVENTS
// ==========================================

function bindEvents() {

    el.btnBack?.addEventListener(
        "click",
        kembaliDashboard
    );


    el.btnBackToList?.addEventListener(
        "click",
        tampilkanDaftar
    );


    el.notulaSearch?.addEventListener(
        "input",
        renderNotulaList
    );

}


// ==========================================
// INIT PAGE
// ==========================================

async function initPage() {

    try {

        currentSession =
            await getValidSession();

        if (!currentSession) {

            redirectLogin();

            return;
        }


        await loadNotula();


    } catch (error) {

        console.error(
            "SIDAT Notula init error:",
            error
        );

        showPageMessage(
            "Gagal memuat halaman Notula.",
            "error"
        );

    }

}


// ==========================================
// SESSION
// ==========================================

async function getValidSession() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Get session error:",
            error
        );

        return null;
    }


    let session =
        data?.session || null;


    if (!session) {

        return null;
    }


    const expiresAt =
        Number(session.expires_at || 0);


    const now =
        Math.floor(
            Date.now() / 1000
        );


    if (
        expiresAt &&
        expiresAt - now < 60
    ) {

        const {
            data: refreshData,
            error: refreshError
        } =
            await supabaseClient.auth.refreshSession();


        if (
            refreshError ||
            !refreshData?.session
        ) {

            console.error(
                "Refresh session error:",
                refreshError
            );

            return null;
        }


        session =
            refreshData.session;
    }


    try {

        localStorage.setItem(
            "sidat_access_token",
            session.access_token
        );

    } catch (error) {

        console.warn(
            "Tidak dapat menyimpan access token:",
            error
        );

    }


    return session;
}


// ==========================================
// REDIRECT
// ==========================================

function redirectLogin() {

    window.location.href =
        "../index.html";
}


// ==========================================
// LOAD NOTULA
// ==========================================

async function loadNotula() {

    setLoading(true);


    try {

        const session =
            await getValidSession();


        if (!session) {

            redirectLogin();

            return;
        }


        const {
            data,
            error
        } =
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
                    created_at,
                    updated_at
                `)
                .order(
                    "meeting_date",
                    {
                        ascending: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;
        }


        notulaData =
            data || [];


        renderNotulaList();


        if (
            notulaData.length > 0
        ) {

            await openNotulaDetail(
                notulaData[0].id
            );

        } else {

            clearDetail();
        }


    } catch (error) {

        console.error(
            "Load notula error:",
            error
        );


        showPageMessage(
            getFriendlySupabaseError(error),
            "error"
        );


        if (
            error?.code === "401" ||
            error?.status === 401
        ) {

            redirectLogin();
        }

    } finally {

        setLoading(false);
    }

}


// ==========================================
// RENDER LIST
// ==========================================

function renderNotulaList() {

    if (!el.notulaList) {
        return;
    }


    const keyword =
        (
            el.notulaSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    let filtered =
        notulaData;


    if (keyword) {

        filtered =
            notulaData.filter(
                item => {

                    const text = [

                        item.title,

                        MEETING_TYPE_LABELS[
                            item.meeting_type
                        ],

                        item.location,

                        item.chairman_name,

                        item.secretary_name,

                        STATUS_LABELS[
                            item.status
                        ]

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return text.includes(
                        keyword
                    );

                }
            );

    }


    el.notulaList.innerHTML = "";


    if (
        filtered.length === 0
    ) {

        el.notulaEmpty
            ?.classList
            .remove("hidden");

        return;
    }


    el.notulaEmpty
        ?.classList
        .add("hidden");


    filtered.forEach(
        item => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "notula-card";


            if (
                currentNotula &&
                currentNotula.id === item.id
            ) {

                card.classList.add(
                    "active"
                );

            }


            const typeText =
                MEETING_TYPE_LABELS[
                    item.meeting_type
                ] ||
                item.meeting_type ||
                "Kegiatan";


            const statusText =
                STATUS_LABELS[
                    item.status
                ] ||
                item.status ||
                "Draft";


            const dateText =
                formatDate(
                    item.meeting_date
                );


            const timeText =
                formatTimeRange(
                    item.start_time,
                    item.end_time
                );


            card.innerHTML = `

                <div class="notula-card-icon">

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M6 3h9l4 4v14H6z"
                        ></path>

                        <path
                            d="M15 3v5h5"
                        ></path>

                        <path
                            d="M9 12h6M9 16h5"
                        ></path>
                    </svg>

                </div>


                <div class="notula-card-main">

                    <strong>
                        ${escapeHtml(
                            item.title ||
                            "Tanpa Judul"
                        )}
                    </strong>


                    <span class="notula-card-meta">
                        ${escapeHtml(
                            typeText
                        )}
                    </span>


                    <span class="notula-card-meta">

                        ${escapeHtml(
                            dateText
                        )}

                        ${
                            timeText !== "-"
                                ? ` • ${escapeHtml(
                                    timeText
                                )}`
                                : ""
                        }

                    </span>


                    ${
                        item.location
                            ? `
                                <span
                                    class="notula-card-meta"
                                >
                                    ${escapeHtml(
                                        item.location
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>


                <span
                    class="
                        status-badge
                        status-${escapeHtml(
                            item.status ||
                            "draft"
                        )}
                    "
                >
                    ${escapeHtml(
                        statusText
                    )}
                </span>


                <svg
                    class="notula-card-arrow"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="m9 18 6-6-6-6"
                    ></path>
                </svg>

            `;


            card.addEventListener(
                "click",
                () => {

                    openNotulaDetail(
                        item.id
                    );

                }
            );


            el.notulaList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// OPEN DETAIL
// ==========================================

async function openNotulaDetail(
    id
) {

    try {

        const session =
            await getValidSession();


        if (!session) {

            redirectLogin();

            return;
        }


        const [
            meetingResult,
            attendeesResult,
            discussionsResult,
            decisionsResult
        ] =
            await Promise.all([

                supabaseClient
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
                        created_at,
                        updated_at
                    `)
                    .eq(
                        "id",
                        id
                    )
                    .single(),


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
                    .eq(
                        "meeting_id",
                        id
                    )
                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    ),


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
                    .eq(
                        "meeting_id",
                        id
                    )
                    .order(
                        "discussion_order",
                        {
                            ascending: true
                        }
                    ),


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
                    .eq(
                        "meeting_id",
                        id
                    )
                    .order(
                        "decision_order",
                        {
                            ascending: true
                        }
                    )

            ]);


        if (
            meetingResult.error
        ) {

            throw meetingResult.error;
        }


        if (
            attendeesResult.error
        ) {

            throw attendeesResult.error;
        }


        if (
            discussionsResult.error
        ) {

            throw discussionsResult.error;
        }


        if (
            decisionsResult.error
        ) {

            throw decisionsResult.error;
        }


        currentNotula = {

            ...meetingResult.data,

            attendees:
                attendeesResult.data || [],

            discussions:
                discussionsResult.data || [],

            decisions:
                decisionsResult.data || []

        };


        renderDetail();


        renderNotulaList();


        showDetail();


    } catch (error) {

        console.error(
            "Open notula detail error:",
            error
        );


        showPageMessage(
            getFriendlySupabaseError(error),
            "error"
        );

    }

}


// ==========================================
// SHOW DETAIL
// ==========================================

function showDetail() {

    el.notulaListSection
        ?.classList
        .add("hidden");


    el.notulaDetailSection
        ?.classList
        .remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// SHOW LIST
// ==========================================

function tampilkanDaftar() {

    el.notulaDetailSection
        ?.classList
        .add("hidden");


    el.notulaListSection
        ?.classList
        .remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// RENDER DETAIL
// ==========================================

function renderDetail() {

    if (!currentNotula) {

        clearDetail();

        return;
    }


    const n =
        currentNotula;


    const typeText =
        MEETING_TYPE_LABELS[
            n.meeting_type
        ] ||
        n.meeting_type ||
        "Kegiatan";


    const statusText =
        STATUS_LABELS[
            n.status
        ] ||
        n.status ||
        "Draft";


    setText(
        el.detailType,
        typeText
    );


    setText(
        el.detailTitle,
        n.title || "Tanpa Judul"
    );


    setText(
        el.detailDate,
        formatDate(
            n.meeting_date
        )
    );


    setText(
        el.detailTime,
        formatTimeRange(
            n.start_time,
            n.end_time
        )
    );


    setText(
        el.detailLocation,
        n.location || "-"
    );


    setText(
        el.detailChairman,
        n.chairman_name || "-"
    );


    setText(
        el.detailSecretary,
        n.secretary_name || "-"
    );


    setText(
        el.detailStatus,
        statusText
    );


    renderDetailAttendees();


    renderDetailDiscussions();


    renderDetailDecisions();


    renderOpeningClosing();

}


// ==========================================
// PESERTA
// ==========================================

function renderDetailAttendees() {

    if (!el.detailAttendees) {
        return;
    }


    const attendees =
        currentNotula?.attendees || [];


    el.detailAttendees.innerHTML =
        "";


    if (
        attendees.length === 0
    ) {

        el.detailAttendees.innerHTML = `

            <div class="detail-empty">

                Belum ada data peserta.

            </div>

        `;

        return;
    }


    attendees.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "attendee-item";


            const attendance =
                ATTENDANCE_LABELS[
                    item.attendance_status
                ] ||
                item.attendance_status ||
                "-";


            row.innerHTML = `

                <div class="attendee-number">
                    ${index + 1}
                </div>


                <div class="attendee-main">

                    <strong>
                        ${escapeHtml(
                            item.participant_name ||
                            "-"
                        )}
                    </strong>


                    ${
                        item.notes
                            ? `
                                <span>
                                    ${escapeHtml(
                                        item.notes
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>


                <span
                    class="
                        attendance-badge
                        attendance-${escapeHtml(
                            item.attendance_status ||
                            "hadir"
                        )}
                    "
                >
                    ${escapeHtml(
                        attendance
                    )}
                </span>

            `;


            el.detailAttendees
                .appendChild(row);

        }
    );

}


// ==========================================
// PEMBAHASAN
// ==========================================

function renderDetailDiscussions() {

    if (!el.detailDiscussions) {
        return;
    }


    const discussions =
        currentNotula?.discussions || [];


    el.detailDiscussions.innerHTML =
        "";


    if (
        discussions.length === 0
    ) {

        el.detailDiscussions.innerHTML = `

            <div class="detail-empty">

                Belum ada pembahasan.

            </div>

        `;

        return;
    }


    discussions.forEach(
        (item, index) => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "discussion-item";


            article.innerHTML = `

                <div class="discussion-number">

                    ${index + 1}

                </div>


                <div class="discussion-body">

                    <strong>
                        ${escapeHtml(
                            item.topic ||
                            "Tanpa topik"
                        )}
                    </strong>


                    <div class="discussion-text">

                        ${formatMultiline(
                            item.discussion ||
                            "-"
                        )}

                    </div>

                </div>

            `;


            el.detailDiscussions
                .appendChild(article);

        }
    );

}


// ==========================================
// KEPUTUSAN
// ==========================================

function renderDetailDecisions() {

    if (!el.detailDecisions) {
        return;
    }


    const decisions =
        currentNotula?.decisions || [];


    el.detailDecisions.innerHTML =
        "";


    if (
        decisions.length === 0
    ) {

        el.detailDecisions.innerHTML = `

            <div class="detail-empty">

                Belum ada hasil keputusan.

            </div>

        `;

        return;
    }


    decisions.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "decision-item";


            const status =
                FOLLOW_UP_LABELS[
                    item.follow_up_status
                ] ||
                item.follow_up_status ||
                "-";


            card.innerHTML = `

                <div class="decision-number">

                    ${index + 1}

                </div>


                <div class="decision-body">

                    <strong>
                        Keputusan
                    </strong>


                    <div class="decision-text">

                        ${formatMultiline(
                            item.decision ||
                            "-"
                        )}

                    </div>


                    <div class="decision-meta-grid">

                        <div class="decision-meta">

                            <span>
                                Penanggung Jawab
                            </span>

                            <strong>
                                ${escapeHtml(
                                    item.responsible_person ||
                                    "-"
                                )}
                            </strong>

                        </div>


                        <div class="decision-meta">

                            <span>
                                Target
                            </span>

                            <strong>
                                ${
                                    item.target_date
                                        ? escapeHtml(
                                            formatDate(
                                                item.target_date
                                            )
                                        )
                                        : "-"
                                }
                            </strong>

                        </div>


                        <div class="decision-meta">

                            <span>
                                Status Tindak Lanjut
                            </span>

                            <span
                                class="
                                    follow-up-badge
                                    follow-${escapeHtml(
                                        item.follow_up_status ||
                                        "belum"
                                    )}
                                "
                            >
                                ${escapeHtml(
                                    status
                                )}
                            </span>

                        </div>


                        <div class="decision-meta">

                            <span>
                                Keterangan
                            </span>

                            <strong>
                                ${
                                    item.notes
                                        ? escapeHtml(
                                            item.notes
                                        )
                                        : "-"
                                }
                            </strong>

                        </div>

                    </div>

                </div>

            `;


            el.detailDecisions
                .appendChild(card);

        }
    );

}


// ==========================================
// OPENING / CLOSING
// ==========================================

function renderOpeningClosing() {

    const opening =
        (
            currentNotula?.opening_notes ||
            ""
        ).trim();


    const closing =
        (
            currentNotula?.closing_notes ||
            ""
        ).trim();


    if (opening) {

        el.detailOpeningBlock
            ?.classList
            .remove("hidden");


        if (
            el.detailOpeningNotes
        ) {

            el.detailOpeningNotes.innerHTML =
                formatMultiline(
                    opening
                );

        }

    } else {

        el.detailOpeningBlock
            ?.classList
            .add("hidden");

    }


    if (closing) {

        el.detailClosingBlock
            ?.classList
            .remove("hidden");


        if (
            el.detailClosingNotes
        ) {

            el.detailClosingNotes.innerHTML =
                formatMultiline(
                    closing
                );

        }

    } else {

        el.detailClosingBlock
            ?.classList
            .add("hidden");

    }

}


// ==========================================
// LOADING
// ==========================================

function setLoading(
    isLoading
) {

    if (!el.notulaLoading) {
        return;
    }


    if (isLoading) {

        el.notulaLoading
            .classList
            .remove("hidden");

    } else {

        el.notulaLoading
            .classList
            .add("hidden");

    }

}


// ==========================================
// CLEAR DETAIL
// ==========================================

function clearDetail() {

    currentNotula =
        null;


    el.notulaDetailSection
        ?.classList
        .add("hidden");


    if (
        el.detailAttendees
    ) {

        el.detailAttendees.innerHTML =
            "";

    }


    if (
        el.detailDiscussions
    ) {

        el.detailDiscussions.innerHTML =
            "";

    }


    if (
        el.detailDecisions
    ) {

        el.detailDecisions.innerHTML =
            "";

    }

}


// ==========================================
// PAGE MESSAGE
// ==========================================

function showPageMessage(
    message,
    type = "info"
) {

    if (!el.pageMessage) {
        return;
    }


    el.pageMessage.textContent =
        message;


    el.pageMessage.className =
        `page-message ${type}`;


    el.pageMessage
        .classList
        .remove("hidden");


    clearTimeout(
        showPageMessage.timer
    );


    showPageMessage.timer =
        setTimeout(
            () => {

                el.pageMessage
                    ?.classList
                    .add("hidden");

            },
            5000
        );

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
// FORMAT TIME
// ==========================================

function cleanTime(
    value
) {

    if (!value) {
        return "";
    }


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


    if (
        s &&
        e
    ) {

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
// MULTILINE
// ==========================================

function formatMultiline(
    value
) {

    return escapeHtml(
        String(
            value || "-"
        )
    )
        .replace(
            /\r?\n/g,
            "<br>"
        );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
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
// SET TEXT
// ==========================================

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        value ?? "-";

}


// ==========================================
// FRIENDLY ERROR
// ==========================================

function getFriendlySupabaseError(
    error
) {

    if (!error) {

        return "Terjadi kesalahan.";

    }


    if (
        error.code === "42501"
    ) {

        return (
            "Akses data Notula ditolak oleh database."
        );

    }


    if (
        error.code === "PGRST116"
    ) {

        return (
            "Notula yang dipilih tidak ditemukan."
        );

    }


    if (
        error.message
    ) {

        return error.message;

    }


    return (
        "Gagal memuat data Notula."
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

window.muatNotula =
    loadNotula;

window.bersihkanPencarian =
    () => {

        if (
            el.notulaSearch
        ) {

            el.notulaSearch.value =
                "";

        }

        renderNotulaList();

    };

window.kembaliDashboard =
    kembaliDashboard;