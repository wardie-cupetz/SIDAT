/* =========================================================
   SIDAT - PROFIL WARGA
   Versi final mobile / APK
   ========================================================= */

"use strict";

console.log("SIDAT: profil.js mulai...");


/* =========================================================
   KONFIGURASI
   ========================================================= */

const PROFILE_BUCKET = "profile-photos";
const SESSION_STORAGE_KEY = "sidat_access_token";


/* =========================================================
   GLOBAL
   ========================================================= */

let supabaseClient = null;
let profilWarga = null;
let currentUser = null;
let fotoBaru = null;


/* =========================================================
   ELEMENT
   ========================================================= */

const loadingOverlay = document.getElementById("loadingOverlay");

const profilePhoto = document.getElementById("profilePhoto");
const namaWarga = document.getElementById("namaWarga");
const kodeWarga = document.getElementById("kodeWarga");
const accountStatus = document.getElementById("accountStatus");

const namaLengkap = document.getElementById("namaLengkap");
const tempatLahir = document.getElementById("tempatLahir");
const tanggalLahir = document.getElementById("tanggalLahir");
const jenisKelamin = document.getElementById("jenisKelamin");
const statusKeluarga = document.getElementById("statusKeluarga");

const alamat = document.getElementById("alamat");
const nomorRumah = document.getElementById("nomorRumah");
const nomorHP = document.getElementById("nomorHP");

const email = document.getElementById("email");
const statusAkun = document.getElementById("statusAkun");
const akunDibuat = document.getElementById("akunDibuat");

const editModal = document.getElementById("editModal");
const editPhotoPreview = document.getElementById("editPhotoPreview");
const photoInput = document.getElementById("photoInput");
const editProfileForm = document.getElementById("editProfileForm");
const editPhone = document.getElementById("editPhone");

const editError = document.getElementById("editError");
const editSuccess = document.getElementById("editSuccess");
const saveProfileButton = document.getElementById("saveProfileButton");

const pinModal = document.getElementById("pinModal");
const changePinForm = document.getElementById("changePinForm");
const pinBaru = document.getElementById("pinBaru");
const pinKonfirmasi = document.getElementById("pinKonfirmasi");
const pinError = document.getElementById("pinError");
const pinSuccess = document.getElementById("pinSuccess");
const savePinButton = document.getElementById("savePinButton");


/* =========================================================
   INIT SUPABASE
   ========================================================= */

function initSupabase() {

    if (typeof supabase === "undefined") {
        throw new Error("Library Supabase belum dimuat.");
    }

    if (typeof SUPABASE_URL === "undefined") {
        throw new Error("SUPABASE_URL tidak ditemukan.");
    }

    if (typeof SUPABASE_KEY === "undefined") {
        throw new Error("SUPABASE_KEY tidak ditemukan.");
    }

    supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("SIDAT: Supabase client siap.");
}


/* =========================================================
   SESSION
   ========================================================= */

async function getValidSession() {

    if (!supabaseClient) {
        initSupabase();
    }

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        throw new Error(
            "Gagal membaca sesi login: " +
            error.message
        );
    }

    let session = data?.session || null;

    if (!session) {
        throw new Error(
            "Sesi login tidak ditemukan. Silakan login kembali."
        );
    }

    const expiresAt =
        Number(session.expires_at || 0);

    const now =
        Math.floor(Date.now() / 1000);

    if (
        expiresAt &&
        expiresAt - now < 60
    ) {

        const {
            data: refreshed,
            error: refreshError
        } = await supabaseClient.auth.refreshSession();

        if (refreshError) {
            throw new Error(
                "Sesi login telah berakhir. Silakan login kembali."
            );
        }

        session =
            refreshed?.session || null;
    }

    if (!session?.access_token) {
        throw new Error(
            "Token login tidak tersedia."
        );
    }

    localStorage.setItem(
        SESSION_STORAGE_KEY,
        session.access_token
    );

    currentUser =
        session.user || null;

    return session;
}


/* =========================================================
   USER LOGIN
   ========================================================= */

async function ambilUserLogin() {

    const session =
        await getValidSession();

    if (!session?.user) {
        throw new Error(
            "Sesi login tidak ditemukan."
        );
    }

    currentUser =
        session.user;

    return currentUser;
}


/* =========================================================
   LOADING
   ========================================================= */

function tampilkanLoading() {

    if (loadingOverlay) {
        loadingOverlay.style.display = "flex";
    }
}


function sembunyikanLoading() {

    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    }
}


/* =========================================================
   HELPER
   ========================================================= */

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


function setText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        nilaiAman(value);
}


