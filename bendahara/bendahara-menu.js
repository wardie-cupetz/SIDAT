/* =========================================================
SIDAT — BENDAHARA MENU TERPUSAT
File   : bendahara-menu.js

Fungsi :

- Membuat bottom navbar Bendahara secara otomatis
- Struktur mengikuti Admin Menu
- Membuat tombol Menu utama
- Membuat panel Menu Bendahara
- Membuat copyright footer
- Navigasi terpusat untuk seluruh halaman Bendahara
- Tidak bergantung pada navbar HTML lama
- Menu Bendahara:
  1. Arus Kas
  2. Jimpitan

Bottom Navbar:

- Beranda
- Menu
- Profil
  ========================================================= */

(function () {

"use strict";


/* =====================================================
   CEGAH INISIALISASI GANDA
   ===================================================== */

if (window.__SIDAT_BENDAHARA_MENU_INITIALIZED__) {
    return;
}

window.__SIDAT_BENDAHARA_MENU_INITIALIZED__ = true;


/* =====================================================
   KONFIGURASI MENU BENDAHARA
   ===================================================== */

const MENU_ITEMS = [

    {
        id: "arus-kas",

        label: "Arus Kas",

        target: "../admin/kas.html",

        icon: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                />

                <path d="M3 10h18"/>

                <path d="M7 15h4"/>

                <circle
                    cx="17"
                    cy="15"
                    r="1"
                />
            </svg>
        `
    },


    {
        id: "jimpitan",

        label: "Jimpitan",

        target: "../admin/jimpitan-transfer.html",

        icon: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M12 2v20"/>

                <path
                    d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7"
                />
            </svg>
        `
    }

];


/* =====================================================
   HELPER SVG
   ===================================================== */

const ICON_HOME = `

    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
    >

        <path
            d="M3 10.5 12 3l9 7.5"
        />

        <path
            d="M5 9.5V21h14V9.5"
        />

        <path
            d="M9 21v-6h6v6"
        />

    </svg>

`;


const ICON_MENU = `

    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
    >

        <path d="M4 7h16"/>

        <path d="M4 12h16"/>

        <path d="M4 17h16"/>

    </svg>

`;


/*
 * ICON PROFIL
 *
 * Menggantikan ikon Pengaturan.
 */

const ICON_PROFILE = `

    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
    >

        <circle
            cx="12"
            cy="8"
            r="4"
        />

        <path
            d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8"
        />

    </svg>

`;


const ICON_CLOSE = `

    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
    >

        <path d="M6 6l12 12"/>

        <path d="M18 6 6 18"/>

    </svg>

`;


/* =====================================================
   VARIABEL GLOBAL MENU
   ===================================================== */

let navBeranda = null;

let navMenu = null;

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
        MENU_ITEMS.find(
            function (menuItem) {

                return menuItem.id === menu;

            }
        );


    if (!item || !item.target) {

        console.warn(
            "Menu belum memiliki tujuan:",
            menu
        );

        return;

    }


    window.location.href =
        item.target;

}


/* =====================================================
   BERANDA
   ===================================================== */

function bukaBeranda() {
    closeMenu();

    window.location.href =
        "../bendahara/dashboard.html";
}


/* =====================================================
   PROFIL BENDAHARA
   ===================================================== */

function bukaProfilBendahara() {
    closeMenu();

    window.location.href =
        "../bendahara/profil.html";
}


/* =====================================================
   BUKA MENU
   ===================================================== */

function openMenu() {

    if (
        !menuOverlay ||
        !menuPanel
    ) {

        return;

    }


    menuOverlay.classList.add(
        "show"
    );


    menuPanel.classList.add(
        "show"
    );


    document.body.classList.add(
        "sidat-menu-open"
    );


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

    }


    if (menuPanel) {

        menuPanel.classList.remove(
            "show"
        );

    }


    document.body.classList.remove(
        "sidat-menu-open"
    );

}


/* =====================================================
   BUAT BOTTOM NAVBAR
   ===================================================== */

