(function () {

    "use strict";


    /* =====================================================
       SIDAT
       HALAMAN PENGUMUMAN WARGA
       ===================================================== */


    /* =====================================================
       ELEMENT
       ===================================================== */

    function ambilElement() {

        return {

            loading:
                document.getElementById(
                    "loading"
                ),

            announcementList:
                document.getElementById(
                    "announcementList"
                ),

            emptyState:
                document.getElementById(
                    "emptyState"
                ),

            errorState:
                document.getElementById(
                    "errorState"
                ),

            errorMessage:
                document.getElementById(
                    "errorMessage"
                )

        };

    }


    /* =====================================================
       SESSION
       ===================================================== */

    function ambilToken() {

        return localStorage.getItem(
            "sidat_access_token"
        );

    }


    function cekSession() {

        const token =
            ambilToken();


        const wargaData =
            localStorage.getItem(
                "sidat_user"
            );


        if (
            !token ||
            !wargaData
        ) {

            window.location.replace(
                "../index.html"
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       FORMAT TANGGAL
       ===================================================== */

    function formatTanggal(
        tanggal
    ) {

        if (!tanggal) {

            return "-";

        }


        const waktu =
            new Date(
                tanggal
            );


        if (
            Number.isNaN(
                waktu.getTime()
            )
        ) {

            return "-";

        }


        return new Intl.DateTimeFormat(
            "id-ID",
            {

                day:
                    "2-digit",

                month:
                    "long",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        ).format(
            waktu
        );

    }


    /* =====================================================
       ICON PENGUMUMAN
       ===================================================== */

    function iconPengumuman() {

        return `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >

                <path d="M3 10v4h4l5 4V6l-5 4H3Z"></path>

                <path d="M16 9.5a4 4 0 0 1 0 5"></path>

                <path d="M18.5 7a7.5 7.5 0 0 1 0 10"></path>

            </svg>
        `;

    }


    /* =====================================================
       LOAD DATA
       ===================================================== */

    async function loadPengumuman() {

        const token =
            ambilToken();


        if (!token) {

            throw new Error(
                "Session warga tidak ditemukan."
            );

        }


        if (
            typeof SUPABASE_URL ===
            "undefined" ||

            typeof SUPABASE_KEY ===
            "undefined"
        ) {

            throw new Error(
                "Konfigurasi Supabase tidak ditemukan."
            );

        }


        const url =
            `${SUPABASE_URL}` +
            `/rest/v1/announcements` +
            `?select=id,title,content,created_at,is_active` +
            `&is_active=eq.true` +
            `&order=created_at.desc`;


        console.log(
            "SIDAT: Memuat pengumuman..."
        );


        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    }

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "SIDAT RESPONSE PENGUMUMAN:",
                errorText
            );


            throw new Error(
                errorText ||
                `Gagal memuat pengumuman. HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(
                data
            )
        ) {

            return [];

        }


        console.log(
            "SIDAT: Jumlah pengumuman:",
            data.length
        );


        return data;

    }


    /* =====================================================
       RENDER
       ===================================================== */

    function renderPengumuman(
        data
    ) {

        const {

            announcementList,
            emptyState

        } =
            ambilElement();


        if (!announcementList) {

            console.error(
                "SIDAT: #announcementList tidak ditemukan."
            );

            return;

        }


        announcementList.innerHTML =
            "";


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            if (emptyState) {

                emptyState.classList.remove(
                    "hidden"
                );

            }

            return;

        }


        if (emptyState) {

            emptyState.classList.add(
                "hidden"
            );

        }


        data.forEach(
            function (item) {


                /* ======================================
                   CARD
                ====================================== */

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "announcement-card";


                card.dataset.id =
                    String(
                        item.id ?? ""
                    );


                /* ======================================
                   TOP
                ====================================== */

                const top =
                    document.createElement(
                        "div"
                    );


                top.className =
                    "announcement-top";


                /* ======================================
                   ICON
                ====================================== */

                const icon =
                    document.createElement(
                        "div"
                    );


                icon.className =
                    "announcement-icon";


                icon.innerHTML =
                    iconPengumuman();


                /* ======================================
                   HEADING
                ====================================== */

                const heading =
                    document.createElement(
                        "div"
                    );


                heading.className =
                    "announcement-heading";


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    item.title ||
                    "Pengumuman RT";


                const date =
                    document.createElement(
                        "span"
                    );


                date.className =
                    "announcement-date";


                date.textContent =
                    formatTanggal(
                        item.created_at
                    );


                heading.appendChild(
                    title
                );


                heading.appendChild(
                    date
                );


                top.appendChild(
                    icon
                );


                top.appendChild(
                    heading
                );


                /* ======================================
                   DIVIDER
                ====================================== */

                const divider =
                    document.createElement(
                        "div"
                    );


                divider.className =
                    "announcement-divider";


                /* ======================================
                   CONTENT
                ====================================== */

                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "announcement-content";


                content.textContent =
                    item.content ||
                    "Tidak ada isi pengumuman.";


                /* ======================================
                   ASSEMBLE
                ====================================== */

                card.appendChild(
                    top
                );


                card.appendChild(
                    divider
                );


                card.appendChild(
                    content
                );


                /* ======================================
                   CLICK
                ====================================== */

                card.addEventListener(
                    "click",
                    function () {

                        bukaPengumuman(
                            item.id
                        );

                    }
                );


                card.setAttribute(
                    "role",
                    "button"
                );


                card.setAttribute(
                    "tabindex",
                    "0"
                );


                card.addEventListener(
                    "keydown",
                    function (event) {

                        if (
                            event.key ===
                            "Enter" ||

                            event.key ===
                            " "
                        ) {

                            event.preventDefault();

                            bukaPengumuman(
                                item.id
                            );

                        }

                    }
                );


                announcementList.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       BUKA PENGUMUMAN
       ===================================================== */

    function bukaPengumuman(
        id
    ) {

        if (
            id === null ||
            id === undefined ||
            id === ""
        ) {

            return;

        }


        /*
         * Tetap berada di halaman Pengumuman.
         *
         * ID disimpan di URL sehingga ketika
         * halaman dibuka dari Notifikasi,
         * pengumuman yang sesuai dapat difokuskan.
         */

        const url =
            `pengumuman.html?id=${encodeURIComponent(id)}`;


        /*
         * Jika sudah berada di halaman yang sama,
         * cukup fokuskan card.
         */

        const currentParams =
            new URLSearchParams(
                window.location.search
            );


        const currentId =
            currentParams.get(
                "id"
            );


        if (
            String(currentId || "") ===
            String(id)
        ) {

            fokusPengumuman(
                id
            );

            return;

        }


        window.location.href =
            url;

    }


    /* =====================================================
       FOKUS PENGUMUMAN
       ===================================================== */

    function fokusPengumuman(
        id
    ) {

        const cards =
            document.querySelectorAll(
                ".announcement-card"
            );


        cards.forEach(
            function (card) {

                if (
                    String(
                        card.dataset.id
                    ) ===
                    String(id)
                ) {


                    card.scrollIntoView(
                        {

                            behavior:
                                "smooth",

                            block:
                                "center"

                        }
                    );


                    card.classList.add(
                        "announcement-target"
                    );


                    setTimeout(
                        function () {

                            card.classList.remove(
                                "announcement-target"
                            );

                        },
                        1800
                    );

                }

            }
        );

    }


    /* =====================================================
       TAMPILKAN
       ===================================================== */

    async function tampilkanPengumuman() {

        const {

            loading,
            announcementList,
            emptyState,
            errorState,
            errorMessage

        } =
            ambilElement();


        if (loading) {

            loading.classList.remove(
                "hidden"
            );

        }


        if (announcementList) {

            announcementList.innerHTML =
                "";

        }


        if (emptyState) {

            emptyState.classList.add(
                "hidden"
            );

        }


        if (errorState) {

            errorState.classList.add(
                "hidden"
            );

        }


        try {

            const data =
                await loadPengumuman();


            if (loading) {

                loading.classList.add(
                    "hidden"
                );

            }


            renderPengumuman(
                data
            );


            /* ======================================
               CEK ?id=
            ====================================== */

            const params =
                new URLSearchParams(
                    window.location.search
                );


            const targetId =
                params.get(
                    "id"
                );


            if (targetId) {

                /*
                 * Beri sedikit waktu agar
                 * DOM card selesai dibuat.
                 */

                setTimeout(
                    function () {

                        fokusPengumuman(
                            targetId
                        );

                    },
                    100
                );

            }

        }

        catch (error) {

            console.error(
                "SIDAT: Gagal memuat pengumuman:",
                error
            );


            if (loading) {

                loading.classList.add(
                    "hidden"
                );

            }


            if (errorMessage) {

                errorMessage.textContent =
                    "Silakan coba lagi beberapa saat.";

            }


            if (errorState) {

                errorState.classList.remove(
                    "hidden"
                );

            }

        }

    }


    /* =====================================================
       KEMBALI DASHBOARD
       ===================================================== */

    function kembaliDashboard() {

        window.location.href =
            "dashboard.html";

    }


    /* =====================================================
       EXPORT GLOBAL
       ===================================================== */

    window.loadPengumuman =
        loadPengumuman;


    window.tampilkanPengumuman =
        tampilkanPengumuman;


    window.bukaPengumuman =
        bukaPengumuman;


    window.kembaliDashboard =
        kembaliDashboard;


    /* =====================================================
       START
       ===================================================== */

    function mulaiPengumuman() {

        if (
            !cekSession()
        ) {

            return;

        }


        tampilkanPengumuman();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            mulaiPengumuman
        );

    }

    else {

        mulaiPengumuman();

    }


})();