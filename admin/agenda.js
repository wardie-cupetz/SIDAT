// ==================================================
// SIDAT - AGENDA
// ==================================================

console.log("SIDAT: Agenda memuat...");


// ==================================================
// SUPABASE
// ==================================================

let supabaseClient = null;

function initSupabase() {

    if (
        typeof SUPABASE_URL === "undefined" ||
        typeof SUPABASE_KEY === "undefined"
    ) {
        throw new Error(
            "Konfigurasi Supabase tidak ditemukan."
        );
    }

    if (
        typeof supabase === "undefined" ||
        !supabase.createClient
    ) {
        throw new Error(
            "Library Supabase belum dimuat."
        );
    }

    supabaseClient =
        supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
}


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

let eligibleResidents = [];

let currentRondaDay = null;


// ==================================================
// ELEMENT
// ==================================================

const agendaModal =
    document.getElementById(
        "agendaModal"
    );

const rondaModal =
    document.getElementById(
        "rondaModal"
    );

const agendaForm =
    document.getElementById(
        "agendaForm"
    );

const rondaForm =
    document.getElementById(
        "rondaForm"
    );


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

    element.textContent = message;

    element.className =
        "page-message " +
        type;

    setTimeout(
        () => {
            element.classList.add(
                "hidden"
            );
        },
        4000
    );
}


function showFormMessage(
    elementId,
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "form-message " +
        (message ? type : "");
}


// ==================================================
// ESCAPE HTML
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
// FORMAT TANGGAL
// ==================================================

function formatTanggal(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            value + "T00:00:00"
        );

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// ==================================================
// FORMAT JENIS AGENDA
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

    return map[type] || type || "-";
}


// ==================================================
// FORMAT STATUS
// ==================================================

function formatStatus(status) {

    const map = {

        scheduled:
            "Terjadwal",

        completed:
            "Selesai",

        cancelled:
            "Dibatalkan"

    };

    return map[status] || status || "-";
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

    return `${mulai} – ${selesai}`;
}


// ==================================================
// VALIDASI JAM
// ==================================================

function validasiJam(
    start,
    end
) {

    if (!start || !end) {
        return true;
    }

    return end > start;
}


// ==================================================
// MODAL
// ==================================================

function openModal(
    modal
) {

    modal.classList.remove(
        "hidden"
    );

    document.body.classList.add(
        "modal-open"
    );
}


function closeModal(
    modal
) {

    modal.classList.add(
        "hidden"
    );

    if (
        agendaModal.classList.contains(
            "hidden"
        ) &&
        rondaModal.classList.contains(
            "hidden"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );
    }
}


// ==================================================
// AGENDA - LOAD
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

    const list =
        document.getElementById(
            "agendaList"
        );

    loading.classList.remove(
        "hidden"
    );

    empty.classList.add(
        "hidden"
    );

    list.innerHTML = "";

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("agendas")
                .select("*")
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
            "Load agenda:",
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
// AGENDA - RENDER
// ==================================================

function renderAgenda() {

    const list =
        document.getElementById(
            "agendaList"
        );

    const empty =
        document.getElementById(
            "agendaEmpty"
        );

    list.innerHTML = "";

    if (
        !agendaData.length
    ) {

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

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "agenda-card";


            card.innerHTML = `

                <div class="agenda-card-top">

                    <div>

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

                    <span class="status-badge status-${escapeHTML(
                        agenda.status
                    )}">
                        ${escapeHTML(
                            formatStatus(
                                agenda.status
                            )
                        )}
                    </span>

                </div>


                <div class="agenda-details">

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

                    <div>
                        <strong>Lokasi</strong>
                        <span>
                            ${escapeHTML(
                                agenda.location ||
                                "-"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Peserta</strong>
                        <span>
                            ${
                                agenda.target_type ===
                                "user"
                                    ? "Warga tertentu"
                                    : "Semua Warga"
                            }
                        </span>
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


                <div class="agenda-actions">

                    <button
                        type="button"
                        class="btn-small btn-edit"
                        data-agenda-edit="${agenda.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn-small btn-delete"
                        data-agenda-delete="${agenda.id}"
                    >
                        Hapus
                    </button>

                </div>

            `;


            list.appendChild(
                card
            );
        }
    );


    list
        .querySelectorAll(
            "[data-agenda-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .agendaEdit;

                        editAgenda(id);

                    }
                );

            }
        );


    list
        .querySelectorAll(
            "[data-agenda-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .agendaDelete;

                        deleteAgenda(id);

                    }
                );

            }
        );
}


