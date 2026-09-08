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
        version: "1.0.0",

        // GANTI NAMA FILE INI SESUAI APK YANG ADA DI REPOSITORY
        fileName: "SIDAT.apk",

        // Lokasi folder APK di repository GitHub Pages
        folder: "apk"
    };

    // ======================================================
    // MEMBUAT URL DOWNLOAD
    // ======================================================

    const apkUrl = `${APK_CONFIG.folder}/${APK_CONFIG.fileName}`;

    // ======================================================
    // TAMPILKAN INFORMASI VERSI
    // ======================================================

    if (versionElement) {
        versionElement.textContent = `Versi ${APK_CONFIG.version}`;
    }

    // ======================================================
    // CEK FILE APK
    // ======================================================

    async function cekAPK() {
        if (!statusElement) return;

        try {
            const response = await fetch(apkUrl, {
                method: "HEAD",
                cache: "no-cache"
            });

            if (response.ok) {
                statusElement.textContent = "APK tersedia untuk diunduh.";
                statusElement.classList.remove("error");
                statusElement.classList.add("success");

                // Tampilkan ukuran file jika tersedia
                const contentLength = response.headers.get("content-length");

                if (contentLength && sizeElement) {
                    const ukuranMB =
                        parseInt(contentLength, 10) / (1024 * 1024);

                    sizeElement.textContent =
                        `Ukuran APK: ${ukuranMB.toFixed(1)} MB`;
                }
            } else {
                statusElement.textContent =
                    "File APK belum tersedia.";

                statusElement.classList.remove("success");
                statusElement.classList.add("error");
            }
        } catch (error) {
            console.error("Gagal mengecek APK:", error);

            statusElement.textContent =
                "Tidak dapat mengecek file APK.";

            statusElement.classList.remove("success");
            statusElement.classList.add("error");
        }
    }

    // ======================================================
    // TOMBOL DOWNLOAD
    // ======================================================

    if (downloadButton) {
        downloadButton.addEventListener("click", async (event) => {
            event.preventDefault();

            downloadButton.disabled = true;

            const teksAwal = downloadButton.textContent;
            downloadButton.textContent = "Menyiapkan download...";

            try {
                const response = await fetch(apkUrl, {
                    method: "HEAD",
                    cache: "no-cache"
                });

                if (!response.ok) {
                    throw new Error("File APK tidak ditemukan.");
                }

                // Buat link download
                const link = document.createElement("a");

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
                    statusElement.classList.remove("error");
                    statusElement.classList.add("success");
                }

            } catch (error) {
                console.error("Download APK gagal:", error);

                if (statusElement) {
                    statusElement.textContent =
                        "APK belum tersedia atau gagal diunduh.";
                    statusElement.classList.remove("success");
                    statusElement.classList.add("error");
                }

                alert(
                    "APK SIDAT belum tersedia.\n\n" +
                    "Pastikan file APK sudah berada di folder /apk/ pada repository."
                );

            } finally {
                downloadButton.disabled = false;
                downloadButton.textContent = teksAwal;
            }
        });
    }

    // ======================================================
    // JALANKAN PENGECEKAN
    // ======================================================

    cekAPK();
});
