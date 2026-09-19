/* =========================================================
   SIDAT - DATA WARGA
   WARGA
   Mobile / APK
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       SUPABASE
    ===================================================== */

    let supabaseClient = null;

    const SESSION_STORAGE_KEY =
        "sidat_access_token";


    function initSupabase() {

        if (supabaseClient) {
            return supabaseClient;
        }


        /*
         * Menggunakan konfigurasi SIDAT:
         *
         * SUPABASE_URL
         * SUPABASE_KEY
         *
         * dari:
         * ../js/supabase-config.js
         */

        if (
            typeof SUPABASE_URL === "undefined" ||
            typeof SUPABASE_KEY === "undefined"
        ) {

            throw new Error(
                "Konfigurasi Supabase tidak ditemukan."
            );
        }


        if (
            !SUPABASE_URL ||
            !SUPABASE_KEY
        ) {

            throw new Error(
                "Konfigurasi Supabase SIDAT tidak lengkap."
            );
        }


        if (
            typeof window.supabase === "undefined"
        ) {

            throw new Error(
                "Library Supabase belum dimuat."
            );
        }


        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        return supabaseClient;
    }


    /* =====================================================
       SESSION
    ===================================================== */

    async function getValidSession() {

        const client =
            initSupabase();


        let {
            data,
            error
        } =
            await client.auth.getSession();


        if (error) {
            throw error;
        }


        let session =
            data &&
            data.session
                ? data.session
                : null;


        /*
         * Jika session tidak ditemukan,
         * coba refresh session.
         */

        if (!session) {

            const storedToken =
                localStorage.getItem(
                    SESSION_STORAGE_KEY
                );


            if (!storedToken) {
                return null;
            }


            const {
                data: refreshData,
                error: refreshError
            } =
                await client.auth.refreshSession();


            if (refreshError) {
                throw refreshError;
            }


            session =
                refreshData &&
                refreshData.session
                    ? refreshData.session
                    : null;
        }


        if (!session) {
            return null;
        }


        /*
         * Refresh jika token hampir habis.
         */

        const expiresAt =
            Number(
                session.expires_at || 0
            );


        const now =
            Math.floor(
                Date.now() / 1000
            );


        if (
            expiresAt > 0 &&
            expiresAt - now < 60
        ) {

            const {
                data: refreshData,
                error: refreshError
            } =
                await client.auth.refreshSession();


            if (refreshError) {
                throw refreshError;
            }


            if (
                refreshData &&
                refreshData.session
            ) {

                session =
                    refreshData.session;
            }
        }


        /*
         * Simpan access token untuk
         * kompatibilitas SIDAT.
         */

        if (session.access_token) {

            localStorage.setItem(
                SESSION_STORAGE_KEY,
                session.access_token
            );
        }


        return session;
    }


    /* =====================================================
       DATA
    ===================================================== */

    let semuaKeluarga = [];

    let hasilPencarian = [];

    let profilAkun = null;


    /* =====================================================
       ELEMENT
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);
    }


    /* =====================================================
       LOADING
    ===================================================== */

    function tampilkanLoading() {

        const loading =
            getElement("loading");

        const list =
            getElement("residentList");

        const empty =
            getElement("emptyState");

        const error =
            getElement("errorState");


        if (loading) {
            loading.classList.remove("hidden");
        }


        if (list) {
            list.innerHTML = "";
        }


        if (empty) {
            empty.classList.add("hidden");
        }


        if (error) {
            error.classList.add("hidden");
        }
    }


    function sembunyikanLoading() {

        const loading =
            getElement("loading");


        if (loading) {
            loading.classList.add("hidden");
        }
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
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


    /* =====================================================
       INITIAL
    ===================================================== */

    function dapatkanInitial(nama) {

        const text =
            String(nama || "")
                .trim();


        if (!text) {
            return "W";
        }


        const bagian =
            text
                .split(/\s+/)
                .filter(Boolean);


        if (bagian.length === 1) {

            return bagian[0]
                .charAt(0)
                .toUpperCase();
        }


        return (
            bagian[0].charAt(0) +
            bagian[1].charAt(0)
        ).toUpperCase();
    }


    /* =====================================================
       PHOTO HTML
    ===================================================== */

    function buatFotoHtml(
        photoUrl,
        nama,
        className
    ) {

        const initial =
            escapeHtml(
                dapatkanInitial(nama)
            );


        const safeClass =
            className ||
            "member-avatar";


        /*
         * Jika ada foto:
         * tetap siapkan initial sebagai fallback.
         */

        if (photoUrl) {

            const safeUrl =
                escapeHtml(photoUrl);


            return `
                <div
                    class="${safeClass}"
                >

                    <img
                        src="${safeUrl}"
                        alt="Foto ${escapeHtml(nama)}"
                        loading="lazy"
                        onerror="
                            this.style.display='none';
                            this.parentElement.classList.add('photo-fallback');
                        "
                    >

                    <span
                        class="photo-initial"
                    >
                        ${initial}
                    </span>

                </div>
            `;
        }


        return `
            <div
                class="${safeClass}"
            >

                <span
                    class="photo-initial"
                >
                    ${initial}
                </span>

            </div>
        `;
    }


    /* =====================================================
       NORMALISASI MEMBER
    ===================================================== */

    function normalisasiMembers(
        members
    ) {

        if (!Array.isArray(members)) {
            return [];
        }


        return members
            .map(function (member) {

                if (!member) {
                    return null;
                }


                return {

                    id:
                        member.id ||
                        null,

                    resident_code:
                        member.resident_code ||
                        "",

                    name:
                        member.name ||
                        "",

                    phone:
                        member.phone ||
                        "",

                    photo_url:
                        member.photo_url ||
                        "",

                    house_number:
                        member.house_number ||
                        "",

                    family_status:
                        member.family_status ||
                        ""
                };

            })
            .filter(Boolean);
    }


    /* =====================================================
       KEPALA KELUARGA
    ===================================================== */

    function dapatkanKepalaKeluarga(
        members
    ) {

        if (!Array.isArray(members)) {
            return null;
        }


        /*
         * Cari berdasarkan status terlebih dahulu.
         */

        const kepala =
            members.find(
                function (member) {

                    return (
                        String(
                            member.family_status ||
                            ""
                        )
                        .trim()
                        .toLowerCase() ===
                        "kepala keluarga"
                    );

                }
            );


        if (kepala) {
            return kepala;
        }


        /*
         * Fallback:
         * RPC mengurutkan Kepala Keluarga
         * di posisi pertama.
         */

        return members[0] || null;
    }


    /* =====================================================
       PROFIL AKUN WARGA
    ===================================================== */

    async function muatProfilAkun(
        session
    ) {

        try {

            const client =
                initSupabase();


            const {
                data,
                error
            } =
                await client.rpc(
                    "get_my_resident_id"
                );


            if (error) {
                throw error;
            }


            const residentId =
                data || null;


            if (!residentId) {

                console.warn(
                    "SIDAT: resident_id akun tidak ditemukan."
                );

                return;
            }


            const {
                data: resident,
                error: residentError
            } =
                await client
                    .from("residents")
                    .select(
                        "id,resident_code,name,phone,photo_url"
                    )
                    .eq(
                        "id",
                        residentId
                    )
                    .maybeSingle();


            if (residentError) {
                throw residentError;
            }


            if (!resident) {
                return;
            }


            profilAkun =
                resident;


            const profileName =
                getElement(
                    "profileName"
                );

            const profileCode =
                getElement(
                    "profileCode"
                );

            const profilePhoto =
                getElement(
                    "profilePhoto"
                );


            if (profileName) {

                profileName.textContent =
                    resident.name ||
                    "Warga";
            }


            if (profileCode) {

                profileCode.textContent =
                    resident.resident_code ||
                    "-";
            }


            if (profilePhoto) {

                if (resident.photo_url) {

                    profilePhoto.innerHTML = `
                        <img
                            src="${escapeHtml(
                                resident.photo_url
                            )}"
                            alt="Foto profil"
                            onerror="
                                this.style.display='none';
                            "
                        >
                    `;

                } else {

                    profilePhoto.innerHTML = `
                        <span id="profileInitial">
                            ${escapeHtml(
                                dapatkanInitial(
                                    resident.name
                                )
                            )}
                        </span>
                    `;
                }
            }


        } catch (error) {

            /*
             * Profil akun tidak boleh
             * menghentikan Data Warga.
             */

            console.error(
                "SIDAT PROFIL AKUN:",
                error
            );
        }
    }


    /* =====================================================
       LOAD DATA WARGA
    ===================================================== */

    async function muatDataWarga() {

        tampilkanLoading();


        try {

            const session =
                await getValidSession();


            if (!session) {

                window.location.replace(
                    "../index.html"
                );

                return;
            }


            /*
             * Muat profil akun terlebih dahulu.
             */

            await muatProfilAkun(
                session
            );


            const client =
                initSupabase();


            /*
             * RPC:
             * get_public_residents()
             *
             * Mengembalikan:
             *
             * family_id
             * members[]
             *
             * Setiap member:
             *
             * id
             * resident_code
             * name
             * phone
             * photo_url
             * house_number
             * family_status
             */

            const {
                data,
                error
            } =
                await client.rpc(
                    "get_public_residents"
                );


            if (error) {
                throw error;
            }


            semuaKeluarga =
                Array.isArray(data)
                    ? data
                        .map(
                            function (
                                keluarga
                            ) {

                                return {

                                    family_id:
                                        keluarga.family_id ||
                                        null,

                                    members:
                                        normalisasiMembers(
                                            keluarga.members
                                        )
                                };
                            }
                        )
                        .filter(
                            function (
                                keluarga
                            ) {

                                return (
                                    keluarga
                                        .members
                                        .length > 0
                                );
                            }
                        )
                    : [];


            /*
             * Total Warga:
             * semua anggota keluarga.
             *
             * Bukan jumlah KK.
             */

            const total =
                semuaKeluarga.reduce(
                    function (
                        jumlah,
                        keluarga
                    ) {

                        return (
                            jumlah +
                            keluarga.members.length
                        );

                    },
                    0
                );


            const totalElement =
                getElement(
                    "totalWarga"
                );


            if (totalElement) {

                totalElement.textContent =
                    total.toLocaleString(
                        "id-ID"
                    );
            }


            hasilPencarian =
                semuaKeluarga.slice();


            renderDaftarKeluarga();


        } catch (error) {

            console.error(
                "SIDAT DATA WARGA:",
                error
            );


            console.error(
                "SIDAT DATA WARGA MESSAGE:",
                error?.message ||
                "(tidak ada message)"
            );


            console.error(
                "SIDAT DATA WARGA DETAILS:",
                error?.details ||
                "(tidak ada details)"
            );


            console.error(
                "SIDAT DATA WARGA HINT:",
                error?.hint ||
                "(tidak ada hint)"
            );


            console.error(
                "SIDAT DATA WARGA CODE:",
                error?.code ||
                "(tidak ada code)"
            );


            const errorState =
                getElement(
                    "errorState"
                );

            const errorMessage =
                getElement(
                    "errorMessage"
                );


            if (errorMessage) {

                errorMessage.textContent =
                    error &&
                    error.message
                        ? error.message
                        : "Terjadi kesalahan saat mengambil data warga.";
            }


            if (errorState) {
                errorState.classList.remove(
                    "hidden"
                );
            }


        } finally {

            sembunyikanLoading();
        }
    }


    /* =====================================================
       FAMILY CARD
    ===================================================== */

    function buatKartuKeluarga(
        keluarga,
        index
    ) {

        const members =
            Array.isArray(
                keluarga.members
            )
                ? keluarga.members
                : [];


        const kepala =
            dapatkanKepalaKeluarga(
                members
            );


        if (!kepala) {
            return "";
        }


        const namaKepala =
            kepala.name ||
            "Kepala Keluarga";


        const kodeWarga =
            kepala.resident_code ||
            "-";


        const nomorRumah =
            kepala.house_number ||
            "";


        const jumlahAnggota =
            members.length;


        /*
         * ID DOM unik.
         */

        const rawId =
            kepala.id ||
            keluarga.family_id ||
            index;


        const cardId =
            (
                "family-" +
                index +
                "-" +
                String(rawId)
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        ""
                    )
            );


        return `
            <article
                class="family-card"
                data-family-id="${escapeHtml(
                    keluarga.family_id || ""
                )}"
                data-card-id="${escapeHtml(
                    cardId
                )}"
            >

                <!-- =================================
                     KEPALA KELUARGA
                ================================== -->

                <button
                    type="button"
                    class="family-header-button"
                    onclick="toggleKeluarga('${escapeHtml(
                        cardId
                    )}')"
                    aria-expanded="false"
                    aria-controls="${escapeHtml(
                        cardId
                    )}-members"
                >

                    ${buatFotoHtml(
                        kepala.photo_url,
                        namaKepala,
                        "family-photo"
                    )}


                    <div
                        class="family-main-info"
                    >

                        <strong
                            class="family-main-name"
                        >
                            ${escapeHtml(
                                namaKepala
                            )}
                        </strong>


                        <div
                            class="family-main-meta"
                        >

                            <span
                                class="family-main-code"
                            >
                                ${escapeHtml(
                                    kodeWarga
                                )}
                            </span>


                            ${
                                nomorRumah
                                    ? `
                                        <span
                                            class="family-house-number"
                                        >
                                            Rumah
                                            ${escapeHtml(
                                                nomorRumah
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    <span
                        class="family-badge"
                    >
                        ${jumlahAnggota}
                        ${
                            jumlahAnggota === 1
                                ? " Warga"
                                : " Anggota"
                        }
                    </span>


                    <span
                        class="family-toggle"
                        aria-hidden="true"
                    >

                        <svg
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="m6 9 6 6 6-6"
                            ></path>
                        </svg>

                    </span>

                </button>


                <!-- =================================
                     RINGKASAN
                ================================== -->

                <div
                    class="family-summary"
                >

                    <span>
                        Kepala Keluarga
                    </span>


                    <span
                        class="family-summary-action"
                    >
                        Lihat Anggota
                    </span>

                </div>


                <!-- =================================
                     ANGGOTA KELUARGA
                ================================== -->

                <div
                    id="${escapeHtml(
                        cardId
                    )}-members"
                    class="family-members hidden"
                >

                    ${
                        members
                            .map(
                                function (
                                    member
                                ) {

                                    return buatMemberItem(
                                        member
                                    );
                                }
                            )
                            .join("")
                    }

                </div>

            </article>
        `;
    }


    /* =====================================================
       MEMBER ITEM
    ===================================================== */

    function buatMemberItem(
        member
    ) {

        const nama =
            member.name ||
            "Warga";


        const status =
            member.family_status ||
            "";


        const phone =
            normalisasiNomorTelepon(
                member.phone
            );


        const adaPhone =
            Boolean(phone);


        const isKepala =
            String(
                status
            )
            .trim()
            .toLowerCase() ===
            "kepala keluarga";


        return `
            <div
                class="member-item"
            >

                ${buatFotoHtml(
                    member.photo_url,
                    nama,
                    "member-avatar"
                )}


                <div
                    class="member-info"
                >

                    <span
                        class="member-name"
                    >
                        ${escapeHtml(
                            nama
                        )}
                    </span>


                    ${
                        status
                            ? `
                                <span
                                    class="member-status"
                                >
                                    ${escapeHtml(
                                        status
                                    )}
                                </span>
                            `
                            : ""
                    }


                    ${
                        isKepala
                            ? `
                                <span
                                    class="member-head-badge"
                                >
                                    Kepala Keluarga
                                </span>
                            `
                            : ""
                    }


                    ${
                        adaPhone
                            ? `
                                <span
                                    class="member-phone"
                                >

                                    <span
                                        class="member-phone-icon"
                                        aria-hidden="true"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L9 10.7a16 16 0 0 0 4.3 4.3l1.27-1.27a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z"
                                            ></path>
                                        </svg>

                                    </span>

                                    ${escapeHtml(
                                        member.phone
                                    )}

                                </span>
                            `
                            : `
                                <span
                                    class="member-phone"
                                >
                                    Nomor HP belum tersedia
                                </span>
                            `
                    }

                </div>


                ${
                    adaPhone
                        ? `
                            <a
                                class="member-whatsapp"
                                href="${buatLinkWhatsApp(
                                    phone
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Hubungi ${escapeHtml(
                                    nama
                                )} melalui WhatsApp"
                                onclick="event.stopPropagation()"
                            >

                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M20 11.5a8.3 8.3 0 0 1-12.6 7.1L3 20l1.5-4.3A8.3 8.3 0 1 1 20 11.5Z"
                                    ></path>

                                    <path
                                        d="M8.6 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.6.7c.6 1.1 1.5 2 2.7 2.6l.7-.6c.2-.2.4-.2.7-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1 .3-1.5.2-2.7-.5-5.1-2.9-6.4-6.1-.2-.5-.1-1.1.1-1.5Z"
                                    ></path>

                                </svg>


                                <span>
                                    WhatsApp
                                </span>

                            </a>
                        `
                        : `
                            <span
                                class="member-phone-empty"
                            >
                                —
                            </span>
                        `
                }

            </div>
        `;
    }


    /* =====================================================
       PHONE
    ===================================================== */

    function normalisasiNomorTelepon(
        phone
    ) {

        let value =
            String(phone || "")
                .trim();


        if (!value) {
            return "";
        }


        value =
            value.replace(
                /[^0-9+]/g,
                ""
            );


        if (
            value.startsWith("+62")
        ) {

            value =
                "0" +
                value.substring(3);

        } else if (
            value.startsWith("62")
        ) {

            value =
                "0" +
                value.substring(2);
        }


        return value;
    }


    function buatLinkWhatsApp(
        phone
    ) {

        const normalized =
            normalisasiNomorTelepon(
                phone
            );


        const international =
            normalized.startsWith("0")
                ? "62" +
                    normalized.substring(1)
                : normalized;


        return (
            "https://wa.me/" +
            encodeURIComponent(
                international
            )
        );
    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    function renderDaftarKeluarga() {

        const list =
            getElement(
                "residentList"
            );

        const empty =
            getElement(
                "emptyState"
            );


        if (!list) {
            return;
        }


        list.innerHTML = "";


        if (
            !Array.isArray(
                hasilPencarian
            ) ||
            hasilPencarian.length === 0
        ) {

            if (empty) {
                empty.classList.remove(
                    "hidden"
                );
            }

            return;
        }


        if (empty) {
            empty.classList.add(
                "hidden"
            );
        }


        const html =
            hasilPencarian
                .map(
                    function (
                        keluarga,
                        index
                    ) {

                        return buatKartuKeluarga(
                            keluarga,
                            index
                        );

                    }
                )
                .join("");


        list.innerHTML =
            html;
    }


    /* =====================================================
       TOGGLE KELUARGA
    ===================================================== */

    function toggleKeluarga(
        cardId
    ) {

        const cards =
            document.querySelectorAll(
                ".family-card"
            );


        let card = null;


        cards.forEach(
            function (
                item
            ) {

                if (
                    item.getAttribute(
                        "data-card-id"
                    ) === cardId
                ) {

                    card = item;
                }
            }
        );


        if (!card) {
            return;
        }


        const members =
            card.querySelector(
                ".family-members"
            );

        const button =
            card.querySelector(
                ".family-header-button"
            );


        if (
            !members ||
            !button
        ) {

            return;
        }


        const sedangTerbuka =
            !members.classList.contains(
                "hidden"
            );


        /*
         * Tutup KK lain.
         */

        document
            .querySelectorAll(
                ".family-card.is-open"
            )
            .forEach(
                function (
                    otherCard
                ) {

                    if (
                        otherCard === card
                    ) {

                        return;
                    }


                    const otherMembers =
                        otherCard.querySelector(
                            ".family-members"
                        );


                    const otherButton =
                        otherCard.querySelector(
                            ".family-header-button"
                        );


                    if (otherMembers) {

                        otherMembers.classList.add(
                            "hidden"
                        );
                    }


                    if (otherButton) {

                        otherButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }


                    otherCard.classList.remove(
                        "is-open"
                    );
                }
            );


        if (sedangTerbuka) {

            members.classList.add(
                "hidden"
            );


            button.setAttribute(
                "aria-expanded",
                "false"
            );


            card.classList.remove(
                "is-open"
            );

        } else {

            members.classList.remove(
                "hidden"
            );


            button.setAttribute(
                "aria-expanded",
                "true"
            );


            card.classList.add(
                "is-open"
            );
        }
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function lakukanPencarian() {

        const input =
            getElement(
                "searchInput"
            );


        if (!input) {
            return;
        }


        const keyword =
            String(
                input.value || ""
            )
            .trim()
            .toLowerCase();


        const clearButton =
            getElement(
                "clearSearch"
            );


        if (clearButton) {

            if (keyword) {

                clearButton.classList.remove(
                    "hidden"
                );

            } else {

                clearButton.classList.add(
                    "hidden"
                );
            }
        }


        /*
         * Jika pencarian kosong,
         * tampilkan seluruh KK.
         */

        if (!keyword) {

            hasilPencarian =
                semuaKeluarga.slice();


            renderDaftarKeluarga();

            return;
        }


        /*
         * Pencarian ke seluruh anggota.
         *
         * Hasil tetap kartu KK.
         */

        hasilPencarian =
            semuaKeluarga.filter(
                function (
                    keluarga
                ) {

                    return keluarga.members.some(
                        function (
                            member
                        ) {

                            const nama =
                                String(
                                    member.name ||
                                    ""
                                )
                                .toLowerCase();


                            const kode =
                                String(
                                    member.resident_code ||
                                    ""
                                )
                                .toLowerCase();


                            return (
                                nama.includes(
                                    keyword
                                ) ||
                                kode.includes(
                                    keyword
                                )
                            );
                        }
                    );
                }
            );


        renderDaftarKeluarga();
    }


    /* =====================================================
       CLEAR SEARCH
    ===================================================== */

    function bersihkanPencarian() {

        const input =
            getElement(
                "searchInput"
            );


        if (input) {
            input.value = "";
        }


        const clearButton =
            getElement(
                "clearSearch"
            );


        if (clearButton) {

            clearButton.classList.add(
                "hidden"
            );
        }


        hasilPencarian =
            semuaKeluarga.slice();


        renderDaftarKeluarga();
    }


    /* =====================================================
       BACK
    ===================================================== */

    function kembaliDashboard() {

        window.location.href =
            "dashboard.html";
    }


    /* =====================================================
       SEARCH EVENT
    ===================================================== */

    function pasangEventSearch() {

        const input =
            getElement(
                "searchInput"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            lakukanPencarian
        );


        input.addEventListener(
            "search",
            lakukanPencarian
        );
    }


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            pasangEventSearch();

            muatDataWarga();
        }
    );


    /* =====================================================
       EXPORT GLOBAL
    ===================================================== */

    window.muatDataWarga =
        muatDataWarga;


    window.bersihkanPencarian =
        bersihkanPencarian;


    window.lakukanPencarian =
        lakukanPencarian;


    window.kembaliDashboard =
        kembaliDashboard;


    window.toggleKeluarga =
        toggleKeluarga;

})();