function buatBottomNavbar() {

    const oldNav =
        document.querySelector(
            ".admin-bottom-nav"
        );


    /*
     * Navbar lama tidak digunakan.
     * Jika masih ada di HTML, hapus agar
     * tidak terjadi navbar ganda.
     */

    if (oldNav) {

        oldNav.remove();

    }


    const nav =
        document.createElement("nav");


    /*
     * Menggunakan class Admin agar
     * CSS yang sama dapat digunakan.
     */

    nav.className =
        "admin-bottom-nav";


    nav.setAttribute(
        "aria-label",
        "Navigasi utama Bendahara"
    );


    nav.innerHTML = `

        <div
            class="bottom-nav-bubble bubble-left"
        ></div>


        <!-- =========================
             BERANDA
             ========================= -->

        <button
            type="button"
            class="bottom-nav-item"
            id="bendaharaNavBeranda"
            aria-label="Beranda"
        >

            <span
                class="bottom-nav-icon"
            >
                ${ICON_HOME}
            </span>

            <span
                class="bottom-nav-label"
            >
                Beranda
            </span>

        </button>


        <!-- =========================
             MENU
             ========================= -->

        <button
            type="button"
            class="menu-main-button"
            id="bendaharaMenuButton"
            aria-label="Buka Menu Bendahara"
            aria-haspopup="dialog"
            aria-expanded="false"
        >

            <span
                class="menu-main-circle"
            >
                ${ICON_MENU}
            </span>

            <span
                class="menu-main-label"
            >
                Menu
            </span>

        </button>


        <!-- =========================
             PROFIL
             ========================= -->

        <button
            type="button"
            class="bottom-nav-item"
            id="bendaharaNavProfil"
            aria-label="Profil"
        >

            <span
                class="bottom-nav-icon"
            >
                ${ICON_PROFILE}
            </span>

            <span
                class="bottom-nav-label"
            >
                Profil
            </span>

        </button>


        <div
            class="bottom-nav-bubble bubble-right"
        ></div>

    `;


    document.body.appendChild(
        nav
    );


    navBeranda =
        document.getElementById(
            "bendaharaNavBeranda"
        );


    navMenu =
        document.getElementById(
            "bendaharaMenuButton"
        );


    navProfil =
        document.getElementById(
            "bendaharaNavProfil"
        );


    tandaiNavAktif();

}


/* =====================================================
   TANDAI NAVIGASI AKTIF
   ===================================================== */

function tandaiNavAktif() {

    const currentPage =
        getCurrentPage();


    /* =========================
       BERANDA
       ========================= */

    if (
        currentPage === "index.html" ||
        currentPage === "dashboard.html"
    ) {

        if (navBeranda) {

            navBeranda.classList.add(
                "active"
            );

        }

    }


    /* =========================
       PROFIL
       ========================= */

    if (
        currentPage === "profil.html"
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

    const oldOverlay =
        document.querySelector(
            ".admin-menu-overlay"
        );


    if (oldOverlay) {

        oldOverlay.remove();

    }


    menuOverlay =
        document.createElement("div");


    /*
     * Menggunakan class Admin agar
     * tampilan mengikuti CSS Admin.
     */

    menuOverlay.className =
        "admin-menu-overlay";


    menuOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    menuPanel =
        document.createElement("aside");


    menuPanel.className =
        "admin-menu-panel";


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
        "Menu Bendahara SIDAT"
    );


    menuPanel.innerHTML = `

        <div
            class="admin-menu-header"
        >

            <div
                class="admin-menu-title-wrap"
            >

                <div
                    class="admin-menu-brand"
                >
                    SIDAT BENDAHARA
                </div>


                <div
                    class="admin-menu-subtitle"
                >
                    Menu Bendahara
                </div>

            </div>


            <button
                type="button"
                class="admin-menu-close"
                id="bendaharaMenuClose"
                aria-label="Tutup Menu"
            >

                ${ICON_CLOSE}

            </button>

        </div>


        <div
            class="admin-menu-divider"
        ></div>


        <div
            class="admin-menu-list"
        >

            ${MENU_ITEMS.map(
                function (item) {

                    return `

                        <button
                            type="button"
                            class="menu-item"
                            data-menu="${item.id}"
                        >

                            <span
                                class="menu-item-icon"
                            >
                                ${item.icon}
                            </span>


                            <span
                                class="menu-item-label"
                            >
                                ${item.label}
                            </span>


                            <span
                                class="menu-item-arrow"
                            >

                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >

                                    <path
                                        d="m9 18 6-6-6-6"
                                    />

                                </svg>

                            </span>

                        </button>

                    `;

                }
            ).join("")}

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
            "bendaharaMenuClose"
        );

}


/* =====================================================
   BUAT COPYRIGHT FOOTER
   ===================================================== */

function buatFooter() {

    const oldFooter =
        document.querySelector(
            ".admin-footer"
        );


    if (oldFooter) {

        oldFooter.remove();

    }


    const footer =
        document.createElement("footer");


    footer.className =
        "admin-footer";


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
                 * Klik area gelap di luar panel
                 * menutup menu.
                 */

                if (
                    event.target ===
                    menuOverlay
                ) {

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
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const menu =
                            button.getAttribute(
                                "data-menu"
                            );


                        bukaMenuItem(
                            menu
                        );

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

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

    /* =========================
       BERANDA
       ========================= */

    if (navBeranda) {

        navBeranda.addEventListener(
            "click",
            function () {

                bukaBeranda();

            }
        );

    }


    /* =========================
       PROFIL
       ========================= */

    if (navProfil) {

        navProfil.addEventListener(
            "click",
            function () {

                bukaProfilBendahara();

            }
        );

    }

}


/* =====================================================
   INIT
   ===================================================== */

function initBendaharaMenu() {

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
        initBendaharaMenu,
        {
            once: true
        }
    );

} else {

    initBendaharaMenu();

}


/* =====================================================
   EXPORT GLOBAL
   ===================================================== */

window.bukaMenuItem =
    bukaMenuItem;


window.bukaBeranda =
    bukaBeranda;


window.bukaProfilBendahara =
    bukaProfilBendahara;


window.openMenu =
    openMenu;


window.closeMenu =
    closeMenu;

})();