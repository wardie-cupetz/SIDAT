// ==========================================
// SIDAT
// PENGATURAN ADMIN
// Dibuat oleh Suwardi
// BAGIAN 1
// ==========================================


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


// ==========================================
// REDIRECT JIKA BELUM LOGIN
// ==========================================

if (!accessToken) {

    window.location.href =
        "../index.html";

}


// ==========================================
// SUPABASE CLIENT
// ==========================================

let sidatSupabase = null;


// ==========================================
// DATA GLOBAL
// ==========================================

let dataWilayah = null;

let userProfile = null;

let logoFileBaru = null;


// ==========================================
// ELEMENT
// ==========================================

const formPengaturan =
    document.getElementById(
        "settingsForm"
    );

const loadingState =
    document.getElementById(
        "loadingState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const formError =
    document.getElementById(
        "formError"
    );

const formSuccess =
    document.getElementById(
        "formSuccess"
    );


// ==========================================
// HELPER ELEMENT
// ==========================================

function el(id) {

    return document.getElementById(id);

}


// ==========================================
// INIT SUPABASE
// ==========================================

function pastikanSupabase() {

    // ======================================
    // SUDAH ADA
    // ======================================

    if (
        sidatSupabase
    ) {

        return sidatSupabase;

    }


    // ======================================
    // CEK LIBRARY
    // ======================================

    if (
        typeof supabase ===
        "undefined"
    ) {

        throw new Error(
            "Library Supabase belum dimuat."
        );

    }


    // ======================================
    // CEK CONFIG
    // ======================================

    if (
        typeof SUPABASE_URL ===
        "undefined" ||
        typeof SUPABASE_KEY ===
        "undefined"
    ) {

        throw new Error(
            "Konfigurasi Supabase tidak ditemukan."
        );

    }


    // ======================================
    // BUAT CLIENT
    // ======================================

    sidatSupabase =
        supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    console.log(
        "SIDAT: Supabase client pengaturan siap."
    );


    return sidatSupabase;

}


// ==========================================
// PESAN ERROR
// ==========================================

function tampilkanError(
    message
) {

    const pesan =
        message ||
        "Terjadi kesalahan.";


    // ======================================
    // FORM ERROR
    // ======================================

    if (formError) {

        formError.textContent =
            pesan;

        formError.classList.remove(
            "hidden"
        );

    }


    // ======================================
    // ERROR LOADING
    // ======================================

    if (errorMessage) {

        errorMessage.textContent =
            pesan;

    }


    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

    }


    // ======================================
    // HIDE SUCCESS
    // ======================================

    if (formSuccess) {

        formSuccess.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// PESAN SUKSES
// ==========================================

function tampilkanSuccess(
    message
) {

    const pesan =
        message ||
        "Pengaturan berhasil disimpan.";


    console.log(
        "SIDAT SUCCESS:",
        pesan
    );


    // ======================================
    // FORM SUCCESS
    // ======================================

    if (formSuccess) {

        formSuccess.textContent =
            pesan;

        formSuccess.classList.remove(
            "hidden"
        );

    }


    // ======================================
    // HIDE ERROR
    // ======================================

    if (formError) {

        formError.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// BERSIHKAN PESAN
// ==========================================

function bersihkanPesan() {

    if (formError) {

        formError.textContent =
            "";

        formError.classList.add(
            "hidden"
        );

    }


    if (formSuccess) {

        formSuccess.textContent =
            "";

        formSuccess.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// LOADING
// ==========================================

function tampilkanLoading(
    tampil
) {

    if (loadingState) {

        if (tampil) {

            loadingState.classList.remove(
                "hidden"
            );

        } else {

            loadingState.classList.add(
                "hidden"
            );

        }

    }


    // ======================================
    // FORM
    // ======================================

    if (formPengaturan) {

        if (tampil) {

            formPengaturan.classList.add(
                "hidden"
            );

        } else {

            formPengaturan.classList.remove(
                "hidden"
            );

        }

    }

}


// ==========================================
// AMBIL USER LOGIN
// ==========================================

async function ambilUserLogin() {

    const client =
        pastikanSupabase();


    // ======================================
    // COBA SESSION SUPABASE
    // ======================================

    const {
        data: sessionData,
        error: sessionError
    } =
        await client.auth.getSession();


    if (
        !sessionError &&
        sessionData?.session?.user
    ) {

        const user =
            sessionData.session.user;


        console.log(
            "SIDAT USER SESSION:",
            user.id
        );


        return user;

    }


    // ======================================
    // FALLBACK ACCESS TOKEN
    // ======================================

    const token =
        localStorage.getItem(
            "sidat_access_token"
        );


    if (!token) {

        throw new Error(
            "Sesi login tidak ditemukan."
        );

    }


    const response =
        await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {

                method:
                    "GET",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${token}`

                }

            }
        );


    if (!response.ok) {

        const text =
            await response.text();


        console.error(
            "SIDAT AUTH USER ERROR:",
            text
        );


        throw new Error(
            "Sesi login tidak valid."
        );

    }


    const user =
        await response.json();


    if (
        !user ||
        !user.id
    ) {

        throw new Error(
            "Data user login tidak ditemukan."
        );

    }


    console.log(
        "SIDAT USER TOKEN:",
        user.id
    );


    return user;

}


// ==========================================
// CEK ADMIN
// ==========================================

async function cekAdmin() {

    const client =
        pastikanSupabase();


    const user =
        await ambilUserLogin();


    console.log(
        "SIDAT CEK ADMIN USER:",
        user.id
    );


    const {
        data,
        error
    } =
        await client
            .from("profiles")
            .select(
                "id,user_id,role,resident_id"
            )
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "SIDAT PROFILE ERROR:",
            error
        );


        throw new Error(
            error.message
        );

    }


    if (!data) {

        throw new Error(
            "Profil akun tidak ditemukan."
        );

    }


    userProfile =
        data;


    console.log(
        "SIDAT PROFILE:",
        data
    );


    const role =
        String(
            data.role || ""
        )
        .trim()
        .toLowerCase();


    if (
        role !== "admin" &&
        role !== "administrator"
    ) {

        throw new Error(
            "Halaman pengaturan hanya dapat digunakan oleh admin."
        );

    }


    console.log(
        "SIDAT: Admin terverifikasi."
    );


    return true;

}


// ==========================================
// AMBIL DATA WILAYAH
// ==========================================

async function muatPengaturan() {

    console.log(
        "SIDAT: Mulai muat pengaturan..."
    );


    tampilkanLoading(
        true
    );


    bersihkanPesan();


    try {

        const client =
            pastikanSupabase();


        await cekAdmin();


        // ======================================
        // AMBIL SATU DATA WILAYAH
        // ======================================

        const {
            data,
            error
        } =
            await client
                .from("wilayah")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                )
                .limit(1)
                .maybeSingle();


        if (error) {

            console.error(
                "SIDAT WILAYAH ERROR:",
                error
            );


            throw new Error(
                error.message
            );

        }


        console.log(
            "SIDAT DATA WILAYAH:",
            data
        );


        // ======================================
        // DATA DITEMUKAN
        // ======================================

        if (data) {

            dataWilayah =
                data;


            isiForm(
                data
            );


            console.log(
                "SIDAT: Pengaturan wilayah berhasil dimuat."
            );

        }


        // ======================================
        // BELUM ADA DATA
        // ======================================

        else {

            dataWilayah =
                null;


            isiFormKosong();


            console.log(
                "SIDAT: Data wilayah belum ada."
            );

        }


    } catch (error) {

        console.error(
            "SIDAT MUAT PENGATURAN ERROR:",
            error
        );


        tampilkanError(
            error?.message ||
            "Gagal memuat pengaturan."
        );


    } finally {

        tampilkanLoading(
            false
        );

    }

}


// ==========================================
// ISI FORM
// ==========================================

function isiForm(
    data
) {

    if (!data) {

        isiFormKosong();

        return;

    }


    setValue(
        "namaAplikasi",
        data.nama_aplikasi
    );


    setValue(
        "namaDusun",
        data.nama_dusun
    );


    setValue(
        "namaDesa",
        data.nama_desa
    );


    setValue(
        "rt",
        data.rt
    );


    setValue(
        "rw",
        data.rw
    );


    setValue(
        "namaKetuaRT",
        data.nama_ketua_rt
    );


    setValue(
        "kecamatan",
        data.kecamatan
    );


    setValue(
        "kabupaten",
        data.kabupaten
    );


    setValue(
        "provinsi",
        data.provinsi
    );


    setValue(
        "warnaTema",
        data.warna_tema ||
        "#15803d"
    );


    // ======================================
    // LOGO
    // ======================================

    const logoInput =
        el(
            "logoInput"
        );


    if (logoInput) {

        logoInput.value =
            "";

    }


    logoFileBaru =
        null;


    tampilkanPreviewLogo(
        data.logo_url
    );


    updateWarnaUI(
        data.warna_tema ||
        "#15803d"
    );

}


// ==========================================
// FORM KOSONG
// ==========================================

function isiFormKosong() {

    setValue(
        "namaAplikasi",
        "SIDAT"
    );


    setValue(
        "namaDusun",
        ""
    );


    setValue(
        "namaDesa",
        ""
    );


    setValue(
        "rt",
        ""
    );


    setValue(
        "rw",
        ""
    );


    setValue(
        "namaKetuaRT",
        ""
    );


    setValue(
        "kecamatan",
        ""
    );


    setValue(
        "kabupaten",
        ""
    );


    setValue(
        "provinsi",
        "Jawa Tengah"
    );


    setValue(
        "warnaTema",
        "#15803d"
    );


    logoFileBaru =
        null;


    tampilkanPreviewLogo(
        null
    );


    updateWarnaUI(
        "#15803d"
    );

}
// ==========================================
// SIDAT
// PENGATURAN ADMIN
// BAGIAN 2
// ==========================================


// ==========================================
// SET VALUE
// ==========================================

function setValue(
    id,
    value
) {

    const element =
        el(id);


    if (!element) {

        console.warn(
            "SIDAT: Element tidak ditemukan:",
            id
        );

        return;

    }


    element.value =
        value == null
            ? ""
            : value;

}


// ==========================================
// GET VALUE
// ==========================================

function getValue(
    id
) {

    const element =
        el(id);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


// ==========================================
// VALIDASI WARNA
// ==========================================

function validasiWarna(
    warna
) {

    const value =
        String(
            warna || ""
        ).trim();


    if (
        /^#[0-9A-Fa-f]{6}$/
            .test(value)
    ) {

        return value;

    }


    return null;

}


// ==========================================
// UPDATE UI WARNA
// ==========================================

function updateWarnaUI(
    warna
) {

    const warnaValid =
        validasiWarna(
            warna
        ) ||
        "#15803d";


    // ======================================
    // COLOR INPUT
    // ======================================

    const colorInput =
        el(
            "warnaTema"
        );


    if (colorInput) {

        colorInput.value =
            warnaValid;

    }


    // ======================================
    // PREVIEW WARNA
    // ======================================

    const warnaPreview =
        el(
            "warnaPreview"
        );


    if (warnaPreview) {

        warnaPreview.style.backgroundColor =
            warnaValid;

    }


    // ======================================
    // TEXT WARNA
    // ======================================

    const warnaText =
        el(
            "warnaText"
        );


    if (warnaText) {

        warnaText.textContent =
            warnaValid.toUpperCase();

    }


    // ======================================
    // THEME COLOR
    // ======================================

    document.documentElement
        .style
        .setProperty(
            "--primary-color",
            warnaValid
        );


    document.documentElement
        .style
        .setProperty(
            "--theme-color",
            warnaValid
        );

}


// ==========================================
// PREVIEW LOGO
// ==========================================

function tampilkanPreviewLogo(
    logoUrl
) {

    const logoPreview =
        el(
            "logoPreview"
        );


    const logoPlaceholder =
        el(
            "logoPlaceholder"
        );


    if (!logoPreview) {

        return;

    }


    if (logoUrl) {

        logoPreview.src =
            logoUrl;


        logoPreview.classList.remove(
            "hidden"
        );


        if (logoPlaceholder) {

            logoPlaceholder.classList.add(
                "hidden"
            );

        }


        logoPreview.onerror =
            function () {

                console.warn(
                    "SIDAT: Logo tidak dapat dimuat."
                );


                logoPreview.classList.add(
                    "hidden"
                );


                if (logoPlaceholder) {

                    logoPlaceholder.classList.remove(
                        "hidden"
                    );

                }

            };

    } else {

        logoPreview.removeAttribute(
            "src"
        );


        logoPreview.classList.add(
            "hidden"
        );


        if (logoPlaceholder) {

            logoPlaceholder.classList.remove(
                "hidden"
            );

        }

    }

}


// ==========================================
// PREVIEW LOGO FILE
// ==========================================

function previewLogo() {

    const input =
        el(
            "logoInput"
        );


    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        return;

    }


    const file =
        input.files[0];


    // ======================================
    // VALIDASI TIPE
    // ======================================

    const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        tampilkanError(
            "Format logo harus JPG, PNG, atau WEBP."
        );


        input.value =
            "";


        return;

    }


    // ======================================
    // VALIDASI UKURAN
    // ======================================

    const maxSize =
        2 * 1024 * 1024;


    if (
        file.size >
        maxSize
    ) {

        tampilkanError(
            "Ukuran logo maksimal 2 MB."
        );


        input.value =
            "";


        return;

    }


    logoFileBaru =
        file;


    // ======================================
    // PREVIEW
    // ======================================

    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            tampilkanPreviewLogo(
                event.target.result
            );

        };


    reader.readAsDataURL(
        file
    );


    bersihkanPesan();

}


// ==========================================
// UPLOAD LOGO
// ==========================================

async function uploadLogo(
    file
) {

    if (!file) {

        return null;

    }


    const client =
        pastikanSupabase();


    // ======================================
    // NAMA FILE
    // ======================================

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const namaFile =
        `logo-rt-${Date.now()}.${extension}`;


    const filePath =
        `wilayah/${namaFile}`;


    console.log(
        "SIDAT: Upload logo:",
        filePath
    );


    // ======================================
    // BUCKET
    // ======================================
    //
    // Bucket yang digunakan:
    // sidat
    //
    // Jika bucket Anda berbeda,
    // ubah satu nama ini saja.
    //
    // ======================================

    const bucket =
        "sidat";


    const {
        error: uploadError
    } =
        await client.storage
            .from(bucket)
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        true,

                    contentType:
                        file.type
                }
            );


    if (uploadError) {

        console.error(
            "SIDAT UPLOAD LOGO ERROR:",
            uploadError
        );


        throw new Error(
            "Gagal upload logo: " +
            uploadError.message
        );

    }


    const {
        data
    } =
        client.storage
            .from(bucket)
            .getPublicUrl(
                filePath
            );


    const publicUrl =
        data?.publicUrl;


    if (!publicUrl) {

        throw new Error(
            "URL logo tidak berhasil dibuat."
        );

    }


    console.log(
        "SIDAT LOGO URL:",
        publicUrl
    );


    return publicUrl;

}


// ==========================================
// SIMPAN PENGATURAN
// ==========================================

async function simpanPengaturan(
    event
) {

    if (event) {

        event.preventDefault();

    }


    console.log(
        "SIDAT: Mulai simpan pengaturan..."
    );


    bersihkanPesan();


    const saveButton =
        el(
            "saveButton"
        );


    const oldText =
        saveButton
            ? saveButton.textContent
            : "";


    try {

        const client =
            pastikanSupabase();


        // ======================================
        // CEK ADMIN
        // ======================================

        await cekAdmin();


        // ======================================
        // AMBIL FORM
        // ======================================

        const namaAplikasi =
            getValue(
                "namaAplikasi"
            ) ||
            "SIDAT";


        const namaDusun =
            getValue(
                "namaDusun"
            );


        const namaDesa =
            getValue(
                "namaDesa"
            );


        const rt =
            getValue(
                "rt"
            );


        const rw =
            getValue(
                "rw"
            );


        const namaKetuaRT =
            getValue(
                "namaKetuaRT"
            );


        const kecamatan =
            getValue(
                "kecamatan"
            );


        const kabupaten =
            getValue(
                "kabupaten"
            );


        const provinsi =
            getValue(
                "provinsi"
            );


        const warnaTema =
            validasiWarna(
                getValue(
                    "warnaTema"
                )
            );


        if (!warnaTema) {

            throw new Error(
                "Warna tema tidak valid."
            );

        }


        // ======================================
        // DISABLE BUTTON
        // ======================================

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "⏳ Menyimpan...";

        }


        // ======================================
        // UPLOAD LOGO JIKA ADA
        // ======================================

        let logoUrl =
            dataWilayah?.logo_url ||
            null;


        if (logoFileBaru) {

            logoUrl =
                await uploadLogo(
                    logoFileBaru
                );

        }


        // ======================================
        // DATA
        // ======================================

        const updateData = {

            nama_aplikasi:
                namaAplikasi,

            nama_dusun:
                namaDusun ||
                null,

            nama_desa:
                namaDesa ||
                null,

            rt:
                rt ||
                null,

            rw:
                rw ||
                null,

            nama_ketua_rt:
                namaKetuaRT ||
                null,

            kecamatan:
                kecamatan ||
                null,

            kabupaten:
                kabupaten ||
                null,

            provinsi:
                provinsi ||
                null,

            logo_url:
                logoUrl,

            warna_tema:
                warnaTema,

            updated_at:
                new Date()
                    .toISOString()

        };


        console.log(
            "SIDAT DATA SIMPAN:",
            updateData
        );


        let result;


        // ======================================
        // UPDATE
        // ======================================

        if (
            dataWilayah &&
            dataWilayah.id
        ) {

            result =
                await client
                    .from("wilayah")
                    .update(
                        updateData
                    )
                    .eq(
                        "id",
                        dataWilayah.id
                    )
                    .select()
                    .maybeSingle();

        }


        // ======================================
        // INSERT
        // ======================================

        else {

            result =
                await client
                    .from("wilayah")
                    .insert(
                        updateData
                    )
                    .select()
                    .single();

        }


        // ======================================
        // CEK ERROR
        // ======================================

        if (result.error) {

            console.error(
                "SIDAT SIMPAN WILAYAH ERROR:",
                result.error
            );


            throw new Error(
                result.error.message
            );

        }


        if (!result.data) {

            throw new Error(
                "Data pengaturan tidak dikembalikan setelah disimpan."
            );

        }


        // ======================================
        // UPDATE GLOBAL
        // ======================================

        dataWilayah =
            result.data;


        logoFileBaru =
            null;


        // ======================================
        // TAMPILKAN DATA
        // ======================================

        isiForm(
            result.data
        );


        // ======================================
        // UPDATE TEMA
        // ======================================

        updateWarnaUI(
            result.data.warna_tema
        );


        // ======================================
        // PESAN SUKSES
        // ======================================

        tampilkanSuccess(
            "✓ Pengaturan berhasil disimpan."
        );


        // ======================================
        // NOTIFIKASI HALAMAN LAIN
        // ======================================

        try {

            localStorage.setItem(
                "sidat_wilayah_updated",
                Date.now().toString()
            );


            localStorage.setItem(
                "sidat_wilayah_data",
                JSON.stringify(
                    result.data
                )
            );

        } catch (storageError) {

            console.warn(
                "SIDAT STORAGE WARNING:",
                storageError
            );

        }


        console.log(
            "SIDAT: Pengaturan berhasil disimpan:",
            result.data
        );


    } catch (error) {

        console.error(
            "SIDAT SIMPAN PENGATURAN ERROR:",
            error
        );


        tampilkanError(
            error?.message ||
            "Gagal menyimpan pengaturan."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                oldText ||
                "💾 Simpan Pengaturan";

        }

    }

}


// ==========================================
// EVENT WARNA
// ==========================================

function ubahWarnaTema(
    value
) {

    const warna =
        validasiWarna(
            value
        );


    if (!warna) {

        return;

    }


    setValue(
        "warnaTema",
        warna
    );


    updateWarnaUI(
        warna
    );

}


// ==========================================
// RESET
// ==========================================

function resetPengaturan() {

    if (
        !confirm(
            "Batalkan perubahan yang belum disimpan?"
        )
    ) {

        return;

    }


    bersihkanPesan();


    if (dataWilayah) {

        isiForm(
            dataWilayah
        );

    } else {

        isiFormKosong();

    }

}


// ==========================================
// KEMBALI DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// EVENT FORM
// ==========================================

if (formPengaturan) {

    formPengaturan.addEventListener(
        "submit",
        simpanPengaturan
    );

}


// ==========================================
// EVENT LOGO
// ==========================================

const logoInput =
    el(
        "logoInput"
    );


if (logoInput) {

    logoInput.addEventListener(
        "change",
        previewLogo
    );

}


// ==========================================
// EVENT WARNA
// ==========================================

const warnaInput =
    el(
        "warnaTema"
    );


if (warnaInput) {

    warnaInput.addEventListener(
        "input",
        function () {

            ubahWarnaTema(
                this.value
            );

        }
    );

}


// ==========================================
// EXPORT FUNCTION
// ==========================================

window.muatPengaturan =
    muatPengaturan;


window.simpanPengaturan =
    simpanPengaturan;


window.resetPengaturan =
    resetPengaturan;


window.kembaliDashboard =
    kembaliDashboard;


window.previewLogo =
    previewLogo;


window.ubahWarnaTema =
    ubahWarnaTema;


window.updateWarnaUI =
    updateWarnaUI;


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SIDAT: Pengaturan admin dimulai..."
        );


        muatPengaturan();

    }
);