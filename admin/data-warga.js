/* =========================================================
   SIDAT — DATA WARGA
   File : admin/data-warga.js
   Versi: Rebuild Data Warga Final
          + Preview Import Fix
          + Auto Account WARGA Fix

   Catatan:
   - Dashboard tidak disentuh.
   - admin-menu.js tetap menjadi pengelola menu bawah.
   - Fungsi simpan utama: saveResident()
   - Kepala Keluarga mendapatkan akun WARGA otomatis.
   - Preview import tidak menulis database.
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       STATE
       ===================================================== */

    const state = {
        client: null,

        residents: [],
        households: [],

        filteredHeads: [],

        editingResident: null,
        familyHead: null,
        familyMembers: [],

        importRows: [],
        importValidated: false,
        importResult: null,

        isLoading: false
    };


    /* =====================================================
       ELEMENT HELPER
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function qs(selector, parent) {
        return (parent || document).querySelector(selector);
    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       FATAL ERROR
       ===================================================== */

    function showFatalError(message) {

        const container =
            $("keluargaList");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="sidat-error-state">

                <div class="sidat-error-icon">
                    ⚠️
                </div>

                <h3>
                    Data Warga tidak dapat dimuat
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="btn-primary"
                    id="btnRetryDataWarga"
                >
                    Coba Lagi
                </button>

            </div>
        `;

        $("btnRetryDataWarga")
            ?.addEventListener(
                "click",
                loadData
            );
    }


    /* =====================================================
       INIT SUPABASE
       ===================================================== */

    function initSupabase() {

        if (
            typeof window.supabase === "undefined" ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.error(
                "SIDAT Supabase Client Error: Supabase SDK belum tersedia."
            );

            showFatalError(
                "Supabase SDK belum tersedia. Pastikan supabase-js dimuat sebelum data-warga.js."
            );

            return false;
        }

        if (
            typeof SUPABASE_URL !== "string" ||
            !SUPABASE_URL
        ) {

            console.error(
                "SIDAT Supabase Client Error: SUPABASE_URL tidak tersedia."
            );

            showFatalError(
                "SUPABASE_URL tidak tersedia."
            );

            return false;
        }

        if (
            typeof SUPABASE_KEY !== "string" ||
            !SUPABASE_KEY
        ) {

            console.error(
                "SIDAT Supabase Client Error: SUPABASE_KEY tidak tersedia."
            );

            showFatalError(
                "SUPABASE_KEY tidak tersedia."
            );

            return false;
        }

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {

            state.client =
                window.supabaseClient;

            return true;
        }

        try {

            state.client =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );

            window.supabaseClient =
                state.client;

            return true;

        } catch (error) {

            console.error(
                "SIDAT Supabase Client Error:",
                error
            );

            showFatalError(
                "Gagal membuat koneksi Supabase."
            );

            return false;
        }
    }


    /* =====================================================
       SESSION
       ===================================================== */

    async function checkSession() {

        const {
            data,
            error
        } = await state.client.auth.getSession();

        if (error) {
            throw error;
        }

        if (
            !data ||
            !data.session
        ) {

            window.location.href =
                "../index.html";

            return false;
        }

        return true;
    }


    /* =====================================================
       LOAD DATA
       ===================================================== */

    async function loadData() {

        if (state.isLoading) {
            return;
        }

        setLoading(true);

        try {

            const sessionOK =
                await checkSession();

            if (!sessionOK) {
                return;
            }

            await Promise.all([
                loadResidents(),
                loadHouseholds()
            ]);

            updateSummary();

            state.filteredHeads =
                state.residents.filter(
                    function (resident) {

                        return (
                            resident.family_status ===
                            "Kepala Keluarga"
                        );
                    }
                );

            renderHeadList();

        } catch (error) {

            console.error(
                "Data Warga load error:",
                error
            );

            showFatalError(
                error?.message ||
                "Terjadi kesalahan saat mengambil data warga."
            );

        } finally {

            setLoading(false);
        }
    }


    /* =====================================================
       LOAD RESIDENTS
       ===================================================== */

    async function loadResidents() {

        const {
            data,
            error
        } = await state.client
            .from("residents")
            .select(`
                id,
                resident_code,
                nik,
                kk_number,
                name,
                birth_place,
                birth_date,
                gender,
                address,
                house_number,
                phone,
                family_status,
                photo_url,
                jimpitan_balance,
                qr_token,
                is_active,
                created_at,
                updated_at,
                auth_email,
                account_created,
                auth_id,
                must_change_pin
            `)
            .eq("is_active", true)
            .order("name", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        state.residents =
            data || [];
    }


    /* =====================================================
       LOAD HOUSEHOLDS
       ===================================================== */

    async function loadHouseholds() {

        const {
            data,
            error
        } = await state.client
            .from("households")
            .select(`
                id,
                kk_number,
                head_resident_id,
                address,
                jimpitan_balance,
                qr_token,
                created_at
            `)
            .order("kk_number", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        state.households =
            data || [];
    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateSummary() {

        const heads =
            state.residents.filter(
                function (resident) {

                    return (
                        resident.family_status ===
                        "Kepala Keluarga"
                    );
                }
            );

        const kkNumbers =
            new Set();

        state.residents.forEach(
            function (resident) {

                if (resident.kk_number) {

                    kkNumbers.add(
                        resident.kk_number
                    );
                }
            }
        );

        if ($("totalKepalaKeluarga")) {

            $("totalKepalaKeluarga")
                .textContent =
                heads.length;
        }

        if ($("totalWarga")) {

            $("totalWarga")
                .textContent =
                state.residents.length;
        }

        if ($("totalKK")) {

            $("totalKK")
                .textContent =
                kkNumbers.size;
        }
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function filterHeads() {

        const input =
            $("searchWarga");

        const keyword =
            input
                ? input.value
                    .trim()
                    .toLowerCase()
                : "";

        const heads =
            state.residents.filter(
                function (resident) {

                    return (
                        resident.family_status ===
                        "Kepala Keluarga"
                    );
                }
            );

        if (!keyword) {

            state.filteredHeads =
                heads;

            renderHeadList();

            return;
        }

        state.filteredHeads =
            heads.filter(
                function (resident) {

                    const text = [
                        resident.name,
                        resident.nik,
                        resident.kk_number,
                        resident.resident_code,
                        resident.address,
                        resident.phone
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return text.includes(
                        keyword
                    );
                }
            );

        renderHeadList();
    }


    /* =====================================================
       RENDER HEAD LIST
       ===================================================== */

    function renderHeadList() {

        const container =
            $("keluargaList");

        if (!container) {
            return;
        }

        let heads =
            state.filteredHeads;

        if (!Array.isArray(heads)) {
            heads = [];
        }

        if (!heads.length) {

            heads =
                state.residents.filter(
                    function (resident) {

                        return (
                            resident.family_status ===
                            "Kepala Keluarga"
                        );
                    }
                );
        }

        if (!heads.length) {

            container.innerHTML = `
                <div class="sidat-empty-state">

                    <div class="sidat-empty-icon">
                        👨‍👩‍👧‍👦
                    </div>

                    <h3>
                        Belum ada Kepala Keluarga
                    </h3>

                    <p>
                        Tambahkan data warga untuk mulai
                        membangun data keluarga.
                    </p>

                    <button
                        type="button"
                        class="btn-primary"
                        id="btnEmptyTambah"
                    >
                        Tambah Warga
                    </button>

                </div>
            `;

            $("btnEmptyTambah")
                ?.addEventListener(
                    "click",
                    openAddResident
                );

            return;
        }

        container.innerHTML =
            heads
                .map(renderHeadCard)
                .join("");

        container
            .querySelectorAll(
                "[data-head-id]"
            )
            .forEach(
                function (card) {

                    card.addEventListener(
                        "click",
                        function () {

                            const id =
                                card.getAttribute(
                                    "data-head-id"
                                );

                            if (id) {
                                openFamily(id);
                            }
                        }
                    );
                }
            );
    }


    /* =====================================================
       HEAD CARD
       ===================================================== */

    function renderHeadCard(head) {

        const memberCount =
            state.residents.filter(
                function (resident) {

                    return (
                        resident.kk_number &&
                        resident.kk_number ===
                        head.kk_number
                    );
                }
            ).length;

        const household =
            state.households.find(
                function (item) {

                    return (
                        item.kk_number ===
                        head.kk_number
                    );
                }
            );

        const address =
            head.address ||
            household?.address ||
            "-";

        const accountStatus =
            head.account_created
                ? "Akun WARGA aktif"
                : "Akun WARGA belum dibuat";

        return `
            <article
                class="keluarga-card"
                data-head-id="${escapeHtml(head.id)}"
            >

                <div class="keluarga-card-main">

                    <div class="keluarga-avatar">
                        ${getInitials(head.name)}
                    </div>

                    <div class="keluarga-info">

                        <div class="keluarga-name">
                            ${escapeHtml(head.name)}
                        </div>

                        <div class="keluarga-meta">
                            KK
                            ${escapeHtml(
                                head.kk_number || "-"
                            )}
                        </div>

                        <div class="keluarga-address">
                            ${escapeHtml(address)}
                        </div>

                    </div>

                </div>

                <div class="keluarga-card-footer">

                    <span>
                        👨‍👩‍👧‍👦
                        ${memberCount} anggota
                    </span>

                    <span>
                        ${escapeHtml(accountStatus)}
                    </span>

                    <span class="keluarga-arrow">
                        ›
                    </span>

                </div>

            </article>
        `;
    }


    /* =====================================================
       INITIALS
       ===================================================== */

    function getInitials(name) {

        if (!name) {
            return "?";
        }

        const parts =
            String(name)
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (!parts.length) {
            return "?";
        }

        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }


    /* =====================================================
       OPEN FAMILY
       ===================================================== */

    function openFamily(headId) {

        const head =
            state.residents.find(
                function (resident) {

                    return resident.id === headId;
                }
            );

        if (!head) {

            console.warn(
                "SIDAT: Kepala Keluarga tidak ditemukan:",
                headId
            );

            return;
        }

        state.familyHead =
            head;

        state.familyMembers =
            state.residents
                .filter(
                    function (resident) {

                        return (
                            resident.kk_number &&
                            resident.kk_number ===
                            head.kk_number
                        );
                    }
                )
                .sort(
                    function (a, b) {

                        if (
                            a.family_status ===
                            "Kepala Keluarga"
                        ) {
                            return -1;
                        }

                        if (
                            b.family_status ===
                            "Kepala Keluarga"
                        ) {
                            return 1;
                        }

                        return String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            ),
                            "id"
                        );
                    }
                );

        renderFamilyModal();

        showModal(
            "familyModal"
        );
    }


    /* =====================================================
       FAMILY MODAL
       ===================================================== */

    function renderFamilyModal() {

        const content =
            $("familyModalContent");

        if (
            !content ||
            !state.familyHead
        ) {
            return;
        }

        const head =
            state.familyHead;

        const modalTitle =
            $("familyModalTitle");

        if (modalTitle) {

            modalTitle.textContent =
                "Keluarga " +
                head.name;
        }

        content.innerHTML = `

            <div class="family-summary">

                <div>
                    <span>Nomor KK</span>
                    <strong>
                        ${escapeHtml(
                            head.kk_number || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Kepala Keluarga</span>
                    <strong>
                        ${escapeHtml(
                            head.name
                        )}
                    </strong>
                </div>

                <div>
                    <span>Anggota</span>
                    <strong>
                        ${state.familyMembers.length}
                    </strong>
                </div>

            </div>

            <div class="family-actions">

                <button
                    type="button"
                    class="btn-primary"
                    id="familyEditHead"
                >
                    Edit KK
                </button>

                <button
                    type="button"
                    class="btn-secondary"
                    id="familyAddMember"
                >
                    + Tambah Anggota
                </button>

                <button
                    type="button"
                    class="btn-secondary"
                    id="familyQr"
                >
                    QR Token
                </button>

                <button
                    type="button"
                    class="btn-secondary"
                    id="familyPin"
                >
                    Ubah PIN
                </button>

            </div>

            <div class="family-members">

                ${
                    state.familyMembers.length
                        ? state.familyMembers
                            .map(
                                renderFamilyMember
                            )
                            .join("")
                        : `
                            <div class="family-empty">
                                Belum ada anggota keluarga.
                            </div>
                        `
                }

            </div>
        `;

        $("familyEditHead")
            ?.addEventListener(
                "click",
                function () {

                    closeModal(
                        "familyModal"
                    );

                    openEditResident(
                        head.id
                    );
                }
            );

        $("familyAddMember")
            ?.addEventListener(
                "click",
                function () {

                    closeModal(
                        "familyModal"
                    );

                    openAddMember(
                        head
                    );
                }
            );

        $("familyQr")
            ?.addEventListener(
                "click",
                function () {

                    showQrToken(
                        head
                    );
                }
            );

        $("familyPin")
            ?.addEventListener(
                "click",
                function () {

                    openChangePin(
                        head
                    );
                }
            );

        content
            .querySelectorAll(
                "[data-member-action]"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        handleMemberAction
                    );
                }
            );
    }


    /* =====================================================
       FAMILY MEMBER
       ===================================================== */

    function renderFamilyMember(member) {

        const isHead =
            member.family_status ===
            "Kepala Keluarga";

        return `
            <div class="family-member">

                <div class="family-member-avatar">
                    ${getInitials(member.name)}
                </div>

                <div class="family-member-info">

                    <strong>
                        ${escapeHtml(
                            member.name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            member.family_status ||
                            "-"
                        )}
                    </span>

                    <small>
                        ${escapeHtml(
                            member.resident_code ||
                            ""
                        )}
                    </small>

                </div>

                <div class="family-member-actions">

                    <button
                        type="button"
                        data-member-action="edit"
                        data-id="${escapeHtml(member.id)}"
                    >
                        Edit
                    </button>

                    ${
                        isHead
                            ? ""
                            : `
                                <button
                                    type="button"
                                    data-member-action="move"
                                    data-id="${escapeHtml(member.id)}"
                                >
                                    Pindah KK
                                </button>

                                <button
                                    type="button"
                                    data-member-action="delete"
                                    data-id="${escapeHtml(member.id)}"
                                >
                                    Hapus
                                </button>
                            `
                    }

                </div>

            </div>
        `;
    }


    /* =====================================================
       MEMBER ACTION
       ===================================================== */

    function handleMemberAction(event) {

        event.stopPropagation();

        const button =
            event.currentTarget;

        const action =
            button.getAttribute(
                "data-member-action"
            );

        const id =
            button.getAttribute(
                "data-id"
            );

        if (!id) {
            return;
        }

        if (action === "edit") {

            closeModal(
                "familyModal"
            );

            openEditResident(id);

            return;
        }

        if (action === "move") {

            openMoveResident(id);

            return;
        }

        if (action === "delete") {

            deleteResident(id);

            return;
        }
    }


    /* =====================================================
       ADD RESIDENT
       ===================================================== */

    function openAddResident() {

        state.editingResident =
            null;

        openResidentForm({
            mode: "add",
            resident: null,
            head: null
        });
    }


    /* =====================================================
       ADD MEMBER
       ===================================================== */

    function openAddMember(head) {

        if (!head) {
            return;
        }

        state.editingResident =
            null;

        openResidentForm({
            mode: "add-member",
            resident: null,
            head: head
        });
    }


    /* =====================================================
       EDIT RESIDENT
       ===================================================== */

    function openEditResident(id) {

        const resident =
            state.residents.find(
                function (item) {

                    return item.id === id;
                }
            );

        if (!resident) {
            return;
        }

        state.editingResident =
            resident;

        let head =
            null;

        if (
            resident.family_status ===
            "Kepala Keluarga"
        ) {

            head =
                resident;

        } else if (
            resident.kk_number
        ) {

            head =
                state.residents.find(
                    function (item) {

                        return (
                            item.kk_number ===
                            resident.kk_number &&
                            item.family_status ===
                            "Kepala Keluarga"
                        );
                    }
                ) || null;
        }

        openResidentForm({
            mode: "edit",
            resident: resident,
            head: head
        });
    }


    /* =====================================================
   RESIDENT FORM
   ===================================================== */

function openResidentForm(options) {

    const form =
        $("residentForm");

    if (!form) {
        return;
    }

    const resident =
        options.resident;

    const head =
        options.head;

    const title =
        $("residentModalTitle");

    if (title) {

        if (
            options.mode ===
            "edit"
        ) {

            title.textContent =
                "Edit Data Warga";

        } else if (
            options.mode ===
            "add-member"
        ) {

            title.textContent =
                "Tambah Anggota Keluarga";

        } else {

            title.textContent =
                "Tambah Warga";
        }
    }

    setValue(
        "residentId",
        resident?.id || ""
    );

    setValue(
        "residentName",
        resident?.name || ""
    );

    setValue(
        "residentNik",
        resident?.nik || ""
    );

    setValue(
        "residentGender",
        resident?.gender || ""
    );

    /*
     * Status keluarga:
     *
     * EDIT:
     *   gunakan status warga yang sudah ada.
     *
     * TAMBAH ANGGOTA:
     *   default Anak jika belum ada status.
     *
     * TAMBAH WARGA:
     *   default Kepala Keluarga.
     */
    setValue(
        "residentFamilyStatus",
        resident?.family_status ||
        (
            options.mode ===
            "add-member"
                ? "Anak"
                : "Kepala Keluarga"
        )
    );

    setValue(
        "residentKk",
        resident?.kk_number ||
        head?.kk_number ||
        ""
    );

    setValue(
        "residentBirthPlace",
        resident?.birth_place ||
        ""
    );

    setValue(
        "residentBirthDate",
        resident?.birth_date ||
        ""
    );

    setValue(
        "residentAddress",
        resident?.address ||
        head?.address ||
        ""
    );

    setValue(
        "residentHouseNumber",
        resident?.house_number ||
        ""
    );

    setValue(
        "residentPhone",
        resident?.phone ||
        ""
    );

    /*
     * STATUS KELUARGA TIDAK DIKUNCI.
     *
     * Sebelumnya:
     *
     * status.disabled =
     *     options.mode === "add-member" &&
     *     !!head;
     *
     * Baris tersebut menyebabkan dropdown
     * Status Keluarga terkunci saat Tambah Anggota.
     *
     * Sekarang dropdown selalu aktif.
     */
    const status =
        $("residentFamilyStatus");

    if (status) {

        status.disabled = false;

    }

    const accountInfo =
        $("accountInfo");

    const accountInfoText =
        $("accountInfoText");

    if (
        accountInfo &&
        accountInfoText
    ) {

        if (
            resident &&
            resident.family_status ===
            "Kepala Keluarga"
        ) {

            accountInfo.hidden =
                false;

            accountInfoText.textContent =
                resident.account_created
                    ? "Akun WARGA sudah tersedia."
                    : "Akun WARGA akan dibuat otomatis setelah data disimpan.";

        } else {

            accountInfo.hidden =
                true;
        }
    }

    showModal(
        "residentModal"
    );
}

    /* =====================================================
       SAVE RESIDENT
       ===================================================== */

    async function saveResident(event) {

        event.preventDefault();

        if (!state.client) {
            return;
        }

        const id =
            getValue(
                "residentId"
            );

        const name =
            getValue(
                "residentName"
            ).trim();

        const nik =
            getValue(
                "residentNik"
            ).trim();

        const gender =
            getValue(
                "residentGender"
            );

        const familyStatus =
            getValue(
                "residentFamilyStatus"
            );

        const kkNumber =
            getValue(
                "residentKk"
            ).trim();

        const birthPlace =
            getValue(
                "residentBirthPlace"
            ).trim();

        const birthDate =
            getValue(
                "residentBirthDate"
            ) || null;

        const address =
            getValue(
                "residentAddress"
            ).trim();

        const houseNumber =
            getValue(
                "residentHouseNumber"
            ).trim();

        const phone =
            getValue(
                "residentPhone"
            ).trim();

        if (!name) {

            alert(
                "Nama warga wajib diisi."
            );

            return;
        }

        if (
            familyStatus ===
            "Kepala Keluarga" &&
            !kkNumber
        ) {

            alert(
                "Nomor KK wajib diisi."
            );

            return;
        }

        const payload = {
            name:
                name,

            nik:
                nik || null,

            kk_number:
                kkNumber || null,

            birth_place:
                birthPlace || null,

            birth_date:
                birthDate,

            gender:
                gender || null,

            address:
                address || null,

            house_number:
                houseNumber || null,

            phone:
                phone || null,

            family_status:
                familyStatus || null
        };

        const button =
            $("btnSaveResident");

        setButtonLoading(
            button,
            true,
            "Menyimpan..."
        );

        try {

            let residentId =
                id;

            if (id) {

                const {
                    data,
                    error
                } = await state.client
                    .from("residents")
                    .update(payload)
                    .eq("id", id)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                residentId =
                    data.id;

            } else {

                const {
                    data,
                    error
                } = await state.client
                    .from("residents")
                    .insert(payload)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                residentId =
                    data.id;
            }

            if (
                familyStatus ===
                "Kepala Keluarga"
            ) {

                await ensureHousehold(
                    kkNumber,
                    residentId,
                    address
                );
            }

            let accountWarning =
                "";

            if (
                familyStatus ===
                "Kepala Keluarga"
            ) {

                const resident =
                    await getResidentById(
                        residentId
                    );

                if (
                    resident &&
                    !resident.account_created
                ) {

                    try {

                        await createResidentAccount(
                            resident
                        );

                    } catch (accountError) {

                        console.error(
                            "Create resident account error:",
                            accountError
                        );

                        accountWarning =
                            "\n\nData warga berhasil disimpan, tetapi akun WARGA belum berhasil dibuat.\n\n" +
                            getFunctionErrorMessage(
                                accountError
                            );
                    }
                }
            }

            closeModal(
                "residentModal"
            );

            await reloadData();

            if (accountWarning) {

                alert(
                    "Data warga berhasil disimpan." +
                    accountWarning
                );

            } else {

                alert(
                    "Data warga berhasil disimpan."
                );
            }

        } catch (error) {

            console.error(
                "Save resident error:",
                error
            );

            alert(
                "Gagal menyimpan data warga:\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );

        } finally {

            setButtonLoading(
                button,
                false,
                "Simpan"
            );
        }
    }


    /* =====================================================
       GET RESIDENT
       ===================================================== */

    async function getResidentById(id) {

        const {
            data,
            error
        } = await state.client
            .from("residents")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }


    /* =====================================================
       ENSURE HOUSEHOLD
       ===================================================== */

    async function ensureHousehold(
        kkNumber,
        headResidentId,
        address
    ) {

        if (!kkNumber) {
            return null;
        }

        const {
            data: existing,
            error: findError
        } = await state.client
            .from("households")
            .select("*")
            .eq(
                "kk_number",
                kkNumber
            )
            .maybeSingle();

        if (findError) {
            throw findError;
        }

        if (existing) {

            const updatePayload = {
                head_resident_id:
                    headResidentId
            };

            if (address) {

                updatePayload.address =
                    address;
            }

            const {
                data,
                error
            } = await state.client
                .from("households")
                .update(
                    updatePayload
                )
                .eq(
                    "id",
                    existing.id
                )
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        }

        const {
            data,
            error
        } = await state.client
            .from("households")
            .insert({
                kk_number:
                    kkNumber,

                head_resident_id:
                    headResidentId,

                address:
                    address || null
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }


    /* =====================================================
       CREATE RESIDENT ACCOUNT
       ===================================================== */

    async function createResidentAccount(
        resident
    ) {

        if (!resident) {
            return null;
        }

        if (
            resident.family_status !==
            "Kepala Keluarga"
        ) {
            return null;
        }

        if (
            resident.account_created
        ) {
            return null;
        }

        console.log(
            "SIDAT: Membuat akun WARGA otomatis:",
            resident.name,
            resident.id
        );

        const {
            data,
            error
        } = await state.client
            .functions
            .invoke(
                "create-resident-account",
                {
                    body: {
                        resident_id:
                            resident.id
                    }
                }
            );

        if (error) {
            throw error;
        }

        if (
            data &&
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Akun WARGA gagal dibuat."
            );
        }

        console.log(
            "SIDAT: Akun WARGA berhasil dibuat:",
            resident.name
        );

        return data;
    }


    /* =====================================================
       EDGE FUNCTION ERROR READER
       ===================================================== */

    function getFunctionErrorMessage(
        error
    ) {

        if (!error) {
            return "Error tidak diketahui.";
        }

        return (
            error.message ||
            "Edge Function gagal."
        );
    }


    /* =====================================================
       CHANGE PIN
       ===================================================== */

    function openChangePin(head) {

        if (!head) {
            return;
        }

        if (!head.account_created) {

            alert(
                "Kepala Keluarga belum memiliki akun WARGA."
            );

            return;
        }

        const newPin =
            prompt(
                "Masukkan PIN baru 4–6 digit:"
            );

        if (newPin === null) {
            return;
        }

        const pin =
            newPin.trim();

        if (
            !/^\d{4,6}$/.test(pin)
        ) {

            alert(
                "PIN harus terdiri dari 4–6 digit."
            );

            return;
        }

        if (pin === "123456") {

            alert(
                "PIN baru tidak boleh 123456."
            );

            return;
        }

        resetResidentPin(
            head.id,
            pin
        );
    }


    /* =====================================================
   RESET PIN
   ===================================================== */

async function resetResidentPin(
    residentId,
    newPin
) {

    try {

        const {
            data,
            error
        } = await state.client
            .functions
.invoke(
    "reset-resident-pin",
    {
        body: {
            resident_id: residentId,
            pin: newPin
        }
    }
);
        if (error) {
            throw error;
        }

        if (
            data &&
            data.success === false
        ) {
            throw new Error(
                data.message ||
                "PIN gagal diubah."
            );
        }

        alert(
            "PIN WARGA berhasil diubah."
        );

        await reloadData();

    } catch (error) {

        console.error(
            "Reset PIN error:",
            error
        );

        alert(
            "Gagal mengubah PIN:\n\n" +
            (
                error?.message ||
                "Terjadi kesalahan."
            )
        );
    }
}
    /* =====================================================
   QR JIMPITAN
   ===================================================== */

/**
 * Menampilkan QR Jimpitan Kepala Keluarga.
 *
 * PAYLOAD QR:
 *   residents.resident_code
 *
 * Contoh:
 *   RT001
 *   RT002
 *   RT004
 *
 * BUKAN:
 *   residents.id       -> UUID panjang
 *   residents.qr_token
 *   households.qr_token
 */
async function showQrToken(head) {

    if (!head) {
        alert(
            "Data Kepala Keluarga tidak ditemukan."
        );
        return;
    }

    /*
     * ID Warga untuk QR Jimpitan adalah
     * resident_code, contoh RT001.
     */
    const residentCode =
        head.resident_code
            ? String(head.resident_code).trim()
            : "";

    if (!residentCode) {
        alert(
            "ID Warga tidak tersedia.\n\n" +
            "QR Jimpitan tidak dapat dibuat."
        );
        return;
    }

    /*
     * Pastikan library QRCode tersedia.
     */
    try {

        await loadQrCodeLibrary();

    } catch (error) {

        console.error(
            "SIDAT QR Jimpitan library error:",
            error
        );

        alert(
            "Library QR Jimpitan gagal dimuat.\n\n" +
            "Periksa koneksi internet kemudian coba lagi."
        );

        return;
    }

    /*
     * Hapus modal QR lama jika masih ada.
     */
    const oldModal =
        document.getElementById(
            "sidatQrJimpitanModal"
        );

    if (oldModal) {
        oldModal.remove();
    }

    /*
     * Buat modal QR Jimpitan.
     */
    const modal =
        document.createElement("div");

    modal.id =
        "sidatQrJimpitanModal";

    modal.className =
        "sidat-qr-jimpitan-modal";

    modal.setAttribute(
        "role",
        "dialog"
    );

    modal.setAttribute(
        "aria-modal",
        "true"
    );

    modal.setAttribute(
        "aria-labelledby",
        "sidatQrJimpitanTitle"
    );

    modal.innerHTML = `
        <div class="sidat-qr-jimpitan-backdrop"></div>

        <div class="sidat-qr-jimpitan-dialog">

            <div class="sidat-qr-jimpitan-header">

                <div>
                    <h2 id="sidatQrJimpitanTitle">
                        QR Jimpitan
                    </h2>

                    <p>
                        Scan QR untuk transaksi jimpitan
                    </p>
                </div>

                <button
                    type="button"
                    class="sidat-qr-jimpitan-close"
                    id="sidatQrJimpitanClose"
                    aria-label="Tutup"
                >
                    ×
                </button>

            </div>

            <div class="sidat-qr-jimpitan-body">

                <div
                    class="sidat-qr-jimpitan-code"
                    id="sidatQrJimpitanCode"
                ></div>

                <div class="sidat-qr-jimpitan-info">

                    <div class="sidat-qr-jimpitan-label">
                        Nama Warga
                    </div>

                    <div class="sidat-qr-jimpitan-name">
                        ${escapeHtml(
                            head.name || "-"
                        )}
                    </div>

                    <div class="sidat-qr-jimpitan-label">
                        ID Warga
                    </div>

                    <div class="sidat-qr-jimpitan-id">
                        ${escapeHtml(
                            residentCode
                        )}
                    </div>

                </div>

                <div class="sidat-qr-jimpitan-note">
                    QR ini menggunakan ID Warga
                    sebagai identitas transaksi jimpitan.
                </div>

            </div>

            <div class="sidat-qr-jimpitan-footer">

                <button
                    type="button"
                    class="btn-secondary"
                    id="sidatQrJimpitanCloseBottom"
                >
                    Tutup
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    ensureQrJimpitanStyles();

    requestAnimationFrame(function () {
        modal.classList.add("active");
    });

    const qrContainer =
        document.getElementById(
            "sidatQrJimpitanCode"
        );

    if (!qrContainer) {
        return;
    }

    /*
     * =================================================
     * PENTING
     *
     * Isi QR = resident_code
     *
     * Contoh:
     * RT001
     *
     * BUKAN UUID residents.id.
     * =================================================
     */
    try {

        new QRCode(
            qrContainer,
            {
                text: residentCode,

                width: 240,

                height: 240,

                colorDark: "#111827",

                colorLight: "#ffffff",

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );

    } catch (error) {

        console.error(
            "SIDAT QR Jimpitan render error:",
            error
        );

        qrContainer.innerHTML = `
            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#dc2626;
                    font-size:14px;
                "
            >
                QR gagal dibuat.
            </div>
        `;
    }

    function closeQrModal() {

        modal.classList.remove(
            "active"
        );

        setTimeout(
            function () {

                if (
                    modal &&
                    modal.parentNode
                ) {
                    modal.remove();
                }

            },
            180
        );
    }

    document
        .getElementById(
            "sidatQrJimpitanClose"
        )
        ?.addEventListener(
            "click",
            closeQrModal
        );

    document
        .getElementById(
            "sidatQrJimpitanCloseBottom"
        )
        ?.addEventListener(
            "click",
            closeQrModal
        );

    const backdrop =
        modal.querySelector(
            ".sidat-qr-jimpitan-backdrop"
        );

    backdrop?.addEventListener(
        "click",
        closeQrModal
    );

    function handleQrEscape(event) {

        if (
            event.key === "Escape"
        ) {

            closeQrModal();

            document.removeEventListener(
                "keydown",
                handleQrEscape
            );
        }
    }

    document.addEventListener(
        "keydown",
        handleQrEscape
    );
}


/* =====================================================
   LOAD QR CODE LIBRARY
   ===================================================== */

function loadQrCodeLibrary() {

    if (
        typeof window.QRCode !==
        "undefined"
    ) {
        return Promise.resolve();
    }

    if (
        window.__SIDAT_QR_LIBRARY_PROMISE__
    ) {
        return window
            .__SIDAT_QR_LIBRARY_PROMISE__;
    }

    window.__SIDAT_QR_LIBRARY_PROMISE__ =
        new Promise(
            function (
                resolve,
                reject
            ) {

                const existingScript =
                    document.querySelector(
                        'script[data-sidat-qrcode="true"]'
                    );

                if (existingScript) {

                    existingScript.addEventListener(
                        "load",
                        function () {

                            if (
                                typeof window.QRCode !==
                                "undefined"
                            ) {

                                resolve();

                            } else {

                                reject(
                                    new Error(
                                        "QRCode library tidak tersedia."
                                    )
                                );
                            }

                        },
                        {
                            once: true
                        }
                    );

                    existingScript.addEventListener(
                        "error",
                        function () {

                            reject(
                                new Error(
                                    "QRCode library gagal dimuat."
                                )
                            );

                        },
                        {
                            once: true
                        }
                    );

                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";

                script.async = true;

                script.dataset.sidatQrcode =
                    "true";

                script.onload =
                    function () {

                        if (
                            typeof window.QRCode !==
                            "undefined"
                        ) {

                            resolve();

                        } else {

                            reject(
                                new Error(
                                    "QRCode library berhasil dimuat tetapi objek QRCode tidak tersedia."
                                )
                            );
                        }
                    };

                script.onerror =
                    function () {

                        reject(
                            new Error(
                                "Gagal memuat QRCode library."
                            )
                        );
                    };

                document.head.appendChild(
                    script
                );
            }
        );

    return window
        .__SIDAT_QR_LIBRARY_PROMISE__;
}


/* =====================================================
   QR JIMPITAN STYLE
   ===================================================== */

function ensureQrJimpitanStyles() {

    if (
        document.getElementById(
            "sidatQrJimpitanStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "sidatQrJimpitanStyles";

    style.textContent = `
        .sidat-qr-jimpitan-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding:
                max(16px, env(safe-area-inset-top))
                16px
                max(16px, env(safe-area-inset-bottom))
                16px;
            box-sizing: border-box;
            opacity: 0;
            visibility: hidden;
            transition:
                opacity .18s ease,
                visibility .18s ease;
        }

        .sidat-qr-jimpitan-modal.active {
            opacity: 1;
            visibility: visible;
        }

        .sidat-qr-jimpitan-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(
                15,
                23,
                42,
                .62
            );
            backdrop-filter: blur(3px);
        }

        .sidat-qr-jimpitan-dialog {
            position: relative;
            z-index: 1;
            width: min(
                100%,
                390px
            );
            max-height: calc(
                100vh - 32px
            );
            overflow-y: auto;
            background: #ffffff;
            border-radius: 22px;
            box-shadow:
                0 24px 70px
                rgba(
                    15,
                    23,
                    42,
                    .28
                );
            transform:
                translateY(14px)
                scale(.97);
            transition:
                transform .18s ease;
        }

        .sidat-qr-jimpitan-modal.active
        .sidat-qr-jimpitan-dialog {
            transform:
                translateY(0)
                scale(1);
        }

        .sidat-qr-jimpitan-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 17px 17px 14px;
            background:
                linear-gradient(
                    135deg,
                    #15803d,
                    #166534
                );
            color: #ffffff;
        }

        .sidat-qr-jimpitan-header > div:first-child {
            flex: 1;
            min-width: 0;
        }

        .sidat-qr-jimpitan-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            line-height: 1.2;
        }

        .sidat-qr-jimpitan-header p {
            margin: 4px 0 0;
            font-size: 11px;
            line-height: 1.4;
            opacity: .88;
        }

        .sidat-qr-jimpitan-close {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            border: 0;
            border-radius: 12px;
            background: rgba(
                255,
                255,
                255,
                .16
            );
            color: #ffffff;
            font-size: 28px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sidat-qr-jimpitan-body {
            padding: 20px 18px 16px;
            text-align: center;
        }

        .sidat-qr-jimpitan-code {
            width: 260px;
            height: 260px;
            max-width: 100%;
            margin: 0 auto 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            box-sizing: border-box;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
        }

        .sidat-qr-jimpitan-code img {
            display: block;
            width: 240px;
            height: 240px;
            max-width: 100%;
            max-height: 100%;
        }

        .sidat-qr-jimpitan-code canvas {
            display: block;
            width: 240px;
            height: 240px;
            max-width: 100%;
            max-height: 100%;
        }

        .sidat-qr-jimpitan-info {
            padding: 13px 14px;
            border-radius: 15px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            text-align: left;
        }

        .sidat-qr-jimpitan-label {
            margin-top: 7px;
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .sidat-qr-jimpitan-label:first-child {
            margin-top: 0;
        }

        .sidat-qr-jimpitan-name {
            margin-top: 3px;
            color: #172033;
            font-size: 15px;
            font-weight: 800;
            line-height: 1.35;
        }

        .sidat-qr-jimpitan-id {
            margin-top: 3px;
            color: #166534;
            font-family:
                ui-monospace,
                SFMono-Regular,
                Menlo,
                Monaco,
                Consolas,
                monospace;
            font-size: 11px;
            font-weight: 700;
            word-break: break-all;
        }

        .sidat-qr-jimpitan-note {
            margin-top: 12px;
            color: #64748b;
            font-size: 11px;
            line-height: 1.5;
        }

        .sidat-qr-jimpitan-footer {
            display: flex;
            justify-content: center;
            padding: 0 18px 18px;
        }

        .sidat-qr-jimpitan-footer button {
            width: 100%;
            min-height: 44px;
        }

        @media (max-width: 380px) {

            .sidat-qr-jimpitan-dialog {
                border-radius: 18px;
            }

            .sidat-qr-jimpitan-code {
                width: 235px;
                height: 235px;
            }

            .sidat-qr-jimpitan-code img,
            .sidat-qr-jimpitan-code canvas {
                width: 215px;
                height: 215px;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}


    /* =====================================================
       MOVE RESIDENT
       ===================================================== */

    function openMoveResident(id) {

        const resident =
            state.residents.find(
                function (item) {

                    return item.id === id;
                }
            );

        if (!resident) {
            return;
        }

        const currentKK =
            resident.kk_number ||
            "";

        const newKK =
            prompt(
                "Masukkan nomor KK tujuan:",
                currentKK
            );

        if (newKK === null) {
            return;
        }

        const kk =
            newKK.trim();

        if (!kk) {

            alert(
                "Nomor KK tujuan wajib diisi."
            );

            return;
        }

        if (
            kk === currentKK
        ) {

            alert(
                "Warga sudah berada pada KK tersebut."
            );

            return;
        }

        moveResident(
            resident,
            kk
        );
    }


    /* =====================================================
       MOVE PROCESS
       ===================================================== */

    async function moveResident(
        resident,
        newKK
    ) {

        try {

            const {
                data: targetHousehold,
                error: householdError
            } = await state.client
                .from("households")
                .select("*")
                .eq(
                    "kk_number",
                    newKK
                )
                .maybeSingle();

            if (householdError) {
                throw householdError;
            }

            if (!targetHousehold) {

                alert(
                    "KK tujuan belum terdaftar."
                );

                return;
            }

            const {
                error
            } = await state.client
                .from("residents")
                .update({
                    kk_number:
                        newKK,

                    address:
                        targetHousehold.address ||
                        resident.address ||
                        null
                })
                .eq(
                    "id",
                    resident.id
                );

            if (error) {
                throw error;
            }

            alert(
                "Warga berhasil dipindahkan."
            );

            await reloadData();

        } catch (error) {

            console.error(
                "Move resident error:",
                error
            );

            alert(
                "Gagal memindahkan warga:\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );
        }
    }


    /* =====================================================
       DELETE RESIDENT
       ===================================================== */

    async function deleteResident(id) {

        const resident =
            state.residents.find(
                function (item) {

                    return item.id === id;
                }
            );

        if (!resident) {
            return;
        }

        if (
            resident.family_status ===
            "Kepala Keluarga"
        ) {

            alert(
                "Kepala Keluarga tidak dapat dihapus dari menu anggota."
            );

            return;
        }

        const confirmed =
            confirm(
                "Hapus warga berikut?\n\n" +
                resident.name +
                "\n\n" +
                "Tindakan ini tidak dapat dibatalkan."
            );

        if (!confirmed) {
            return;
        }

        try {

            const {
                error
            } = await state.client
                .from("residents")
                .update({
                    is_active:
                        false
                })
                .eq(
                    "id",
                    id
                );

            if (error) {
                throw error;
            }

            alert(
                "Data warga berhasil dihapus."
            );

            await reloadData();

            if (
                state.familyHead
            ) {

                const head =
                    state.residents.find(
                        function (item) {

                            return (
                                item.id ===
                                state.familyHead.id
                            );
                        }
                    );

                if (head) {

                    openFamily(
                        head.id
                    );
                }
            }

        } catch (error) {

            console.error(
                "Delete resident error:",
                error
            );

            alert(
                "Gagal menghapus warga:\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );
        }
    }


    /* =====================================================
       IMPORT EXCEL
       ===================================================== */

    function chooseExcel() {

        const input =
            $("excelFile");

        if (!input) {
            return;
        }

        input.click();
    }


    async function handleExcelFile(
        event
    ) {

        const file =
            event.target.files &&
            event.target.files[0];

        if (!file) {
            return;
        }

        updateSelectedFileInfo(
            file
        );

        try {

            await loadXlsxLibrary();

            const rows =
                await readExcelFile(
                    file
                );

            state.importRows =
                rows;

            state.importValidated =
                false;

            state.importResult =
                null;

            renderImportPreview();

        } catch (error) {

            console.error(
                "Excel read error:",
                error
            );

            alert(
                "Gagal membaca file Excel:\n\n" +
                (
                    error?.message ||
                    "Format file tidak dapat dibaca."
                )
            );
        }
    }


    /* =====================================================
       XLSX LOADER
       ===================================================== */

    function loadXlsxLibrary() {

        if (window.XLSX) {
            return Promise.resolve();
        }

        return new Promise(
            function (
                resolve,
                reject
            ) {

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

                script.onload =
                    function () {

                        resolve();
                    };

                script.onerror =
                    function () {

                        reject(
                            new Error(
                                "Library Excel XLSX gagal dimuat."
                            )
                        );
                    };

                document.head.appendChild(
                    script
                );
            }
        );
    }


    /* =====================================================
       READ EXCEL
       ===================================================== */

    function readExcelFile(
        file
    ) {

        return new Promise(
            function (
                resolve,
                reject
            ) {

                const reader =
                    new FileReader();

                reader.onload =
                    function (event) {

                        try {

                            const workbook =
                                XLSX.read(
                                    event.target.result,
                                    {
                                        type:
                                            "array"
                                    }
                                );

                            const firstSheet =
                                workbook.Sheets[
                                    workbook.SheetNames[0]
                                ];

                            const rows =
                                XLSX.utils.sheet_to_json(
                                    firstSheet,
                                    {
                                        defval:
                                            ""
                                    }
                                );

                            resolve(
                                rows
                            );

                        } catch (error) {

                            reject(
                                error
                            );
                        }
                    };

                reader.onerror =
                    function () {

                        reject(
                            new Error(
                                "File tidak dapat dibaca."
                            )
                        );
                    };

                reader.readAsArrayBuffer(
                    file
                );
            }
        );
    }


    /* =====================================================
       IMPORT PREVIEW
       FIX:
       #previewTable adalah <tbody>
       sehingga hanya boleh berisi <tr>.
       ===================================================== */

    function renderImportPreview() {

        const rows =
            state.importRows || [];

        const total =
            rows.length;

        if ($("previewTotal")) {

            $("previewTotal")
                .textContent =
                total;
        }

        if ($("previewNew")) {

            $("previewNew")
                .textContent =
                total;
        }

        if ($("previewUpdate")) {

            $("previewUpdate")
                .textContent =
                0;
        }

        const tableBody =
            $("previewTable");

        if (!tableBody) {
            return;
        }

        if (!rows.length) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Tidak ada data pada file.
                    </td>
                </tr>
            `;

            showImportStep(
                "preview"
            );

            return;
        }

        const columns =
            Object.keys(
                rows[0]
            );

        /*
         * Gunakan kolom penting jika tersedia.
         * Jika tidak, gunakan seluruh kolom.
         */

        const preferredColumns = [
            "Nama",
            "nama",
            "NIK",
            "nik",
            "Nomor KK",
            "KK",
            "kk",
            "Status Keluarga",
            "family_status",
            "Status",
            "status"
        ];

        const selectedColumns =
            [];

        preferredColumns.forEach(
            function (column) {

                if (
                    columns.includes(column) &&
                    !selectedColumns.includes(column)
                ) {

                    selectedColumns.push(
                        column
                    );
                }
            }
        );

        /*
         * Jika kolom standar tidak lengkap,
         * tetap tampilkan maksimal 8 kolom
         * dari file.
         */

        if (
            selectedColumns.length <
            3
        ) {

            selectedColumns.length =
                0;

            columns
                .slice(
                    0,
                    8
                )
                .forEach(
                    function (column) {

                        selectedColumns.push(
                            column
                        );
                    }
                );
        }

        /*
         * Header mengikuti data file.
         */

        const header =
            selectedColumns
                .map(
                    function (column) {

                        return `
                            <th>
                                ${escapeHtml(
                                    column
                                )}
                            </th>
                        `;
                    }
                )
                .join("");

        /*
         * Isi preview.
         * Tidak lagi membuat <div>/<table>
         * di dalam tbody.
         */

        const body =
            rows
                .slice(
                    0,
                    100
                )
                .map(
                    function (
                        row,
                        index
                    ) {

                        return `
                            <tr>

                                <td>
                                    ${index + 1}
                                </td>

                                ${selectedColumns
                                    .map(
                                        function (
                                            column
                                        ) {

                                            return `
                                                <td>
                                                    ${escapeHtml(
                                                        row[
                                                            column
                                                        ]
                                                    )}
                                                </td>
                                            `;
                                        }
                                    )
                                    .join("")}

                            </tr>
                        `;
                    }
                )
                .join("");

        /*
         * Karena HTML awal sudah menyediakan
         * <table> + <thead> + <tbody id="previewTable">,
         * kita perlu mengisi struktur tabel
         * secara aman.
         */

        const table =
            tableBody.closest(
                "table"
            );

        if (table) {

            const thead =
                table.querySelector(
                    "thead"
                );

            if (thead) {

                thead.innerHTML = `
                    <tr>
                        <th>No</th>
                        ${header}
                    </tr>
                `;
            }
        }

        tableBody.innerHTML =
            body;

        showImportStep(
            "preview"
        );
    }


    /* =====================================================
       VALIDATE IMPORT
       ===================================================== */

    async function validateImport() {

        const rows =
            state.importRows || [];

        if (!rows.length) {

            alert(
                "Tidak ada data untuk divalidasi."
            );

            return;
        }

        const results =
            [];

        const existingNik =
            new Set(
                state.residents
                    .filter(
                        function (item) {

                            return !!item.nik;
                        }
                    )
                    .map(
                        function (item) {

                            return String(
                                item.nik
                            ).trim();
                        }
                    )
            );

        const existingKK =
            new Set(
                state.households
                    .filter(
                        function (item) {

                            return !!item.kk_number;
                        }
                    )
                    .map(
                        function (item) {

                            return String(
                                item.kk_number
                            ).trim();
                        }
                    )
            );

        const nikInFile =
            new Map();

        rows.forEach(
            function (
                row,
                index
            ) {

                const name =
                    normalizeImportValue(
                        row.Nama ||
                        row.nama ||
                        row.NAME ||
                        row["Nama Warga"]
                    );

                const nik =
                    normalizeImportValue(
                        row.NIK ||
                        row.nik
                    );

                const kk =
                    normalizeImportValue(
                        row.KK ||
                        row.kk ||
                        row["Nomor KK"] ||
                        row["KK Number"]
                    );

                const status =
                    normalizeImportValue(
                        row["Status Keluarga"] ||
                        row.family_status ||
                        row.Status ||
                        row.status
                    ) ||
                    "Anggota Keluarga";

                const errors =
                    [];

                if (!name) {

                    errors.push(
                        "Nama kosong"
                    );
                }

                if (
                    nik &&
                    !/^\d{16}$/.test(nik)
                ) {

                    errors.push(
                        "NIK harus 16 digit"
                    );
                }

                if (
                    kk &&
                    !/^\d{16}$/.test(kk)
                ) {

                    errors.push(
                        "Nomor KK harus 16 digit"
                    );
                }

                if (
                    status ===
                    "Kepala Keluarga" &&
                    !kk
                ) {

                    errors.push(
                        "Nomor KK kosong"
                    );
                }

                if (nik) {

                    if (
                        nikInFile.has(
                            nik
                        )
                    ) {

                        errors.push(
                            "NIK duplikat di file"
                        );

                    } else {

                        nikInFile.set(
                            nik,
                            index
                        );
                    }
                }

                let action =
                    "new";

                if (
                    nik &&
                    existingNik.has(
                        nik
                    )
                ) {

                    action =
                        "update";
                }

                if (
                    status ===
                    "Kepala Keluarga" &&
                    kk &&
                    existingKK.has(
                        kk
                    )
                ) {

                    action =
                        "update";
                }

                results.push({
                    row:
                        index + 2,

                    name:
                        name,

                    nik:
                        nik,

                    kk:
                        kk,

                    status:
                        status,

                    action:
                        action,

                    errors:
                        errors,

                    valid:
                        errors.length === 0
                });
            }
        );

        state.importResult =
            results;

        state.importValidated =
            true;

        renderValidationResults();

        showImportStep(
            "validation"
        );
    }


    /* =====================================================
       NORMALIZE IMPORT VALUE
       ===================================================== */

    function normalizeImportValue(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(
            value
        ).trim();
    }


    /* =====================================================
       VALIDATION RESULT
       ===================================================== */

    function renderValidationResults() {

        const results =
            state.importResult || [];

        const valid =
            results.filter(
                function (item) {

                    return item.valid;
                }
            ).length;

        const invalid =
            results.length -
            valid;

        const newCount =
            results.filter(
                function (item) {

                    return (
                        item.valid &&
                        item.action ===
                        "new"
                    );
                }
            ).length;

        const updateCount =
            results.filter(
                function (item) {

                    return (
                        item.valid &&
                        item.action ===
                        "update"
                    );
                }
            ).length;

        if ($("previewNew")) {

            $("previewNew")
                .textContent =
                newCount;
        }

        if ($("previewUpdate")) {

            $("previewUpdate")
                .textContent =
                updateCount;
        }

        const summary =
            $("validationSummary");

        if (summary) {

            summary.innerHTML = `
                <div>
                    <strong>
                        ${results.length}
                    </strong>
                    Total
                </div>

                <div>
                    <strong>
                        ${valid}
                    </strong>
                    Valid
                </div>

                <div>
                    <strong>
                        ${newCount}
                    </strong>
                    Baru
                </div>

                <div>
                    <strong>
                        ${updateCount}
                    </strong>
                    Update
                </div>

                <div>
                    <strong>
                        ${invalid}
                    </strong>
                    Bermasalah
                </div>
            `;
        }

        const container =
            $("validationResults");

        if (!container) {
            return;
        }

        container.innerHTML =
            results
                .map(
                    function (item) {

                        const actionText =
                            item.action ===
                            "update"
                                ? "UPDATE"
                                : "BARU";

                        return `
                            <div
                                class="import-validation-row ${
                                    item.valid
                                        ? "valid"
                                        : "invalid"
                                }"
                            >

                                <div>
                                    Baris
                                    ${item.row}
                                </div>

                                <div>
                                    ${escapeHtml(
                                        item.name ||
                                        "(tanpa nama)"
                                    )}
                                </div>

                                <div>
                                    ${
                                        item.valid
                                            ? `✓ Valid — ${actionText}`
                                            : escapeHtml(
                                                item.errors.join(
                                                    ", "
                                                )
                                            )
                                    }
                                </div>

                            </div>
                        `;
                    }
                )
                .join("");

        const text =
            $("importConfirmText");

        if (text) {

            text.textContent =
                invalid > 0
                    ? "Masih ada data bermasalah. Perbaiki file sebelum import."
                    : `Semua ${valid} data valid. ${newCount} data baru dan ${updateCount} data akan diperbarui.`;
        }
    }


    /* =====================================================
       IMPORT TO DATABASE
       ===================================================== */

    async function executeImport() {

        if (
            !state.importValidated ||
            !state.importResult
        ) {

            alert(
                "Validasi data terlebih dahulu."
            );

            return;
        }

        const invalid =
            state.importResult.filter(
                function (item) {

                    return !item.valid;
                }
            );

        if (invalid.length) {

            alert(
                "Import dibatalkan karena masih ada data bermasalah."
            );

            return;
        }

        const confirmed =
            confirm(
                "Semua data valid.\n\n" +
                "Lanjutkan import ke database?"
            );

        if (!confirmed) {
            return;
        }

        showImportStep(
            "import"
        );

        const rows =
            state.importRows || [];

        let success =
            0;

        let failed =
            0;

        let accountCreated =
            0;

        let accountFailed =
            0;

        const errors =
            [];

        for (
            let index = 0;
            index < rows.length;
            index++
        ) {

            const row =
                rows[index];

            try {

                const result =
                    await importOneRow(
                        row
                    );

                success++;

                if (
                    result &&
                    result.accountCreated
                ) {

                    accountCreated++;
                }

                if (
                    result &&
                    result.accountFailed
                ) {

                    accountFailed++;
                }

            } catch (error) {

                failed++;

                errors.push({
                    row:
                        index + 2,

                    error:
                        error?.message ||
                        String(error)
                });
            }
        }

        const message =
            $("importStepImport");

        if (message) {

            message.innerHTML = `
                <div class="import-finished">

                    <div class="import-success-icon">
                        ${
                            failed
                                ? "⚠️"
                                : "✓"
                        }
                    </div>

                    <h3>
                        Import selesai
                    </h3>

                    <p>
                        Data berhasil:
                        <strong>
                            ${success}
                        </strong>
                    </p>

                    <p>
                        Data gagal:
                        <strong>
                            ${failed}
                        </strong>
                    </p>

                    <p>
                        Akun WARGA dibuat:
                        <strong>
                            ${accountCreated}
                        </strong>
                    </p>

                    <p>
                        Akun WARGA belum dibuat:
                        <strong>
                            ${accountFailed}
                        </strong>
                    </p>

                    ${
                        errors.length
                            ? `
                                <div class="import-errors">

                                    ${errors
                                        .map(
                                            function (
                                                item
                                            ) {

                                                return `
                                                    <div>
                                                        Baris
                                                        ${item.row}:
                                                        ${escapeHtml(
                                                            item.error
                                                        )}
                                                    </div>
                                                `;
                                            }
                                        )
                                        .join("")}

                                </div>
                            `
                            : ""
                    }

                </div>
            `;
        }

        await reloadData();
    }


    /* =====================================================
       IMPORT ONE ROW
       ===================================================== */

    async function importOneRow(
        row
    ) {

        const name =
            normalizeImportValue(
                row.Nama ||
                row.nama ||
                row.NAME ||
                row["Nama Warga"]
            );

        const nik =
            normalizeImportValue(
                row.NIK ||
                row.nik
            );

        const kk =
            normalizeImportValue(
                row.KK ||
                row.kk ||
                row["Nomor KK"] ||
                row["KK Number"]
            );

        const birthPlace =
            normalizeImportValue(
                row["Tempat Lahir"] ||
                row.birth_place
            );

        const birthDate =
            normalizeImportValue(
                row["Tanggal Lahir"] ||
                row.birth_date
            );

        const gender =
            normalizeImportValue(
                row.Gender ||
                row.gender
            );

        const address =
            normalizeImportValue(
                row.Alamat ||
                row.address
            );

        const houseNumber =
            normalizeImportValue(
                row["No Rumah"] ||
                row.house_number
            );

        const phone =
            normalizeImportValue(
                row.Telepon ||
                row.Phone ||
                row.phone
            );

        const familyStatus =
            normalizeImportValue(
                row["Status Keluarga"] ||
                row.family_status ||
                row.Status ||
                row.status
            ) ||
            "Anggota Keluarga";

        if (!name) {

            throw new Error(
                "Nama warga kosong."
            );
        }

        if (
            nik &&
            !/^\d{16}$/.test(nik)
        ) {

            throw new Error(
                "NIK harus terdiri dari 16 digit."
            );
        }

        if (
            kk &&
            !/^\d{16}$/.test(kk)
        ) {

            throw new Error(
                "Nomor KK harus terdiri dari 16 digit."
            );
        }

        if (
            familyStatus ===
            "Kepala Keluarga" &&
            !kk
        ) {

            throw new Error(
                "Kepala Keluarga wajib memiliki Nomor KK."
            );
        }

        const payload = {

            name:
                name,

            nik:
                nik || null,

            kk_number:
                kk || null,

            birth_place:
                birthPlace || null,

            birth_date:
                birthDate || null,

            gender:
                gender || null,

            address:
                address || null,

            house_number:
                houseNumber || null,

            phone:
                phone || null,

            family_status:
                familyStatus,

            is_active:
                true
        };

        let resident =
            null;

        let action =
            "insert";

        /*
         * Cek NIK terlebih dahulu.
         */

        if (nik) {

            const {
                data: existingByNik,
                error: nikError
            } = await state.client
                .from("residents")
                .select("*")
                .eq(
                    "nik",
                    nik
                )
                .maybeSingle();

            if (nikError) {
                throw nikError;
            }

            if (existingByNik) {

                const {
                    data,
                    error
                } = await state.client
                    .from("residents")
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        existingByNik.id
                    )
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                resident =
                    data;

                action =
                    "update";
            }
        }

        /*
         * Jika belum ada berdasarkan NIK,
         * insert baru.
         */

        if (!resident) {

            const {
                data,
                error
            } = await state.client
                .from("residents")
                .insert(
                    payload
                )
                .select()
                .single();

            if (error) {
                throw error;
            }

            resident =
                data;

            action =
                "insert";
        }

        /*
         * Kepala Keluarga:
         * pastikan household ada.
         */

        if (
            familyStatus ===
            "Kepala Keluarga"
        ) {

            await ensureHousehold(
                kk,
                resident.id,
                address
            );

            /*
             * Ambil ulang data warga
             * setelah proses penyimpanan.
             *
             * Ini penting karena account_created
             * bisa berubah setelah Edge Function.
             */

            resident =
                await getResidentById(
                    resident.id
                );

            let accountCreated =
                false;

            let accountFailed =
                false;

            /*
             * Jika akun belum ada,
             * buat otomatis.
             */

            if (
                resident &&
                !resident.account_created
            ) {

                try {

                    console.log(
                        "SIDAT IMPORT: Membuat akun WARGA untuk:",
                        resident.name
                    );

                    await createResidentAccount(
                        resident
                    );

                    /*
                     * Verifikasi ulang ke database.
                     */

                    const verifiedResident =
                        await getResidentById(
                            resident.id
                        );

                    if (
                        verifiedResident &&
                        verifiedResident.account_created
                    ) {

                        accountCreated =
                            true;

                    } else {

                        accountFailed =
                            true;

                        console.warn(
                            "SIDAT IMPORT: Edge Function selesai tetapi account_created belum true:",
                            resident.id
                        );
                    }

                } catch (accountError) {

                    accountFailed =
                        true;

                    console.error(
                        "SIDAT IMPORT: Gagal membuat akun WARGA:",
                        resident.name,
                        accountError
                    );

                    /*
                     * Jangan throw di sini.
                     *
                     * Data warga tetap dianggap
                     * berhasil diimport.
                     */
                }

            } else if (
                resident &&
                resident.account_created
            ) {

                /*
                 * Akun sudah ada.
                 * Jangan dibuat ulang.
                 */

                accountCreated =
                    false;

                accountFailed =
                    false;
            }

            return {

                resident:
                    resident,

                action:
                    action,

                accountCreated:
                    accountCreated,

                accountFailed:
                    accountFailed
            };
        }

        return {

            resident:
                resident,

            action:
                action,

            accountCreated:
                false,

            accountFailed:
                false
        };
    }


    /* =====================================================
       EXPORT EXCEL
       ===================================================== */

    async function exportExcel() {

        try {

            await loadXlsxLibrary();

            const rows =
                state.residents.map(
                    function (
                        resident
                    ) {

                        return {

                            "Kode Warga":
                                resident.resident_code ||
                                "",

                            "NIK":
                                resident.nik ||
                                "",

                            "Nomor KK":
                                resident.kk_number ||
                                "",

                            "Nama":
                                resident.name ||
                                "",

                            "Tempat Lahir":
                                resident.birth_place ||
                                "",

                            "Tanggal Lahir":
                                resident.birth_date ||
                                "",

                            "Gender":
                                resident.gender ||
                                "",

                            "Status Keluarga":
                                resident.family_status ||
                                "",

                            "Alamat":
                                resident.address ||
                                "",

                            "No Rumah":
                                resident.house_number ||
                                "",

                            "Telepon":
                                resident.phone ||
                                "",

                            "Akun WARGA":
                                resident.account_created
                                    ? "Ya"
                                    : "Tidak"
                        };
                    }
                );

            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Data Warga"
            );

            XLSX.writeFile(
                workbook,
                "SIDAT-Data-Warga.xlsx"
            );

        } catch (error) {

            console.error(
                "Export error:",
                error
            );

            alert(
                "Gagal melakukan export Excel."
            );
        }
    }


    /* =====================================================
       TEMPLATE EXCEL
       ===================================================== */

    async function downloadTemplate() {

        try {

            await loadXlsxLibrary();

            const rows = [
                {

                    "Nama":
                        "CONTOH NAMA",

                    "NIK":
                        "3300000000000000",

                    "Nomor KK":
                        "3300000000000000",

                    "Tempat Lahir":
                        "Klaten",

                    "Tanggal Lahir":
                        "1990-01-01",

                    "Gender":
                        "L",

                    "Status Keluarga":
                        "Kepala Keluarga",

                    "Alamat":
                        "Morangan",

                    "No Rumah":
                        "01",

                    "Telepon":
                        "081234567890"
                }
            ];

            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Template"
            );

            XLSX.writeFile(
                workbook,
                "SIDAT-Template-Import-Warga.xlsx"
            );

        } catch (error) {

            console.error(
                "Template error:",
                error
            );

            alert(
                "Gagal membuat template Excel."
            );
        }
    }


    /* =====================================================
       IMPORT STEP
       ===================================================== */

    function showImportStep(
        step
    ) {

        const steps = [
            "importStepSelect",
            "importStepPreview",
            "importStepValidation",
            "importStepImport"
        ];

        steps.forEach(
            function (id) {

                const element =
                    $(id);

                if (element) {

                    element.style.display =
                        "none";

                    element.hidden =
                        true;
                }
            }
        );

        const target =
            $("importStep" +
                capitalize(step));

        if (target) {

            target.hidden =
                false;

            target.style.display =
                "block";
        }
    }


    function capitalize(
        value
    ) {

        if (!value) {
            return "";
        }

        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );
    }


    /* =====================================================
       MODAL
       ===================================================== */

    function getModalElements() {

        return Array.from(
            document.querySelectorAll(
                ".data-warga-modal, .sidat-modal"
            )
        );
    }


    function showModal(id) {

        const modal =
            $(id);

        if (!modal) {

            console.warn(
                "SIDAT Modal: elemen tidak ditemukan:",
                id
            );

            return;
        }

        modal.hidden =
            false;

        modal.classList.add(
            "active"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "sidat-modal-open"
        );
    }


    function closeModal(id) {

        const modal =
            $(id);

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "active"
        );

        modal.hidden =
            true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        const anyOpen =
            getModalElements()
                .some(
                    function (item) {

                        return (
                            item.classList.contains(
                                "active"
                            ) &&
                            !item.hidden
                        );
                    }
                );

        if (!anyOpen) {

            document.body.classList.remove(
                "sidat-modal-open"
            );
        }
    }


    /* =====================================================
       REFRESH
       ===================================================== */

    async function reloadData() {

        state.residents =
            [];

        state.households =
            [];

        state.filteredHeads =
            [];

        await loadData();
    }


    /* =====================================================
       LOADING
       ===================================================== */

    function setLoading(
        isLoading
    ) {

        state.isLoading =
            isLoading;

        const loading =
            $("loadingState");

        const list =
            $("keluargaList");

        if (loading) {

            loading.style.display =
                isLoading
                    ? "block"
                    : "none";

            loading.hidden =
                !isLoading;
        }

        if (
            list &&
            isLoading
        ) {

            list.innerHTML =
                "";
        }
    }


    /* =====================================================
       BUTTON LOADING
       ===================================================== */

    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }

        if (loading) {

            if (
                button.dataset.oldText ===
                undefined
            ) {

                button.dataset.oldText =
                    button.textContent;
            }

            button.disabled =
                true;

            button.textContent =
                text ||
                "Memproses...";

        } else {

            button.disabled =
                false;

            button.textContent =
                button.dataset.oldText ||
                text ||
                "Simpan";
        }
    }


    /* =====================================================
       FORM HELPERS
       ===================================================== */

    function getValue(
        id
    ) {

        const element =
            $(id);

        if (!element) {
            return "";
        }

        return element.value ||
            "";
    }


    function setValue(
        id,
        value
    ) {

        const element =
            $(id);

        if (!element) {
            return;
        }

        element.value =
            value === null ||
            value === undefined
                ? ""
                : value;
    }


    /* =====================================================
       IMPORT MODAL RESET
       ===================================================== */

    function resetImport() {

        state.importRows =
            [];

        state.importValidated =
            false;

        state.importResult =
            null;

        const input =
            $("excelFile");

        if (input) {
            input.value =
                "";
        }

        const info =
            $("selectedFileInfo");

        if (info) {

            info.textContent =
                "Belum ada file dipilih.";

            info.hidden =
                true;
        }

        showImportStep(
            "select"
        );
    }


    /* =====================================================
       EVENT BINDING
       ===================================================== */

    function bindEvents() {

        /* Search */

        $("searchWarga")
            ?.addEventListener(
                "input",
                filterHeads
            );

        $("btnClearSearch")
            ?.addEventListener(
                "click",
                function () {

                    setValue(
                        "searchWarga",
                        ""
                    );

                    filterHeads();
                }
            );


        /* Tambah Warga */

        document
            .querySelectorAll(
                "#btnTambahWarga, #btnEmptyTambah"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        openAddResident
                    );
                }
            );


        /* Refresh */

        $("btnRefresh")
            ?.addEventListener(
                "click",
                reloadData
            );


        /* Export */

        $("btnExport")
            ?.addEventListener(
                "click",
                exportExcel
            );


        /* Template */

        $("btnTemplate")
            ?.addEventListener(
                "click",
                downloadTemplate
            );


        /* Import */

        $("btnImport")
            ?.addEventListener(
                "click",
                function () {

                    resetImport();

                    showModal(
                        "importModal"
                    );
                }
            );


        /* Excel */

        $("btnChooseExcel")
            ?.addEventListener(
                "click",
                chooseExcel
            );

        $("excelFile")
            ?.addEventListener(
                "change",
                handleExcelFile
            );


        /* Form */

        $("residentForm")
            ?.addEventListener(
                "submit",
                saveResident
            );


        $("btnCancelResident")
            ?.addEventListener(
                "click",
                function () {

                    closeModal(
                        "residentModal"
                    );
                }
            );


        /* Family */

        $("btnCloseFamilyModal")
            ?.addEventListener(
                "click",
                function () {

                    closeModal(
                        "familyModal"
                    );
                }
            );


        /* Resident */

        $("btnCloseResidentModal")
            ?.addEventListener(
                "click",
                function () {

                    closeModal(
                        "residentModal"
                    );
                }
            );


        /* Import close */

        $("btnCloseImportModal")
            ?.addEventListener(
                "click",
                function () {

                    closeModal(
                        "importModal"
                    );
                }
            );


        /* Import navigation */

        $("btnImportBack")
            ?.addEventListener(
                "click",
                function () {

                    showImportStep(
                        "select"
                    );
                }
            );

        $("btnImportNext")
            ?.addEventListener(
                "click",
                handleImportNext
            );


        /* Modal backdrop */

        getModalElements()
            .forEach(
                function (modal) {

                    modal.addEventListener(
                        "click",
                        function (event) {

                            if (
                                event.target ===
                                modal
                            ) {

                                closeModal(
                                    modal.id
                                );
                            }
                        }
                    );
                }
            );


        /* Escape */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                getModalElements()
                    .filter(
                        function (modal) {

                            return (
                                modal.classList.contains(
                                    "active"
                                ) &&
                                !modal.hidden
                            );
                        }
                    )
                    .forEach(
                        function (modal) {

                            closeModal(
                                modal.id
                            );
                        }
                    );
            }
        );
    }


    /* =====================================================
       IMPORT NEXT
       ===================================================== */

    async function handleImportNext() {

        const select =
            $("importStepSelect");

        const preview =
            $("importStepPreview");

        const validation =
            $("importStepValidation");

        if (
            select &&
            !select.hidden &&
            select.style.display !==
            "none"
        ) {

            if (
                !state.importRows.length
            ) {

                alert(
                    "Pilih file Excel terlebih dahulu."
                );

                return;
            }

            renderImportPreview();

            return;
        }

        if (
            preview &&
            !preview.hidden &&
            preview.style.display !==
            "none"
        ) {

            await validateImport();

            return;
        }

        if (
            validation &&
            !validation.hidden &&
            validation.style.display !==
            "none"
        ) {

            await executeImport();

            return;
        }

        closeModal(
            "importModal"
        );
    }


    /* =====================================================
       SELECTED FILE INFO
       ===================================================== */

    function updateSelectedFileInfo(
        file
    ) {

        const element =
            $("selectedFileInfo");

        if (!element) {
            return;
        }

        if (!file) {

            element.textContent =
                "Belum ada file dipilih.";

            element.hidden =
                true;

            return;
        }

        const size =
            file.size /
            1024;

        element.textContent =
            `${file.name} — ${size.toFixed(1)} KB`;

        element.hidden =
            false;
    }


    /* =====================================================
       FILE INFO
       ===================================================== */

    function bindFileInfo() {

        const input =
            $("excelFile");

        if (!input) {
            return;
        }

        input.addEventListener(
            "change",
            function () {

                const file =
                    input.files &&
                    input.files[0];

                updateSelectedFileInfo(
                    file
                );
            }
        );
    }


    /* =====================================================
       DOM READY
       ===================================================== */

    async function init() {

        console.log(
            "SIDAT Data Warga initializing..."
        );

        if (!initSupabase()) {
            return;
        }

        bindEvents();

        bindFileInfo();

        try {

            await loadData();

            console.log(
                "SIDAT Data Warga ready."
            );

        } catch (error) {

            console.error(
                "Data Warga init error:",
                error
            );

            showFatalError(
                error?.message ||
                "Data Warga gagal diinisialisasi."
            );
        }
    }


    /* =====================================================
       START
       ===================================================== */

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


    /* =====================================================
       GLOBAL API
       ===================================================== */

    window.SIDATDataWarga = {

        reload:
            reloadData,

        openAdd:
            openAddResident,

        openEdit:
            openEditResident,

        openFamily:
            openFamily,

        exportExcel:
            exportExcel,

        downloadTemplate:
            downloadTemplate
    };

})();