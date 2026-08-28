// ==========================================
// SIDAT
// BACKUP & RESTORE DATA
// SISTEM INFORMASI DATA WARGA
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// SESSION
// ==========================================

const adminAccessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


// ==========================================
// TABEL YANG DICADANGKAN
// ==========================================

const BACKUP_TABLES = [

    "residents",

    "households",

    "cash_transactions",

    "jimpitan_transactions",

    "reports",

    "announcements",

    "notifications",

    "settings"

];


// ==========================================
// DATA BACKUP TERBACA
// ==========================================

let backupDataSiapRestore =
    null;


// ==========================================
// ELEMENT
// ==========================================

const backupMessage =
    document.getElementById(
        "backupMessage"
    );

const backupButton =
    document.getElementById(
        "backupButton"
    );

const backupProgress =
    document.getElementById(
        "backupProgress"
    );

const restoreFile =
    document.getElementById(
        "restoreFile"
    );

const restoreFileInfo =
    document.getElementById(
        "restoreFileInfo"
    );

const restoreFileName =
    document.getElementById(
        "restoreFileName"
    );

const restoreFileSize =
    document.getElementById(
        "restoreFileSize"
    );

const restorePreview =
    document.getElementById(
        "restorePreview"
    );

const restoreValidation =
    document.getElementById(
        "restoreValidation"
    );

const restoreWarning =
    document.getElementById(
        "restoreWarning"
    );

const restoreButton =
    document.getElementById(
        "restoreButton"
    );

const restoreProgress =
    document.getElementById(
        "restoreProgress"
    );

// ==========================================
// BACKUP TERAKHIR
// ==========================================

const LAST_BACKUP_KEY =
    "sidat_last_backup";


// ==========================================
// FORMAT TANGGAL BACKUP
// ==========================================