/* =========================================================
   FORMAT TANGGAL
   ========================================================= */

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


/* =========================================================
   FORMAT GENDER
   ========================================================= */

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


/* =========================================================
   AVATAR DEFAULT
   ========================================================= */

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
            >${huruf}</text>
        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}


/* =========================================================
   AMBIL PROFIL RESIDENT
   ========================================================= */

async function ambilProfilWarga() {

    const user =
        await ambilUserLogin();

    const {
        data,
        error
    } = await supabaseClient
        .from("residents")
        .select(`
            id,
            resident_code,
            name,
            birth_place,
            birth_date,
            gender,
            address,
            house_number,
            phone,
            family_status,
            photo_url,
            is_active,
            created_at,
            auth_email,
            account_created,
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

    return data;
}


/* =========================================================
   TAMPILKAN PROFIL
   ========================================================= */

function tampilkanProfil(data) {

    if (!data) {
        return;
    }

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
        formatTanggal(data.birth_date)
    );

    setText(
        jenisKelamin,
        formatGender(data.gender)
    );

    setText(
        statusKeluarga,
        data.family_status
    );

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
        formatTanggal(data.created_at)
    );

    const foto =
        data.photo_url ||
        avatarDefault(data.name);

    if (profilePhoto) {
        profilePhoto.src = foto;
    }

    if (editPhotoPreview) {
        editPhotoPreview.src = foto;
    }

    if (editPhone) {
        editPhone.value =
            data.phone || "";
    }
}


/* =========================================================
   LOAD PROFIL
   ========================================================= */

async function loadProfil() {

    try {

        tampilkanLoading();

        const data =
            await ambilProfilWarga();

        tampilkanProfil(data);

    } catch (error) {

        console.error(
            "SIDAT load profil:",
            error
        );

        localStorage.removeItem(
            SESSION_STORAGE_KEY
        );

        alert(
            error?.message ||
            "Gagal memuat profil."
        );

    } finally {

        sembunyikanLoading();
    }
}


/* =========================================================
   PESAN EDIT PROFIL
   ========================================================= */

function bersihkanPesan() {

    if (editError) {

        editError.textContent = "";

        editError.classList.add(
            "hidden"
        );
    }

    if (editSuccess) {

        editSuccess.textContent = "";

        editSuccess.classList.add(
            "hidden"
        );
    }
}


function tampilkanError(pesan) {

    if (!editError) {
        return;
    }

    editError.textContent =
        pesan;

    editError.classList.remove(
        "hidden"
    );
}


function tampilkanSuccess(pesan) {

    if (!editSuccess) {
        return;
    }

    editSuccess.textContent =
        pesan;

    editSuccess.classList.remove(
        "hidden"
    );
}


/* =========================================================
   EDIT PROFIL
   ========================================================= */

async function bukaEditProfil() {

    try {

        bersihkanPesan();

        const data =
            await ambilProfilWarga();

        tampilkanProfil(data);

        fotoBaru = null;

        if (photoInput) {
            photoInput.value = "";
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
            error?.message ||
            "Gagal membuka edit profil."
        );
    }
}


function tutupEditProfil() {

    bersihkanPesan();

    fotoBaru = null;

    if (photoInput) {
        photoInput.value = "";
    }

    if (editModal) {

        editModal.classList.add(
            "hidden"
        );

        editModal.style.display =
            "none";
    }
}


/* =========================================================
   FOTO
   ========================================================= */

function handlePhotoChange(event) {

    bersihkanPesan();

    const file =
        event.target.files?.[0];

    if (!file) {

        fotoBaru = null;

        return;
    }

    if (
        file.size >
        2 * 1024 * 1024
    ) {

        fotoBaru = null;

        event.target.value = "";

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
        ].includes(file.type);

    if (!tipeValid) {

        fotoBaru = null;

        event.target.value = "";

        tampilkanError(
            "Format foto harus JPG, PNG, atau WEBP."
        );

        return;
    }

    fotoBaru =
        file;

    const reader =
        new FileReader();

    reader.onload =
        function () {

            if (editPhotoPreview) {
                editPhotoPreview.src =
                    reader.result;
            }
        };

    reader.readAsDataURL(file);
}


/* =========================================================
   VALIDASI NOMOR HP
   ========================================================= */

function validasiNomorHP(nomor) {

    if (!nomor) {
        return true;
    }

    return /^[0-9+\-\s()]{8,20}$/.test(
        nomor
    );
}


/* =========================================================
   UPLOAD FOTO
   ========================================================= */

async function uploadFotoProfil(
    userId,
    file
) {

    if (!file) {
        return null;
    }

    let extension =
        "jpg";

    if (file.type === "image/png") {
        extension = "png";
    } else if (
        file.type === "image/webp"
    ) {
        extension = "webp";
    }

    const fileName =
        "profile-" +
        Date.now() +
        "." +
        extension;

    const filePath =
        userId +
        "/" +
        fileName;

    const {
        data,
        error
    } = await supabaseClient
        .storage
        .from(PROFILE_BUCKET)
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
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

    const {
        data: publicData
    } = supabaseClient
        .storage
        .from(PROFILE_BUCKET)
        .getPublicUrl(filePath);

    if (
        !publicData?.publicUrl
    ) {

        throw new Error(
            "URL foto tidak berhasil dibuat."
        );
    }

    return publicData.publicUrl;
}


/* =========================================================
   SIMPAN PROFIL
   ========================================================= */

async function simpanProfil(event) {

    if (event) {
        event.preventDefault();
    }

    bersihkanPesan();

    try {

        const user =
            await ambilUserLogin();

        const nomorBaru =
            editPhone
                ? editPhone.value.trim()
                : "";

        if (
            !validasiNomorHP(
                nomorBaru
            )
        ) {

            tampilkanError(
                "Nomor HP tidak valid."
            );

            editPhone?.focus();

            return;
        }

        if (saveProfileButton) {

            saveProfileButton.disabled =
                true;

            saveProfileButton.dataset.oldText =
                saveProfileButton.textContent;

            saveProfileButton.textContent =
                "Menyimpan...";
        }

        let photoUrl =
            profilWarga?.photo_url ||
            null;

        if (fotoBaru) {

            photoUrl =
                await uploadFotoProfil(
                    user.id,
                    fotoBaru
                );
        }

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

        const {
            data,
            error
        } = await supabaseClient
            .from("residents")
            .update(updateData)
            .eq(
                "auth_id",
                user.id
            )
            .select(`
                id,
                resident_code,
                name,
                birth_place,
                birth_date,
                gender,
                address,
                house_number,
                phone,
                family_status,
                photo_url,
                is_active,
                created_at,
                auth_email,
                account_created,
                auth_id
            `)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {

            throw new Error(
                "Profil tidak berhasil diperbarui."
            );
        }

        profilWarga =
            data;

        tampilkanProfil(data);

        fotoBaru = null;

        if (photoInput) {
            photoInput.value = "";
        }

        tampilkanSuccess(
            "Profil berhasil disimpan."
        );

        setTimeout(
            tutupEditProfil,
            900
        );

    } catch (error) {

        console.error(
            "SIDAT SIMPAN PROFIL:",
            error
        );

        tampilkanError(
            error?.message ||
            "Gagal menyimpan profil."
        );

    } finally {

        if (saveProfileButton) {

            saveProfileButton.disabled =
                false;

            saveProfileButton.textContent =
                saveProfileButton.dataset.oldText ||
                "Simpan Perubahan";
        }
    }
}


/* =========================================================
   GANTI PIN
   ========================================================= */

function bukaGantiPIN() {

    if (!pinModal) {
        return;
    }

    pinBaru.value = "";
    pinKonfirmasi.value = "";

    pinError.textContent = "";
    pinSuccess.textContent = "";

    pinError.classList.add("hidden");
    pinSuccess.classList.add("hidden");

    pinModal.classList.remove("hidden");
    pinModal.style.display = "flex";

    setTimeout(
        () => pinBaru?.focus(),
        100
    );
}


function tutupGantiPIN() {

    if (!pinModal) {
        return;
    }

    pinModal.classList.add("hidden");
    pinModal.style.display = "none";
}


function tampilkanErrorPIN(pesan) {

    if (!pinError) {
        return;
    }

    pinSuccess.textContent = "";

    pinSuccess.classList.add(
        "hidden"
    );

    pinError.textContent =
        pesan;

    pinError.classList.remove(
        "hidden"
    );
}


function tampilkanSuccessPIN(pesan) {

    if (!pinSuccess) {
        return;
    }

    pinError.textContent = "";

    pinError.classList.add(
        "hidden"
    );

    pinSuccess.textContent =
        pesan;

    pinSuccess.classList.remove(
        "hidden"
    );
}


async function simpanPINBaru(event) {

    event.preventDefault();

    const nilaiPin =
        pinBaru?.value.trim() || "";

    const nilaiKonfirmasi =
        pinKonfirmasi?.value.trim() || "";

    pinError.classList.add(
        "hidden"
    );

    pinSuccess.classList.add(
        "hidden"
    );

    if (
        !/^\d{4,6}$/.test(
            nilaiPin
        )
    ) {

        tampilkanErrorPIN(
            "PIN harus terdiri dari 4-6 digit angka."
        );

        pinBaru?.focus();

        return;
    }

    if (
        nilaiPin !==
        nilaiKonfirmasi
    ) {

        tampilkanErrorPIN(
            "Konfirmasi PIN tidak sama."
        );

        pinKonfirmasi?.focus();

        return;
    }

    try {

        if (!supabaseClient) {
            initSupabase();
        }

        await ambilUserLogin();

        if (savePinButton) {

            savePinButton.disabled =
                true;

            savePinButton.dataset.oldText =
                savePinButton.textContent;

            savePinButton.textContent =
                "Menyimpan...";
        }

        const {
            error
        } = await supabaseClient.auth.updateUser({
            password:
                nilaiPin
        });

        if (error) {
            throw error;
        }

        tampilkanSuccessPIN(
            "PIN berhasil diubah."
        );

        pinBaru.value = "";
        pinKonfirmasi.value = "";

        setTimeout(
            tutupGantiPIN,
            1200
        );

    } catch (error) {

        console.error(
            "SIDAT GANTI PIN:",
            error
        );

        tampilkanErrorPIN(
            error?.message ||
            "Gagal mengubah PIN."
        );

    } finally {

        if (savePinButton) {

            savePinButton.disabled =
                false;

            savePinButton.textContent =
                savePinButton.dataset.oldText ||
                "Simpan PIN";
        }
    }
}


/* =========================================================
   KEMBALI
   ========================================================= */

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";
}
/* =========================================================
   LOGOUT
========================================================= */

async function sidatLogout() {

    const konfirmasi =
        confirm(
            "Keluar dari akun?\n\n" +
            "Anda akan keluar dari akun SIDAT."
        );

    if (!konfirmasi) {
        return;
    }

    try {

        tampilkanLoading();

        if (!supabaseClient) {
            initSupabase();
        }

        /*
         * Logout dari Supabase Auth.
         */
        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {

            console.error(
                "SIDAT LOGOUT:",
                error
            );

            throw error;
        }

        /*
         * Bersihkan token akses SIDAT
         * tanpa menghapus data offline lainnya.
         */
        localStorage.removeItem(
            SESSION_STORAGE_KEY
        );

        /*
         * Kembali ke halaman login.
         */
        window.location.replace(
            "../index.html"
        );

    } catch (error) {

        console.error(
            "SIDAT LOGOUT ERROR:",
            error
        );

        /*
         * Jika session Supabase sudah tidak valid,
         * token lokal tetap dibersihkan.
         */
        localStorage.removeItem(
            SESSION_STORAGE_KEY
        );

        alert(
            "Sesi telah dikeluarkan. " +
            "Silakan login kembali."
        );

        window.location.replace(
            "../index.html"
        );

    } finally {

        sembunyikanLoading();

    }
}

/* =========================================================
   EVENT
   ========================================================= */

function initEvents() {

    photoInput?.addEventListener(
        "change",
        handlePhotoChange
    );

    editProfileForm?.addEventListener(
        "submit",
        simpanProfil
    );

    changePinForm?.addEventListener(
        "submit",
        simpanPINBaru
    );

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            if (
                editModal &&
                !editModal.classList.contains(
                    "hidden"
                )
            ) {
                tutupEditProfil();
            }

            if (
                pinModal &&
                !pinModal.classList.contains(
                    "hidden"
                )
            ) {
                tutupGantiPIN();
            }
        }
    );
}


/* =========================================================
   INIT
   ========================================================= */

async function initProfil() {

    try {

        tampilkanLoading();

        initSupabase();

        initEvents();

        await loadProfil();

    } catch (error) {

        console.error(
            "SIDAT INIT PROFIL:",
            error
        );

        alert(
            error?.message ||
            "Gagal menginisialisasi profil."
        );

    } finally {

        sembunyikanLoading();
    }
}


/* =========================================================
   EXPORT
   ========================================================= */

window.bukaEditProfil =
    bukaEditProfil;

window.tutupEditProfil =
    tutupEditProfil;

window.simpanProfil =
    simpanProfil;

window.handlePhotoChange =
    handlePhotoChange;

window.loadProfil =
    loadProfil;

window.tampilkanProfil =
    tampilkanProfil;

window.bukaGantiPIN =
    bukaGantiPIN;

window.tutupGantiPIN =
    tutupGantiPIN;

window.simpanPINBaru =
    simpanPINBaru;

window.kembaliDashboard =
    kembaliDashboard;

window.sidatLogout =
    sidatLogout;


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initProfil
    );

} else {

    initProfil();
}


console.log(
    "SIDAT: profil.js selesai dimuat."
);