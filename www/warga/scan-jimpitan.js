// ==========================================
// SIDAT
// SCAN JIMPITAN - ID WARGA
// QR menggunakan resident_code
// Contoh QR: RT001
// Dibuat oleh Suwardi
// ==========================================

"use strict";

// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem("sidat_access_token");

if (!accessToken) {
    window.location.href = "../index.html";
}

// ==========================================
// SCANNER STATE
// ==========================================

let scanner = null;
let cameraTrack = null;
let torchAktif = false;

// Data warga hasil scan
let residentId = null;
let residentCode = null;

// ==========================================
// ELEMENT
// ==========================================

const reader =
    document.getElementById("reader");

const scannerStatus =
    document.getElementById("scannerStatus");

const residentName =
    document.getElementById("residentName");

const resultCard =
    document.getElementById("resultCard");

const amountInput =
    document.getElementById("amount");

const notesInput =
    document.getElementById("notes");

const saveButton =
    document.getElementById("saveButton");

const manualQrCode =
    document.getElementById("manualQrCode");

// ==========================================
// VALIDASI ID WARGA
// ==========================================

function validasiResidentCode(value) {

    if (!value) {
        return false;
    }

    const code =
        String(value)
            .trim()
            .toUpperCase();

    /*
     * Format ID warga SIDAT:
     * RT001
     * RT002
     * RT003
     * dst.
     *
     * Tetap memberi ruang sampai 20 karakter
     * agar tidak terlalu mengunci struktur resident_code.
     */

    return /^RT[0-9A-Z_-]{1,18}$/.test(code);
}

// ==========================================
// NORMALISASI ID WARGA
// ==========================================

function normalisasiResidentCode(value) {

    return String(value || "")
        .trim()
        .toUpperCase();
}

// ==========================================
// TAMPILKAN DATA WARGA
// ==========================================

function tampilkanWarga(data) {

    if (!data) {
        return;
    }

    residentId =
        data.id || null;

    residentCode =
        data.resident_code || null;

    residentName.textContent =
        `${data.name || "-"} (${data.resident_code || "-"})`;

    amountInput.value =
        500;

    notesInput.value =
        "";

    resultCard.classList.remove(
        "hidden"
    );

    scannerStatus.textContent =
        "ID warga berhasil ditemukan.";

    console.log(
        "SIDAT WARGA TERPILIH:",
        data
    );
}

// ==========================================
// CARI WARGA BERDASARKAN resident_code
// ==========================================

