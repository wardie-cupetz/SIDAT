// ==========================================
// SIDAT
// SISTEM INFORMASI DATA WARGA
// PROFIL WARGA
// ==========================================

"use strict";

console.log("SIDAT: profil.js mulai...");


// ==========================================
// KONFIGURASI
// ==========================================

const PROFILE_BUCKET = "profile-photos";


// ==========================================
// GLOBAL
// ==========================================

let supabaseClient = null;

let profilWarga = null;

let currentUser = null;

let fotoBaru = null;


// ==========================================
// ELEMENT HTML
// ==========================================

const loadingOverlay =
    document.getElementById("loadingOverlay");

const profilePhoto =
    document.getElementById("profilePhoto");

const photoEditButton =
    document.getElementById("photoEditButton");

const namaWarga =
    document.getElementById("namaWarga");

const kodeWarga =
    document.getElementById("kodeWarga");

const accountStatus =
    document.getElementById("accountStatus");

const nik =
    document.getElementById("nik");

const nomorKK =
    document.getElementById("nomorKK");

const namaLengkap =
    document.getElementById("namaLengkap");

const tempatLahir =
    document.getElementById("tempatLahir");

const tanggalLahir =
    document.getElementById("tanggalLahir");

const jenisKelamin =
    document.getElementById("jenisKelamin");

const statusKeluarga =
    document.getElementById("statusKeluarga");

const alamat =
    document.getElementById("alamat");

const nomorRumah =
    document.getElementById("nomorRumah");

const nomorHP =
    document.getElementById("nomorHP");

const email =
    document.getElementById("email");

const statusAkun =
    document.getElementById("statusAkun");

const akunDibuat =
    document.getElementById("akunDibuat");

const editModal =
    document.getElementById("editModal");

const editPhotoPreview =
    document.getElementById("editPhotoPreview");

const photoInput =
    document.getElementById("photoInput");

const editProfileForm =
    document.getElementById("editProfileForm");

const editPhone =
    document.getElementById("editPhone");

const editError =
    document.getElementById("editError");

const editSuccess =
    document.getElementById("editSuccess");

const saveProfileButton =
    document.getElementById("saveProfileButton");


// ==========================================
// INIT SUPABASE
// ==========================================

function initSupabase() {

    if (
        typeof supabase === "undefined"
    ) {

        throw new Error(
            "Library Supabase belum dimuat."
        );
    }


    if (
        typeof SUPABASE_URL === "undefined"
    ) {

        throw new Error(
            "SUPABASE_URL tidak ditemukan."
        );
    }


    if (
        typeof SUPABASE_KEY === "undefined"
    ) {

        throw new Error(
            "SUPABASE_KEY tidak ditemukan."
        );
    }


    supabaseClient =
        supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    console.log(
        "SIDAT: Supabase client siap."
    );
}


// ==========================================
// LOADING
// ==========================================

function tampilkanLoading() {

    if (!loadingOverlay) {
        return;
    }


    loadingOverlay.style.display =
        "flex";
}


function sembunyikanLoading() {

    if (!loadingOverlay) {
        return;
    }


    loadingOverlay.style.display =
        "none";
}


// ==========================================
// NILAI AMAN
// ==========================================

function nilaiAman(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";
    }


    return value;
}


// ==========================================
// SET TEXT
// ==========================================

