/* =========================================================
SIDAT — WARGA MENU TERPUSAT
File   : warga-menu.js
Fungsi :

- Membuat bottom navbar Warga secara otomatis
- Membuat tombol Menu utama
- Membuat tombol Scan Jimpitan yang menonjol
- Membuat tombol Profil
- Membuat panel Menu Warga
- Membuat copyright footer
- Navigasi terpusat untuk seluruh halaman Warga
- Tidak bergantung pada navbar HTML lama
  ========================================================= */

(function () {
"use strict";

/* =====================================================
   CEGAH INISIALISASI GANDA
   ===================================================== */

if (window.__SIDAT_WARGA_MENU_INITIALIZED__) {
    return;
}

window.__SIDAT_WARGA_MENU_INITIALIZED__ = true;


/* =====================================================
   KONFIGURASI MENU
   ===================================================== */

const MENU_ITEMS = [
  {
    id: "beranda",
    label: "Beranda",
    target: "dashboard.html",
    icon: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5"/>
            <path d="M5 9.5V21h14V9.5"/>
            <path d="M9 21v-6h6v6"/>
        </svg>
    `
},
    {
        id: "data-warga",
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
        id: "laporan",
        label: "Laporan",
        target: "laporan.html",
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
        id: "jimpitan",
        label: "Jimpitan",
        target: "riwayat-jimpitan.html",
        icon: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2v20"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7"/>
            </svg>
        `
    },
    {
        id: "kas-rt",
        label: "Kas RT",
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

const ICON_MENU = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16"/>
        <path d="M4 12h16"/>
        <path d="M4 17h16"/>
    </svg>
`;


const ICON_SCAN = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>

        <path d="M8 8h3v3H8z"/>
        <path d="M13 8h3v3h-3z"/>
        <path d="M8 13h3v3H8z"/>
        <path d="M13 13h3v3h-3z"/>
    </svg>
`;


const ICON_PROFILE = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21a8 8 0 0 1 16 0"/>
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

let navMenu = null;
let navScan = null;
let navProfil = null;

let menuOverlay = null;
let menuPanel = null;
let closeMenuButton = null;


/* =====================================================
   CEK HALAMAN AKTIF
   ===================================================== */

function getCurrentPage() {

    const path =
        window.location.pathname || "";

    const file =
        path.split("/").pop();

    return file || "index.html";
}


/* =====================================================
   NAVIGASI MENU
   ===================================================== */

function bukaMenuItem(menu) {

    closeMenu();

    const item =
        MENU_ITEMS.find(function (menuItem) {

            return menuItem.id === menu;

        });


    if (!item || !item.target) {

        console.warn(
            "Menu Warga belum memiliki tujuan:",
            menu
        );

        return;
    }


    window.location.href =
        item.target;
}


/* =====================================================
   SCAN JIMPITAN
   ===================================================== */

function bukaScanJimpitan() {

    closeMenu();

    window.location.href =
        "scan-jimpitan.html";
}


/* =====================================================
   PROFIL WARGA
   ===================================================== */

function bukaProfilWarga() {

    closeMenu();

    window.location.href =
        "profil.html";
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


    menuOverlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "sidat-menu-open"
    );


    if (navMenu) {

        navMenu.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    if (closeMenuButton) {
        closeMenuButton.focus();
    }
}


/* =====================================================
   TUTUP MENU
   ===================================================== */

function closeMenu() {

    if (menuOverlay) {

        menuOverlay.classList.remove(
            "show"
        );

        menuOverlay.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    if (menuPanel) {

        menuPanel.classList.remove(
            "show"
        );
    }


    document.body.classList.remove(
        "sidat-menu-open"
    );


    if (navMenu) {

        navMenu.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


/* =====================================================
   BUAT BOTTOM NAVBAR
   ===================================================== */

function buatBottomNavbar() {

    /*
     * Hapus navbar Warga lama apabila masih
     * tertinggal di HTML.
     */

    const oldNav =
        document.querySelector(
            ".sidat-warga-bottom-nav"
        );


    if (oldNav) {
        oldNav.remove();
    }


    /*
     * Antisipasi nama navbar lama.
     */

    const oldNavLegacy =
        document.querySelector(
            ".warga-bottom-nav"
        );


    if (oldNavLegacy) {
        oldNavLegacy.remove();
    }


    const nav =
        document.createElement("nav");


    nav.className =
        "sidat-warga-bottom-nav";


    nav.setAttribute(
        "aria-label",
        "Navigasi utama Warga"
    );


    nav.innerHTML = `

        <div class="sidat-warga-nav-bubble bubble-left"></div>


        <!-- MENU -->

        <button
            type="button"
            class="sidat-warga-nav-item"
            id="wargaNavMenu"
            aria-label="Buka Menu Warga"
            aria-haspopup="dialog"
            aria-expanded="false"
        >

            <span class="sidat-warga-nav-icon">
                ${ICON_MENU}
            </span>

            <span class="sidat-warga-nav-label">
                Menu
            </span>

        </button>


        <!-- SCAN JIMPITAN -->

        <button
            type="button"
            class="sidat-warga-nav-scan"
            id="wargaNavScan"
            aria-label="Scan Jimpitan"
        >

            <span class="sidat-warga-nav-scan-circle">
                ${ICON_SCAN}
            </span>

            <span class="sidat-warga-nav-scan-label">
                Scan Jimpitan
            </span>

        </button>


        <!-- PROFIL -->

        <button
            type="button"
            class="sidat-warga-nav-item"
            id="wargaNavProfil"
            aria-label="Profil"
        >

            <span class="sidat-warga-nav-icon">
                ${ICON_PROFILE}
            </span>

            <span class="sidat-warga-nav-label">
                Profil
            </span>

        </button>


        <div class="sidat-warga-nav-bubble bubble-right"></div>

    `;


    document.body.appendChild(nav);


    navMenu =
        document.getElementById(
            "wargaNavMenu"
        );


    navScan =
        document.getElementById(
            "wargaNavScan"
        );


    navProfil =
        document.getElementById(
            "wargaNavProfil"
        );


    tandaiNavAktif();
}


/* =====================================================
   TANDAI NAVIGASI AKTIF
   ===================================================== */

function tandaiNavAktif() {

    const currentPage =
        getCurrentPage();


    /*
     * Scan Jimpitan aktif.
     */

    if (
        currentPage ===
        "scan-jimpitan.html"
    ) {

        if (navScan) {

            navScan.classList.add(
                "active"
            );
        }
    }


    /*
     * Profil aktif.
     */

    if (
        currentPage ===
        "profil.html"
    ) {

        if (navProfil) {

            navProfil.classList.add(
                "active"
            );
        }
    }
}


/* =====================================================
   BUAT MENU PANEL
   ===================================================== */

function buatMenuPanel() {

    /*
     * Hapus panel lama apabila masih ada.
     */

    const oldOverlay =
        document.querySelector(
            ".sidat-warga-menu-overlay"
        );


    if (oldOverlay) {
        oldOverlay.remove();
    }


    menuOverlay =
        document.createElement("div");


    menuOverlay.className =
        "sidat-warga-menu-overlay";


    menuOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    menuPanel =
        document.createElement("aside");


    menuPanel.className =
        "sidat-warga-menu-sheet";


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
        "Menu Warga SIDAT"
    );


    menuPanel.innerHTML = `

        <div class="sidat-warga-menu-handle"></div>


        <div class="sidat-warga-menu-header">

            <div class="sidat-warga-menu-title-wrap">

                <div class="sidat-warga-menu-brand">
                    SIDAT
                </div>

                <div class="sidat-warga-menu-subtitle">
                    Menu Warga
                </div>

            </div>


            <button
                type="button"
                class="sidat-warga-menu-close"
                id="wargaMenuClose"
                aria-label="Tutup Menu"
            >
                ${ICON_CLOSE}
            </button>

        </div>


        <div class="sidat-warga-menu-divider"></div>


        <div class="sidat-warga-menu-list">

            ${MENU_ITEMS.map(function (item) {

                return `

                    <button
                        type="button"
                        class="sidat-warga-menu-item"
                        data-menu="${item.id}"
                    >

                        <span class="sidat-warga-menu-icon">
                            ${item.icon}
                        </span>

                        <span class="sidat-warga-menu-label">
                            ${item.label}
                        </span>

                        <span class="sidat-warga-menu-arrow">

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


    menuOverlay.appendChild(
        menuPanel
    );


    document.body.appendChild(
        menuOverlay
    );


    closeMenuButton =
        document.getElementById(
            "wargaMenuClose"
        );
}


/* =====================================================
   BUAT COPYRIGHT FOOTER
   ===================================================== */

function buatFooter() {

    /*
     * Hapus footer Warga lama.
     */

    const oldFooter =
        document.querySelector(
            ".sidat-warga-footer"
        );


    if (oldFooter) {
        oldFooter.remove();
    }


    const oldFooterLegacy =
        document.querySelector(
            ".warga-footer"
        );


    if (oldFooterLegacy) {
        oldFooterLegacy.remove();
    }


    const footer =
        document.createElement("footer");


    footer.className =
        "sidat-warga-footer";


    footer.setAttribute(
        "aria-label",
        "Copyright SIDAT"
    );


    footer.innerHTML = `

        <strong>SIDAT</strong>

        <span>•</span>

        <span>
            Dibuat oleh Suwardi © 2026
        </span>

    `;


    document.body.appendChild(
        footer
    );
}


/* =====================================================
   EVENT MENU
   ===================================================== */

function pasangEventMenu() {

    /*
     * Tombol Menu
     */

    if (navMenu) {

        navMenu.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const isOpen =
                    menuPanel &&
                    menuPanel.classList.contains(
                        "show"
                    );


                if (isOpen) {

                    closeMenu();

                } else {

                    openMenu();
                }

            }
        );
    }


    /*
     * Tombol close
     */

    if (closeMenuButton) {

        closeMenuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeMenu();

            }
        );
    }


    /*
     * Klik area gelap
     */

    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    menuOverlay
                ) {

                    closeMenu();

                }

            }
        );
    }


    /*
     * Item menu
     */

    document
        .querySelectorAll(
            ".sidat-warga-menu-item[data-menu]"
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


    /*
     * Tombol Escape
     */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeMenu();

            }

        }
    );
}