async function cariWargaByResidentCode(
    code
) {

    const residentCodeValue =
        normalisasiResidentCode(code);

    if (
        !validasiResidentCode(
            residentCodeValue
        )
    ) {

        throw new Error(
            "ID warga tidak valid. Contoh: RT001"
        );
    }

    const query =
        [
            "select=id,resident_code,name,kk_number,family_status,is_active,account_created,auth_id",
            `resident_code=eq.${encodeURIComponent(residentCodeValue)}`,
            "is_active=eq.true",
            "limit=1"
        ].join("&");

    const response =
        await fetch(
            `${SUPABASE_URL}/rest/v1/residents?${query}`,
            {
                method: "GET",

                headers: {
                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );

    if (!response.ok) {

        throw new Error(
            await response.text()
        );
    }

    const data =
        await response.json();

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        throw new Error(
            `ID warga ${residentCodeValue} tidak ditemukan atau warga tidak aktif.`
        );
    }

    return data[0];
}

// ==========================================
// STOP SCANNER
// ==========================================

async function hentikanScanner() {

    if (!scanner) {
        return;
    }

    try {

        await scanner.stop();

    } catch (error) {

        console.warn(
            "Scanner stop:",
            error
        );
    }

    try {

        scanner.clear();

    } catch (error) {

        console.warn(
            "Scanner clear:",
            error
        );
    }

    scanner =
        null;

    cameraTrack =
        null;

    torchAktif =
        false;
}

// ==========================================
// AMBIL CAMERA TRACK
// ==========================================

function ambilCameraTrack() {

    cameraTrack =
        null;

    try {

        const videoElement =
            reader?.querySelector(
                "video"
            );

        if (
            !videoElement ||
            !videoElement.srcObject
        ) {

            return;
        }

        const tracks =
            videoElement
                .srcObject
                .getVideoTracks();

        if (
            tracks &&
            tracks.length > 0
        ) {

            cameraTrack =
                tracks[0];

            console.log(
                "SIDAT camera track:",
                cameraTrack
            );

            console.log(
                "SIDAT camera capabilities:",
                cameraTrack.getCapabilities
                    ? cameraTrack.getCapabilities()
                    : "Tidak tersedia"
            );
        }

    } catch (error) {

        console.warn(
            "Tidak dapat mengambil camera track:",
            error
        );
    }
}

// ==========================================
// RESET TOMBOL SENTER
// ==========================================

function resetTombolTorch() {

    torchAktif =
        false;

    const torchButton =
        document.getElementById(
            "btnTorch"
        );

    if (!torchButton) {
        return;
    }

    const span =
        torchButton.querySelector(
            "span"
        );

    if (span) {

        span.textContent =
            "Nyalakan Senter";

    } else {

        torchButton.textContent =
            "Nyalakan Senter";

    }

    torchButton.disabled =
        false;
}

// ==========================================
// START SCANNER
// ==========================================

async function mulaiScanner() {

    if (!reader) {

        console.error(
            "Element #reader tidak ditemukan."
        );

        return;
    }

    if (scanner) {
        return;
    }

    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        console.error(
            "Html5Qrcode belum tersedia."
        );

        if (scannerStatus) {

            scannerStatus.textContent =
                "Pemindai QR belum tersedia.";
        }

        return;
    }

    try {

        if (
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        ) {

            /*
             * Meminta izin kamera terlebih dahulu.
             * Stream sementara dihentikan karena
             * Html5Qrcode akan membuka kamera sendiri.
             */

            const permissionStream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode:
                            "environment"
                    }
                });

            permissionStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        }

        scanner =
            new Html5Qrcode(
                "reader"
            );

        await scanner.start(

            {
                facingMode:
                    "environment"
            },

            {
                fps:
                    10,

                qrbox: {
                    width:
                        220,

                    height:
                        220
                },

                aspectRatio:
                    1.0
            },

            qrCodeMessage => {

                prosesQR(
                    qrCodeMessage
                );

            },

            errorMessage => {

                // Error scan per-frame
                // sengaja tidak ditampilkan.

            }
        );

        /*
         * Tunggu sebentar sampai elemen video
         * benar-benar dibuat oleh Html5Qrcode.
         */

        setTimeout(
            () => {

                ambilCameraTrack();

            },
            500
        );

        resetTombolTorch();

        if (scannerStatus) {

            scannerStatus.textContent =
                "Arahkan kamera ke QR ID warga.";
        }

    } catch (error) {

        console.error(
            "Kamera gagal:",
            error
        );

        scanner =
            null;

        cameraTrack =
            null;

        if (scannerStatus) {

            scannerStatus.textContent =
                "Kamera tidak dapat digunakan. Pastikan izin kamera diberikan.";
        }

        alert(
            "Aplikasi memerlukan izin kamera."
        );
    }
}

// ==========================================
// TOGGLE SENTER
// ==========================================

