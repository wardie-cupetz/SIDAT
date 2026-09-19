/* =========================================================
   SIDAT — KETUA RT MENU TERPUSAT
   File : ketua-rt-menu.js

   MENU KETUA RT:

   1. Data Warga
   2. Generate QR
   3. Laporan Warga
   4. Pengumuman

   Routing menggunakan halaman SIDAT yang sudah tersedia.
   Tampilan mengikuti ADMIN MENU.
   ========================================================= */

(function () {
    "use strict";


    /* =========================================================
       CEGAH INISIALISASI GANDA
       ========================================================= */

    if (window.__SIDAT_KETUA_RT_MENU_INITIALIZED__) {

        console.warn(
            "[SIDAT] Menu KETUA RT sudah diinisialisasi."
        );

        return;
    }

    window.__SIDAT_KETUA_RT_MENU_INITIALIZED__ = true;


    /* =========================================================
       ID UNIK
       ========================================================= */

    const CONTAINER_ID =
        "sidatKetuaRTMenuContainer";

    const OVERLAY_ID =
        "sidatKetuaRTMenuOverlay";

    const PANEL_ID =
        "sidatKetuaRTMenuPanel";

    const NAV_ID =
        "sidatKetuaRTBottomNav";

    const FOOTER_ID =
        "sidatKetuaRTFooter";


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

        users: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <circle cx="9" cy="8" r="3"></circle>
                <path d="M3 20c.5-3.5 2.5-5 6-5s5.5 1.5 6 5"></path>
                <path d="M16 11c2.8 0 4.5 1.3 5 4"></path>
                <path d="M16 5.5a3 3 0 0 1 0 5"></path>
            </svg>
        `,

        household: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M3 11 12 4l9 7"></path>
                <path d="M5 10.5V20h14v-9.5"></path>
                <path d="M9 20v-5h6v5"></path>
            </svg>
        `,

        report: `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M5 3h14v18H5z"></path>
                <path d="M8 8h8"></path>
                <path d="M8 12h8"></path>
                <path d="M8 16h5"></path>
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
       MENU KETUA RT
       ========================================================= */

    const MENU_ITEMS = [

        {
            id: "data-warga",
            label: "Data Warga",
            icon: ICONS.users,

            /*
             * ketua-rt/
             *     dashboard.html
             *     ketua-rt-menu.js
             *
             * ../admin/
             *     data-warga.html
             */
            url: "../admin/data-warga.html"
        },

        {
            id: "generate-qr",
            label: "Generate QR",
            icon: ICONS.household,

            url: "../admin/generate-qr.html"
        },

        {
            id: "laporan-warga",
            label: "Laporan Warga",
            icon: ICONS.report,

            url: "../admin/admin-laporan.html"
        },

        {
            id: "pengumuman",
            label: "Pengumuman",
            icon: ICONS.announcement,

            url: "../admin/pengumuman.html"
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

            <div class="bottom-nav-bubble bubble-left"></div>

            <div class="bottom-nav-bubble bubble-right"></div>


            <!-- BERANDA -->

            <button
                type="button"
                class="bottom-nav-item active"
                id="sidatKetuaRTNavHome"
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
                id="sidatKetuaRTNavMenu"
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
                id="sidatKetuaRTNavProfile"
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

        container.id = CONTAINER_ID;

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
                    aria-label="Menu KETUA RT"
                >

                    <!-- HEADER -->

                    <div class="admin-menu-header">

                        <div class="admin-menu-title-wrap">

                            <div class="admin-menu-brand">
                                SIDAT
                            </div>

                            <div class="admin-menu-subtitle">
                                Menu KETUA RT
                            </div>

                        </div>


                        <button
                            type="button"
                            class="admin-menu-close"
                            id="sidatKetuaRTMenuClose"
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

                            return `

                                <button
                                    type="button"
                                    class="menu-item"
                                    data-sidat-ketua-url="${escapeHtml(item.url)}"
                                    data-sidat-ketua-id="${escapeHtml(item.id)}"
                                    aria-label="${escapeHtml(item.label)}"
                                >

                                    <span class="menu-item-icon">
                                        ${item.icon}
                                    </span>

                                    <span class="menu-item-label">
                                        ${escapeHtml(item.label)}
                                    </span>

                                    <span class="menu-item-arrow">
                                        ${ICONS.chevron}
                                    </span>

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
                "[SIDAT] Overlay KETUA RT tidak ditemukan."
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

            console.error(
                "[SIDAT] URL menu kosong:",
                label
            );

            return;
        }

        console.log(
            "[SIDAT] KETUA RT →",
            label,
            "→",
            url
        );

        closeMenu();


        /*
         * Beri sedikit waktu agar animasi penutupan
         * menu selesai sebelum berpindah halaman.
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
                "[data-sidat-ketua-url]"
            );

        menuItems.forEach(function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    const url =
                        item.getAttribute(
                            "data-sidat-ketua-url"
                        );

                    const label =
                        item.querySelector(
                            ".menu-item-label"
                        )?.textContent?.trim() ||
                        "Menu KETUA RT";

                    navigate(
                        url,
                        label
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
                "sidatKetuaRTNavMenu"
            );

        const navHome =
            document.getElementById(
                "sidatKetuaRTNavHome"
            );

        const navProfile =
            document.getElementById(
                "sidatKetuaRTNavProfile"
            );

        const closeButton =
            document.getElementById(
                "sidatKetuaRTMenuClose"
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
                        "../ketua-rt/dashboard.html"
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
                "[SIDAT] Membuka Profil KETUA RT"
            );

            window.location.assign(
                "../ketua-rt/profil-rt.html"
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
                "[SIDAT] Menu KETUA RT berhasil diinisialisasi."
            );

        } catch (error) {

            console.error(
                "[SIDAT] Gagal menginisialisasi menu KETUA RT:",
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