// ==================================================
// LOAD WARGA TARGET AGENDA
// ==================================================

async function loadAgendaTargetResidents() {

    const select =
        document.getElementById(
            "agendaTargetUser"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Memuat Warga...
        </option>
    `;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("residents")
                .select(
                    "id,resident_code,name,family_status,account_created,auth_id,is_active"
                )
                .eq(
                    "is_active",
                    true
                )
                .eq(
                    "account_created",
                    true
                )
                .not(
                    "auth_id",
                    "is",
                    null
                )
                .order(
                    "resident_code",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }


        const warga =
            (data || [])
                .filter(
                    resident =>
                        resident.family_status ===
                            "Kepala Keluarga"
                );


        select.innerHTML = `
            <option value="">
                Pilih Warga
            </option>
        `;


        warga.forEach(
            resident => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    resident.id;

                option.textContent =
                    `${resident.resident_code} - ${resident.name}`;

                select.appendChild(
                    option
                );

            }
        );

    }
    catch (error) {

        console.error(
            "Load target warga:",
            error
        );

        select.innerHTML = `
            <option value="">
                Gagal memuat Warga
            </option>
        `;
    }
}


// ==================================================
// AGENDA - RESET FORM
// ==================================================

function resetAgendaForm() {

    agendaForm.reset();

    document.getElementById(
        "agendaId"
    ).value = "";

    document.getElementById(
        "agendaStatus"
    ).value = "scheduled";

    document.getElementById(
        "agendaTargetType"
    ).value = "all";

    document.getElementById(
        "agendaTargetUserGroup"
    ).classList.add(
        "hidden"
    );

    document.getElementById(
        "agendaModalTitle"
    ).textContent =
        "Tambah Agenda";

    showFormMessage(
        "agendaFormMessage",
        ""
    );

    document.getElementById(
        "btnSaveAgenda"
    ).textContent =
        "Simpan Agenda";
}


// ==================================================
// AGENDA - OPEN ADD
// ==================================================

function openTambahAgenda() {

    resetAgendaForm();

    openModal(
        agendaModal
    );
}


// ==================================================
// AGENDA - EDIT
// ==================================================

function editAgenda(id) {

    const agenda =
        agendaData.find(
            item =>
                item.id === id
        );

    if (!agenda) {
        return;
    }


    document.getElementById(
        "agendaId"
    ).value =
        agenda.id;


    document.getElementById(
        "agendaTitle"
    ).value =
        agenda.title || "";


    document.getElementById(
        "agendaType"
    ).value =
        agenda.type || "rapat_rt";


    document.getElementById(
        "agendaDate"
    ).value =
        agenda.event_date || "";


    document.getElementById(
        "agendaStatus"
    ).value =
        agenda.status || "scheduled";


    document.getElementById(
        "agendaStartTime"
    ).value =
        agenda.start_time
            ? String(
                agenda.start_time
            ).slice(0, 5)
            : "";


    document.getElementById(
        "agendaEndTime"
    ).value =
        agenda.end_time
            ? String(
                agenda.end_time
            ).slice(0, 5)
            : "";


    document.getElementById(
        "agendaLocation"
    ).value =
        agenda.location || "";


    document.getElementById(
        "agendaDescription"
    ).value =
        agenda.description || "";


    document.getElementById(
        "agendaTargetType"
    ).value =
        agenda.target_type || "all";


    document.getElementById(
        "agendaTargetUserGroup"
    ).classList.toggle(
        "hidden",
        agenda.target_type !== "user"
    );


    document.getElementById(
        "agendaTargetUser"
    ).value =
        agenda.target_user_id || "";


    document.getElementById(
        "agendaModalTitle"
    ).textContent =
        "Edit Agenda";


    document.getElementById(
        "btnSaveAgenda"
    ).textContent =
        "Simpan Perubahan";


    showFormMessage(
        "agendaFormMessage",
        ""
    );


    openModal(
        agendaModal
    );
}


// ==================================================
// AGENDA - SAVE
// ==================================================

async function saveAgenda() {

    const id =
        document.getElementById(
            "agendaId"
        ).value;


    const title =
        document.getElementById(
            "agendaTitle"
        ).value.trim();


    const type =
        document.getElementById(
            "agendaType"
        ).value;


    const eventDate =
        document.getElementById(
            "agendaDate"
        ).value;


    const status =
        document.getElementById(
            "agendaStatus"
        ).value;


    const startTime =
        document.getElementById(
            "agendaStartTime"
        ).value || null;


    const endTime =
        document.getElementById(
            "agendaEndTime"
        ).value || null;


    const location =
        document.getElementById(
            "agendaLocation"
        ).value.trim();


    const description =
        document.getElementById(
            "agendaDescription"
        ).value.trim();


    const targetType =
        document.getElementById(
            "agendaTargetType"
        ).value;


    const targetUserId =
        targetType === "user"
            ? (
                document.getElementById(
                    "agendaTargetUser"
                ).value || null
            )
            : null;


    if (!title) {

        showFormMessage(
            "agendaFormMessage",
            "Judul agenda wajib diisi."
        );

        return;
    }


    if (!eventDate) {

        showFormMessage(
            "agendaFormMessage",
            "Tanggal agenda wajib diisi."
        );

        return;
    }


    if (
        !validasiJam(
            startTime,
            endTime
        )
    ) {

        showFormMessage(
            "agendaFormMessage",
            "Jam selesai harus lebih besar dari jam mulai."
        );

        return;
    }


    if (
        targetType === "user" &&
        !targetUserId
    ) {

        showFormMessage(
            "agendaFormMessage",
            "Silakan pilih Warga tertentu."
        );

        return;
    }


    const payload = {

        title,

        type,

        event_date:
            eventDate,

        start_time:
            startTime,

        end_time:
            endTime,

        location:
            location || null,

        description:
            description || null,

        target_type:
            targetType,

        target_user_id:
            targetUserId,

        status

    };


    const button =
        document.getElementById(
            "btnSaveAgenda"
        );


    button.disabled =
        true;


    try {

        let error = null;


        if (id) {

            ({
                error
            } =
                await supabaseClient
                    .from("agendas")
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    ));

        }
        else {

            ({
                error
            } =
                await supabaseClient
                    .from("agendas")
                    .insert(
                        payload
                    ));

        }


        if (error) {
            throw error;
        }


        closeModal(
            agendaModal
        );


        showPageMessage(
            id
                ? "Agenda berhasil diperbarui."
                : "Agenda berhasil ditambahkan.",
            "success"
        );


        await loadAgenda();

    }
    catch (error) {

        console.error(
            "Save agenda:",
            error
        );


        showFormMessage(
            "agendaFormMessage",
            "Gagal menyimpan agenda: " +
            error.message
        );

    }
    finally {

        button.disabled =
            false;

    }
}


// ==================================================
// AGENDA - DELETE
// ==================================================

async function deleteAgenda(id) {

    const agenda =
        agendaData.find(
            item =>
                item.id === id
        );


    if (!agenda) {
        return;
    }


    const confirmed =
        window.confirm(
            `Hapus agenda "${agenda.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("agendas")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showPageMessage(
            "Agenda berhasil dihapus.",
            "success"
        );


        await loadAgenda();

    }
    catch (error) {

        console.error(
            "Delete agenda:",
            error
        );


        showPageMessage(
            "Gagal menghapus agenda: " +
            error.message,
            "error"
        );
    }
}