async function toggleTorch() {

    const button =
        document.getElementById(
            "btnTorch"
        );

    if (!cameraTrack) {

        /*
         * Kadang track belum berhasil diambil
         * ketika tombol langsung ditekan.
         */

        ambilCameraTrack();
    }

    if (!cameraTrack) {

        alert(
            "Kamera belum siap. Tunggu sampai kamera aktif."
        );

        return;
    }

    if (
        !cameraTrack.getCapabilities
    ) {

        alert(
            "Perangkat tidak mendukung kontrol senter."
        );

        return;
    }

    const capabilities =
        cameraTrack.getCapabilities();

    console.log(
        "SIDAT torch capability:",
        capabilities.torch
    );

    if (
        !capabilities.torch
    ) {

        alert(
            "HP atau browser ini tidak mendukung kontrol senter dari halaman web."
        );

        return;
    }

    try {

        torchAktif =
            !torchAktif;

        await cameraTrack.applyConstraints({
            advanced: [
                {
                    torch:
                        torchAktif
                }
            ]
        });

        if (button) {

            const span =
                button.querySelector(
                    "span"
                );

            const label =
                torchAktif
                    ? "Matikan Senter"
                    : "Nyalakan Senter";

            if (span) {

                span.textContent =
                    label;

            } else {

                button.textContent =
                    label;
            }
        }

        console.log(
            "SIDAT senter:",
            torchAktif
                ? "ON"
                : "OFF"
        );

    } catch (error) {

        console.error(
            "Gagal mengubah senter:",
            error
        );

        torchAktif =
            false;

        resetTombolTorch();

        alert(
            "Senter tidak dapat dikontrol oleh perangkat ini."
        );
    }
}

// ==========================================
// PROSES QR KAMERA
// ==========================================

async function prosesQR(
    qrValue
) {

    const code =
        normalisasiResidentCode(
            qrValue
        );

    console.log(
        "SIDAT QR TERBACA:",
        code
    );

    // ======================================
    // VALIDASI FORMAT
    // ======================================

    if (
        !validasiResidentCode(
            code
        )
    ) {

        if (scannerStatus) {

            scannerStatus.textContent =
                "QR bukan QR ID warga SIDAT.";

        }

        return;
    }

    // ======================================
    // HENTIKAN SCANNER
    // ======================================

    await hentikanScanner();

    if (scannerStatus) {

        scannerStatus.textContent =
            "Memeriksa ID warga...";
    }

    // ======================================
    // CARI WARGA
    // ======================================

    try {

        const warga =
            await cariWargaByResidentCode(
                code
            );

        tampilkanWarga(
            warga
        );

    } catch (error) {

        console.error(
            "Gagal membaca ID warga:",
            error
        );

        residentId =
            null;

        residentCode =
            null;

        alert(
            error.message ||
            "ID warga tidak ditemukan."
        );

        await scanUlang();
    }
}

// ==========================================
// CARI ID WARGA MANUAL
// ==========================================

async function cariKodeManual() {

    if (!manualQrCode) {
        return;
    }

    const code =
        normalisasiResidentCode(
            manualQrCode.value
        );

    // ======================================
    // VALIDASI INPUT
    // ======================================

    if (!code) {

        alert(
            "Masukkan ID warga terlebih dahulu."
        );

        manualQrCode.focus();

        return;
    }

    // ======================================
    // VALIDASI FORMAT
    // ======================================

    if (
        !validasiResidentCode(
            code
        )
    ) {

        alert(
            "ID warga tidak valid.\n\n" +
            "Contoh:\n" +
            "RT001"
        );

        manualQrCode.focus();

        return;
    }

    if (scannerStatus) {

        scannerStatus.textContent =
            "Memeriksa ID warga...";
    }

    try {

        const warga =
            await cariWargaByResidentCode(
                code
            );

        /*
         * Jika scanner masih aktif,
         * hentikan supaya kamera tidak
         * tetap membaca QR.
         */

        await hentikanScanner();

        tampilkanWarga(
            warga
        );

    } catch (error) {

        console.error(
            "Kode manual error:",
            error
        );

        residentId =
            null;

        residentCode =
            null;

        alert(
            error.message ||
            "ID warga tidak ditemukan."
        );
    }
}

// ==========================================
// NOTIFIKASI JIMPITAN DIAMBIL
// ==========================================