/* =====================================================
   EVENT BOTTOM NAV
   ===================================================== */

function pasangEventBottomNav() {

    /*
     * Scan Jimpitan
     */

    if (navScan) {

        navScan.addEventListener(
            "click",
            function () {

                bukaScanJimpitan();

            }
        );
    }


    /*
     * Profil
     */

    if (navProfil) {

        navProfil.addEventListener(
            "click",
            function () {

                bukaProfilWarga();

            }
        );
    }
}


/* =====================================================
   INIT
   ===================================================== */

function initWargaMenu() {

    buatBottomNavbar();

    buatMenuPanel();

    buatFooter();

    pasangEventMenu();

    pasangEventBottomNav();
}


/* =====================================================
   DOM READY
   ===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initWargaMenu,
        {
            once: true
        }
    );

} else {

    initWargaMenu();

}


/* =====================================================
   EXPORT GLOBAL
   ===================================================== */

window.bukaMenuItem =
    bukaMenuItem;

window.bukaScanJimpitan =
    bukaScanJimpitan;

window.bukaProfilWarga =
    bukaProfilWarga;

window.openMenu =
    openMenu;

window.closeMenu =
    closeMenu;


window.SIDAT_WARGA_MENU = {

    buka: openMenu,

    tutup: closeMenu,

    items: MENU_ITEMS

};

})();