// ==================================================
// RONDA - LOAD ELIGIBLE RESIDENTS
// ==================================================

async function loadEligibleResidents() {

    try {

        const [
            residentsResult,
            householdsResult,
            profilesResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("residents")
                    .select(
                        "id,resident_code,name,family_status,account_created,auth_id,is_active"
                    )
                    .eq(
                        "is_active",
                        true
                    )
                    .eq(
                        "account_created",
                        true
                    )
                    .not(
                        "auth_id",
                        "is",
                        null
                    ),

                supabaseClient
                    .from("households")
                    .select(
                        "kk_number,head_resident_id"
                    ),

                supabaseClient
                    .from("profiles")
                    .select(
                        "user_id,resident_id,role"
                    )
                    .eq(
                        "role",
                        "warga"
                    )

            ]);


        if (residentsResult.error) {
            throw residentsResult.error;
        }

        if (householdsResult.error) {
            throw householdsResult.error;
        }

        if (profilesResult.error) {
            throw profilesResult.error;
        }


        const headIds =
            new Set(
                (householdsResult.data || [])
                    .map(
                        item =>
                            item.head_resident_id
                    )
                    .filter(Boolean)
            );


        const wargaProfileIds =
            new Set(
                (profilesResult.data || [])
                    .map(
                        item =>
                            item.resident_id
                    )
                    .filter(Boolean)
            );


        eligibleResidents =
            (residentsResult.data || [])
                .filter(
                    resident =>

                        resident.family_status ===
                            "Kepala Keluarga"

                        &&

                        headIds.has(
                            resident.id
                        )

                        &&

                        wargaProfileIds.has(
                            resident.id
                        )
                )
                .sort(
                    (a, b) =>
                        String(
                            a.resident_code
                        ).localeCompare(
                            String(
                                b.resident_code
                            )
                        )
                );


        console.log(
            "Warga eligible ronda:",
            eligibleResidents
        );

    }
    catch (error) {

        console.error(
            "Load eligible residents:",
            error
        );

        eligibleResidents =
            [];

        throw error;
    }
}


