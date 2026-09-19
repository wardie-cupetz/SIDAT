/* =========================================================
   SIDAT — ADMIN MENU TERPUSAT
   File   : admin-menu.js
   Fungsi :
   - Membuat bottom navbar Admin secara otomatis
   - Membuat tombol Menu utama
   - Membuat panel Menu Admin
   - Membuat copyright footer
   - Navigasi terpusat untuk seluruh halaman Admin
   - Tidak bergantung pada navbar HTML lama
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       CEGAH INISIALISASI GANDA
       ===================================================== */

    if (window.__SIDAT_ADMIN_MENU_INITIALIZED__) {
        return;
    }

    window.__SIDAT_ADMIN_MENU_INITIALIZED__ = true;


    /* =====================================================
       KONFIGURASI MENU
       ===================================================== */

    const MENU_ITEMS = [
        {
            id: "akun-warga",
            label: "Data Warga",
            target: "data-warga.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            `
        },
        {
            id: "jimpitan",
            label: "Jimpitan",
            target: "jimpitan-transfer.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2v20"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7"/>
                </svg>
            `
        },
              {
            id: "koperasi",
            label: "Koperasi RT",
            target: "koperasi.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16v13H4z"/>
                    <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                    <path d="M4 11h16"/>
                    <path d="M9 15h6"/>
                    <path d="M10 19v-4"/>
                </svg>
            `
        },
        {
            id: "laporan",
            label: "Laporan",
            target: "admin-laporan.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M8 13h8"/>
                    <path d="M8 17h6"/>
                    <path d="M8 9h2"/>
                </svg>
            `
        },
        {
            id: "agenda",
            label: "Agenda",
            target: "agenda.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="17" rx="2"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                    <path d="M3 10h18"/>
                    <path d="M8 14h.01"/>
                    <path d="M12 14h.01"/>
                    <path d="M16 14h.01"/>
                    <path d="M8 18h.01"/>
                    <path d="M12 18h.01"/>
                    <path d="M16 18h.01"/>
                </svg>
            `
        },
        {
            id: "arus-kas",
            label: "Arus Kas",
            target: "kas.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="M3 10h18"/>
                    <path d="M7 15h4"/>
                    <circle cx="17" cy="15" r="1"/>
                </svg>
            `
        },
        {
            id: "generate-qr",
            label: "Generate QR",
            target: "generate-qr.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3h7v7H3z"/>
                    <path d="M14 3h7v7h-7z"/>
                    <path d="M3 14h7v7H3z"/>
                    <path d="M14 14h3v3h-3z"/>
                    <path d="M19 14h2"/>
                    <path d="M19 17v4"/>
                    <path d="M14 19h3"/>
                </svg>
            `
        },
        {
            id: "pengumuman",
            label: "Pengumuman",
            target: "pengumuman.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 11v2"/>
                    <path d="M6 9v6"/>
                    <path d="M9 7v10"/>
                    <path d="M12 5v14"/>
                    <path d="M15 8v8"/>
                    <path d="M18 10v4"/>
                    <path d="M21 11v2"/>
                </svg>
            `
        },
        {
            id: "notula",
            label: "Notula",
            target: "notula.html",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 4h16v16H4z"/>
                    <path d="M8 8h8"/>
                    <path d="M8 12h8"/>
                    <path d="M8 16h5"/>
                </svg>
            `
        }
    ];


    /* =====================================================
       HELPER SVG
       ===================================================== */

    const ICON_HOME = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5"/>
            <path d="M5 9.5V21h14V9.5"/>
            <path d="M9 21v-6h6v6"/>
        </svg>
    `;

    const ICON_MENU = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16"/>
            <path d="M4 12h16"/>
            <path d="M4 17h16"/>
        </svg>
    `;

    const ICON_SETTINGS = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V20h-2.55v-.11a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 7.1 15a1.7 1.7 0 0 0-1.55-1.03H5.44v-2.55h.11A1.7 1.7 0 0 0 7.1 10.4a1.7 1.7 0 0 0-.34-1.88L6.7 8.46l1.8-1.8.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.55V5.4h2.55v.11a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06a1.7 1.7 0 0 0 .34 1.88 1.7 1.7 0 0 0 1.55 1.03h.11v2.55h-.11A1.7 1.7 0 0 0 19.4 15z"/>
        </svg>
    `;

    const ICON_CLOSE = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12"/>
            <path d="M18 6 6 18"/>
        </svg>
    `;


    /* =====================================================
       VARIABEL GLOBAL MENU
       ===================================================== */

    let navBeranda = null;
    let navMenu = null;
    let navPengaturan = null;

    let menuOverlay = null;
    let menuPanel = null;
    let closeMenuButton = null;


    /* =====================================================
       CEK HALAMAN AKTIF
       ===================================================== */

    function getCurrentPage() {
        const path = window.location.pathname || "";
        const file = path.split("/").pop();

        return file || "index.html";
    }


    /* =====================================================
       NAVIGASI MENU
       ===================================================== */

    function bukaMenuItem(menu) {
        closeMenu();

        const item = MENU_ITEMS.find(function (menuItem) {
            return menuItem.id === menu;
        });

        if (!item || !item.target) {
            console.warn("Menu belum memiliki tujuan:", menu);
            return;
        }

        window.location.href = item.target;
    }


    /* BERANDA */

    function bukaBeranda() {
        closeMenu();

        window.location.href = "dashboard.html";
    }
    


    /* PENGATURAN */

    function bukaPengaturan() {
        closeMenu();

        window.location.href = "pengaturan.html";
    }


    /* PROFIL ADMIN */

    function bukaProfilAdmin() {
        closeMenu();

        window.location.href = "profil.html";
    }


    /* =====================================================
       BUKA MENU
       ===================================================== */

    function openMenu() {
        if (!menuOverlay || !menuPanel) {
            return;
        }

        menuOverlay.classList.add("show");
        menuPanel.classList.add("show");

        document.body.classList.add("sidat-menu-open");

        if (closeMenuButton) {
            closeMenuButton.focus();
        }
    }


    /* =====================================================
       TUTUP MENU
       ===================================================== */

    function closeMenu() {
        if (menuOverlay) {
            menuOverlay.classList.remove("show");
        }

        if (menuPanel) {
            menuPanel.classList.remove("show");
        }

        document.body.classList.remove("sidat-menu-open");
    }


    /* =====================================================
       BUAT BOTTOM NAVBAR
       ===================================================== */

    function buatBottomNavbar() {

        const oldNav = document.querySelector(".admin-bottom-nav");

        /*
         * Navbar lama tidak digunakan.
         * Jika masih ada di HTML, hapus agar tidak terjadi
         * navbar ganda.
         */

        if (oldNav) {
            oldNav.remove();
        }


        const nav = document.createElement("nav");

        nav.className = "admin-bottom-nav";
        nav.setAttribute("aria-label", "Navigasi utama Admin");

        nav.innerHTML = `
            <div class="bottom-nav-bubble bubble-left"></div>

            <button
                type="button"
                class="bottom-nav-item"
                id="adminNavBeranda"
                aria-label="Beranda"
            >
                <span class="bottom-nav-icon">
                    ${ICON_HOME}
                </span>
                <span class="bottom-nav-label">Beranda</span>
            </button>

            <button
                type="button"
                class="menu-main-button"
                id="adminMenuButton"
                aria-label="Buka Menu Admin"
                aria-haspopup="dialog"
                aria-expanded="false"
            >
                <span class="menu-main-circle">
                    ${ICON_MENU}
                </span>
                <span class="menu-main-label">Menu</span>
            </button>

            <button
                type="button"
                class="bottom-nav-item"
                id="adminNavPengaturan"
                aria-label="Pengaturan"
            >
                <span class="bottom-nav-icon">
                    ${ICON_SETTINGS}
                </span>
                <span class="bottom-nav-label">Pengaturan</span>
            </button>

            <div class="bottom-nav-bubble bubble-right"></div>
        `;

        document.body.appendChild(nav);


        navBeranda = document.getElementById("adminNavBeranda");
        navMenu = document.getElementById("adminMenuButton");
        navPengaturan = document.getElementById("adminNavPengaturan");


        tandaiNavAktif();
    }


    /* =====================================================
       TANDAI NAVIGASI AKTIF
       ===================================================== */

    function tandaiNavAktif() {

        const currentPage = getCurrentPage();

        /*
         * Beranda dianggap aktif hanya pada halaman admin
         * utama jika halaman tersebut menggunakan navigasi
         * ini.
         */

        if (
            currentPage === "index.html" ||
            currentPage === "dashboard.html"
        ) {
            if (navBeranda) {
                navBeranda.classList.add("active");
            }
        }

        /*
         * Pengaturan aktif pada pengaturan.html
         */

        if (currentPage === "pengaturan.html") {
            if (navPengaturan) {
                navPengaturan.classList.add("active");
            }
        }
    }


    /* =====================================================
       BUAT MENU PANEL
       ===================================================== */

    function buatMenuPanel() {

        const oldOverlay = document.querySelector(".admin-menu-overlay");

        if (oldOverlay) {
            oldOverlay.remove();
        }


        menuOverlay = document.createElement("div");

        menuOverlay.className = "admin-menu-overlay";

        menuOverlay.setAttribute(
            "aria-hidden",
            "true"
        );


        menuPanel = document.createElement("aside");

        menuPanel.className = "admin-menu-panel";

        menuPanel.setAttribute(
            "role",
            "dialog"
        );

        menuPanel.setAttribute(
            "aria-modal",
            "true"
        );

        menuPanel.setAttribute(
            "aria-label",
            "Menu Admin SIDAT"
        );


        menuPanel.innerHTML = `
            <div class="admin-menu-header">

                <div class="admin-menu-title-wrap">
                    <div class="admin-menu-brand">
                        SIDAT ADMIN
                    </div>

                    <div class="admin-menu-subtitle">
                        Menu Admin
                    </div>
                </div>

                <button
                    type="button"
                    class="admin-menu-close"
                    id="adminMenuClose"
                    aria-label="Tutup Menu"
                >
                    ${ICON_CLOSE}
                </button>

            </div>

            <div class="admin-menu-divider"></div>

            <div class="admin-menu-list">
                ${MENU_ITEMS.map(function (item) {

                    return `
                        <button
                            type="button"
                            class="menu-item"
                            data-menu="${item.id}"
                        >
                            <span class="menu-item-icon">
                                ${item.icon}
                            </span>

                            <span class="menu-item-label">
                                ${item.label}
                            </span>

                            <span class="menu-item-arrow">
                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="m9 18 6-6-6-6"/>
                                </svg>
                            </span>
                        </button>
                    `;

                }).join("")}
            </div>
        `;


        menuOverlay.appendChild(menuPanel);

        document.body.appendChild(menuOverlay);


        closeMenuButton = document.getElementById(
            "adminMenuClose"
        );
    }


    /* =====================================================
       BUAT COPYRIGHT FOOTER
       ===================================================== */

    function buatFooter() {

        const oldFooter = document.querySelector(".admin-footer");

        if (oldFooter) {
            oldFooter.remove();
        }


        const footer = document.createElement("footer");

        footer.className = "admin-footer";

        footer.setAttribute(
            "aria-label",
            "Copyright SIDAT"
        );

        footer.innerHTML = `
            <strong>SIDAT</strong>
            <span>•</span>
            <span>Dibuat oleh Suwardi © 2026</span>
        `;


        document.body.appendChild(footer);
    }


    /* =====================================================
       EVENT MENU
       ===================================================== */

    function pasangEventMenu() {

        if (navMenu) {

            navMenu.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const isOpen =
                        menuPanel &&
                        menuPanel.classList.contains("show");

                    if (isOpen) {
                        closeMenu();
                    } else {
                        openMenu();
                    }

                    navMenu.setAttribute(
                        "aria-expanded",
                        String(!isOpen)
                    );
                }
            );
        }


        if (closeMenuButton) {

            closeMenuButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    closeMenu();

                    if (navMenu) {
                        navMenu.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                }
            );
        }


        if (menuOverlay) {

            menuOverlay.addEventListener(
                "click",
                function (event) {

                    /*
                     * Klik pada area gelap di luar panel
                     * menutup menu.
                     */

                    if (event.target === menuOverlay) {
                        closeMenu();

                        if (navMenu) {
                            navMenu.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    }
                }
            );
        }


        document
            .querySelectorAll(
                ".menu-item[data-menu]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const menu =
                            button.getAttribute(
                                "data-menu"
                            );

                        bukaMenuItem(menu);
                    }
                );
            });


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    closeMenu();

                    if (navMenu) {
                        navMenu.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                }
            }
        );
    }


    /* =====================================================
       EVENT NAVIGASI BAWAH
       ===================================================== */

    function pasangEventBottomNav() {

        if (navBeranda) {

            navBeranda.addEventListener(
                "click",
                function () {

                    bukaBeranda();
                }
            );
        }


        if (navPengaturan) {

            navPengaturan.addEventListener(
                "click",
                function () {

                    bukaPengaturan();
                }
            );
        }
    }


    /* =====================================================
       INIT
       ===================================================== */

    function initAdminMenu() {

        buatBottomNavbar();

        buatMenuPanel();

        buatFooter();

        pasangEventMenu();

        pasangEventBottomNav();
    }


    /* =====================================================
       DOM READY
       ===================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initAdminMenu,
            {
                once: true
            }
        );

    } else {

        initAdminMenu();
    }


    /* =====================================================
       EXPORT GLOBAL
       ===================================================== */

    window.bukaMenuItem = bukaMenuItem;
    window.bukaBeranda = bukaBeranda;
    window.bukaPengaturan = bukaPengaturan;
    window.bukaProfilAdmin = bukaProfilAdmin;
    window.openMenu = openMenu;
    window.closeMenu = closeMenu;

})();