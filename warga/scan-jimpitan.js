// ==========================================
// SIDAT
// SCAN QR JIMPITAN - QR KK
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


if (!accessToken) {

    window.location.href =
        "../index.html";

}


// ==========================================
// SCANNER
// ==========================================

let scanner = null;

let cameraTrack = null;

let torchAktif = false;

let qrToken = null;


// ==========================================
// ELEMENT
// ==========================================

const reader =
    document.getElementById(
        "reader"
    );

const scannerStatus =
    document.getElementById(
        "scannerStatus"
    );

const residentName =
    document.getElementById(
        "residentName"
    );

const resultCard =
    document.getElementById(
        "resultCard"
    );

const amountInput =
    document.getElementById(
        "amount"
    );

const notesInput =
    document.getElementById(
        "notes"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );

const manualQrCode =
    document.getElementById(
        "manualQrCode"
    );


// ==========================================
// VALIDASI QR KK
// ==========================================

// ==========================================
// VALIDASI QR KK
// ==========================================

function validasiQRKK(qrValue) {

    if (!qrValue) {

        return false;

    }

    return qrValue
        .trim()
        .toUpperCase()
        .startsWith(
            "SIDAT-KK-"
        );

}


// ==========================================
// TAMPILKAN DATA KK
// ==========================================

function tampilkanKK(
    data,
    token
) {

    qrToken =
        token;


    residentName.textContent =
        `${data.name} (${data.resident_code}) - KK ${data.kk_number}`;


    amountInput.value =
        500;


    notesInput.value =
        "";


    resultCard.classList.remove(
        "hidden"
    );


    scannerStatus.textContent =
        "QR KK berhasil ditemukan.";

}


// ==========================================
// START SCANNER
// ==========================================

async function mulaiScanner() {

    if (!reader) {
        console.error("Element #reader tidak ditemukan.");
        return;
    }

    if (scanner) {
        return;
    }

    try {

        // Meminta izin kamera
        await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            }
        });

        scanner = new Html5Qrcode("reader");

        await scanner.start(
            {
                facingMode: "environment"
            },
            {
                fps: 10,
                qrbox: {
                    width: 220,
                    height: 220
                }
            },
            qrCodeMessage => {
                prosesQR(qrCodeMessage);
            },
            errorMessage => {
                // abaikan
            }
        );

    } catch (err) {
        console.error("Izin kamera ditolak:", err);
        alert("Aplikasi memerlukan izin kamera.");
    }
}


        // ======================================
        // AMBIL CAMERA TRACK
        // ======================================

        cameraTrack =
            null;


        try {

            const videoElement =
                reader.querySelector(
                    "video"
                );


            if (
                videoElement &&
                videoElement.srcObject
            ) {

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
                        "Camera track:",
                        cameraTrack
                    );


                    console.log(
                        "Camera capabilities:",
                        cameraTrack.getCapabilities
                            ? cameraTrack.getCapabilities()
                            : "Tidak tersedia"
                    );

                }

            }

        } catch (trackError) {

            console.warn(
                "Tidak dapat mengambil camera track:",
                trackError
            );

        }


        // ======================================
        // RESET STATUS SENTER
        // ======================================

        torchAktif =
            false;


        const torchButton =
            document.getElementById(
                "btnTorch"
            );


        if (torchButton) {

            torchButton.textContent =
                "🔦 Nyalakan Senter";

            torchButton.disabled =
                false;

        }


        if (scannerStatus) {

            scannerStatus.textContent =
                "Arahkan kamera ke QR jimpitan warga";

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


    // ======================================
    // CEK CAMERA TRACK
    // ======================================

    if (!cameraTrack) {

        alert(
            "Kamera belum siap. Tunggu sampai kamera aktif."
        );

        return;

    }


    // ======================================
    // CEK SUPPORT TORCH
    // ======================================

    if (
        !cameraTrack.getCapabilities
    ) {

        alert(
            "Browser tidak mendukung kontrol senter."
        );

        return;

    }


    const capabilities =
        cameraTrack.getCapabilities();


    console.log(
        "Torch capability:",
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


    // ======================================
    // TOGGLE
    // ======================================

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

            button.textContent =
                torchAktif
                    ? "🔦 Matikan Senter"
                    : "🔦 Nyalakan Senter";

        }


        console.log(
            "Senter:",
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


        if (button) {

            button.textContent =
                "🔦 Nyalakan Senter";

        }


        alert(
            "Senter tidak dapat dikontrol oleh browser pada perangkat ini."
        );

    }

}

// ==========================================
// PROSES QR KAMERA
// ==========================================