function formatTanggalBackup(
    tanggal
) {

    if (!tanggal) {

        return "Belum ada backup";

    }


    const date =
        new Date(
            tanggal
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Belum ada backup";

    }


    return new Intl.DateTimeFormat(
        "id-ID",
        {

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    ).format(
        date
    );

}


// ==========================================
// SIMPAN INFORMASI BACKUP TERAKHIR
// ==========================================

function simpanInfoBackupTerakhir(
    info
) {

    try {

        localStorage.setItem(
            LAST_BACKUP_KEY,
            JSON.stringify(
                info
            )
        );

    }

    catch (
        error
    ) {

        console.warn(
            "SIDAT: Gagal menyimpan info backup:",
            error
        );

    }

}


// ==========================================
// TAMPILKAN BACKUP TERAKHIR
// ==========================================

function tampilkanBackupTerakhir() {

    let info =
        null;


    try {

        const data =
            localStorage.getItem(
                LAST_BACKUP_KEY
            );


        if (data) {

            info =
                JSON.parse(
                    data
                );

        }

    }

    catch (
        error
    ) {

        console.warn(
            "SIDAT: Data backup terakhir rusak:",
            error
        );

    }


    if (!info) {

        if (lastBackupDate) {

            lastBackupDate.textContent =
                "Belum ada backup";

        }

        if (lastBackupRecords) {

            lastBackupRecords.textContent =
                "-";

        }

        if (lastBackupSize) {

            lastBackupSize.textContent =
                "-";

        }

        if (lastBackupFileName) {

            lastBackupFileName.textContent =
                "-";

        }

        return;

    }


    if (lastBackupDate) {

        lastBackupDate.textContent =
            formatTanggalBackup(
                info.created_at
            );

    }


    if (lastBackupRecords) {

        lastBackupRecords.textContent =
            `${info.total_records || 0} record`;

    }


    if (lastBackupSize) {

        lastBackupSize.textContent =
            formatFileSize(
                info.file_size
            );

    }


    if (lastBackupFileName) {

        lastBackupFileName.textContent =
            info.file_name ||
            "-";

    }

}

// ==========================================
// CEK SESSION
// ==========================================

if (!adminAccessToken) {

    console.warn(
        "SIDAT: Session admin tidak ditemukan."
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

    .replaceAll(
        "&",
        "&amp;"
    )

    .replaceAll(
        "<",
        "&lt;"
    )

    .replaceAll(
        ">",
        "&gt;"
    )

    .replaceAll(
        '"',
        "&quot;"
    )

    .replaceAll(
        "'",
        "&#039;"
    );

}


// ==========================================
// FORMAT UKURAN FILE
// ==========================================

function formatFileSize(
    bytes
) {

    if (
        !bytes ||
        bytes <= 0
    ) {

        return "0 KB";

    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    let ukuran =
        bytes;

    let index =
        0;


    while (
        ukuran >= 1024 &&
        index <
        units.length - 1
    ) {

        ukuran /=
            1024;

        index++;

    }


    return (
        ukuran.toFixed(
            index === 0
                ? 0
                : 2
        ) +
        " " +
        units[index]
    );

}


// ==========================================
// PESAN
// ==========================================

function tampilkanPesan(
    message,
    type = "success"
) {

    if (!backupMessage) {

        return;

    }


    backupMessage.className =
        "message " +
        type;


    backupMessage.textContent =
        message;

}


function sembunyikanPesan() {

    if (!backupMessage) {

        return;

    }


    backupMessage.className =
        "message hidden";

    backupMessage.textContent =
        "";

}


// ==========================================
// SUPABASE REQUEST
// ==========================================

async function supabaseRequest(
    url,
    options = {}
) {

    if (
        !adminAccessToken
    ) {

        throw new Error(
            "Session admin tidak ditemukan."
        );

    }


    const headers = {

        "apikey":
            SUPABASE_KEY,

        "Authorization":
            `Bearer ${adminAccessToken}`,

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };


    if (
        options.headers
    ) {

        Object.assign(
            headers,
            options.headers
        );

    }


    const response =
        await fetch(
            url,
            {
                ...options,

                headers
            }
        );


    const text =
        await response.text();


    if (!response.ok) {

        console.error(
            "SIDAT BACKUP/RESTORE ERROR:",
            response.status,
            text
        );


        throw new Error(
            text ||
            `HTTP ${response.status}`
        );

    }


    if (!text) {

        return null;

    }


    try {

        return JSON.parse(
            text
        );

    }

    catch {

        return text;

    }

}


// ==========================================
// AMBIL DATA SATU TABEL
// ==========================================

async function ambilDataTabel(
    table
) {

    console.log(
        "SIDAT: Backup tabel:",
        table
    );


    const url =
        `${SUPABASE_URL}` +
        `/rest/v1/${table}` +
        `?select=*`;


    const data =
        await supabaseRequest(
            url
        );


    if (
        !Array.isArray(
            data
        )
    ) {

        throw new Error(
            `Data tabel ${table} bukan array.`
        );

    }


    return data;

}


// ==========================================
// BUAT BACKUP
// ==========================================

async function buatBackup() {

    console.log(
        "SIDAT: Memulai backup..."
    );


    sembunyikanPesan();


    if (
        !adminAccessToken
    ) {

        tampilkanPesan(
            "Session admin tidak ditemukan. Silakan login kembali.",
            "error"
        );

        return;

    }


    if (backupButton) {

        backupButton.disabled =
            true;

    }


    if (backupProgress) {

        backupProgress.classList.remove(
            "hidden"
        );

    }


    try {

        const backup = {

            sidat_backup:
                true,

            version:
                "1.0",

            created_at:
                new Date().toISOString(),

            application:
                "SIDAT",

            created_by:
                "Suwardi",

            tables: {}

        };


        // ==================================
        // AMBIL SEMUA TABEL
        // ==================================

        for (
            const table
            of BACKUP_TABLES
        ) {

            try {

                backup.tables[table] =
                    await ambilDataTabel(
                        table
                    );

            }

            catch (
                error
            ) {

                console.warn(
                    `SIDAT: Tabel ${table} gagal diambil:`,
                    error
                );


                /*
                 * Tabel yang tidak dapat dibaca
                 * tetap dicatat sebagai array kosong.
                 *
                 * Backup tabel lain tetap berjalan.
                 */

                backup.tables[table] =
                    [];

            }

        }


        // ==================================
        // STATISTIK BACKUP
        // ==================================

        let totalData =
            0;


        Object.values(
            backup.tables
        )
        .forEach(
            data => {

                if (
                    Array.isArray(
                        data
                    )
                ) {

                    totalData +=
                        data.length;

                }

            }
        );


        // ==================================
        // TAMBAHKAN INFORMASI
        // ==================================

        backup.summary = {

            total_records:
                totalData,

            residents:
                backup.tables
                    .residents?.length ||
                0,

            households:
                backup.tables
                    .households?.length ||
                0,

            cash_transactions:
                backup.tables
                    .cash_transactions?.length ||
                0,

            jimpitan_transactions:
                backup.tables
                    .jimpitan_transactions?.length ||
                0,

            reports:
                backup.tables
                    .reports?.length ||
                0,

            announcements:
                backup.tables
                    .announcements?.length ||
                0,

            notifications:
                backup.tables
                    .notifications?.length ||
                0,

            settings:
                backup.tables
                    .settings?.length ||
                0

        };


        // ==================================
        // BUAT FILE JSON
        // ==================================

        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        const sekarang =
            new Date();


        const tanggal =
            sekarang
                .toISOString()
                .slice(
                    0,
                    10
                );


        const waktu =
            sekarang
                .toTimeString()
                .slice(
                    0,
                    8
                )
                .replaceAll(
                    ":",
                    "-"
                );


        link.href =
            url;


        link.download =
            `SIDAT-backup-${tanggal}-${waktu}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

// ==================================
// SIMPAN INFO BACKUP TERAKHIR
// ==================================

simpanInfoBackupTerakhir({

    created_at:
        backup.created_at,

    total_records:
        totalData,

    file_size:
        blob.size,

    file_name:
        link.download

});

        URL.revokeObjectURL(
            url
        );


        console.log(
            "SIDAT: Backup selesai:",
            backup.summary
        );


        tampilkanPesan(

            `Backup berhasil dibuat. Total ${totalData} data telah dicadangkan.`,

            "success"

        );

    }

    catch (
        error
    ) {

        console.error(
            "SIDAT: Backup gagal:",
            error
        );


        tampilkanPesan(

            "Backup gagal: " +
            (
                error?.message ||
                "Kesalahan tidak diketahui."
            ),

            "error"

        );

    }

    finally {

        if (backupButton) {

            backupButton.disabled =
                false;

        }


        if (backupProgress) {

            backupProgress.classList.add(
                "hidden"
            );

        }

    }

}


// ==========================================
// HANDLE FILE RESTORE
// ==========================================

if (restoreFile) {

    restoreFile.addEventListener(
        "change",
        handleRestoreFile
    );

}


async function handleRestoreFile(
    event
) {

    sembunyikanPesan();


    const file =
        event.target.files?.[0];


    // ======================================
    // RESET
    // ======================================

    backupDataSiapRestore =
        null;


    if (restoreButton) {

        restoreButton.disabled =
            true;

    }


    if (restorePreview) {

        restorePreview.classList.add(
            "hidden"
        );

    }


    if (restoreWarning) {

        restoreWarning.classList.add(
            "hidden"
        );

    }


    if (!file) {

        if (restoreFileInfo) {

            restoreFileInfo.classList.add(
                "hidden"
            );

        }

        return;

    }


    // ======================================
    // INFO FILE
    // ======================================

    if (restoreFileInfo) {

        restoreFileInfo.classList.remove(
            "hidden"
        );

    }


    if (restoreFileName) {

        restoreFileName.textContent =
            file.name;

    }


    if (restoreFileSize) {

        restoreFileSize.textContent =
            formatFileSize(
                file.size
            );

    }


    // ======================================
    // VALIDASI FORMAT
    // ======================================

    if (
        !file.name
            .toLowerCase()
            .endsWith(
                ".json"
            )
    ) {

        tampilkanValidasi(
            false,
            "File harus berformat JSON."
        );

        return;

    }


    try {

        const text =
            await file.text();


        const data =
            JSON.parse(
                text
            );


        // ==================================
        // VALIDASI BACKUP SIDAT
        // ==================================

        if (
            !data ||
            data.sidat_backup !==
            true
        ) {

            throw new Error(
                "File bukan backup SIDAT yang valid."
            );

        }


        if (
            !data.tables ||
            typeof data.tables !==
            "object"
        ) {

            throw new Error(
                "Struktur backup tidak memiliki bagian tables."
            );

        }


        // ==================================
        // VALIDASI TABEL
        // ==================================

        const tabelDikenal =
            Object.keys(
                data.tables
            );


        if (
            tabelDikenal.length ===
            0
        ) {

            throw new Error(
                "Backup tidak berisi data tabel."
            );

        }


        // ==================================
        // SIMPAN DATA
        // ==================================

        backupDataSiapRestore =
            data;


        // ==================================
        // TAMPILKAN PREVIEW
        // ==================================

        tampilkanPreview(
            data
        );


        tampilkanValidasi(
            true,
            "File backup SIDAT valid dan siap dipulihkan."
        );


        if (restoreWarning) {

            restoreWarning.classList.remove(
                "hidden"
            );

        }


        if (restoreButton) {

            restoreButton.disabled =
                false;

        }


        console.log(
            "SIDAT: File backup valid:",
            data
        );

    }

    catch (
        error
    ) {

        console.error(
            "SIDAT: File restore tidak valid:",
            error
        );


        backupDataSiapRestore =
            null;


        tampilkanValidasi(
            false,
            error?.message ||
            "File backup tidak valid."
        );

    }

}


// ==========================================
// TAMPILKAN VALIDASI
// ==========================================

function tampilkanValidasi(
    valid,
    message
) {

    if (!restorePreview) {

        return;

    }


    restorePreview.classList.remove(
        "hidden"
    );


    if (!restoreValidation) {

        return;

    }


    restoreValidation.className =
        "validation-message " +
        (
            valid
                ? "valid"
                : "invalid"
        );


    restoreValidation.textContent =
        message;

}


// ==========================================
// TAMPILKAN PREVIEW
// ==========================================

function tampilkanPreview(
    backup
) {

    if (!restorePreview) {

        return;

    }


    restorePreview.classList.remove(
        "hidden"
    );


    const tables =
        backup.tables ||
        {};


    setPreview(
        "previewResidents",
        tables.residents
    );


    setPreview(
        "previewHouseholds",
        tables.households
    );


    setPreview(
        "previewCash",
        tables.cash_transactions
    );


    setPreview(
        "previewJimpitan",
        tables.jimpitan_transactions
    );


    setPreview(
        "previewReports",
        tables.reports
    );


    setPreview(
        "previewAnnouncements",
        tables.announcements
    );


    setPreview(
        "previewNotifications",
        tables.notifications
    );

}


function setPreview(
    id,
    data
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        Array.isArray(data)
            ? data.length
            : 0;

}


// ==========================================
// VALIDASI RECORD
// ==========================================

function validasiRecord(
    table,
    row
) {

    if (
        !row ||
        typeof row !==
        "object"
    ) {

        return false;

    }


    /*
     * Setiap record Supabase
     * idealnya memiliki primary key id.
     *
     * Record tanpa id dilewati agar
     * tidak membuat data rusak.
     */

    if (
        row.id ===
        undefined ||
        row.id ===
        null ||
        row.id ===
        ""
    ) {

        console.warn(
            `SIDAT: Record tanpa id pada ${table}:`,
            row
        );

        return false;

    }


    return true;

}


// ==========================================
// RESTORE SATU TABEL
// ==========================================

async function restoreTabel(
    table,
    rows
) {

    if (
        !Array.isArray(
            rows
        ) ||
        rows.length ===
        0
    ) {

        return 0;

    }


    const validRows =
        rows.filter(
            row =>
                validasiRecord(
                    table,
                    row
                )
        );


    if (
        validRows.length ===
        0
    ) {

        return 0;

    }


    console.log(
        `SIDAT: Restore ${table}:`,
        validRows.length,
        "record"
    );


    /*
     * Supabase REST mempunyai batas ukuran request.
     *
     * Data dibagi menjadi batch kecil.
     */

    const BATCH_SIZE =
        100;


    let berhasil =
        0;


    for (
        let i = 0;
        i < validRows.length;
        i += BATCH_SIZE
    ) {

        const batch =
            validRows.slice(
                i,
                i + BATCH_SIZE
            );


        const url =
            `${SUPABASE_URL}` +
            `/rest/v1/${table}`;


        await supabaseRequest(
            url,
            {

                method:
                    "POST",

                headers: {

                    "Prefer":
                        "resolution=merge-duplicates,return=minimal"

                },

                body:
                    JSON.stringify(
                        batch
                    )

            }
        );


        berhasil +=
            batch.length;

    }


    return berhasil;

}


// ==========================================
// URUTAN RESTORE
// ==========================================

function getUrutanRestore(
    tables
) {

    const urutan = [];


    /*
     * Parent table terlebih dahulu.
     */

    const prioritas = [

        "households",

        "residents",

        "cash_transactions",

        "jimpitan_transactions",

        "reports",

        "announcements",

        "notifications",

        "settings"

    ];


    prioritas.forEach(
        table => {

            if (
                Object.prototype
                    .hasOwnProperty.call(
                        tables,
                        table
                    )
            ) {

                urutan.push(
                    table
                );

            }

        }
    );


    /*
     * Tambahkan tabel lain jika
     * suatu saat dimasukkan ke backup.
     */

    Object.keys(
        tables
    ).forEach(
        table => {

            if (
                !urutan.includes(
                    table
                )
            ) {

                urutan.push(
                    table
                );

            }

        }
    );


    return urutan;

}


// ==========================================
// RESTORE DATA
// ==========================================

async function restoreData() {

    sembunyikanPesan();


    if (
        !adminAccessToken
    ) {

        tampilkanPesan(
            "Session admin tidak ditemukan. Silakan login kembali.",
            "error"
        );

        return;

    }


    if (
        !backupDataSiapRestore
    ) {

        tampilkanPesan(
            "Pilih file backup SIDAT terlebih dahulu.",
            "error"
        );

        return;

    }


    const konfirmasi =
        confirm(

            "Restore data SIDAT?\n\n" +

            "Data dari file backup akan " +
            "dimasukkan ke database.\n\n" +

            "Pastikan file backup yang dipilih benar.\n\n" +

            "Lanjutkan?"

        );


    if (!konfirmasi) {

        return;

    }


    if (restoreButton) {

        restoreButton.disabled =
            true;

    }


    if (restoreProgress) {

        restoreProgress.classList.remove(
            "hidden"
        );

    }


    try {

        const tables =
            backupDataSiapRestore.tables;


        const urutan =
            getUrutanRestore(
                tables
            );


        let totalBerhasil =
            0;


        const hasil =
            {};


        // ==================================
        // RESTORE BERURUTAN
        // ==================================

        for (
            const table
            of urutan
        ) {

            const rows =
                tables[table];


            if (
                !Array.isArray(
                    rows
                )
            ) {

                continue;

            }


            try {

                const jumlah =
                    await restoreTabel(
                        table,
                        rows
                    );


                hasil[table] =
                    jumlah;


                totalBerhasil +=
                    jumlah;

            }

            catch (
                error
            ) {

                console.error(
                    `SIDAT: Restore tabel ${table} gagal:`,
                    error
                );


                hasil[table] = {

                    error:
                        error?.message ||
                        "Gagal restore"

                };

            }

        }


        console.log(
            "SIDAT: Hasil restore:",
            hasil
        );


        // ==================================
        // CEK ERROR
        // ==================================

        const gagal =
            Object.entries(
                hasil
            )
            .filter(
                ([, value]) =>
                    value &&
                    typeof value ===
                    "object" &&
                    value.error
            );


        if (
            gagal.length > 0
        ) {

            tampilkanPesan(

                `Restore selesai sebagian. ${totalBerhasil} data berhasil dipulihkan, tetapi ${gagal.length} tabel mengalami masalah.`,

                "error"

            );

        }

        else {

            tampilkanPesan(

                `Restore berhasil. Total ${totalBerhasil} data telah dipulihkan.`,

                "success"

            );

        }


        /*
         * Jangan langsung menghapus file input.
         * User masih dapat melihat preview.
         */

        console.log(
            "SIDAT: Restore selesai."
        );

    }

    catch (
        error
    ) {

        console.error(
            "SIDAT: Restore gagal:",
            error
        );


        tampilkanPesan(

            "Restore gagal: " +
            (
                error?.message ||
                "Kesalahan tidak diketahui."
            ),

            "error"

        );

    }

    finally {

        if (restoreProgress) {

            restoreProgress.classList.add(
                "hidden"
            );

        }


        if (restoreButton) {

            restoreButton.disabled =
                !backupDataSiapRestore;

        }

    }

}


// ==========================================
// KEMBALI KE DASHBOARD ADMIN
// ==========================================

function kembaliAdmin() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// EXPORT GLOBAL
// ==========================================

window.buatBackup =
    buatBackup;

window.restoreData =
    restoreData;

window.kembaliAdmin =
    kembaliAdmin;

window.handleRestoreFile =
    handleRestoreFile;


// ==========================================
// START
// ==========================================

console.log(
    "SIDAT: Backup & Restore JS aktif."
);
// ==========================================
// TAMPILKAN BACKUP TERAKHIR SAAT HALAMAN DIBUKA
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        tampilkanBackupTerakhir
    );

}

else {

    tampilkanBackupTerakhir();

}


// ==========================================
// EXPORT
// ==========================================

window.buatBackup =
    buatBackup;

window.restoreData =
    restoreData;

window.kembaliAdmin =
    kembaliAdmin;