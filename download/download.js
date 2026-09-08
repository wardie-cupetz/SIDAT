// ==========================================================
// SIDAT - DOWNLOAD APK
// download/download.js
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    const downloadButton = document.getElementById("download-apk");
    const versionElement = document.getElementById("apk-version");
    const sizeElement = document.getElementById("apk-size");
    const statusElement = document.getElementById("download-status");

    // ======================================================
    // KONFIGURASI APK SIDAT
    // ======================================================

    const APK_CONFIG = {
        version: "1.0.2",
        fileName: "SIDAT.apk",
        folder: "../apk"
    };

    // ======================================================
    // URL APK
    // Halaman berada di /download/
    // APK berada di /apk/
    // ======================================================

    const apkUrl = `${APK_CONFIG.folder}/${APK_CONFIG.fileName}`;

    // ======================================================
    // INFORMASI VERSI
    // ======================================================

    if (versionElement) {
        versionElement.textContent = `Versi ${APK_CONFIG.version}`;
    }

    // ======================================================
    // FORMAT UKURAN FILE
    // ======================================================

    function formatSize(bytes) {

        if (!bytes || bytes <= 0) {
            return "Tidak diketahui";
        }

        const mb = bytes / (1024 * 1024);

        return `${mb.toFixed(1)} MB`;
    }

    // ======================================================
    // CEK APK
    // ======================================================

    async function cekAPK() {

        if (!statusElement) return;

        try {

            const response = await fetch(apkUrl, {
                method: "HEAD",
                cache: "no-cache"
            });

            if (!response.ok) {
                throw new Error("APK tidak ditemukan.");
            }

            statusElement.textContent =
                "APK tersedia untuk diunduh.";

            statusElement.classList.remove("error");
            statusElement.classList.add("success");

            const contentLength =
                response.headers.get("content-length");

            if (contentLength && sizeElement) {

                sizeElement.textContent =
                    `Ukuran APK: ${formatSize(
                        parseInt(contentLength, 10)
                    )}`;

            } else if (sizeElement) {

                sizeElement.textContent =
                    "Ukuran APK: ±7,9 MB";

            }

        } catch (error) {

            console.error(
                "Gagal mengecek APK:",
                error
            );

            statusElement.textContent =
                "APK belum tersedia.";

            statusElement.classList.remove("success");
            statusElement.classList.add("error");

            if (sizeElement) {
                sizeElement.textContent =
                    "Ukuran APK: ±7,9 MB";
            }
        }
    }

    // ======================================================
    // DOWNLOAD APK
    // ======================================================

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                // Langsung buka URL APK.
                // Ini lebih kompatibel dengan Android
                // dan GitHub Pages dibanding fetch + blob.

                const link =
                    document.createElement("a");

                link.href = apkUrl;
                link.download = APK_CONFIG.fileName;
                link.target = "_blank";
                link.rel = "noopener";

                document.body.appendChild(link);

                link.click();

                link.remove();

                if (statusElement) {

                    statusElement.textContent =
                        "Download APK dimulai...";

                    statusElement.classList.remove(
                        "error"
                    );

                    statusElement.classList.add(
                        "success"
                    );
                }
            }
        );
    }

    // ======================================================
    // CEK APK SAAT HALAMAN DIBUKA
    // ======================================================

    cekAPK();

});
