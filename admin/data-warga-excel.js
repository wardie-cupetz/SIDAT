// ==========================================================
// SIDAT
// DATA WARGA - IMPORT / EXPORT EXCEL
// ==========================================================
//
// File terpisah dari data-warga.js
//
// Fungsi:
// 1. Download template Excel
// 2. Export data warga
// 3. Import data warga
// 4. Validasi seluruh data sebelum import
// 5. Update warga berdasarkan ID Warga / NIK
// 6. Membuat KK untuk Kepala Keluarga
// 7. Membuat akun WARGA otomatis untuk Kepala Keluarga
//
// ATURAN AKUN WARGA:
// - Hanya Kepala Keluarga yang dibuatkan akun WARGA
// - PIN awal ditentukan server: 123456
// - PIN tidak disimpan plaintext
// - Akun WARGA yang sudah ada tidak ditimpa
// - Anggota keluarga lain tidak dibuatkan akun
//
// DATA AKUN YANG TIDAK DIUBAH DARI EXCEL:
// - auth_id
// - auth_email
// - account_created
// - must_change_pin
// - password / PIN
// - photo_url
//
// ==========================================================


(function () {

    "use strict";


    // ======================================================
    // KONFIGURASI
    // ======================================================

    const TABLE_RESIDENTS = "residents";
    const TABLE_HOUSEHOLDS = "households";

    const ACCESS_TOKEN =
        localStorage.getItem(
            "sidat_access_token"
        );


    // ======================================================
    // HELPER HEADER
    // ======================================================

    function headers() {

        return {
            "apikey":
                SUPABASE_KEY,

            "Authorization":
                `Bearer ${ACCESS_TOKEN}`,

            "Content-Type":
                "application/json",

            "Prefer":
                "return=representation"
        };

    }


    // ======================================================
    // NORMALISASI TEXT
    // ======================================================

    function normalizeText(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .trim();

    }


    function normalizeKK(value) {

        return normalizeText(value)
            .replace(/\D/g, "");

    }


    function normalizeNIK(value) {

        return normalizeText(value)
            .replace(/\D/g, "");

    }


    function normalizeResidentCode(value) {

        return normalizeText(value)
            .toUpperCase();

    }


    // ======================================================
    // NORMALISASI GENDER
    // ======================================================

    function normalizeGender(value) {

        const text =
            normalizeText(value)
                .toUpperCase();


        if (
            text === "L" ||
            text === "LAKI-LAKI" ||
            text === "LAKI LAKI" ||
            text === "LAKI"
        ) {

            return "L";

        }


        if (
            text === "P" ||
            text === "PEREMPUAN"
        ) {

            return "P";

        }


        return "";

    }


    // ======================================================
    // NORMALISASI STATUS KELUARGA
    // ======================================================

    function normalizeFamilyStatus(value) {

        const text =
            normalizeText(value)
                .toLowerCase();


        const map = {

            "kepala keluarga":
                "Kepala Keluarga",

            "kepala":
                "Kepala Keluarga",

            "istri":
                "Istri",

            "anak":
                "Anak",

            "orang tua":
                "Orang Tua",

            "orangtua":
                "Orang Tua",

            "saudara":
                "Saudara",

            "anggota keluarga":
                "Anggota Keluarga",

            "anggota":
                "Anggota Keluarga"

        };


        return map[text] || "";

    }


    // ======================================================
    // TANGGAL
    // ======================================================

    function normalizeDate(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return null;

        }


        // Date object
        if (
            Object.prototype.toString.call(value)
            === "[object Date]"
        ) {

            if (
                Number.isNaN(
                    value.getTime()
                )
            ) {

                return null;

            }


            return formatDate(value);

        }


        // Excel serial number
        if (
            typeof value === "number" &&
            value > 0
        ) {

            const date =
                new Date(
                    Math.round(
                        (
                            value -
                            25569
                        ) *
                        86400 *
                        1000
                    )
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return null;

            }


            return formatDate(date);

        }


        const text =
            normalizeText(value);


        // YYYY-MM-DD
        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(text)
        ) {

            const date =
                new Date(
                    `${text}T00:00:00`
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return null;

            }


            return text;

        }


        // DD/MM/YYYY atau DD-MM-YYYY
        const match =
            text.match(
                /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
            );


        if (match) {

            const day =
                match[1]
                    .padStart(
                        2,
                        "0"
                    );


            const month =
                match[2]
                    .padStart(
                        2,
                        "0"
                    );


            const year =
                match[3];


            const result =
                `${year}-${month}-${day}`;


            const date =
                new Date(
                    `${result}T00:00:00`
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return null;

            }


            return result;

        }


        const parsed =
            new Date(text);


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return formatDate(parsed);

        }


        return null;

    }


    function formatDate(date) {

        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            )
            .padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}`;

    }


    // ======================================================
    // HEADER EXCEL
    // ======================================================

    function normalizeHeader(value) {

        return normalizeText(value)
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }


    function getValue(
        row,
        names
    ) {

        const keys =
            Object.keys(row);


        for (
            const wanted of names
        ) {

            const normalizedWanted =
                normalizeHeader(
                    wanted
                );


            const key =
                keys.find(
                    item =>
                        normalizeHeader(
                            item
                        ) ===
                        normalizedWanted
                );


            if (
                key !== undefined
            ) {

                return row[key];

            }

        }


        return "";

    }


    // ======================================================
    // SUPABASE REQUEST
    // ======================================================

    async function request(
        url,
        options = {}
    ) {

        if (!ACCESS_TOKEN) {

            throw new Error(
                "Sesi login tidak ditemukan."
            );

        }


        const response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {
                        ...headers(),

                        ...(options.headers || {})
                    }
                }
            );


        const text =
            await response.text();


        let data;


        try {

            data =
                text
                    ? JSON.parse(text)
                    : null;

        } catch {

            data =
                text;

        }


        if (!response.ok) {

            let message =
                "Permintaan Supabase gagal.";


            if (
                typeof data === "string" &&
                data
            ) {

                message =
                    data;

            } else if (
                data &&
                data.message
            ) {

                message =
                    data.message;

            } else if (
                data &&
                data.error_description
            ) {

                message =
                    data.error_description;

            } else if (
                data &&
                data.error
            ) {

                message =
                    data.error;

            }


            throw new Error(
                message
            );

        }


        return data;

    }


    // ======================================================
    // VALIDASI SATU BARIS
    // ======================================================

    function validateRow(
        row,
        nomor
    ) {

        const name =
            normalizeText(
                getValue(
                    row,
                    [
                        "Nama Lengkap",
                        "Nama",
                        "name"
                    ]
                )
            );


        const residentCode =
            normalizeResidentCode(
                getValue(
                    row,
                    [
                        "ID Warga",
                        "ID",
                        "Kode Warga",
                        "resident_code"
                    ]
                )
            );


        const nik =
            normalizeNIK(
                getValue(
                    row,
                    [
                        "NIK",
                        "nik"
                    ]
                )
            );


        const kk =
            normalizeKK(
                getValue(
                    row,
                    [
                        "Nomor KK",
                        "KK",
                        "No KK",
                        "kk_number"
                    ]
                )
            );


        const gender =
            normalizeGender(
                getValue(
                    row,
                    [
                        "Jenis Kelamin",
                        "Gender",
                        "gender"
                    ]
                )
            );


        const familyStatus =
            normalizeFamilyStatus(
                getValue(
                    row,
                    [
                        "Status Keluarga",
                        "Status Dalam Keluarga",
                        "family_status"
                    ]
                )
            );


        const birthDateRaw =
            getValue(
                row,
                [
                    "Tanggal Lahir",
                    "birth_date"
                ]
            );


        const birthDate =
            normalizeDate(
                birthDateRaw
            );


        const errors = [];


        // --------------------------------------------------
        // NAMA
        // --------------------------------------------------

        if (!name) {

            errors.push(
                "Nama Lengkap wajib diisi."
            );

        }


        // --------------------------------------------------
        // NIK
        // --------------------------------------------------

        if (
            nik &&
            nik.length !== 16
        ) {

            errors.push(
                "NIK harus 16 digit."
            );

        }


        // --------------------------------------------------
        // KK
        // --------------------------------------------------

        if (
            kk &&
            kk.length !== 16
        ) {

            errors.push(
                "Nomor KK harus 16 digit."
            );

        }


        // --------------------------------------------------
        // GENDER
        // --------------------------------------------------

        if (!gender) {

            errors.push(
                "Jenis Kelamin harus L atau P."
            );

        }


        // --------------------------------------------------
        // STATUS KELUARGA
        // --------------------------------------------------

        if (!familyStatus) {

            errors.push(
                "Status Keluarga tidak valid."
            );

        }


        // --------------------------------------------------
        // KEPALA KELUARGA
        // --------------------------------------------------

        if (
            familyStatus ===
            "Kepala Keluarga" &&
            !kk
        ) {

            errors.push(
                "Kepala Keluarga wajib memiliki Nomor KK."
            );

        }


        // --------------------------------------------------
        // TANGGAL LAHIR
        // --------------------------------------------------

        if (
            birthDateRaw !== "" &&
            birthDateRaw !== null &&
            birthDateRaw !== undefined &&
            !birthDate
        ) {

            errors.push(
                "Tanggal Lahir tidak valid."
            );

        }


        // --------------------------------------------------
        // HASIL
        // --------------------------------------------------

        if (errors.length) {

            throw new Error(
                `Baris ${nomor}: ${errors.join(" ")}`
            );

        }


        return {

            excel_row:
                nomor,

            resident_code:
                residentCode || null,

            nik:
                nik || null,

            kk_number:
                kk || null,

            name,

            birth_place:
                normalizeText(
                    getValue(
                        row,
                        [
                            "Tempat Lahir",
                            "birth_place"
                        ]
                    )
                ) || null,

            birth_date:
                birthDate,

            gender,

            phone:
                normalizeText(
                    getValue(
                        row,
                        [
                            "Nomor HP",
                            "No HP",
                            "Telepon",
                            "phone"
                        ]
                    )
                ) || null,

            address:
                normalizeText(
                    getValue(
                        row,
                        [
                            "Alamat",
                            "address"
                        ]
                    )
                ) || null,

            family_status:
                familyStatus

        };

    }


    // ======================================================
    // VALIDASI SELURUH EXCEL
    // ======================================================
    //
    // PENTING:
    // Fungsi ini HANYA membaca dan memeriksa.
    // Tidak melakukan INSERT / UPDATE.
    //
    // ======================================================

    function validateAllRows(
        rows
    ) {

        const validRows = [];
        const errors = [];

        const seenCodes =
            new Map();

        const seenNiks =
            new Map();

        const seenKKHeads =
            new Map();


        for (
            let index = 0;
            index < rows.length;
            index++
        ) {

            const row =
                rows[index];


            const nomor =
                index + 2;


            try {

                const resident =
                    validateRow(
                        row,
                        nomor
                    );


                // ------------------------------------------
                // DUPLIKASI ID WARGA DALAM EXCEL
                // ------------------------------------------

                if (
                    resident.resident_code
                ) {

                    const code =
                        resident.resident_code;


                    if (
                        seenCodes.has(code)
                    ) {

                        errors.push(
                            `Baris ${nomor}: ID Warga "${code}" duplikat dengan baris ${seenCodes.get(code)}.`
                        );

                    } else {

                        seenCodes.set(
                            code,
                            nomor
                        );

                    }

                }


                // ------------------------------------------
                // DUPLIKASI NIK DALAM EXCEL
                // ------------------------------------------

                if (
                    resident.nik
                ) {

                    const nik =
                        resident.nik;


                    if (
                        seenNiks.has(nik)
                    ) {

                        errors.push(
                            `Baris ${nomor}: NIK "${nik}" duplikat dengan baris ${seenNiks.get(nik)}.`
                        );

                    } else {

                        seenNiks.set(
                            nik,
                            nomor
                        );

                    }

                }


                // ------------------------------------------
                // DUPLIKASI KEPALA KELUARGA
                // ------------------------------------------

                if (
                    resident.family_status ===
                    "Kepala Keluarga" &&
                    resident.kk_number
                ) {

                    const kk =
                        resident.kk_number;


                    if (
                        seenKKHeads.has(kk)
                    ) {

                        errors.push(
                            `Baris ${nomor}: Nomor KK "${kk}" memiliki lebih dari satu Kepala Keluarga pada file Excel.`
                        );

                    } else {

                        seenKKHeads.set(
                            kk,
                            nomor
                        );

                    }

                }


                validRows.push(
                    resident
                );


            } catch (error) {

                errors.push(
                    error.message
                );

            }

        }


        return {

            validRows,

            errors

        };

    }


    // ======================================================
    // VALIDASI TERHADAP DATABASE
    // ======================================================
    //
    // Dilakukan SEBELUM proses INSERT / UPDATE.
    //
    // ======================================================

    function validateDatabaseConflicts(
        rows,
        existingResidents,
        existingHouseholds
    ) {

        const errors = [];


        // --------------------------------------------------
        // INDEX DATABASE
        // --------------------------------------------------

        const byCode =
            new Map();

        const byNik =
            new Map();


        existingResidents.forEach(
            resident => {

                const code =
                    normalizeResidentCode(
                        resident.resident_code
                    );


                const nik =
                    normalizeNIK(
                        resident.nik
                    );


                if (code) {

                    byCode.set(
                        code,
                        resident
                    );

                }


                if (nik) {

                    byNik.set(
                        nik,
                        resident
                    );

                }

            }
        );


        // --------------------------------------------------
        // CEK SETIAP BARIS
        // --------------------------------------------------

        rows.forEach(
            resident => {

                const code =
                    normalizeResidentCode(
                        resident.resident_code
                    );


                const nik =
                    normalizeNIK(
                        resident.nik
                    );


                const byCodeResident =
                    code
                        ? byCode.get(code)
                        : null;


                const byNikResident =
                    nik
                        ? byNik.get(nik)
                        : null;


                // ------------------------------------------
                // ID WARGA DAN NIK MENUNJUK KE ORANG BERBEDA
                // ------------------------------------------

                if (
                    byCodeResident &&
                    byNikResident &&
                    byCodeResident.id !==
                    byNikResident.id
                ) {

                    errors.push(
                        `Baris ${resident.excel_row}: ID Warga "${code}" dan NIK "${nik}" mengarah ke dua data warga berbeda.`
                    );

                    return;

                }


                // ------------------------------------------
                // JIKA ID WARGA ADA
                // ------------------------------------------

                if (
                    byCodeResident &&
                    nik &&
                    normalizeNIK(
                        byCodeResident.nik
                    ) &&
                    normalizeNIK(
                        byCodeResident.nik
                    ) !== nik
                ) {

                    errors.push(
                        `Baris ${resident.excel_row}: ID Warga "${code}" sudah digunakan warga lain dengan NIK berbeda.`
                    );

                }


                // ------------------------------------------
                // JIKA NIK ADA TAPI ID WARGA BERBEDA
                // ------------------------------------------

                if (
                    byNikResident &&
                    code &&
                    normalizeResidentCode(
                        byNikResident.resident_code
                    ) &&
                    normalizeResidentCode(
                        byNikResident.resident_code
                    ) !== code
                ) {

                    errors.push(
                        `Baris ${resident.excel_row}: NIK "${nik}" sudah digunakan oleh ID Warga "${byNikResident.resident_code}".`
                    );

                }


                // ------------------------------------------
                // KK YANG SUDAH ADA
                // ------------------------------------------

                if (
                    resident.family_status ===
                    "Kepala Keluarga" &&
                    resident.kk_number
                ) {

                    const existingKK =
                        existingHouseholds.find(
                            household =>
                                normalizeKK(
                                    household.kk_number
                                ) ===
                                resident.kk_number
                        );


                    if (
                        existingKK &&
                        existingKK.head_resident_id &&
                        byCodeResident &&
                        existingKK.head_resident_id !==
                        byCodeResident.id
                    ) {

                        // Tidak langsung ditolak jika data
                        // memang sedang dipindahkan menjadi
                        // kepala KK baru.
                        //
                        // Namun jika KK sudah memiliki kepala
                        // yang berbeda dan resident bukan target
                        // yang sama, lebih aman meminta admin
                        // memperbaiki data terlebih dahulu.

                        errors.push(
                            `Baris ${resident.excel_row}: Nomor KK "${resident.kk_number}" sudah memiliki Kepala Keluarga berbeda di database.`
                        );

                    }

                }

            }
        );


        return errors;

    }


    // ======================================================
    // DOWNLOAD TEMPLATE
    // ======================================================

    function downloadTemplateWarga() {

        if (
            typeof XLSX ===
            "undefined"
        ) {

            alert(
                "Library Excel belum tersedia."
            );

            return;

        }


        const data = [

            {

                "ID Warga":
                    "RT001",

                "NIK":
                    "3300000000000001",

                "Nomor KK":
                    "3300000000000001",

                "Nama Lengkap":
                    "Contoh Nama",

                "Tempat Lahir":
                    "Klaten",

                "Tanggal Lahir":
                    "1990-01-15",

                "Jenis Kelamin":
                    "L",

                "Nomor HP":
                    "081234567890",

                "Alamat":
                    "Alamat contoh",

                "Status Keluarga":
                    "Kepala Keluarga"

            }

        ];


        const petunjuk = [

            {
                "Keterangan":
                    "Template Data Warga SIDAT."
            },

            {
                "Keterangan":
                    "Jangan menghapus atau mengganti nama kolom."
            },

            {
                "Keterangan":
                    "ID Warga digunakan untuk mencocokkan data warga yang sudah ada."
            },

            {
                "Keterangan":
                    "Jika ID Warga kosong, NIK dapat digunakan sebagai pencocokan."
            },

            {
                "Keterangan":
                    "NIK dan Nomor KK harus 16 digit."
            },

            {
                "Keterangan":
                    "Jenis Kelamin: L = Laki-laki, P = Perempuan."
            },

            {
                "Keterangan":
                    "Status Keluarga: Kepala Keluarga, Istri, Anak, Orang Tua, Saudara, Anggota Keluarga."
            },

            {
                "Keterangan":
                    "Seluruh data akan divalidasi terlebih dahulu sebelum disimpan."
            },

            {
                "Keterangan":
                    "Jika ditemukan kesalahan, seluruh proses import dibatalkan dan tidak ada data yang diubah."
            },

            {
                "Keterangan":
                    "Kepala Keluarga yang belum memiliki akun akan dibuatkan akun WARGA otomatis."
            },

            {
                "Keterangan":
                    "PIN awal akun WARGA adalah 123456 dan wajib diganti saat login pertama."
            },

            {
                "Keterangan":
                    "Akun WARGA yang sudah ada tidak akan diubah oleh proses Import Excel."
            },

            {
                "Keterangan":
                    "Anggota keluarga selain Kepala Keluarga tidak dibuatkan akun WARGA."

            }

        ];


        const workbook =
            XLSX.utils.book_new();


        const sheetData =
            XLSX.utils.json_to_sheet(
                data
            );


        const sheetPetunjuk =
            XLSX.utils.json_to_sheet(
                petunjuk
            );


        sheetData["!cols"] = [

            { wch: 14 },
            { wch: 20 },
            { wch: 20 },
            { wch: 28 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 35 },
            { wch: 24 }

        ];


        sheetPetunjuk["!cols"] = [
            { wch: 100 }
        ];


        XLSX.utils.book_append_sheet(
            workbook,
            sheetData,
            "Data Warga"
        );


        XLSX.utils.book_append_sheet(
            workbook,
            sheetPetunjuk,
            "Petunjuk"
        );


        XLSX.writeFile(
            workbook,
            "Template_Data_Warga_SIDAT.xlsx"
        );

    }


    // ======================================================
    // EXPORT
    // ======================================================

    async function exportDataWargaExcel() {

        try {

            if (
                typeof XLSX ===
                "undefined"
            ) {

                throw new Error(
                    "Library Excel belum tersedia."
                );

            }


            if (!ACCESS_TOKEN) {

                throw new Error(
                    "Sesi login tidak ditemukan."
                );

            }


            showToastExcel(
                "Menyiapkan data Excel..."
            );


            const residents =
                await request(
                    `${SUPABASE_URL}/rest/v1/${TABLE_RESIDENTS}` +
                    `?select=` +
                    `id,resident_code,nik,kk_number,name,` +
                    `birth_place,birth_date,gender,phone,address,` +
                    `family_status,is_active,account_created,` +
                    `auth_email,must_change_pin,created_at,updated_at` +
                    `&order=resident_code.asc`
                );


            const households =
                await request(
                    `${SUPABASE_URL}/rest/v1/${TABLE_HOUSEHOLDS}` +
                    `?select=id,kk_number,head_resident_id,address,created_at` +
                    `&order=kk_number.asc`
                );


            const householdMap =
                new Map();


            households.forEach(
                item => {

                    householdMap.set(
                        String(
                            item.kk_number || ""
                        ),
                        item
                    );

                }
            );


            const rows =
                residents.map(
                    resident => {

                        const household =
                            householdMap.get(
                                String(
                                    resident.kk_number || ""
                                )
                            );


                        return {

                            "ID Warga":
                                resident.resident_code || "",

                            "NIK":
                                resident.nik || "",

                            "Nomor KK":
                                resident.kk_number || "",

                            "Nama Lengkap":
                                resident.name || "",

                            "Tempat Lahir":
                                resident.birth_place || "",

                            "Tanggal Lahir":
                                resident.birth_date || "",

                            "Jenis Kelamin":
                                resident.gender || "",

                            "Nomor HP":
                                resident.phone || "",

                            "Alamat":
                                resident.address || "",

                            "Status Keluarga":
                                resident.family_status || "",

                            "Status Aktif":
                                resident.is_active
                                    ? "Aktif"
                                    : "Tidak Aktif",

                            "Akun Warga":
                                resident.account_created
                                    ? "Sudah"
                                    : "Belum",

                            "PIN Wajib Diganti":
                                resident.must_change_pin
                                    ? "Ya"
                                    : "Tidak",

                            "Email Akun":
                                resident.auth_email || "",

                            "Dibuat":
                                resident.created_at || "",

                            "Diperbarui":
                                resident.updated_at || "",

                            "Alamat KK":
                                household
                                    ? household.address || ""
                                    : ""

                        };

                    }
                );


            const workbook =
                XLSX.utils.book_new();


            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );


            worksheet["!cols"] = [

                { wch: 14 },
                { wch: 20 },
                { wch: 20 },
                { wch: 28 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 35 },
                { wch: 24 },
                { wch: 14 },
                { wch: 15 },
                { wch: 20 },
                { wch: 32 },
                { wch: 24 },
                { wch: 24 },
                { wch: 35 }

            ];


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Data Warga"
            );


            const petunjuk =
                XLSX.utils.json_to_sheet([

                    {
                        "Keterangan":
                            "File ini merupakan hasil Export Data Warga SIDAT."
                    },

                    {
                        "Keterangan":
                            "Kolom akun hanya untuk informasi."
                    },

                    {
                        "Keterangan":
                            "Kolom akun tidak digunakan untuk mengubah akun saat Import."
                    },

                    {
                        "Keterangan":
                            "auth_id, password, PIN, dan photo_url tidak diubah melalui Excel."
                    },

                    {
                        "Keterangan":
                            "Import akan memvalidasi seluruh data terlebih dahulu sebelum database diubah."
                    },

                    {
                        "Keterangan":
                            "Kepala Keluarga tanpa akun WARGA akan dibuatkan akun otomatis dengan PIN awal 123456."
                    },

                    {
                        "Keterangan":
                            "Akun WARGA yang sudah ada tidak ditimpa."
                    }

                ]);


            petunjuk["!cols"] = [
                { wch: 110 }
            ];


            XLSX.utils.book_append_sheet(
                workbook,
                petunjuk,
                "Petunjuk"
            );


            const now =
                new Date();


            const date =
                now
                    .toISOString()
                    .slice(
                        0,
                        10
                    );


            XLSX.writeFile(
                workbook,
                `Data_Warga_SIDAT_${date}.xlsx`
            );


            showToastExcel(
                "Export Excel berhasil."
            );


        } catch (error) {

            console.error(
                "Export Excel:",
                error
            );


            alert(
                "Export gagal: " +
                error.message
            );

        }

    }


    // ======================================================
    // MODAL
    // ======================================================

    function bukaImportExcel() {

        const modal =
            document.getElementById(
                "importExcelModal"
            );


        if (!modal) {

            alert(
                "Modal Import Excel belum tersedia."
            );

            return;

        }


        modal.classList.remove(
            "hidden"
        );


        resetImportExcel();

    }


    function tutupImportExcel() {

        const modal =
            document.getElementById(
                "importExcelModal"
            );


        if (modal) {

            modal.classList.add(
                "hidden"
            );

        }

    }


    function resetImportExcel() {

        const input =
            document.getElementById(
                "importExcelFile"
            );


        const name =
            document.getElementById(
                "importExcelFileName"
            );


        const result =
            document.getElementById(
                "importExcelResult"
            );


        const progress =
            document.getElementById(
                "importExcelProgress"
            );


        const status =
            document.getElementById(
                "importExcelStatus"
            );


        const count =
            document.getElementById(
                "importExcelCount"
            );


        const bar =
            document.getElementById(
                "importExcelProgressBar"
            );


        const button =
            document.getElementById(
                "btnProsesImportExcel"
            );


        if (input) {

            input.value =
                "";

        }


        if (name) {

            name.textContent =
                "Belum ada file dipilih.";

        }


        if (result) {

            result.classList.add(
                "hidden"
            );

            result.innerHTML =
                "";

        }


        if (progress) {

            progress.classList.add(
                "hidden"
            );

        }


        if (status) {

            status.textContent =
                "Memproses...";

        }


        if (count) {

            count.textContent =
                "0/0";

        }


        if (bar) {

            bar.style.width =
                "0%";

        }


        if (button) {

            button.disabled =
                true;

        }

    }


    // ======================================================
    // FILE INPUT
    // ======================================================

    function setupFileInput() {

        const input =
            document.getElementById(
                "importExcelFile"
            );


        if (!input) {

            return;

        }


        // Hindari listener ganda
        if (
            input.dataset.sidatReady ===
            "true"
        ) {

            return;

        }


        input.dataset.sidatReady =
            "true";


        input.addEventListener(
            "change",
            function () {

                const file =
                    this.files &&
                    this.files[0];


                const name =
                    document.getElementById(
                        "importExcelFileName"
                    );


                const button =
                    document.getElementById(
                        "btnProsesImportExcel"
                    );


                if (!file) {

                    if (name) {

                        name.textContent =
                            "Belum ada file dipilih.";

                    }


                    if (button) {

                        button.disabled =
                            true;

                    }


                    return;

                }


                const valid =
                    /\.(xlsx|xls)$/i
                        .test(
                            file.name
                        );


                if (!valid) {

                    alert(
                        "File harus berformat .xlsx atau .xls."
                    );


                    this.value =
                        "";


                    if (name) {

                        name.textContent =
                            "Belum ada file dipilih.";

                    }


                    if (button) {

                        button.disabled =
                            true;

                    }


                    return;

                }


                if (name) {

                    name.textContent =
                        file.name;

                }


                if (button) {

                    button.disabled =
                        false;

                }

            }
        );

    }


    // ======================================================
    // BACA EXCEL
    // ======================================================

    function readExcelFile(
        file
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                if (
                    typeof XLSX ===
                    "undefined"
                ) {

                    reject(
                        new Error(
                            "Library Excel belum tersedia."
                        )
                    );

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        try {

                            const workbook =
                                XLSX.read(
                                    event.target.result,
                                    {
                                        type:
                                            "array",

                                        cellDates:
                                            true
                                    }
                                );


                            if (
                                !workbook.SheetNames.length
                            ) {

                                throw new Error(
                                    "File Excel tidak memiliki sheet."
                                );

                            }


                            const firstSheet =
                                workbook.Sheets[
                                    workbook.SheetNames[0]
                                ];


                            const rows =
                                XLSX.utils.sheet_to_json(
                                    firstSheet,
                                    {
                                        defval:
                                            "",

                                        raw:
                                            true
                                    }
                                );


                            resolve(
                                rows
                            );


                        } catch (error) {

                            reject(
                                error
                            );

                        }

                    };


                reader.onerror =
                    function () {

                        reject(
                            new Error(
                                "File Excel tidak dapat dibaca."
                            )
                        );

                    };


                reader.readAsArrayBuffer(
                    file
                );

            }
        );

    }


    // ======================================================
    // AMBIL DATA EXISTING
    // ======================================================

    async function getExistingResidents() {

        return await request(
            `${SUPABASE_URL}/rest/v1/${TABLE_RESIDENTS}` +
            `?select=` +
            `id,resident_code,nik,kk_number,name,` +
            `family_status,account_created,auth_id,auth_email,` +
            `must_change_pin,is_active` +
            `&order=resident_code.asc`
        );

    }


    async function getExistingHouseholds() {

        return await request(
            `${SUPABASE_URL}/rest/v1/${TABLE_HOUSEHOLDS}` +
            `?select=id,kk_number,head_resident_id,address`
        );

    }


    // ======================================================
    // CARI RESIDENT
    // ======================================================

    function findExistingResident(
        resident,
        existing
    ) {

        const code =
            normalizeResidentCode(
                resident.resident_code
            );


        const nik =
            normalizeNIK(
                resident.nik
            );


        if (code) {

            const byCode =
                existing.find(
                    item =>
                        normalizeResidentCode(
                            item.resident_code
                        ) ===
                        code
                );


            if (byCode) {

                return byCode;

            }

        }


        if (nik) {

            const byNik =
                existing.find(
                    item =>
                        normalizeNIK(
                            item.nik
                        ) ===
                        nik
                );


            if (byNik) {

                return byNik;

            }

        }


        return null;

    }


    // ======================================================
    // GENERATE ID WARGA
    // ======================================================

    function generateResidentCode(
        existing
    ) {

        let max =
            0;


        existing.forEach(
            item => {

                const match =
                    normalizeResidentCode(
                        item.resident_code
                    )
                    .match(
                        /^RT(\d+)$/i
                    );


                if (match) {

                    const number =
                        parseInt(
                            match[1],
                            10
                        );


                    if (
                        number > max
                    ) {

                        max =
                            number;

                    }

                }

            }
        );


        return (
            "RT" +
            String(
                max + 1
            )
            .padStart(
                3,
                "0"
            )
        );

    }


    // ======================================================
    // SIMPAN RESIDENT
    // ======================================================

    async function saveResident(
        resident,
        existing
    ) {

        let target =
            findExistingResident(
                resident,
                existing
            );


        const payload = {

            resident_code:
                resident.resident_code ||
                generateResidentCode(
                    existing
                ),

            nik:
                resident.nik,

            kk_number:
                resident.kk_number,

            name:
                resident.name,

            birth_place:
                resident.birth_place,

            birth_date:
                resident.birth_date,

            gender:
                resident.gender,

            phone:
                resident.phone,

            address:
                resident.address,

            family_status:
                resident.family_status

        };


        let saved;


        if (target) {

            saved =
                await request(
                    `${SUPABASE_URL}/rest/v1/${TABLE_RESIDENTS}` +
                    `?id=eq.${encodeURIComponent(target.id)}`,
                    {
                        method:
                            "PATCH",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


        } else {

            saved =
                await request(
                    `${SUPABASE_URL}/rest/v1/${TABLE_RESIDENTS}`,
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

        }


        const row =
            Array.isArray(saved)
                ? saved[0]
                : saved;


        return {

            row,

            wasExisting:
                !!target

        };

    }


    // ======================================================
    // SIMPAN HOUSEHOLD
    // ======================================================

    async function saveHousehold(
        resident,
        savedResident,
        households
    ) {

        if (
            resident.family_status !==
            "Kepala Keluarga"
        ) {

            return {

                changed:
                    false,

                created:
                    false,

                ready:
                    false

            };

        }


        const kk =
            normalizeKK(
                resident.kk_number
            );


        if (!kk) {

            return {

                changed:
                    false,

                created:
                    false,

                ready:
                    false

            };

        }


        const existing =
            households.find(
                item =>
                    normalizeKK(
                        item.kk_number
                    ) ===
                    kk
            );


        const payload = {

            kk_number:
                kk,

            head_resident_id:
                savedResident.id,

            address:
                resident.address ||
                null

        };


        if (existing) {

            await request(
                `${SUPABASE_URL}/rest/v1/${TABLE_HOUSEHOLDS}` +
                `?id=eq.${encodeURIComponent(existing.id)}`,
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            existing.head_resident_id =
                savedResident.id;


            existing.address =
                resident.address ||
                null;


            existing.kk_number =
                kk;


            return {

                changed:
                    true,

                created:
                    false,

                ready:
                    true,

                household:
                    existing

            };

        }


        const saved =
            await request(
                `${SUPABASE_URL}/rest/v1/${TABLE_HOUSEHOLDS}`,
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const household =
            Array.isArray(saved)
                ? saved[0]
                : saved;


        if (household) {

            households.push(
                household
            );

        }


        return {

            changed:
                true,

            created:
                true,

            ready:
                true,

            household

        };

    }


    // ======================================================
    // BUAT AKUN WARGA OTOMATIS
    // ======================================================
    //
    // PIN AWAL TIDAK DIKIRIM DARI BROWSER.
    // Edge Function menentukan PIN awal:
    //
    // 123456
    //
    // ======================================================

    async function buatAkunWargaOtomatis(
        residentId
    ) {

        if (!residentId) {

            throw new Error(
                "ID resident tidak ditemukan."
            );

        }


        if (!ACCESS_TOKEN) {

            throw new Error(
                "Sesi login admin tidak ditemukan."
            );

        }


        const response =
            await fetch(
                `${SUPABASE_URL}/functions/v1/create-resident-account`,
                {
                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${ACCESS_TOKEN}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            resident_id:
                                residentId
                        })

                }
            );


        const text =
            await response.text();


        let data;


        try {

            data =
                text
                    ? JSON.parse(text)
                    : null;

        } catch {

            data =
                text;

        }


        if (!response.ok) {

            let message =
                "Pembuatan akun WARGA gagal.";


            if (
                typeof data === "string" &&
                data
            ) {

                message =
                    data;

            } else if (
                data &&
                data.message
            ) {

                message =
                    data.message;

            } else if (
                data &&
                data.error
            ) {

                message =
                    data.error;

            }


            throw new Error(
                message
            );

        }


        // -----------------------------------------------
        // AKUN SUDAH ADA
        // -----------------------------------------------

        if (
            data &&
            (
                data.status ===
                "already_exists" ||

                data.already_exists ===
                true
            )
        ) {

            return {

                status:
                    "already_exists",

                created:
                    false,

                initial_pin:
                    null,

                data

            };

        }


        // -----------------------------------------------
        // AKUN BARU
        // -----------------------------------------------

        return {

            status:
                data?.status ||
                "created",

            created:
                true,

            initial_pin:
                "123456",

            data

        };

    }


    // ======================================================
    // PROGRESS
    // ======================================================

    function setProgress(
        current,
        total,
        status
    ) {

        const progress =
            document.getElementById(
                "importExcelProgress"
            );


        const statusElement =
            document.getElementById(
                "importExcelStatus"
            );


        const countElement =
            document.getElementById(
                "importExcelCount"
            );


        const bar =
            document.getElementById(
                "importExcelProgressBar"
            );


        if (progress) {

            progress.classList.remove(
                "hidden"
            );

        }


        if (statusElement) {

            statusElement.textContent =
                status;

        }


        if (countElement) {

            countElement.textContent =
                `${current}/${total}`;

        }


        if (bar) {

            const percentage =
                total > 0
                    ? (
                        current /
                        total
                    ) * 100
                    : 0;


            bar.style.width =
                `${percentage}%`;

        }

    }


    // ======================================================
    // HASIL
    // ======================================================

    function showImportResult(
        success,
        updated,
        created,
        kkCreated,
        akunCreated,
        akunExisting,
        akunFailed,
        errors
    ) {

        const result =
            document.getElementById(
                "importExcelResult"
            );


        if (!result) {

            return;

        }


        result.classList.remove(
            "hidden"
        );


        let html = `

            <div class="import-result-grid">

                <div>
                    <strong>${success}</strong>
                    <span>Berhasil</span>
                </div>

                <div>
                    <strong>${created}</strong>
                    <span>Warga Baru</span>
                </div>

                <div>
                    <strong>${updated}</strong>
                    <span>Diperbarui</span>
                </div>

                <div>
                    <strong>${kkCreated}</strong>
                    <span>KK Dibuat/Diubah</span>
                </div>

                <div>
                    <strong>${akunCreated}</strong>
                    <span>Akun WARGA Dibuat</span>
                </div>

                <div>
                    <strong>${akunExisting}</strong>
                    <span>Akun Sudah Ada</span>
                </div>

                <div>
                    <strong>${akunFailed}</strong>
                    <span>Akun Gagal</span>
                </div>

            </div>

        `;


        if (
            akunCreated > 0
        ) {

            html += `

                <div class="import-success-list">

                    <strong>
                        Akun WARGA baru berhasil dibuat.
                    </strong>

                    <p>
                        PIN awal: <strong>123456</strong>
                    </p>

                    <p>
                        Sampaikan PIN awal tersebut kepada Kepala Keluarga.
                        PIN wajib diganti saat login pertama.
                    </p>

                </div>

            `;

        }


        if (
            errors.length
        ) {

            html += `

                <div class="import-error-list">

                    <strong>
                        Catatan / data yang gagal:
                    </strong>

                    <ul>

            `;


            errors
                .slice(
                    0,
                    50
                )
                .forEach(
                    error => {

                        html +=
                            `<li>${escapeHtmlExcel(error)}</li>`;

                    }
                );


            html += `

                    </ul>

                </div>

            `;

        }


        result.innerHTML =
            html;

    }


    // ======================================================
    // HASIL VALIDASI SEBELUM IMPORT
    // ======================================================

    function showValidationResult(
        errors,
        total
    ) {

        const result =
            document.getElementById(
                "importExcelResult"
            );


        if (!result) {

            return;

        }


        result.classList.remove(
            "hidden"
        );


        let html = `

            <div class="import-error-list">

                <strong>
                    Import dibatalkan.
                </strong>

                <p>
                    Ditemukan
                    <strong>${errors.length}</strong>
                    masalah pada
                    <strong>${total}</strong>
                    baris data.
                </p>

                <p>
                    Tidak ada data yang diubah di database.
                </p>

                <ul>

        `;


        errors
            .slice(
                0,
                100
            )
            .forEach(
                error => {

                    html +=
                        `<li>${escapeHtmlExcel(error)}</li>`;

                }
            );


        if (
            errors.length > 100
        ) {

            html +=
                `<li>... dan ${errors.length - 100} kesalahan lainnya.</li>`;

        }


        html += `

                </ul>

            </div>

        `;


        result.innerHTML =
            html;

    }


    // ======================================================
    // ESCAPE HTML
    // ======================================================

    function escapeHtmlExcel(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // ======================================================
    // KONFIRMASI IMPORT
    // ======================================================

    function confirmImportExcel(
        totalRows
    ) {

        return window.confirm(
            `Validasi berhasil.\n\n` +
            `${totalRows} baris data siap di-import.\n\n` +
            `Data baru akan dibuat dan data lama akan diperbarui berdasarkan ID Warga/NIK.\n\n` +
            `Kepala Keluarga yang belum memiliki akun WARGA akan dibuatkan akun otomatis dengan PIN awal 123456.\n\n` +
            `Lanjutkan import?`
        );

    }


    // ======================================================
    // IMPORT UTAMA
    // ======================================================

    async function prosesImportExcel() {

        const input =
            document.getElementById(
                "importExcelFile"
            );


        const button =
            document.getElementById(
                "btnProsesImportExcel"
            );


        if (
            !input ||
            !input.files ||
            !input.files[0]
        ) {

            alert(
                "Pilih file Excel terlebih dahulu."
            );

            return;

        }


        const file =
            input.files[0];


        try {

            if (button) {

                button.disabled =
                    true;

            }


            // ==================================================
            // TAHAP 1
            // BACA EXCEL
            // ==================================================

            setProgress(
                0,
                0,
                "Membaca file Excel..."
            );


            const rows =
                await readExcelFile(
                    file
                );


            if (!rows.length) {

                throw new Error(
                    "Tidak ada data pada sheet Excel."
                );

            }


            // ==================================================
            // TAHAP 2
            // VALIDASI DATA EXCEL
            // ==================================================
            //
            // BELUM ADA INSERT / UPDATE.
            //
            // ==================================================

            setProgress(
                0,
                rows.length,
                "Memvalidasi seluruh data Excel..."
            );


            const validation =
                validateAllRows(
                    rows
                );


            if (
                validation.errors.length
            ) {

                setProgress(
                    rows.length,
                    rows.length,
                    "Validasi gagal."
                );


                showValidationResult(
                    validation.errors,
                    rows.length
                );


                return;

            }


            // ==================================================
            // TAHAP 3
            // AMBIL DATA DATABASE
            // ==================================================

            setProgress(
                rows.length,
                rows.length,
                "Memeriksa data database..."
            );


            const existingResidents =
                await getExistingResidents();


            const existingHouseholds =
                await getExistingHouseholds();


            // ==================================================
            // TAHAP 4
            // VALIDASI KONFLIK DATABASE
            // ==================================================
            //
            // MASIH BELUM ADA INSERT / UPDATE.
            //
            // ==================================================

            const databaseErrors =
                validateDatabaseConflicts(
                    validation.validRows,
                    existingResidents,
                    existingHouseholds
                );


            if (
                databaseErrors.length
            ) {

                setProgress(
                    rows.length,
                    rows.length,
                    "Validasi database gagal."
                );


                showValidationResult(
                    databaseErrors,
                    rows.length
                );


                return;

            }


            // ==================================================
            // TAHAP 5
            // KONFIRMASI ADMIN
            // ==================================================

            const confirmed =
                confirmImportExcel(
                    validation.validRows.length
                );


            if (!confirmed) {

                setProgress(
                    rows.length,
                    rows.length,
                    "Import dibatalkan."
                );


                return;

            }


            // ==================================================
            // TAHAP 6
            // IMPORT BARU DIMULAI
            // ==================================================

            let created = 0;
            let updated = 0;
            let kkCreated = 0;

            let akunCreated = 0;
            let akunExisting = 0;
            let akunFailed = 0;

            const errors = [];


            const total =
                validation.validRows.length;


            for (
                let index = 0;
                index < total;
                index++
            ) {

                const resident =
                    validation.validRows[index];


                const nomor =
                    resident.excel_row;


                setProgress(
                    index,
                    total,
                    `Mengimport baris ${nomor}...`
                );


                try {

                    // ------------------------------------------
                    // CARI DATA LAMA
                    // ------------------------------------------

                    const before =
                        findExistingResident(
                            resident,
                            existingResidents
                        );


                    // ------------------------------------------
                    // SIMPAN RESIDENT
                    // ------------------------------------------

                    const saveResult =
                        await saveResident(
                            resident,
                            existingResidents
                        );


                    const savedResident =
                        saveResult.row;


                    if (!savedResident) {

                        throw new Error(
                            `Baris ${nomor}: Data warga tidak berhasil disimpan.`
                        );

                    }


                    if (before) {

                        updated++;

                    } else {

                        created++;

                    }


                    // ------------------------------------------
                    // UPDATE CACHE RESIDENT
                    // ------------------------------------------

                    const existingIndex =
                        existingResidents.findIndex(
                            item =>
                                item.id ===
                                savedResident.id
                        );


                    if (
                        existingIndex >= 0
                    ) {

                        existingResidents[
                            existingIndex
                        ] =
                            {
                                ...existingResidents[
                                    existingIndex
                                ],

                                ...savedResident
                            };

                    } else {

                        existingResidents.push(
                            savedResident
                        );

                    }


                    // ------------------------------------------
                    // KEPALA KELUARGA
                    // ------------------------------------------

                    if (
                        resident.family_status ===
                        "Kepala Keluarga"
                    ) {

                        // --------------------------------------
                        // SIMPAN KK
                        // --------------------------------------

                        const householdResult =
                            await saveHousehold(
                                resident,
                                savedResident,
                                existingHouseholds
                            );


                        if (
                            householdResult.created
                        ) {

                            kkCreated++;

                        }


                        // --------------------------------------
                        // AKUN WARGA
                        // --------------------------------------
                        //
                        // Hanya dibuat setelah KK siap.
                        //
                        // --------------------------------------

                        if (
                            householdResult.ready
                        ) {

                            try {

                                const accountResult =
                                    await buatAkunWargaOtomatis(
                                        savedResident.id
                                    );


                                if (
                                    accountResult.status ===
                                    "already_exists"
                                ) {

                                    akunExisting++;

                                } else {

                                    akunCreated++;

                                }


                            } catch (accountError) {

                                akunFailed++;


                                errors.push(
                                    `Baris ${nomor}: Data warga berhasil disimpan, tetapi akun WARGA gagal dibuat. ${accountError.message}`
                                );

                            }

                        } else {

                            akunFailed++;


                            errors.push(
                                `Baris ${nomor}: Data warga tersimpan, tetapi akun WARGA tidak dibuat karena data KK belum siap.`
                            );

                        }

                    }


                } catch (error) {

                    console.error(
                        `Import baris ${nomor}:`,
                        error
                    );


                    errors.push(
                        error.message
                    );

                }

            }


            // ==================================================
            // SELESAI
            // ==================================================

            setProgress(
                total,
                total,
                "Import selesai."
            );


            showImportResult(
                created + updated,
                updated,
                created,
                kkCreated,
                akunCreated,
                akunExisting,
                akunFailed,
                errors
            );


            // ==================================================
            // TOAST
            // ==================================================

            if (
                errors.length === 0
            ) {

                showToastExcel(
                    "Import Excel berhasil."
                );

            } else {

                showToastExcel(
                    "Import selesai dengan beberapa catatan."
                );

            }


            // ==================================================
            // REFRESH DATA WARGA
            // ==================================================

            setTimeout(
                async function () {

                    try {

                        if (
                            typeof window.loadDataWarga ===
                            "function"
                        ) {

                            await window.loadDataWarga();

                        } else {

                            window.location.reload();

                        }

                    } catch {

                        window.location.reload();

                    }

                },
                800
            );


        } catch (error) {

            console.error(
                "Import Excel:",
                error
            );


            const result =
                document.getElementById(
                    "importExcelResult"
                );


            if (result) {

                result.classList.remove(
                    "hidden"
                );


                result.innerHTML =
                    `
                    <div class="import-error-list">

                        <strong>
                            Import gagal
                        </strong>

                        <p>
                            ${escapeHtmlExcel(
                                error.message
                            )}
                        </p>

                    </div>
                    `;

            }


            alert(
                "Import gagal: " +
                error.message
            );


        } finally {

            if (button) {

                button.disabled =
                    false;

            }

        }

    }


    // ======================================================
    // TOAST
    // ======================================================

    function showToastExcel(
        message
    ) {

        const toast =
            document.getElementById(
                "toast"
            );


        if (!toast) {

            return;

        }


        toast.textContent =
            message;


        toast.classList.remove(
            "hidden"
        );


        clearTimeout(
            window.sidatExcelToastTimer
        );


        window.sidatExcelToastTimer =
            setTimeout(
                function () {

                    toast.classList.add(
                        "hidden"
                    );

                },
                3000
            );

    }


    // ======================================================
    // GLOBAL
    // ======================================================

    window.downloadTemplateWarga =
        downloadTemplateWarga;


    window.exportDataWargaExcel =
        exportDataWargaExcel;


    window.bukaImportExcel =
        bukaImportExcel;


    window.tutupImportExcel =
        tutupImportExcel;


    window.resetImportExcel =
        resetImportExcel;


    window.prosesImportExcel =
        prosesImportExcel;


    // ======================================================
    // INIT
    // ======================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupFileInput
        );

    } else {

        setupFileInput();

    }


})();