async function kirimNotifikasiJimpitan() {

    if (!residentId) {
        return;
    }

    try {

        // Ambil user yang sedang login
        const userResponse =
            await fetch(
                `${SUPABASE_URL}/auth/v1/user`,
                {
                    method: "GET",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (!userResponse.ok) {

            throw new Error(
                "Gagal membaca user petugas."
            );
        }

        const user =
            await userResponse.json();

        if (!user?.id) {

            throw new Error(
                "User petugas tidak ditemukan."
            );
        }

        const notificationId =
            crypto.randomUUID();

        const notificationPayload = {

            id:
                notificationId,

            title:
                "Jimpitan Diambil",

            message:
                "Jimpitan Anda telah diambil oleh petugas.",

            target_type:
                "resident",

            target_resident_id:
                residentId,

            is_read:
                false,

            created_by:
                user.id,

            created_at:
                new Date().toISOString()
        };

        // Simpan notifikasi
        const notificationResponse =
            await fetch(
                `${SUPABASE_URL}/rest/v1/notifications`,
                {
                    method: "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            notificationPayload
                        )
                }
            );

        if (!notificationResponse.ok) {

            throw new Error(
                await notificationResponse.text()
            );
        }

        // Kirim push notification
        const pushResponse =
            await fetch(
                `${SUPABASE_URL}/functions/v1/send-push-notification`,
                {
                    method: "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            notification_id:
                                notificationId
                        })
                }
            );

        if (!pushResponse.ok) {

            throw new Error(
                await pushResponse.text()
            );
        }

        console.log(
            "SIDAT: notifikasi jimpitan berhasil dikirim."
        );

    } catch (error) {

        // Jangan menggagalkan transaksi jimpitan
        console.error(
            "SIDAT: gagal mengirim notifikasi jimpitan:",
            error
        );
    }
}

// ==========================================
// SIMPAN JIMPITAN
// ==========================================

