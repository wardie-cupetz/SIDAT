// ==========================================
// SIDAT
// PWA INSTALL
// ==========================================

let deferredInstallPrompt = null;


// ==========================================
// BUAT BANNER
// ==========================================

function buatBannerInstall() {

    if (document.getElementById("sidatInstallBanner")) {
        return;
    }

    const banner = document.createElement("div");

    banner.id = "sidatInstallBanner";

    banner.innerHTML = `
        <div class="sidat-install-logo">
            <img
                src="./icons/icon-192.png"
                alt="Logo SIDAT"
            >
        </div>

        <div class="sidat-install-content">

            <strong>Instal SIDAT</strong>

            <span>
                Pasang aplikasi SIDAT di HP
                untuk akses lebih cepat.
            </span>

            <button
                id="sidatInstallButton"
                type="button"
            >
                Instal Sekarang
            </button>

        </div>

        <button
            id="sidatInstallClose"
            class="sidat-install-close"
            type="button"
            aria-label="Tutup"
        >
            ×
        </button>
    `;

    document.body.appendChild(banner);


    // ==========================================
    // INSTALL
    // ==========================================

    document
        .getElementById("sidatInstallButton")
        .addEventListener("click", async () => {

            if (!deferredInstallPrompt) {
                return;
            }

            deferredInstallPrompt.prompt();

            const result =
                await deferredInstallPrompt.userChoice;

            console.log(
                "SIDAT install:",
                result.outcome
            );

            deferredInstallPrompt = null;

            sembunyikanBannerInstall();

        });


    // ==========================================
    // TUTUP
    // ==========================================

    document
        .getElementById("sidatInstallClose")
        .addEventListener("click", () => {

            sembunyikanBannerInstall();

            localStorage.setItem(
                "sidat_install_dismissed",
                "true"
            );

        });

}


// ==========================================
// TAMPILKAN
// ==========================================

function tampilkanBannerInstall() {

    const banner =
        document.getElementById(
            "sidatInstallBanner"
        );

    if (banner) {

        banner.classList.add(
            "sidat-install-show"
        );

    }

}


// ==========================================
// SEMBUNYIKAN
// ==========================================

function sembunyikanBannerInstall() {

    const banner =
        document.getElementById(
            "sidatInstallBanner"
        );

    if (banner) {

        banner.classList.remove(
            "sidat-install-show"
        );

    }

}


// ==========================================
// CHROME PWA INSTALL
// ==========================================

window.addEventListener(
    "beforeinstallprompt",
    (event) => {

        console.log(
            "SIDAT: PWA siap diinstall"
        );

        event.preventDefault();

        deferredInstallPrompt = event;

        buatBannerInstall();

        const dismissed =
            localStorage.getItem(
                "sidat_install_dismissed"
            );

        if (dismissed !== "true") {

            setTimeout(() => {

                tampilkanBannerInstall();

            }, 1000);

        }

    }
);


// ==========================================
// BERHASIL INSTALL
// ==========================================

window.addEventListener(
    "appinstalled",
    () => {

        console.log(
            "SIDAT berhasil diinstall"
        );

        deferredInstallPrompt = null;

        sembunyikanBannerInstall();

    }
);