async function prosesQR(
    qrValue
) {

    const token =
        qrValue
            .trim()
            .toUpperCase();


    // ======================================
    // VALIDASI FORMAT QR KK
    // ======================================

    if (
        !validasiQRKK(
            token
        )
    ) {

        scannerStatus.textContent =
            "QR bukan QR KK SIDAT.";

        return;

    }


    // ======================================
    // STOP SCANNER
    // ======================================

    try {

        if (scanner) {

            await scanner.stop();

            scanner.clear();

            scanner =
                null;

        }

    } catch (error) {

        console.log(
            "Scanner stop:",
            error
        );

        scanner =
            null;

    }


    qrToken =
        token;


    scannerStatus.textContent =
        "Memeriksa QR KK...";


    // ======================================
    // CARI KK
    // ======================================

    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_resident_by_qr`,
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

                            p_qr_token:
                                token

                        })

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
            !data ||
            data.length === 0
        ) {

            qrToken =
                null;


            alert(
                "QR KK tidak ditemukan atau kepala keluarga tidak aktif."
            );


            scanUlang();

            return;

        }


        const kk =
            data[0];


        tampilkanKK(
            kk,
            token
        );


    } catch (error) {

        console.error(
            "Gagal membaca QR KK:",
            error
        );


        qrToken =
            null;


        alert(
            "Gagal membaca data QR KK.\n\n" +
            error.message
        );


        scanUlang();

    }

}


// ==========================================
// CARI KODE MANUAL
// ==========================================

async function cariKodeManual() {

    if (!manualQrCode) {

        return;

    }


    let qrValue =
        manualQrCode.value
            .trim()
            .toUpperCase();


    // ======================================
    // VALIDASI INPUT
    // ======================================

    if (!qrValue) {

        alert(
            "Masukkan QR KK terlebih dahulu."
        );

        manualQrCode.focus();

        return;

    }


    // ======================================
    // VALIDASI FORMAT
    // ======================================

    if (
        !validasiQRKK(
            qrValue
        )
    ) {

        alert(
            "Kode QR KK tidak valid.\n\n" +
            "Contoh:\n" +
            "SIDAT-KK-46B4320B1BEA4AC5"
        );

        manualQrCode.focus();

        return;

    }


    scannerStatus.textContent =
        "Memeriksa QR KK...";


    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/get_resident_by_qr`,
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

                            p_qr_token:
                                qrValue

                        })

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
            !data ||
            data.length === 0
        ) {

            qrToken =
                null;


            alert(
                "QR KK tidak ditemukan atau kepala keluarga tidak aktif."
            );

            return;

        }


        const kk =
            data[0];


        tampilkanKK(
            kk,
            qrValue
        );


    } catch (error) {

        console.error(
            "Kode manual error:",
            error
        );


        qrToken =
            null;


        alert(
            "Gagal memeriksa QR KK.\n\n" +
            error.message
        );

    }

}


// ==========================================
// SIMPAN JIMPITAN
// ==========================================

async function simpanJimpitan() {

    if (!qrToken) {

        alert(
            "QR KK belum dipindai."
        );

        return;

    }


    // ======================================
    // VALIDASI QR
    // ======================================

    if (
        !validasiQRKK(
            qrToken
        )
    ) {

        alert(
            "QR KK tidak valid."
        );

        return;

    }


    const amount =
        Number(
            amountInput.value
        );


    const notes =
        notesInput.value.trim();


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

        amountInput.focus();

        return;

    }


    // ======================================
    // DISABLE BUTTON
    // ======================================

    saveButton.disabled =
        true;

    saveButton.textContent =
        "Menyimpan...";


    scannerStatus.textContent =
        "Menyimpan jimpitan...";

    if (!isOnline()) {

    await saveOfflineTransaction({

        qr_token: qrToken,

        amount: amount,

        notes: notes || null,

        type: "create_jimpitan_transaction"

    });

    alert(
        "Tidak ada koneksi internet.\nTransaksi disimpan di perangkat dan akan dikirim otomatis saat online."
    );

    scannerStatus.textContent =
        "Transaksi disimpan secara offline.";

    saveButton.disabled = false;

    saveButton.textContent = "Simpan";

    return;

    }

    try {

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

                            p_qr_token:
                                qrToken,

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
            "Hasil simpan:",
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


        // ==================================
        // SUKSES
        // ==================================

        alert(
            `Jimpitan berhasil dicatat.\n\n` +
            `Kepala Keluarga: ${
                data.resident_name || "-"
            }\n` +
            `No. KK: ${
                data.kk_number || "-"
            }\n` +
            `Nominal: ${
                formatRupiah(
                    data.amount || amount
                )
            }`
        );


        // ==================================
        // RESET
        // ==================================

        qrToken =
            null;


        amountInput.value =
            500;


        notesInput.value =
            "";


        if (manualQrCode) {

            manualQrCode.value =
                "";

        }


        resultCard.classList.add(
            "hidden"
        );


        scannerStatus.textContent =
            "Arahkan kamera ke QR KK warga";


        // ==================================
        // MULAI SCANNER LAGI
        // ==================================

        mulaiScanner();


    } catch (error) {

        console.error(
            "Gagal menyimpan jimpitan:",
            error
        );


        scannerStatus.textContent =
            "Gagal menyimpan jimpitan.";


        alert(
            error.message ||
            "Gagal menyimpan jimpitan."
        );


    } finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "Simpan Jimpitan";

    }

}


// ==========================================
// SCAN ULANG
// ==========================================

async function scanUlang() {

    qrToken =
        null;


    resultCard.classList.add(
        "hidden"
    );


    if (manualQrCode) {

        manualQrCode.value =
            "";

    }


    amountInput.value =
        500;


    notesInput.value =
        "";


    scannerStatus.textContent =
        "Arahkan kamera ke QR KK warga";


    // Jika scanner masih aktif,
    // hentikan terlebih dahulu

    if (scanner) {

        try {

            await scanner.stop();

            scanner.clear();

        } catch (error) {

            console.log(
                "Reset scanner:",
                error
            );

        }

        scanner =
            null;

    }


    // Mulai scanner baru

    mulaiScanner();

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
// KEMBALI
// ==========================================

function kembaliDashboard() {

    if (scanner) {

        scanner.stop()
            .then(
                () => {

                    scanner.clear();

                    scanner =
                        null;

                }
            )
            .catch(
                () => {}
            );

    }


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

mulaiScanner();