async function simpanJimpitan() {

    if (!residentId) {

        alert(
            "ID warga belum dipilih."
        );

        return;
    }

    if (!residentCode) {

        alert(
            "ID warga tidak valid."
        );

        return;
    }

    const amount =
        Number(
            amountInput?.value
        );

    const notes =
        String(
            notesInput?.value || ""
        ).trim();

    // ======================================
    // VALIDASI NOMINAL
    // ======================================

    if (
        !amount ||
        amount <= 0
    ) {

        alert(
            "Masukkan nominal jimpitan yang valid."
        );

        amountInput?.focus();

        return;
    }

    // ======================================
    // DISABLE BUTTON
    // ======================================

    if (saveButton) {

        saveButton.disabled =
            true;

        const span =
            saveButton.querySelector(
                "span"
            );

        if (span) {

            span.textContent =
                "Menyimpan...";

        } else {

            saveButton.textContent =
                "Menyimpan...";
        }
    }

    if (scannerStatus) {

        scannerStatus.textContent =
            "Menyimpan jimpitan...";
    }

    // ======================================
    // OFFLINE
    // ======================================

    if (
        typeof isOnline === "function" &&
        !isOnline()
    ) {

        try {

            /*
             * Penting:
             * transaksi offline sekarang menyimpan
             * resident_id + resident_code,
             * BUKAN qr_token.
             */

            await saveOfflineTransaction({

                resident_id:
                    residentId,

                resident_code:
                    residentCode,

                amount:
                    amount,

                notes:
                    notes || null,

                type:
                    "create_jimpitan_transaction"
            });

            alert(
                "Tidak ada koneksi internet.\n\n" +
                "Transaksi disimpan di perangkat " +
                "dan akan dikirim otomatis saat online."
            );

            if (scannerStatus) {

                scannerStatus.textContent =
                    "Transaksi disimpan secara offline.";
            }

            resetFormJimpitan();

        } catch (offlineError) {

            console.error(
                "Gagal menyimpan transaksi offline:",
                offlineError
            );

            alert(
                offlineError.message ||
                "Transaksi offline gagal disimpan."
            );
        }

        if (saveButton) {

            saveButton.disabled =
                false;

            const span =
                saveButton.querySelector(
                    "span"
                );

            if (span) {

                span.textContent =
                    "Simpan Jimpitan";

            } else {

                saveButton.textContent =
                    "Simpan Jimpitan";
            }
        }

        return;
    }

    // ======================================
    // ONLINE
    // ======================================

    try {

        /*
         * PERHATIAN:
         *
         * Jangan lagi mengirim:
         * p_qr_token
         *
         * Karena Scan Jimpitan SIDAT sekarang
         * menggunakan resident_code.
         *
         * RPC penyimpanan perlu menggunakan
         * resident_id / resident_code.
         *
         * Nama RPC lama sengaja tidak dipalsukan
         * di sini sebelum signature database
         * dikonfirmasi.
         */

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/create_jimpitan_transaction`,
                {
                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            /*
                             * Gunakan resident_id
                             * sebagai identitas utama.
                             */
                            p_resident_id:
                                residentId,

                            p_amount:
                                amount,

                            p_notes:
                                notes || null
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                await response.text()
            );
        }

        const result =
            await response.json();

        console.log(
            "SIDAT hasil simpan jimpitan:",
            result
        );

        // ==================================
        // VALIDASI HASIL
        // ==================================

        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Jimpitan gagal disimpan."
            );
        }

        const data =
            result.data || {};
        await kirimNotifikasiJimpitan();

        // ==================================
        // SUKSES
        // ==================================

        alert(
            `Jimpitan berhasil dicatat.\n\n` +
            `Warga: ${
                data.resident_name ||
                residentName?.textContent ||
                "-"
            }\n` +
            `ID Warga: ${
                data.resident_code ||
                residentCode ||
                "-"
            }\n` +
            `Nominal: ${
                formatRupiah(
                    data.amount ||
                    amount
                )
            }`
        );

        // ==================================
        // RESET
        // ==================================

        resetFormJimpitan();

        // ==================================
        // SCANNER KEMBALI
        // ==================================

        await mulaiScanner();

    } catch (error) {

        console.error(
            "Gagal menyimpan jimpitan:",
            error
        );

        if (scannerStatus) {

            scannerStatus.textContent =
                "Gagal menyimpan jimpitan.";
        }

        alert(
            error.message ||
            "Gagal menyimpan jimpitan."
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            const span =
                saveButton.querySelector(
                    "span"
                );

            if (span) {

                span.textContent =
                    "Simpan Jimpitan";

            } else {

                saveButton.textContent =
                    "Simpan Jimpitan";
            }
        }
    }
}

// ==========================================
// RESET FORM
// ==========================================

function resetFormJimpitan() {

    residentId =
        null;

    residentCode =
        null;

    if (amountInput) {

        amountInput.value =
            500;
    }

    if (notesInput) {

        notesInput.value =
            "";
    }

    if (manualQrCode) {

        manualQrCode.value =
            "";
    }

    if (resultCard) {

        resultCard.classList.add(
            "hidden"
        );
    }

    if (scannerStatus) {

        scannerStatus.textContent =
            "Arahkan kamera ke QR ID warga.";
    }
}

// ==========================================
// SCAN ULANG
// ==========================================

async function scanUlang() {

    await hentikanScanner();

    resetFormJimpitan();

    await mulaiScanner();
}

// ==========================================
// FORMAT RUPIAH
// ==========================================

function formatRupiah(
    nominal
) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style:
                "currency",

            currency:
                "IDR",

            maximumFractionDigits:
                0
        }
    ).format(
        Number(nominal) || 0
    );
}

// ==========================================
// KEMBALI DASHBOARD
// ==========================================

async function kembaliDashboard() {

    await hentikanScanner();

    window.location.href =
        "dashboard.html";
}

// ==========================================
// EXPORT FUNCTION
// ==========================================

window.mulaiScanner =
    mulaiScanner;

window.toggleTorch =
    toggleTorch;

window.prosesQR =
    prosesQR;

window.cariKodeManual =
    cariKodeManual;

window.simpanJimpitan =
    simpanJimpitan;

window.scanUlang =
    scanUlang;

window.kembaliDashboard =
    kembaliDashboard;

// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        mulaiScanner();

    }
);
