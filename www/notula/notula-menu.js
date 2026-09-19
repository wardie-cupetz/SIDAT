/* =========================================================
   SIDAT — NOTULA MENU TERPUSAT
   File : notula-menu.js

   MENU NOTULA:

   1. Agenda
   2. Notula
   3. Pengumuman
   4. Absensi (Fitur Akan Datang)

   Routing menggunakan halaman SIDAT yang sudah tersedia.
   Tampilan mengikuti ADMIN MENU.
   ========================================================= */

(function () {
    "use strict";


    /* =========================================================
       CEGAH INISIALISASI GANDA
       ========================================================= */

    if (window.__SIDAT_NOTULA_MENU_INITIALIZED__) {

        console.warn(
            "[SIDAT] Menu NOTULA sudah diinisialisasi."
        );

        return;
    }

    window.__SIDAT_NOTULA_MENU_INITIALIZED__ = true;


    /* =========================================================
       ID UNIK
       ========================================================= */

    const CONTAINER_ID =
        "sidatNotulaMenuContainer";

    const OVERLAY_ID =
        "sidatNotulaMenuOverlay";

    const PANEL_ID =
        "sidatNotulaMenuPanel";

    const NAV_ID =
        "sidatNotulaBottomNav";

    const FOOTER_ID =
        "sidatNotulaFooter";


    /* =========================================================
       ICON
       ========================================================= */

    const ICONS = {

        home: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5"></path>
                <path d="M5.5 9.5V21h13V9.5"></path>
                <path d="M9.5 21v-7h5v7"></path>
            </svg>
        `,

        menu: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M4 6h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 18h16"></path>
            </svg>
        `,

        profile: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <circle cx="12" cy="8" r="3.5"></circle>
                <path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6"></path>
            </svg>
        `,

        agenda: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <rect
                    x="4"
                    y="5"
                    width="16"
                    height="15"
                    rx="2">
                </rect>

                <path d="M8 3v4"></path>
                <path d="M16 3v4"></path>

                <path d="M4 9h16"></path>

                <path d="M8 13h3"></path>
                <path d="M13 13h3"></path>
                <path d="M8 16h3"></path>
            </svg>
        `,

        notula: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M6 3h9l4 4v14H6z"></path>
                <path d="M15 3v5h4"></path>
                <path d="M9 12h6"></path>
                <path d="M9 15h6"></path>
                <path d="M9 18h4"></path>
            </svg>
        `,

        announcement: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M4 10v4"></path>
                <path d="M7 9v6l11 4V5L7 9z"></path>
                <path d="M4 10h3"></path>
                <path d="M8 15l1.5 5h3L11 16"></path>
            </svg>
        `,

        attendance: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <circle
                    cx="12"
                    cy="8"
                    r="3">
                </circle>

                <path
                    d="M5 20c.7-3.5 3-5.5 7-5.5s6.3 2 7 5.5">
                </path>

                <path d="M18 4v4"></path>
                <path d="M16 6h4"></path>
            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="m6 6 12 12"></path>
                <path d="M18 6 6 18"></path>
            </svg>
        `,

        chevron: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="m9 18 6-6-6-6"></path>
            </svg>
        `

    };


    /* =========================================================
       MENU NOTULA
       ========================================================= */

    const MENU_ITEMS = [

        {
            id: "agenda",
            label: "Agenda",
            icon: ICONS.agenda,

            url: "../admin/agenda.html"
        },

        {
            id: "notula",
            label: "Notula",
            icon: ICONS.notula,

            url: "../admin/notula.html"
        },

        {
            id: "pengumuman",
            label: "Pengumuman",
            icon: ICONS.announcement,

            url: "../admin/pengumuman.html"
        },

        {
            id: "absensi",
            label: "Absensi",
            icon: ICONS.attendance,

            comingSoon: true,
            url: null
        }

    ];


    /* =========================================================
       UTILITAS
       ========================================================= */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       BUAT BOTTOM NAVBAR
       ========================================================= */

    function createBottomNavbar() {

        if (document.getElementById(NAV_ID)) {
            return;
        }

        const nav =
            document.createElement("nav");

        nav.id = NAV_ID;

        nav.className =
            "admin-bottom-nav";

        nav.innerHTML = `

            <div
                class="bottom-nav-bubble bubble-left">
            </div>

            <div
                class="bottom-nav-bubble bubble-right">
            </div>


            <!-- BERANDA -->

            <button
                type="button"
                class="bottom-nav-item active"
                id="sidatNotulaNavHome"
                aria-label="Beranda"
            >

                <span class="bottom-nav-icon">
                    ${ICONS.home}
                </span>

                <span class="bottom-nav-label">
                    Beranda
                </span>

            </button>


            <!-- MENU UTAMA -->

            <button
                type="button"
                class="menu-main-button"
                id="sidatNotulaNavMenu"
                aria-label="Menu"
            >

                <span class="menu-main-circle">
                    ${ICONS.menu}
                </span>

                <span class="menu-main-label">
                    Menu
                </span>

            </button>


            <!-- PROFIL -->

            <button
                type="button"
                class="bottom-nav-item"
                id="sidatNotulaNavProfile"
                aria-label="Profil"
            >

                <span class="bottom-nav-icon">
                    ${ICONS.profile}
                </span>

                <span class="bottom-nav-label">
                    Profil
                </span>

            </button>

        `;

        document.body.appendChild(nav);
    }


    /* =========================================================
       FOOTER
       ========================================================= */

    function createFooter() {

        if (document.getElementById(FOOTER_ID)) {
            return;
        }

        const footer =
            document.createElement("div");

        footer.id = FOOTER_ID;

        footer.className =
            "admin-footer";

        footer.innerHTML = `
            <strong>SIDAT</strong>
            <span>
                Sistem Informasi Data Warga RT
            </span>
        `;

        document.body.appendChild(footer);
    }


    /* =========================================================
       MENU OVERLAY
       ========================================================= */

    function createMenuOverlay() {

        if (document.getElementById(CONTAINER_ID)) {
            return;
        }

        const container =
            document.createElement("div");

        container.id =
            CONTAINER_ID;

        container.innerHTML = `

            <div
                id="${OVERLAY_ID}"
                class="admin-menu-overlay"
                aria-hidden="true"
            >

                <div
                    id="${PANEL_ID}"
                    class="admin-menu-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu NOTULA"
                >

                    <!-- HEADER -->

                    <div class="admin-menu-header">

                        <div class="admin-menu-title-wrap">

                            <div class="admin-menu-brand">
                                SIDAT
                            </div>

                            <div class="admin-menu-subtitle">
                                Menu NOTULA
                            </div>

                        </div>


                        <button
                            type="button"
                            class="admin-menu-close"
                            id="sidatNotulaMenuClose"
                            aria-label="Tutup menu"
                        >
                            ${ICONS.close}
                        </button>

                    </div>


                    <!-- DIVIDER -->

                    <div class="admin-menu-divider"></div>


                    <!-- LIST MENU -->

                    <div class="admin-menu-list">

                        ${MENU_ITEMS.map(function (item) {

                            const disabled =
                                item.comingSoon === true;

                            return `

                                <button
                                    type="button"
                                    class="menu-item${disabled ? " menu-item-disabled" : ""}"

                                    ${disabled
                                        ? 'aria-disabled="true"'
                                        : `data-sidat-notula-url="${escapeHtml(item.url)}"`
                                    }

                                    data-sidat-notula-id="${escapeHtml(item.id)}"

                                    aria-label="${escapeHtml(item.label)}"
                                >

                                    <span class="menu-item-icon">
                                        ${item.icon}
                                    </span>

                                    <span class="menu-item-label">
                                        ${escapeHtml(item.label)}
                                    </span>

                                    ${
                                        disabled
                                        ? `
                                            <span class="menu-item-status">
                                                Segera Hadir
                                            </span>
                                        `
                                        : `
                                            <span class="menu-item-arrow">
                                                ${ICONS.chevron}
                                            </span>
                                        `
                                    }

                                </button>

                            `;

                        }).join("")}

                    </div>

                </div>

            </div>

        `;

        document.body.appendChild(container);
    }


    /* =========================================================
       AMBIL OVERLAY
       ========================================================= */

    function getOverlay() {

        return document.getElementById(
            OVERLAY_ID
        );
    }


    /* =========================================================
       BUKA MENU
       ========================================================= */

    function openMenu() {

        const overlay =
            getOverlay();

        if (!overlay) {

            console.error(
                "[SIDAT] Overlay NOTULA tidak ditemukan."
            );

            return;
        }

        overlay.classList.add("show");

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "sidat-menu-open"
        );
    }


    /* =========================================================
       TUTUP MENU
       ========================================================= */

    function closeMenu() {

        const overlay =
            getOverlay();

        if (!overlay) {
            return;
        }

        overlay.classList.remove("show");

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "sidat-menu-open"
        );
    }


    /* =========================================================
       NAVIGASI MENU
       ========================================================= */

    function navigate(url, label) {

        if (!url) {

            console.warn(
                "[SIDAT] Menu NOTULA belum tersedia:",
                label
            );

            return;
        }

        console.log(
            "[SIDAT] NOTULA →",
            label,
            "→",
            url
        );

        closeMenu();


        /*
         * Beri sedikit waktu agar animasi
         * penutupan menu selesai.
         */

        window.setTimeout(function () {

            window.location.assign(url);

        }, 100);

    }


    /* =========================================================
       EVENT MENU
       ========================================================= */

    function attachMenuItemEvents() {

        const menuItems =
            document.querySelectorAll(
                "[data-sidat-notula-url]"
            );

        menuItems.forEach(function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    const url =
                        item.getAttribute(
                            "data-sidat-notula-url"
                        );

                    const label =
                        item.querySelector(
                            ".menu-item-label"
                        )?.textContent?.trim() ||
                        "Menu NOTULA";

                    navigate(
                        url,
                        label
                    );

                }
            );

        });


        /* =====================================================
           ABSENSI — FITUR AKAN DATANG
           ===================================================== */

        const comingSoonItems =
            document.querySelectorAll(
                ".menu-item-disabled"
            );

        comingSoonItems.forEach(function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    console.log(
                        "[SIDAT] Fitur Absensi NOTULA belum tersedia."
                    );

                }
            );

        });

    }


    /* =========================================================
       PASANG EVENT
       ========================================================= */

    function attachEvents() {

        const navMenu =
            document.getElementById(
                "sidatNotulaNavMenu"
            );

        const navHome =
            document.getElementById(
                "sidatNotulaNavHome"
            );

        const navProfile =
            document.getElementById(
                "sidatNotulaNavProfile"
            );

        const closeButton =
            document.getElementById(
                "sidatNotulaMenuClose"
            );

        const overlay =
            getOverlay();


        /* =====================================================
           TOMBOL MENU
           ===================================================== */

        if (navMenu) {

            navMenu.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    openMenu();

                }
            );

        }


        /* =====================================================
           BERANDA
           ===================================================== */

        if (navHome) {

            navHome.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.assign(
                        "../notula/dashboard.html"
                    );

                }
            );

        }


        /* =====================================================
           PROFIL
           ===================================================== */

        if (navProfile) {

            navProfile.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    console.log(
                        "[SIDAT] Membuka Profil NOTULA"
                    );

                    window.location.assign(
                        "../notula/profil.html"
                    );

                }
            );

        }


        /* =====================================================
           TOMBOL CLOSE
           ===================================================== */

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    closeMenu();

                }
            );

        }


        /* =====================================================
           KLIK AREA LUAR PANEL
           ===================================================== */

        if (overlay) {

            overlay.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === overlay
                    ) {

                        closeMenu();

                    }

                }
            );

        }


        /* =====================================================
           ITEM MENU
           ===================================================== */

        attachMenuItemEvents();


        /* =====================================================
           ESC
           ===================================================== */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeMenu();

                }

            }
        );

    }


    /* =========================================================
       INISIALISASI
       ========================================================= */

    function init() {

        try {

            createBottomNavbar();

            createFooter();

            createMenuOverlay();

            attachEvents();

            console.log(
                "[SIDAT] Menu NOTULA berhasil diinisialisasi."
            );

        } catch (error) {

            console.error(
                "[SIDAT] Gagal menginisialisasi menu NOTULA:",
                error
            );

        }

    }


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }

})();