// ==================================================
// RONDA - LOAD SCHEDULE
// ==================================================

async function loadRonda() {

    const loading =
        document.getElementById(
            "rondaLoading"
        );

    loading.classList.remove(
        "hidden"
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("ronda_schedule")
                .select(
                    `
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
                    `
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
            "Load ronda:",
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
// RONDA - RENDER
// ==================================================

function renderRonda() {

    const tbody =
        document.getElementById(
            "rondaTableBody"
        );

    const empty =
        document.getElementById(
            "rondaEmpty"
        );


    tbody.innerHTML = "";


    if (!rondaData.length) {

        empty.classList.remove(
            "hidden"
        );

    }
    else {

        empty.classList.add(
            "hidden"
        );
    }


    HARI_URUT.forEach(
        day => {

            const rows =
                rondaData.filter(
                    item =>
                        Number(
                            item.day_of_week
                        ) === day &&
                        item.is_active !== false
                );


            if (!rows.length) {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td>
                        <strong>
                            ${HARI[day]}
                        </strong>
                    </td>

                    <td class="empty-cell">
                        —
                    </td>

                    <td class="empty-cell">
                        —
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-small btn-primary-small"
                            data-ronda-add="${day}"
                        >
                            Tambah
                        </button>

                    </td>

                `;


                tbody.appendChild(
                    tr
                );


                return;
            }


            rows.forEach(
                (item, index) => {

                    const resident =
                        item.residents ||
                        {};


                    const tr =
                        document.createElement(
                            "tr"
                        );


                    tr.innerHTML = `

                        <td>

                            ${
                                index === 0
                                    ? `
                                        <strong>
                                            ${HARI[day]}
                                        </strong>
                                    `
                                    : `
                                        <span class="same-day">
                                            ${HARI[day]}
                                        </span>
                                    `
                            }

                        </td>


                        <td>

                            <div class="resident-cell">

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

                        </td>


                        <td>
                            ${escapeHTML(
                                formatJam(
                                    item.start_time,
                                    item.end_time
                                )
                            )}
                        </td>


                        <td>

                            <div class="row-actions">

                                <button
                                    type="button"
                                    class="btn-small btn-edit"
                                    data-ronda-edit="${item.id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="btn-small btn-delete"
                                    data-ronda-delete="${item.id}"
                                >
                                    Hapus
                                </button>

                            </div>

                        </td>

                    `;


                    tbody.appendChild(
                        tr
                    );

                }
            );


            const addTr =
                document.createElement(
                    "tr"
                );


            addTr.innerHTML = `

                <td colspan="3"></td>

                <td>

                    <button
                        type="button"
                        class="btn-small btn-primary-small"
                        data-ronda-add="${day}"
                    >
                        Tambah
                    </button>

                </td>

            `;


            tbody.appendChild(
                addTr
            );

        }
    );


    tbody
        .querySelectorAll(
            "[data-ronda-add]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openTambahRonda(
                            Number(
                                button.dataset
                                    .rondaAdd
                            )
                        );

                    }
                );

            }
        );


    tbody
        .querySelectorAll(
            "[data-ronda-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editRonda(
                            button.dataset
                                .rondaEdit
                        );

                    }
                );

            }
        );


    tbody
        .querySelectorAll(
            "[data-ronda-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteRonda(
                            button.dataset
                                .rondaDelete
                        );

                    }
                );

            }
        );
}


// ==================================================
// RONDA - RESET FORM
// ==================================================

function resetRondaForm() {

    rondaForm.reset();

    document.getElementById(
        "rondaId"
    ).value = "";

    document.getElementById(
        "rondaDay"
    ).value =
        currentRondaDay || "";


    document.getElementById(
        "rondaResidentId"
    ).value = "";


    document.getElementById(
        "rondaResidentSearch"
    ).value = "";


    document.getElementById(
        "rondaResidentResults"
    ).innerHTML = "";


    document.getElementById(
        "selectedRondaResident"
    ).innerHTML = "";


    document.getElementById(
        "selectedRondaResident"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "rondaStartTime"
    ).value =
        "20:00";


    document.getElementById(
        "rondaEndTime"
    ).value =
        "23:00";


    document.getElementById(
        "rondaModalTitle"
    ).textContent =
        "Tambah Jadwal Ronda";


    document.getElementById(
        "btnSaveRonda"
    ).textContent =
        "Simpan Jadwal";


    showFormMessage(
        "rondaFormMessage",
        ""
    );
}


// ==================================================
// RONDA - SELECT RESIDENT
// ==================================================

function selectRondaResident(
    resident
) {

    document.getElementById(
        "rondaResidentId"
    ).value =
        resident.id;


    document.getElementById(
        "rondaResidentSearch"
    ).value =
        resident.name;


    document.getElementById(
        "rondaResidentResults"
    ).innerHTML = "";


    const selected =
        document.getElementById(
            "selectedRondaResident"
        );


    selected.innerHTML = `

        <div>

            <strong>
                ${escapeHTML(
                    resident.name
                )}
            </strong>

            <span>
                ${escapeHTML(
                    resident.resident_code
                )}
            </span>

        </div>

        <button
            type="button"
            id="btnClearRondaResident"
            aria-label="Ganti warga"
        >
            Ganti
        </button>

    `;


    selected.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "btnClearRondaResident"
        )
        .addEventListener(
            "click",
            clearRondaResident
        );
}


// ==================================================
// RONDA - CLEAR RESIDENT
// ==================================================

function clearRondaResident() {

    document.getElementById(
        "rondaResidentId"
    ).value = "";


    document.getElementById(
        "rondaResidentSearch"
    ).value = "";


    document.getElementById(
        "rondaResidentResults"
    ).innerHTML = "";


    document.getElementById(
        "selectedRondaResident"
    ).classList.add(
        "hidden"
    );


    document
        .getElementById(
            "rondaResidentSearch"
        )
        .focus();
}


// ==================================================
// RONDA - SEARCH RESIDENT
// ==================================================

function searchRondaResidents(
    keyword
) {

    const results =
        document.getElementById(
            "rondaResidentResults"
        );


    const query =
        keyword
            .trim()
            .toLowerCase();


    if (!query) {

        results.innerHTML =
            "";

        return;
    }


    const filtered =
        eligibleResidents
            .filter(
                resident => {

                    const name =
                        String(
                            resident.name ||
                            ""
                        )
                            .toLowerCase();

                    const code =
                        String(
                            resident.resident_code ||
                            ""
                        )
                            .toLowerCase();

                    return (
                        name.includes(
                            query
                        ) ||
                        code.includes(
                            query
                        )
                    );
                }
            )
            .slice(
                0,
                10
            );


    if (!filtered.length) {

        results.innerHTML = `
            <div class="search-empty">
                Warga tidak ditemukan.
            </div>
        `;

        return;
    }


    results.innerHTML = "";


    filtered.forEach(
        resident => {

            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "resident-search-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(
                        resident.name
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        resident.resident_code
                    )}
                </span>

            `;


            item.addEventListener(
                "click",
                () =>
                    selectRondaResident(
                        resident
                    )
            );


            results.appendChild(
                item
            );

        }
    );
}


// ==================================================
// RONDA - ADD
// ==================================================

function openTambahRonda(
    day
) {

    currentRondaDay =
        day;


    resetRondaForm();


    document.getElementById(
        "rondaDay"
    ).value =
        day;


    document.getElementById(
        "rondaDayLabel"
    ).textContent =
        HARI[day];


    openModal(
        rondaModal
    );
}


// ==================================================
// RONDA - EDIT
// ==================================================

function editRonda(id) {

    const item =
        rondaData.find(
            row =>
                row.id === id
        );


    if (!item) {
        return;
    }


    currentRondaDay =
        Number(
            item.day_of_week
        );


    resetRondaForm();


    document.getElementById(
        "rondaId"
    ).value =
        item.id;


    document.getElementById(
        "rondaDay"
    ).value =
        item.day_of_week;


    document.getElementById(
        "rondaDayLabel"
    ).textContent =
        HARI[
            Number(
                item.day_of_week
            )
        ];


    document.getElementById(
        "rondaStartTime"
    ).value =
        item.start_time
            ? String(
                item.start_time
            ).slice(0, 5)
            : "20:00";


    document.getElementById(
        "rondaEndTime"
    ).value =
        item.end_time
            ? String(
                item.end_time
            ).slice(0, 5)
            : "23:00";


    const resident =
        eligibleResidents.find(
            person =>
                person.id ===
                item.resident_id
        );


    if (resident) {

        selectRondaResident(
            resident
        );

    }
    else {

        document.getElementById(
            "rondaResidentId"
        ).value =
            item.resident_id;

    }


    document.getElementById(
        "rondaModalTitle"
    ).textContent =
        "Edit Jadwal Ronda";


    document.getElementById(
        "btnSaveRonda"
    ).textContent =
        "Simpan Perubahan";


    openModal(
        rondaModal
    );
}


// ==================================================
// RONDA - SAVE
// ==================================================

async function saveRonda() {

    const id =
        document.getElementById(
            "rondaId"
        ).value;


    const day =
        Number(
            document.getElementById(
                "rondaDay"
            ).value
        );


    const residentId =
        document.getElementById(
            "rondaResidentId"
        ).value;


    const startTime =
        document.getElementById(
            "rondaStartTime"
        ).value;


    const endTime =
        document.getElementById(
            "rondaEndTime"
        ).value;


    if (!day || !HARI[day]) {

        showFormMessage(
            "rondaFormMessage",
            "Hari ronda tidak valid."
        );

        return;
    }


    if (!residentId) {

        showFormMessage(
            "rondaFormMessage",
            "Silakan pilih Warga."
        );

        return;
    }


    if (
        !validasiJam(
            startTime,
            endTime
        )
    ) {

        showFormMessage(
            "rondaFormMessage",
            "Jam selesai harus lebih besar dari jam mulai."
        );

        return;
    }


    const payload = {

        day_of_week:
            day,

        resident_id:
            residentId,

        start_time:
            startTime,

        end_time:
            endTime,

        is_active:
            true

    };


    const button =
        document.getElementById(
            "btnSaveRonda"
        );


    button.disabled =
        true;


    try {

        let error = null;


        if (id) {

            ({
                error
            } =
                await supabaseClient
                    .from("ronda_schedule")
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    ));

        }
        else {

            ({
                error
            } =
                await supabaseClient
                    .from("ronda_schedule")
                    .insert(
                        payload
                    ));

        }


        if (error) {

            if (
                error.code ===
                "23505"
            ) {

                throw new Error(
                    "Warga tersebut sudah memiliki jadwal ronda pada hari ini."
                );
            }


            throw error;
        }


        closeModal(
            rondaModal
        );


        showPageMessage(
            id
                ? "Jadwal ronda berhasil diperbarui."
                : "Jadwal ronda berhasil ditambahkan.",
            "success"
        );


        await loadRonda();

    }
    catch (error) {

        console.error(
            "Save ronda:",
            error
        );


        showFormMessage(
            "rondaFormMessage",
            "Gagal menyimpan jadwal ronda: " +
            error.message
        );

    }
    finally {

        button.disabled =
            false;

    }
}


// ==================================================
// RONDA - DELETE
// ==================================================

async function deleteRonda(id) {

    const item =
        rondaData.find(
            row =>
                row.id === id
        );


    if (!item) {
        return;
    }


    const resident =
        item.residents ||
        {};


    const confirmed =
        window.confirm(
            `Hapus jadwal ronda ${resident.name || "Warga"} pada hari ${HARI[item.day_of_week]}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("ronda_schedule")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showPageMessage(
            "Jadwal ronda berhasil dihapus.",
            "success"
        );


        await loadRonda();

    }
    catch (error) {

        console.error(
            "Delete ronda:",
            error
        );


        showPageMessage(
            "Gagal menghapus jadwal ronda: " +
            error.message,
            "error"
        );
    }
}


// ==================================================
// TARGET AGENDA
// ==================================================

function handleAgendaTargetType() {

    const type =
        document.getElementById(
            "agendaTargetType"
        ).value;


    document
        .getElementById(
            "agendaTargetUserGroup"
        )
        .classList.toggle(
            "hidden",
            type !== "user"
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
// EVENT LISTENERS
// ==================================================

document
    .getElementById(
        "btnTambahAgenda"
    )
    .addEventListener(
        "click",
        openTambahAgenda
    );


document
    .getElementById(
        "btnCloseAgendaModal"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(
                agendaModal
            )
    );


document
    .getElementById(
        "btnCancelAgenda"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(
                agendaModal
            )
    );


document
    .getElementById(
        "btnCloseRondaModal"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(
                rondaModal
            )
    );


document
    .getElementById(
        "btnCancelRonda"
    )
    .addEventListener(
        "click",
        () =>
            closeModal(
                rondaModal
            )
    );


document
    .getElementById(
        "agendaTargetType"
    )
    .addEventListener(
        "change",
        handleAgendaTargetType
    );


document
    .getElementById(
        "rondaResidentSearch"
    )
    .addEventListener(
        "input",
        event =>
            searchRondaResidents(
                event.target.value
            )
    );


agendaForm
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveAgenda();

        }
    );


rondaForm
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveRonda();

        }
    );


document
    .getElementById(
        "btnBack"
    )
    .addEventListener(
        "click",
        handleBack
    );


// ==================================================
// MODAL OVERLAY
// ==================================================

document
    .querySelectorAll(
        ".modal-overlay"
    )
    .forEach(
        overlay => {

            overlay.addEventListener(
                "click",
                () => {

                    const modal =
                        overlay.closest(
                            ".modal"
                        );

                    if (modal) {
                        closeModal(
                            modal
                        );
                    }

                }
            );

        }
    );


// ==================================================
// INIT
// ==================================================

async function init() {

    try {

        initSupabase();

        await Promise.all([
            loadAgendaTargetResidents(),
            loadEligibleResidents()
        ]);

        await Promise.all([
            loadAgenda(),
            loadRonda()
        ]);


        console.log(
            "SIDAT: Agenda berhasil diinisialisasi."
        );

    }
    catch (error) {

        console.error(
            "SIDAT Agenda init error:",
            error
        );


        showPageMessage(
            "Gagal memuat halaman Agenda: " +
            error.message,
            "error"
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    init
);