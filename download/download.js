// ==========================================================
// SIDAT - DOWNLOAD APK
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    const downloadButton = document.getElementById("downloadButton");
    const versionElement = document.getElementById("version");
    const sizeElement = document.getElementById("size");
    const releaseDateElement = document.getElementById("releaseDate");
    const releaseNameElement = document.getElementById("releaseName");
    const releaseInfoElement = document.getElementById("releaseInfo");
    const errorMessageElement = document.getElementById("errorMessage");

    // ======================================================
    // KONFIGURASI APK
    // ======================================================

    const APK_CONFIG = {
        version: "1.0.2",
        fileName: "SIDAT.apk",
        url: "../apk/SIDAT.apk"
    };

    // ======================================================
    // TAMPILKAN VERSI
    // ======================================================

    if (versionElement) {
        versionElement.textContent = APK_CONFIG.version;
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
    // CEK APK
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
                throw new Error("APK tidak ditemukan");
            }

            // Aktifkan tombol
            if (downloadButton) {

                downloadButton.href = APK_CONFIG.url;
                downloadButton.classList.remove("disabled");
                downloadButton.removeAttribute("aria-disabled");
            }

            // Ukuran file
            const contentLength =
                response.headers.get("content-length");

            if (sizeElement && contentLength) {

                const sizeMB =
                    parseInt(contentLength, 10) /
                    (1024 * 1024);

                sizeElement.textContent =
                    `${sizeMB.toFixed(1)} MB`;

            } else if (sizeElement) {

                sizeElement.textContent =
                    "±7,9 MB";
            }

        } catch (error) {

            console.error(
                "APK SIDAT tidak dapat diperiksa:",
                error
            );

            if (downloadButton) {

                downloadButton.href =
                    APK_CONFIG.url;

                downloadButton.classList.remove(
                    "disabled"
                );

                downloadButton.removeAttribute(
                    "aria-disabled"
                );
            }

            if (sizeElement) {
                sizeElement.textContent =
                    "±7,9 MB";
            }

            if (errorMessageElement) {

                errorMessageElement.hidden = false;

                errorMessageElement.textContent =
                    "Jika tombol tidak merespons, tekan kembali untuk mengunduh APK.";
            }
        }
    }

    // ======================================================
    // TOMBOL DOWNLOAD
    // ======================================================

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            () => {

                // Jangan menggunakan fetch/blob.
                // Biarkan browser Android menangani
                // file APK secara langsung.

                downloadButton.href =
                    APK_CONFIG.url;

                downloadButton.removeAttribute(
                    "aria-disabled"
                );

            }
        );
    }

    // ======================================================
    // MULAI
    // ======================================================

    cekAPK();

});
