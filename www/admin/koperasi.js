/* =========================================================
   SIDAT
   HALAMAN KOPERASI RT
   ========================================================= */

(function () {
    "use strict";

    if (window.__SIDAT_KOPERASI_INITIALIZED__) {
        return;
    }

    window.__SIDAT_KOPERASI_INITIALIZED__ = true;


    /* =====================================================
       MENU KOPERASI
       ===================================================== */

    const MENU_TARGETS = {
        anggota: "koperasi-anggota.html",
        simpanan: "koperasi-simpanan.html",
        pinjaman: "koperasi-pinjaman.html",
        angsuran: "koperasi-angsuran.html"
    };


    /* =====================================================
       NAVIGASI
       ===================================================== */

    document
        .querySelectorAll("[data-koperasi-menu]")
        .forEach(function (button) {

            button.addEventListener("click", function () {

                const menu =
                    button.getAttribute("data-koperasi-menu");

                const target =
                    MENU_TARGETS[menu];

                if (!target) {
                    console.warn(
                        "Menu Koperasi belum memiliki tujuan:",
                        menu
                    );

                    return;
                }

                window.location.href = target;
            });
        });

})();