function setText(element, value) {

    if (!element) {
        return;
    }


    element.textContent =
        nilaiAman(value);
}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatTanggal(value) {

    if (!value) {
        return "-";
    }


    const tanggal =
        new Date(value);


    if (
        Number.isNaN(
            tanggal.getTime()
        )
    ) {

        return value;
    }


    return tanggal.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// ==========================================
// FORMAT JENIS KELAMIN
// ==========================================

function formatGender(value) {

    if (!value) {
        return "-";
    }


    const gender =
        String(value)
            .toLowerCase()
            .trim();


    if (
        gender === "l" ||
        gender === "lk" ||
        gender === "male" ||
        gender === "laki-laki" ||
        gender === "laki laki"
    ) {

        return "Laki-laki";
    }


    if (
        gender === "p" ||
        gender === "pr" ||
        gender === "female" ||
        gender === "perempuan"
    ) {

        return "Perempuan";
    }


    return value;
}


// ==========================================
// FORMAT STATUS AKUN
// ==========================================

function formatStatusAkun(value) {

    if (
        value === true ||
        value === "true" ||
        value === 1
    ) {

        return "Aktif";
    }


    if (
        value === false ||
        value === "false" ||
        value === 0
    ) {

        return "Tidak Aktif";
    }


    if (!value) {
        return "-";
    }


    return value;
}


// ==========================================
// DEFAULT AVATAR
// ==========================================

function avatarDefault(nama) {

    const huruf =
        String(nama || "W")
            .trim()
            .charAt(0)
            .toUpperCase();


    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="300"
            height="300"
            viewBox="0 0 300 300"
        >

            <rect
                width="300"
                height="300"
                rx="150"
                fill="#15803d"
            />

            <text
                x="150"
                y="175"
                text-anchor="middle"
                font-family="Arial"
                font-size="130"
                font-weight="bold"
                fill="#ffffff"
            >
                ${huruf}
            </text>

        </svg>
    `;


    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}


// ==========================================
// AMBIL USER LOGIN
// ==========================================

async function ambilUserLogin() {

    if (!supabaseClient) {
        initSupabase();
    }


    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error) {

        throw new Error(
            "Gagal membaca sesi login: " +
            error.message
        );
    }


    if (
        !data ||
        !data.user
    ) {

        throw new Error(
            "Sesi login tidak ditemukan. Silakan login kembali."
        );
    }


    currentUser =
        data.user;


    console.log(
        "SIDAT AUTH USER:",
        currentUser.id
    );

    console.log(
        "SIDAT AUTH EMAIL:",
        currentUser.email
    );


    return currentUser;
}


// ==========================================
// AMBIL DATA RESIDENT
// ==========================================

async function ambilProfilWarga() {

    const user =
        await ambilUserLogin();


    /*
     * STRUKTUR DATABASE ANDA:
     *
     * residents.auth_id
     *
     * harus sama dengan:
     *
     * auth.uid()
     */


    const {
        data,
        error
    } =
        await supabaseClient
            .from("residents")
            .select(`
                id,
                resident_code,
                nik,
                kk_number,
                name,
                birth_place,
                birth_date,
                gender,
                address,
                house_number,
                phone,
                family_status,
                photo_url,
                jimpitan_balance,
                qr_token,
                is_active,
                created_at,
                updated_at,
                auth_email,
                account_created,
                kk,
                auth_id
            `)
            .eq(
                "auth_id",
                user.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "SIDAT residents SELECT:",
            error
        );

        throw new Error(
            "Gagal mengambil data warga: " +
            error.message
        );
    }


    if (!data) {

        throw new Error(
            "Data warga untuk akun " +
            (user.email || "") +
            " tidak ditemukan."
        );
    }


    profilWarga =
        data;


    console.log(
        "SIDAT PROFIL:",
        data
    );


    return data;
}


// ==========================================
// TAMPILKAN PROFIL
// ==========================================

function tampilkanProfil(data) {

    if (!data) {
        return;
    }


    // ======================================
    // HEADER
    // ======================================

    setText(
        namaWarga,
        data.name
    );


    setText(
        kodeWarga,
        data.resident_code
    );


    setText(
        accountStatus,
        data.is_active
            ? "Aktif"
            : "Tidak Aktif"
    );


    // ======================================
    // IDENTITAS
    // ======================================

    setText(
        nik,
        data.nik
    );


    setText(
        nomorKK,
        data.kk_number
    );


    setText(
        namaLengkap,
        data.name
    );


    setText(
        tempatLahir,
        data.birth_place
    );


    setText(
        tanggalLahir,
        formatTanggal(
            data.birth_date
        )
    );


    setText(
        jenisKelamin,
        formatGender(
            data.gender
        )
    );


    setText(
        statusKeluarga,
        data.family_status
    );


    // ======================================
    // ALAMAT
    // ======================================

    setText(
        alamat,
        data.address
    );


    setText(
        nomorRumah,
        data.house_number
    );


    setText(
        nomorHP,
        data.phone
    );


    // ======================================
    // AKUN
    // ======================================

    setText(
        email,
        data.auth_email ||
        currentUser?.email
    );


    setText(
        statusAkun,
        data.is_active
            ? "Aktif"
            : "Tidak Aktif"
    );


    setText(
        akunDibuat,
        formatTanggal(
            data.created_at
        )
    );


    // ======================================
    // FOTO
    // ======================================

    const foto =
        data.photo_url;


    if (profilePhoto) {

        profilePhoto.src =
            foto ||
            avatarDefault(
                data.name
            );
    }


    if (editPhotoPreview) {

        editPhotoPreview.src =
            foto ||
            avatarDefault(
                data.name
            );
    }


    // ======================================
    // FORM EDIT
    // ======================================

    if (editPhone) {

        editPhone.value =
            data.phone || "";
    }
}


// ==========================================
// LOAD PROFIL
// ==========================================

async function loadProfil() {

    try {

        tampilkanLoading();


        const data =
            await ambilProfilWarga();


        tampilkanProfil(
            data
        );


    } catch (error) {

        console.error(
            "SIDAT load profil:",
            error
        );


        alert(
            error.message ||
            "Gagal memuat profil."
        );


    } finally {

        sembunyikanLoading();
    }
}


// ==========================================
// PESAN FORM
// ==========================================

function bersihkanPesan() {

    if (editError) {

        editError.textContent =
            "";

        editError.classList.add(
            "hidden"
        );

        editError.style.display =
            "none";
    }


    if (editSuccess) {

        editSuccess.textContent =
            "";

        editSuccess.classList.add(
            "hidden"
        );

        editSuccess.style.display =
            "none";
    }
}


function tampilkanError(
    pesan
) {

    if (!editError) {
        return;
    }


    editError.textContent =
        pesan;


    editError.classList.remove(
        "hidden"
    );


    editError.style.display =
        "block";
}


function tampilkanSuccess(
    pesan
) {

    if (!editSuccess) {
        return;
    }


    editSuccess.textContent =
        pesan;


    editSuccess.classList.remove(
        "hidden"
    );


    editSuccess.style.display =
        "block";
}


// ==========================================
// BUKA EDIT PROFIL
// ==========================================

async function bukaEditProfil() {

    try {

        bersihkanPesan();


        const data =
            await ambilProfilWarga();


        tampilkanProfil(
            data
        );


        fotoBaru =
            null;


        if (photoInput) {

            photoInput.value =
                "";
        }


        if (editModal) {

            editModal.classList.remove(
                "hidden"
            );

            editModal.style.display =
                "flex";
        }


    } catch (error) {

        console.error(
            "SIDAT buka edit:",
            error
        );


        alert(
            error.message ||
            "Gagal membuka edit profil."
        );
    }
}


// ==========================================
// TUTUP EDIT PROFIL
// ==========================================

function tutupEditProfil() {

    bersihkanPesan();


    fotoBaru =
        null;


    if (photoInput) {

        photoInput.value =
            "";
    }


    if (editModal) {

        editModal.classList.add(
            "hidden"
        );

        editModal.style.display =
            "none";
    }
}


// ==========================================
// PILIH FOTO
// ==========================================

function handlePhotoChange(event) {

    bersihkanPesan();


    const file =
        event.target.files?.[0];


    if (!file) {

        fotoBaru =
            null;

        return;
    }


    // Maksimal sesuai HTML:
    // 2 MB

    if (
        file.size >
        2 * 1024 * 1024
    ) {

        fotoBaru =
            null;


        event.target.value =
            "";


        tampilkanError(
            "Ukuran foto maksimal 2 MB."
        );


        return;
    }


    const tipeValid =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(
            file.type
        );


    if (!tipeValid) {

        fotoBaru =
            null;


        event.target.value =
            "";


        tampilkanError(
            "Format foto harus JPG, PNG, atau WEBP."
        );


        return;
    }


    fotoBaru =
        file;


    // ======================================
    // PREVIEW
    // ======================================

    const reader =
        new FileReader();


    reader.onload =
        function () {

            if (
                editPhotoPreview
            ) {

                editPhotoPreview.src =
                    reader.result;
            }
        };


    reader.readAsDataURL(
        file
    );
}


// ==========================================
// VALIDASI NOMOR HP
// ==========================================

function validasiNomorHP(
    nomor
) {

    if (!nomor) {
        return true;
    }


    /*
     * Mengizinkan:
     * 081234567890
     * +6281234567890
     * 0812-3456-7890
     * 0812 3456 7890
     */

    return /^[0-9+\-\s()]{8,20}$/.test(
        nomor
    );
}
// ==========================================
// UPLOAD FOTO KE SUPABASE STORAGE
// BUCKET: profile-photos
// ==========================================

async function uploadFotoProfil(
    userId,
    file
) {

    if (!file) {
        return null;
    }


    // ======================================
    // TENTUKAN EXTENSION
    // ======================================

    let extension =
        "jpg";


    if (
        file.type ===
        "image/png"
    ) {

        extension =
            "png";

    } else if (
        file.type ===
        "image/webp"
    ) {

        extension =
            "webp";
    }


    // ======================================
    // NAMA FILE
    // ======================================

    const fileName =
        "profile-" +
        Date.now() +
        "." +
        extension;


    /*
     * Folder berdasarkan AUTH USER ID
     *
     * profile-photos/
     * └── auth-user-id/
     *     └── profile-xxxx.jpg
     */

    const filePath =
        userId +
        "/" +
        fileName;


    console.log(
        "SIDAT: Upload foto:",
        filePath
    );


    // ======================================
    // UPLOAD
    // ======================================

    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from(
                PROFILE_BUCKET
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",
                    upsert:
                        false,
                    contentType:
                        file.type
                }
            );


    if (error) {

        console.error(
            "SIDAT Storage Error:",
            error
        );


        throw new Error(
            "Gagal upload foto: " +
            error.message
        );
    }


    console.log(
        "SIDAT: Foto berhasil diupload:",
        data
    );


    // ======================================
    // AMBIL PUBLIC URL
    // ======================================

    const {
        data: publicData
    } =
        supabaseClient
            .storage
            .from(
                PROFILE_BUCKET
            )
            .getPublicUrl(
                filePath
            );


    if (
        !publicData ||
        !publicData.publicUrl
    ) {

        throw new Error(
            "Foto berhasil diupload tetapi URL foto tidak berhasil dibuat."
        );
    }


    return publicData.publicUrl;
}


// ==========================================
// SIMPAN PROFIL
// ==========================================

async function simpanProfil(
    event
) {

    if (event) {

        event.preventDefault();
    }


    bersihkanPesan();


    try {

        // ======================================
        // PASTIKAN SUPABASE
        // ======================================

        if (!supabaseClient) {

            initSupabase();
        }


        // ======================================
        // USER LOGIN
        // ======================================

        const user =
            await ambilUserLogin();


        console.log(
            "SIDAT UPDATE AUTH ID:",
            user.id
        );


        // ======================================
        // NOMOR HP
        // ======================================

        const nomorBaru =
            editPhone
                ? editPhone.value.trim()
                : "";


        // ======================================
        // VALIDASI NOMOR HP
        // ======================================

        if (
            !validasiNomorHP(
                nomorBaru
            )
        ) {

            tampilkanError(
                "Nomor HP tidak valid. Gunakan 8-20 karakter angka."
            );


            if (editPhone) {

                editPhone.focus();
            }


            return;
        }


        // ======================================
        // DISABLE TOMBOL
        // ======================================

        if (saveProfileButton) {

            saveProfileButton.disabled =
                true;


            saveProfileButton.dataset.oldText =
                saveProfileButton.textContent;


            saveProfileButton.textContent =
                "⏳ Menyimpan...";
        }


        // ======================================
        // FOTO LAMA
        // ======================================

        let photoUrl =
            profilWarga?.photo_url ||
            null;


        // ======================================
        // UPLOAD FOTO BARU
        // ======================================

        if (fotoBaru) {

            photoUrl =
                await uploadFotoProfil(
                    user.id,
                    fotoBaru
                );
        }


        // ======================================
        // DATA YANG BOLEH DIUBAH WARGA
        // ======================================
        //
        // HANYA:
        //
        // phone
        // photo_url
        //
        // ======================================

        const updateData = {

            phone:
                nomorBaru || null
        };


        if (
            fotoBaru &&
            photoUrl
        ) {

            updateData.photo_url =
                photoUrl;
        }


        console.log(
            "SIDAT: UPDATE residents:",
            updateData
        );


        // ======================================
        // UPDATE RESIDENTS
        // ======================================

        const {
            data,
            error
        } =
            await supabaseClient
                .from("residents")
                .update(
                    updateData
                )
                .eq(
                    "auth_id",
                    user.id
                )
                .select(`
                    id,
                    resident_code,
                    nik,
                    kk_number,
                    name,
                    birth_place,
                    birth_date,
                    gender,
                    address,
                    house_number,
                    phone,
                    family_status,
                    photo_url,
                    jimpitan_balance,
                    qr_token,
                    is_active,
                    created_at,
                    updated_at,
                    auth_email,
                    account_created,
                    kk,
                    auth_id
                `)
                .maybeSingle();


        // ======================================
        // ERROR UPDATE
        // ======================================

        if (error) {

            console.error(
                "================================"
            );

            console.error(
                "SIDAT UPDATE ERROR"
            );

            console.error(
                "message:",
                error.message
            );

            console.error(
                "details:",
                error.details
            );

            console.error(
                "hint:",
                error.hint
            );

            console.error(
                "code:",
                error.code
            );

            console.error(
                "================================"
            );


            throw new Error(
                error.message
            );
        }


        // ======================================
        // DATA TIDAK KEMBALI
        // ======================================

        if (!data) {

            throw new Error(
                "Update tidak menghasilkan data. Periksa RLS residents dan pastikan auth_id sesuai dengan akun login."
            );
        }


        // ======================================
        // UPDATE GLOBAL
        // ======================================

        profilWarga =
            data;


        // ======================================
        // TAMPILKAN DATA TERBARU
        // ======================================

        tampilkanProfil(
            data
        );


        // ======================================
        // RESET FOTO
        // ======================================

        fotoBaru =
            null;


        if (photoInput) {

            photoInput.value =
                "";
        }


        // ======================================
        // SUKSES
        // ======================================

        tampilkanSuccess(
            "✓ Profil berhasil disimpan."
        );


        console.log(
            "SIDAT: Profil berhasil disimpan."
        );


        // ======================================
        // TUTUP MODAL
        // ======================================

        setTimeout(
            function () {

                tutupEditProfil();

            },
            1000
        );


    } catch (error) {

        console.error(
            "SIDAT SIMPAN PROFIL ERROR:",
            error
        );


        /*
         * Sekarang kita tampilkan pesan error
         * ASLI dari Supabase.
         *
         * Tidak lagi otomatis menyebut
         * "RLS" jika belum tentu RLS.
         */

        tampilkanError(
            error?.message ||
            "Gagal menyimpan profil."
        );


    } finally {

        // ======================================
        // ENABLE TOMBOL
        // ======================================

        if (saveProfileButton) {

            saveProfileButton.disabled =
                false;


            saveProfileButton.textContent =
                saveProfileButton.dataset.oldText ||
                "💾 Simpan Perubahan";
        }
    }
}


// ==========================================
// KEMBALI KE DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";
}


// ==========================================
// EVENT FOTO
// ==========================================

function initPhotoEvent() {

    if (!photoInput) {

        console.warn(
            "SIDAT: photoInput tidak ditemukan."
        );

        return;
    }


    if (
        photoInput.dataset.initialized ===
        "true"
    ) {

        return;
    }


    photoInput.addEventListener(
        "change",
        handlePhotoChange
    );


    photoInput.dataset.initialized =
        "true";
}


// ==========================================
// EVENT FORM
// ==========================================

function initFormEvent() {

    if (!editProfileForm) {

        console.warn(
            "SIDAT: editProfileForm tidak ditemukan."
        );

        return;
    }


    if (
        editProfileForm.dataset.initialized ===
        "true"
    ) {

        return;
    }


    editProfileForm.addEventListener(
        "submit",
        simpanProfil
    );


    editProfileForm.dataset.initialized =
        "true";
}


// ==========================================
// EVENT MODAL
// ==========================================

function initModalEvent() {

    if (!editModal) {
        return;
    }


    if (
        editModal.dataset.initialized ===
        "true"
    ) {

        return;
    }


    // ======================================
    // KLIK BACKDROP
    // ======================================

    editModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                editModal
            ) {

                tutupEditProfil();
            }
        }
    );


    // ======================================
    // ESC
    // ======================================

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                if (
                    !editModal.classList.contains(
                        "hidden"
                    )
                ) {

                    tutupEditProfil();
                }
            }
        }
    );


    editModal.dataset.initialized =
        "true";
}


// ==========================================
// INIT
// ==========================================

async function initProfil() {

    console.log(
        "SIDAT: init profil..."
    );


    try {

        // ======================================
        // INIT SUPABASE
        // ======================================

        initSupabase();


        // ======================================
        // PASANG EVENT
        // ======================================

        initPhotoEvent();

        initFormEvent();

        initModalEvent();


        // ======================================
        // LOAD DATA
        // ======================================

        await loadProfil();


        console.log(
            "SIDAT: profil siap digunakan."
        );


    } catch (error) {

        console.error(
            "SIDAT INIT ERROR:",
            error
        );


        sembunyikanLoading();


        alert(
            error?.message ||
            "Gagal menginisialisasi halaman profil."
        );
    }
}

// ==========================================
// GANTI PIN
// ==========================================

function bukaGantiPIN() {

    const modal =
        document.getElementById(
            "pinModal"
        );

    const pinBaru =
        document.getElementById(
            "pinBaru"
        );

    const pinKonfirmasi =
        document.getElementById(
            "pinKonfirmasi"
        );

    const pinError =
        document.getElementById(
            "pinError"
        );

    const pinSuccess =
        document.getElementById(
            "pinSuccess"
        );


    if (!modal) {

        console.error(
            "SIDAT: Modal Ganti PIN tidak ditemukan."
        );

        return;
    }


    if (pinBaru) {

        pinBaru.value = "";

    }


    if (pinKonfirmasi) {

        pinKonfirmasi.value = "";

    }


    if (pinError) {

        pinError.textContent = "";

        pinError.classList.add(
            "hidden"
        );

    }


    if (pinSuccess) {

        pinSuccess.textContent = "";

        pinSuccess.classList.add(
            "hidden"
        );

    }


    modal.classList.remove(
        "hidden"
    );


    setTimeout(
        function () {

            if (pinBaru) {

                pinBaru.focus();

            }

        },
        100
    );

}


// ==========================================
// TUTUP GANTI PIN
// ==========================================

function tutupGantiPIN() {

    const modal =
        document.getElementById(
            "pinModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// PESAN ERROR PIN
// ==========================================

function tampilkanErrorPIN(
    pesan
) {

    const error =
        document.getElementById(
            "pinError"
        );


    const success =
        document.getElementById(
            "pinSuccess"
        );


    if (success) {

        success.textContent = "";

        success.classList.add(
            "hidden"
        );

    }


    if (error) {

        error.textContent =
            pesan;

        error.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// PESAN SUKSES PIN
// ==========================================

function tampilkanSuccessPIN(
    pesan
) {

    const error =
        document.getElementById(
            "pinError"
        );


    const success =
        document.getElementById(
            "pinSuccess"
        );


    if (error) {

        error.textContent = "";

        error.classList.add(
            "hidden"
        );

    }


    if (success) {

        success.textContent =
            pesan;

        success.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// SIMPAN PIN BARU
// ==========================================

async function simpanPINBaru(
    event
) {

    event.preventDefault();


    const pinBaru =
        document.getElementById(
            "pinBaru"
        );


    const pinKonfirmasi =
        document.getElementById(
            "pinKonfirmasi"
        );


    const tombol =
        document.getElementById(
            "savePinButton"
        );


    const nilaiPin =
        pinBaru
            ? pinBaru.value.trim()
            : "";


    const nilaiKonfirmasi =
        pinKonfirmasi
            ? pinKonfirmasi.value.trim()
            : "";


    tampilkanSuccessPIN("");


    // ======================================
    // VALIDASI PIN
    // ======================================

    if (
        !/^\d{4,6}$/.test(
            nilaiPin
        )
    ) {

        tampilkanErrorPIN(
            "PIN harus terdiri dari 4-6 digit angka."
        );

        if (pinBaru) {

            pinBaru.focus();

        }

        return;
    }


    // ======================================
    // KONFIRMASI
    // ======================================

    if (
        nilaiPin !==
        nilaiKonfirmasi
    ) {

        tampilkanErrorPIN(
            "Konfirmasi PIN tidak sama dengan PIN baru."
        );

        if (pinKonfirmasi) {

            pinKonfirmasi.focus();

        }

        return;
    }


    try {

        // ======================================
        // PASTIKAN SUPABASE
        // ======================================

        if (!supabaseClient) {

            initSupabase();

        }


        // ======================================
        // CEK USER LOGIN
        // ======================================

        const user =
            await ambilUserLogin();


        if (
            !user ||
            !user.id
        ) {

            throw new Error(
                "Sesi login tidak ditemukan. Silakan login kembali."
            );

        }


        console.log(
            "SIDAT: Mengubah PIN user:",
            user.id
        );


        // ======================================
        // DISABLE TOMBOL
        // ======================================

        if (tombol) {

            tombol.disabled =
                true;

            tombol.dataset.oldText =
                tombol.textContent;

            tombol.textContent =
                "⏳ Menyimpan...";

        }


        // ======================================
        // UPDATE PASSWORD SUPABASE AUTH
        // ======================================

        const {
            data,
            error
        } =
            await supabaseClient.auth.updateUser(
                {
                    password:
                        nilaiPin
                }
            );


        if (error) {

            console.error(
                "SIDAT GANTI PIN ERROR:",
                error
            );

            throw error;

        }


        console.log(
            "SIDAT: PIN berhasil diubah.",
            data
        );


        // ======================================
        // SUKSES
        // ======================================

        tampilkanSuccessPIN(
            "✓ PIN berhasil diubah. PIN baru sudah dapat digunakan untuk login."
        );


        if (pinBaru) {

            pinBaru.value = "";

        }


        if (pinKonfirmasi) {

            pinKonfirmasi.value = "";

        }


        // ======================================
        // TUTUP MODAL
        // ======================================

        setTimeout(
            function () {

                tutupGantiPIN();

            },
            1500
        );


    } catch (error) {

        console.error(
            "SIDAT SIMPAN PIN ERROR:",
            error
        );


        tampilkanErrorPIN(
            error?.message ||
            "Gagal mengubah PIN."
        );


    } finally {

        // ======================================
        // ENABLE TOMBOL
        // ======================================

        if (tombol) {

            tombol.disabled =
                false;

            tombol.textContent =
                tombol.dataset.oldText ||
                "🔐 Simpan PIN";

        }

    }

}


// ==========================================
// EVENT FORM GANTI PIN
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "changePinForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                simpanPINBaru
            );

        }

    }
);


// ==========================================
// EXPORT
// ==========================================

window.bukaGantiPIN =
    bukaGantiPIN;

window.tutupGantiPIN =
    tutupGantiPIN;

window.simpanPINBaru =
    simpanPINBaru;
    
    
// ==========================================
// EXPORT
// ==========================================

window.bukaEditProfil =
    bukaEditProfil;


window.tutupEditProfil =
    tutupEditProfil;


window.simpanProfil =
    simpanProfil;


window.kembaliDashboard =
    kembaliDashboard;


window.handlePhotoChange =
    handlePhotoChange;


window.loadProfil =
    loadProfil;


window.tampilkanProfil =
    tampilkanProfil;


// ==========================================
// START
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initProfil
    );

} else {

    initProfil();
}


// ==========================================
// SELESAI
// ==========================================

console.log(
    "SIDAT: profil.js selesai dimuat."
);
