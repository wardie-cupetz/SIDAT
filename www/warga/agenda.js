// ==================================================
// SIDAT - AGENDA WARGA
// Viewer Agenda Kegiatan + Jadwal Ronda
// ==================================================

"use strict";

console.log("SIDAT: Agenda WARGA memuat...");


// ==================================================
// SUPABASE
// ==================================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==================================================
// KONSTANTA
// ==================================================

const HARI = {
    1: "Minggu",
    2: "Senin",
    3: "Selasa",
    4: "Rabu",
    5: "Kamis",
    6: "Jumat",
    7: "Sabtu"
};

const HARI_URUT = [
    2,
    3,
    4,
    5,
    6,
    7,
    1
];


// ==================================================
// STATE
// ==================================================

let agendaData = [];
let rondaData = [];
let myResidentId = null;
let currentSession = null;


// ==================================================
// ELEMENT
// ==================================================

const agendaList =
    document.getElementById(
        "agendaList"
    );

const rondaList =
    document.getElementById(
        "rondaList"
    );


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// ==================================================
// MESSAGE
// ==================================================

function showPageMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "pageMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "page-message " +
        type;

    if (!message) {

        element.classList.add(
            "hidden"
        );

        return;
    }

    setTimeout(
        () => {

            element.classList.add(
                "hidden"
            );

        },
        5000
    );
}


// ==================================================
// SESSION
// ==================================================

async function getValidSession() {

    let {
        data,
        error
    } =
        await supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    let session =
        data?.session || null;

    if (!session) {
        return null;
    }


    const expiresAt =
        Number(
            session.expires_at || 0
        );

    const now =
        Math.floor(
            Date.now() / 1000
        );


    if (
        expiresAt &&
        expiresAt - now < 60
    ) {

        const refresh =
            await supabaseClient.auth.refreshSession();

        if (refresh.error) {
            throw refresh.error;
        }

        session =
            refresh.data?.session ||
            null;
    }


    if (session?.access_token) {

        localStorage.setItem(
            "sidat_access_token",
            session.access_token
        );

    }


    return session;
}


// ==================================================
// RESIDENT ID
// ==================================================

async function loadMyResidentId() {

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "get_my_resident_id"
        );

    if (error) {
        throw error;
    }


    myResidentId =
        data || null;


    if (!myResidentId) {

        throw new Error(
            "Data warga untuk akun ini tidak ditemukan."
        );
    }


    return myResidentId;
}


// ==================================================
// FORMAT TANGGAL
// ==================================================

function formatTanggal(
    value
) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            value + "T00:00:00"
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
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// ==================================================
// FORMAT JENIS
// ==================================================

function formatJenisAgenda(
    type
) {

    const map = {

        rapat_rt:
            "Rapat RT",

        kerja_bakti:
            "Kerja Bakti",

        pertemuan_warga:
            "Pertemuan Warga",

        kegiatan_sosial:
            "Kegiatan Sosial",

        lainnya:
            "Lainnya"

    };

    return (
        map[type] ||
        type ||
        "-"
    );
}


// ==================================================
// FORMAT STATUS
// ==================================================

function formatStatus(
    status
) {

    const map = {

        scheduled:
            "Terjadwal",

        completed:
            "Selesai",

        cancelled:
            "Dibatalkan"

    };

    return (
        map[status] ||
        status ||
        "-"
    );
}


// ==================================================
// FORMAT JAM
// ==================================================

function formatJam(
    start,
    end
) {

    if (!start && !end) {
        return "-";
    }

    const mulai =
        start
            ? String(start).slice(0, 5)
            : "-";

    const selesai =
        end
            ? String(end).slice(0, 5)
            : "-";

    if (
        mulai === "-" &&
        selesai !== "-"
    ) {
        return selesai;
    }

    if (
        mulai !== "-" &&
        selesai === "-"
    ) {
        return mulai;
    }

    return `${mulai} – ${selesai}`;
}


// ==================================================
// ICON
// ==================================================

function iconCalendar() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="4"
                width="18"
                height="17"
                rx="2"
            ></rect>

            <path d="M16 2v4"></path>
            <path d="M8 2v4"></path>
            <path d="M3 10h18"></path>
        </svg>
    `;
}


function iconClock() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
            ></circle>

            <path
                d="M12 7v5l3 2"
            ></path>
        </svg>
    `;
}


