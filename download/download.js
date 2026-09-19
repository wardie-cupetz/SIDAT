// ==========================================================
// SIDAT - DOWNLOAD APK
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    const downloadButton = document.getElementById("downloadButton");
    const versionElement = document.getElementById("version");
    const sizeElement = document.getElementById("fileSize");
    const releaseDateElement = document.getElementById("releaseDate");
    const releaseNameElement = document.getElementById("releaseName");
    const releaseInfoElement = document.getElementById("releaseInfo");
    const errorMessageElement = document.getElementById("errorMessage");

    // ======================================================
    // KONFIGURASI APK SIDAT
    // ======================================================

    const APK_CONFIG = {
        version: "1.0.2",
        fileName: "SIDAT.apk",
        url: "../apk/SIDAT.apk",
        size: "7,9 MB"
    };

    // ======================================================
    // INFORMASI VERSI
    // ======================================================

    if (versionElement) {
        versionElement.textContent = APK_CONFIG.version;
    }

    // ======================================================
    // INFORMASI UKURAN APK
    // ======================================================

    if (sizeElement) {
        sizeElement.textContent = APK_CONFIG.size;
    }

    // ======================================================
    // INFORMASI RELEASE
    // ======================================================

    if (releaseNameElement) {
        releaseNameElement.textContent = "SIDAT Android";
    }

    if (releaseInfoElement) {
        releaseInfoElement.textContent =
            "Aplikasi resmi SIDAT untuk mempermudah pelayanan dan administrasi warga.";
    }

    if (releaseDateElement) {
        releaseDateElement.textContent = "Versi terbaru";
    }

    // ======================================================
    // CEK KETERSEDIAAN APK
    // ======================================================

    async function cekAPK() {

        try {

            const response = await fetch(
                APK_CONFIG.url,
                {
                    method: "HEAD",
                    cache: "no-cache"
                }
            );

            if (!response.ok) {
                throw new Error("APK tidak ditemukan.");
            }

            if (downloadButton) {
                downloadButton.href = APK_CONFIG.url;
                downloadButton.classList.remove("disabled");
                downloadButton.removeAttribute("aria-disabled");
            }

            if (errorMessageElement) {
                errorMessageElement.hidden = true;
            }

        } catch (error) {

            console.error(
                "Gagal mengecek APK SIDAT:",
                error
            );

            // Tombol tetap diarahkan ke APK.
            // Download langsung tetap bisa dilakukan.
            if (downloadButton) {
                downloadButton.href = APK_CONFIG.url;
                downloadButton.classList.remove("disabled");
                downloadButton.removeAttribute("aria-disabled");
            }

        }
    }

    // ======================================================
    // CEK APK
    // ======================================================

    cekAPK();

});