function iconLocation() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"
            ></path>

            <circle
                cx="12"
                cy="10"
                r="2.5"
            ></circle>
        </svg>
    `;
}


function iconUsers() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            ></path>

            <circle
                cx="9"
                cy="7"
                r="4"
            ></circle>

            <path
                d="M22 21v-2a4 4 0 0 0-3-3.87"
            ></path>

            <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
            ></path>
        </svg>
    `;
}


function iconShield() {

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
            ></path>

            <path
                d="M9 12l2 2 4-4"
            ></path>
        </svg>
    `;
}


// ==================================================
// AGENDA QUERY
// ==================================================

async function loadAgenda() {

    const loading =
        document.getElementById(
            "agendaLoading"
        );

    const empty =
        document.getElementById(
            "agendaEmpty"
        );


    loading.classList.remove(
        "hidden"
    );

    empty.classList.add(
        "hidden"
    );

    agendaList.innerHTML = "";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("agendas")
                .select(`
                    id,
                    title,
                    type,
                    event_date,
                    start_time,
                    end_time,
                    location,
                    description,
                    target_type,
                    target_user_id,
                    status
                `)
                .or(
                    `target_type.eq.all,target_user_id.eq.${myResidentId}`
                )
                .order(
                    "event_date",
                    {
                        ascending: true
                    }
                )
                .order(
                    "start_time",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        agendaData =
            data || [];


        renderAgenda();

    }
    catch (error) {

        console.error(
            "SIDAT Agenda load:",
            error
        );

        showPageMessage(
            "Gagal memuat agenda: " +
            error.message,
            "error"
        );

    }
    finally {

        loading.classList.add(
            "hidden"
        );

    }
}


// ==================================================
// RENDER AGENDA
// ==================================================

function renderAgenda() {

    const empty =
        document.getElementById(
            "agendaEmpty"
        );


    agendaList.innerHTML = "";


    if (!agendaData.length) {

        empty.classList.remove(
            "hidden"
        );

        return;
    }


    empty.classList.add(
        "hidden"
    );


    agendaData.forEach(
        agenda => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "agenda-card";


            if (
                agenda.status ===
                "cancelled"
            ) {

                article.classList.add(
                    "agenda-cancelled"
                );

            }


            const targetLabel =
                agenda.target_type === "user"
                    ? "Khusus Warga"
                    : "Semua Warga";


            article.innerHTML = `

                <div class="agenda-card-top">

                    <div class="agenda-heading">

                        <span class="agenda-type">
                            ${escapeHTML(
                                formatJenisAgenda(
                                    agenda.type
                                )
                            )}
                        </span>

                        <h3>
                            ${escapeHTML(
                                agenda.title
                            )}
                        </h3>

                    </div>

                    <span
                        class="status-badge status-${escapeHTML(
                            agenda.status || ""
                        )}"
                    >
                        ${escapeHTML(
                            formatStatus(
                                agenda.status
                            )
                        )}
                    </span>

                </div>


                <div class="agenda-info">

                    <div class="info-row">

                        <span class="info-icon">
                            ${iconCalendar()}
                        </span>

                        <div>
                            <strong>Tanggal</strong>

                            <span>
                                ${escapeHTML(
                                    formatTanggal(
                                        agenda.event_date
                                    )
                                )}
                            </span>
                        </div>

                    </div>


                    <div class="info-row">

                        <span class="info-icon">
                            ${iconClock()}
                        </span>

                        <div>
                            <strong>Jam</strong>

                            <span>
                                ${escapeHTML(
                                    formatJam(
                                        agenda.start_time,
                                        agenda.end_time
                                    )
                                )}
                            </span>
                        </div>

                    </div>


                    <div class="info-row">

                        <span class="info-icon">
                            ${iconLocation()}
                        </span>

                        <div>
                            <strong>Lokasi</strong>

                            <span>
                                ${escapeHTML(
                                    agenda.location ||
                                    "-"
                                )}
                            </span>
                        </div>

                    </div>


                    <div class="info-row">

                        <span class="info-icon">
                            ${iconUsers()}
                        </span>

                        <div>
                            <strong>Peserta</strong>

                            <span>
                                ${escapeHTML(
                                    targetLabel
                                )}
                            </span>
                        </div>

                    </div>

                </div>


                ${
                    agenda.description
                        ? `
                            <div class="agenda-description">
                                ${escapeHTML(
                                    agenda.description
                                )}
                            </div>
                        `
                        : ""
                }

            `;


            agendaList.appendChild(
                article
            );

        }
    );
}


// ==================================================
// RONDA QUERY
// ==================================================

async function loadRonda() {

    const loading =
        document.getElementById(
            "rondaLoading"
        );

    const empty =
        document.getElementById(
            "rondaEmpty"
        );


    loading.classList.remove(
        "hidden"
    );

    empty.classList.add(
        "hidden"
    );

    rondaList.innerHTML = "";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("ronda_schedule")
                .select(`
                    id,
                    day_of_week,
                    resident_id,
                    start_time,
                    end_time,
                    is_active,
                    residents (
                        resident_code,
                        name
                    )
                `)
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "day_of_week",
                    {
                        ascending: true
                    }
                )
                .order(
                    "start_time",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        rondaData =
            data || [];


        renderRonda();

    }
    catch (error) {

        console.error(
            "SIDAT Ronda load:",
            error
        );

        showPageMessage(
            "Gagal memuat jadwal ronda: " +
            error.message,
            "error"
        );

    }
    finally {

        loading.classList.add(
            "hidden"
        );

    }
}


// ==================================================
// RENDER RONDA
// ==================================================

function renderRonda() {

    const empty =
        document.getElementById(
            "rondaEmpty"
        );


    rondaList.innerHTML = "";


    if (!rondaData.length) {

        empty.classList.remove(
            "hidden"
        );

        return;
    }


    empty.classList.add(
        "hidden"
    );


    HARI_URUT.forEach(
        day => {

            const rows =
                rondaData.filter(
                    item =>
                        Number(
                            item.day_of_week
                        ) === day
                );


            if (!rows.length) {
                return;
            }


            const dayCard =
                document.createElement(
                    "section"
                );


            dayCard.className =
                "ronda-day-card";


            const rowsHTML =
                rows.map(
                    item => {

                        const resident =
                            item.residents ||
                            {};


                        const isMine =
                            String(
                                item.resident_id
                            ) ===
                            String(
                                myResidentId
                            );


                        return `

                            <div
                                class="ronda-row ${
                                    isMine
                                        ? "ronda-row-mine"
                                        : ""
                                }"
                            >

                                <div class="ronda-person">

                                    <div class="ronda-person-icon">
                                        ${iconShield()}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                resident.name ||
                                                "-"
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                resident.resident_code ||
                                                "-"
                                            )}
                                        </span>

                                    </div>

                                    ${
                                        isMine
                                            ? `
                                                <span class="mine-badge">
                                                    Jadwal Saya
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                <div class="ronda-time">

                                    <span class="info-icon">
                                        ${iconClock()}
                                    </span>

                                    <span>
                                        ${escapeHTML(
                                            formatJam(
                                                item.start_time,
                                                item.end_time
                                            )
                                        )}
                                    </span>

                                </div>

                            </div>

                        `;
                    }
                )
                .join("");


            dayCard.innerHTML = `

                <div class="ronda-day-header">

                    <strong>
                        ${escapeHTML(
                            HARI[day]
                        )}
                    </strong>

                    <span>
                        ${rows.length}
                        ${rows.length === 1
                            ? "peserta"
                            : "peserta"}
                    </span>

                </div>


                <div class="ronda-day-body">
                    ${rowsHTML}
                </div>

            `;


            rondaList.appendChild(
                dayCard
            );

        }
    );
}


// ==================================================
// BACK
// ==================================================

function handleBack() {

    window.location.href =
        "dashboard.html";
}


// ==================================================
// INIT
// ==================================================

async function init() {

    try {

        currentSession =
            await getValidSession();


        if (!currentSession) {

            localStorage.removeItem(
                "sidat_access_token"
            );

            window.location.href =
                "../index.html";

            return;
        }


        await loadMyResidentId();


        await Promise.all([
            loadAgenda(),
            loadRonda()
        ]);


        console.log(
            "SIDAT: Agenda WARGA berhasil diinisialisasi."
        );

    }
    catch (error) {

        console.error(
            "SIDAT Agenda WARGA init error:",
            error
        );


        showPageMessage(
            "Gagal memuat halaman Agenda: " +
            error.message,
            "error"
        );

    }
}


// ==================================================
// EVENT
// ==================================================

document
    .getElementById(
        "btnBack"
    )
    .addEventListener(
        "click",
        handleBack
    );


document.addEventListener(
    "DOMContentLoaded",
    init
);