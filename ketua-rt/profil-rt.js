/* =========================================================
SIDAT — PROFIL KETUA RT
File: ketua-rt/profil-rt.js
========================================================= */

(() => {
"use strict";

/* =====================================================
   KONFIGURASI
   ===================================================== */

const ACCESS_TOKEN_KEY = "sidat_access_token";
const ROLE_REQUIRED = "ketua_rt";

// Bucket yang SUDAH ADA di Supabase Storage
const PROFILE_BUCKET = "profile-photos";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 800;

let accessToken = "";
let currentUser = null;
let currentProfile = null;
let currentPhotoPath = null;

/* =====================================================
   ELEMENT
   ===================================================== */

const $ = (selector) => document.querySelector(selector);

const loadingProfil = $("#loadingProfil");
const profilContent = $(".profil-content");

const profilePhoto = $("#profilePhoto");
const photoLoading = $("#photoLoading");
const profileName = $("#profileName");

const photoInput = $("#photoInput");
const btnChangePhoto = $("#btnChangePhoto");

const btnChangePassword = $("#btnChangePassword");
const passwordFormCard = $("#passwordFormCard");
const btnCancelPassword = $("#btnCancelPassword");
const btnSavePassword = $("#btnSavePassword");

const newPassword = $("#newPassword");
const confirmPassword = $("#confirmPassword");

const ruleLength = $("#ruleLength");
const ruleMatch = $("#ruleMatch");

const toast = $("#toast");
const btnBack = $("#btnBack");

/* =====================================================
   SVG ICON
   ===================================================== */

const ICON_EYE = `
    <svg viewBox="0 0 24 24"
         width="20"
         height="20"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
        <circle cx="12" cy="12" r="2.5"/>
    </svg>
`;

const ICON_EYE_OFF = `
    <svg viewBox="0 0 24 24"
         width="20"
         height="20"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
        <path d="M3 3l18 18"/>
        <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-3.1 3.8"/>
        <path d="M6.2 6.8C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.3 4-.8"/>
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
    </svg>
`;

/* =====================================================
   INIT
   ===================================================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {

    console.log("[SIDAT] Profil RT mulai.");

    if (btnBack) {
        btnBack.addEventListener("click", handleBack);
    }

    setupPasswordValidation();
    setupPasswordToggles();
    setupPhotoEvents();
    setupPasswordEvents();

    await loadProfile();

}

/* =====================================================
   AUTH
   ===================================================== */

async function loadProfile() {

    try {

        accessToken =
            localStorage.getItem(ACCESS_TOKEN_KEY) || "";

        if (!accessToken) {
            redirectToLogin();
            return;
        }

        const user = await getAuthUser();

        if (!user || !user.id) {
            redirectToLogin();
            return;
        }

        currentUser = user;

        console.log(
            "[SIDAT] Auth user:",
            currentUser.id
        );

        const profile = await getProfile(user.id);

        if (!profile) {
            showError("Profil akun tidak ditemukan.");
            return;
        }

        currentProfile = profile;

        console.log(
            "[SIDAT] role halaman profil:",
            profile.role
        );

        if (profile.role !== ROLE_REQUIRED) {

            showError(
                "Akses ditolak. Halaman ini khusus Ketua RT."
            );

            return;
        }

        await loadResidentData();
        await loadAccountPhoto();

        finishLoading();

        console.log(
            "[SIDAT] Profil Ketua RT berhasil dimuat."
        );

    } catch (error) {

        console.error(
            "[SIDAT] Gagal memuat profil:",
            error
        );

        console.error(
            "[SIDAT] Detail error:",
            error?.message,
            error?.status,
            error?.statusCode,
            error?.name
        );

        showError(
            error?.message ||
            "Gagal memuat profil."
        );

    }

}

async function getAuthUser() {

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {

        throw new Error(
            "Sesi login tidak valid atau sudah berakhir."
        );

    }

    return await response.json();

}

async function getProfile(userId) {

    const url =
        `${SUPABASE_URL}/rest/v1/profiles` +
        `?select=user_id,role,resident_id` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        `&limit=1`;

    const response = await fetch(
        url,
        {
            method: "GET",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {

        throw new Error(
            "Gagal membaca profil akun."
        );

    }

    const rows = await response.json();

    return rows?.[0] || null;

}

/* =====================================================
   DATA WARGA
   ===================================================== */

async function loadResidentData() {

    profileName.textContent = "Ketua RT";

    if (
        !currentProfile ||
        !currentProfile.resident_id
    ) {
        return;
    }

    try {

        const url =
            `${SUPABASE_URL}/rest/v1/residents` +
            `?select=id,name,photo_url` +
            `&id=eq.${encodeURIComponent(
                currentProfile.resident_id
            )}` +
            `&limit=1`;

        const response = await fetch(
            url,
            {
                method: "GET",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            return;
        }

        const rows = await response.json();
        const resident = rows?.[0];

        if (resident?.name) {
            profileName.textContent =
                resident.name;
        }

    } catch (error) {

        console.warn(
            "[SIDAT] Data warga tidak dapat dimuat:",
            error
        );

    }

}

/* =====================================================
   FOTO PROFIL
   ===================================================== */

/*
   PENTING:
   Policy Storage profile-photos mensyaratkan:

   folder pertama = auth.uid()

   Maka path harus:

   UID/profile.webp

   BUKAN:

   profiles/ketua-rt/UID/profile.webp
*/

function getProfilePhotoPath() {

    if (!currentUser?.id) {
        return null;
    }

    return `${currentUser.id}/profile.webp`;

}

async function loadAccountPhoto() {

    if (!currentUser?.id) {
        setDefaultAvatar();
        return;
    }

    const path =
        getProfilePhotoPath();

    if (!path) {
        setDefaultAvatar();
        return;
    }

    currentPhotoPath = path;

    console.log(
        "[SIDAT] Mencari foto profil:",
        path
    );

    try {

        const {
            data,
            error
        } = await supabaseClient
            .storage
            .from(PROFILE_BUCKET)
            .createSignedUrl(
                path,
                60 * 60
            );

        if (error) {

            console.warn(
                "[SIDAT] Foto profil belum tersedia:",
                error.message
            );

            setDefaultAvatar();
            return;
        }

        if (data?.signedUrl) {

            profilePhoto.src =
                `${data.signedUrl}&t=${Date.now()}`;

            profilePhoto.style.display =
                "block";

            console.log(
                "[SIDAT] Foto profil berhasil dimuat."
            );

            return;
        }

    } catch (error) {

        console.warn(
            "[SIDAT] Foto profil belum tersedia:",
            error
        );

        console.warn(
            "[SIDAT] Detail foto:",
            error?.message,
            error?.status,
            error?.statusCode,
            error?.name
        );

    }

    setDefaultAvatar();

}

function setDefaultAvatar() {

    if (!profilePhoto) {
        return;
    }

    profilePhoto.src =
        getDefaultAvatar();

    profilePhoto.style.display =
        "block";

}

function getDefaultAvatar() {

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 200 200"
        >
            <rect
                width="200"
                height="200"
                rx="100"
                fill="#dcfce7"
            />

            <circle
                cx="100"
                cy="78"
                r="38"
                fill="#16a34a"
            />

            <path
                d="M38 172
                   C43 133 67 116 100 116
                   C133 116 157 133 162 172
                   Z"
                fill="#16a34a"
            />
        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );

}

/* =====================================================
   PILIH FOTO
   ===================================================== */

function setupPhotoEvents() {

    if (btnChangePhoto && photoInput) {

        btnChangePhoto.addEventListener(
            "click",
            () => {
                photoInput.click();
            }
        );

    }

    if (photoInput) {

        photoInput.addEventListener(
            "change",
            handlePhotoSelected
        );

    }

}

async function handlePhotoSelected(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    try {

        if (!file.type.startsWith("image/")) {

            showToast(
                "File harus berupa gambar.",
                "error"
            );

            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {

            showToast(
                "Ukuran foto maksimal 2 MB.",
                "error"
            );

            return;
        }

        setPhotoLoading(true);

        console.log(
            "[SIDAT] Foto dipilih:",
            file.name,
            file.type,
            file.size
        );

        const webpFile =
            await convertToWebP(file);

        console.log(
            "[SIDAT] Foto berhasil dikonversi:",
            webpFile.name,
            webpFile.type,
            webpFile.size
        );

        await uploadProfilePhoto(webpFile);

        showToast(
            "Foto profil berhasil diperbarui.",
            "success"
        );

    } catch (error) {

        console.error(
            "[SIDAT] Upload foto gagal:",
            error
        );

        console.error(
            "[SIDAT] Upload foto error detail:",
            error?.message,
            error?.status,
            error?.statusCode,
            error?.name
        );

        showToast(
            error?.message ||
            "Gagal mengganti foto profil.",
            "error"
        );

    } finally {

        setPhotoLoading(false);

        // Supaya foto yang sama tetap bisa dipilih lagi.
        event.target.value = "";

    }

}

/* =====================================================
   KONVERSI WEBP
   ===================================================== */

function convertToWebP(file) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            const objectUrl =
                URL.createObjectURL(file);

            image.onload = () => {

                try {

                    let width =
                        image.naturalWidth;

                    let height =
                        image.naturalHeight;

                    const max =
                        MAX_IMAGE_DIMENSION;

                    if (
                        width > max ||
                        height > max
                    ) {

                        const scale =
                            Math.min(
                                max / width,
                                max / height
                            );

                        width =
                            Math.round(
                                width * scale
                            );

                        height =
                            Math.round(
                                height * scale
                            );

                    }

                    const canvas =
                        document.createElement(
                            "canvas"
                        );

                    canvas.width = width;
                    canvas.height = height;

                    const ctx =
                        canvas.getContext(
                            "2d"
                        );

                    if (!ctx) {

                        URL.revokeObjectURL(
                            objectUrl
                        );

                        reject(
                            new Error(
                                "Browser tidak mendukung pemrosesan gambar."
                            )
                        );

                        return;
                    }

                    ctx.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );

                    canvas.toBlob(
                        (blob) => {

                            URL.revokeObjectURL(
                                objectUrl
                            );

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Gagal mengubah foto."
                                    )
                                );

                                return;
                            }

                            const webpFile =
                                new File(
                                    [blob],
                                    "profile.webp",
                                    {
                                        type:
                                            "image/webp"
                                    }
                                );

                            resolve(
                                webpFile
                            );

                        },
                        "image/webp",
                        0.85
                    );

                } catch (error) {

                    URL.revokeObjectURL(
                        objectUrl
                    );

                    reject(error);

                }

            };

            image.onerror = () => {

                URL.revokeObjectURL(
                    objectUrl
                );

                reject(
                    new Error(
                        "Foto tidak dapat diproses."
                    )
                );

            };

            image.src = objectUrl;

        }
    );

}

/* =====================================================
   UPLOAD FOTO
   ===================================================== */

async function uploadProfilePhoto(file) {

    if (!currentUser?.id) {

        throw new Error(
            "Akun pengguna tidak ditemukan."
        );

    }

    const path =
        getProfilePhotoPath();

    if (!path) {

        throw new Error(
            "Path foto profil tidak dapat dibuat."
        );

    }

    console.log(
        "[SIDAT] Upload foto ke:",
        PROFILE_BUCKET,
        path
    );

    const {
        data,
        error
    } = await supabaseClient
        .storage
        .from(PROFILE_BUCKET)
        .upload(
            path,
            file,
            {
                upsert: true,
                contentType: "image/webp",
                cacheControl: "3600"
            }
        );

    if (error) {

        console.error(
            "[SIDAT] Storage upload error:",
            error
        );

        throw error;
    }

    console.log(
        "[SIDAT] Upload Storage berhasil:",
        data
    );

    currentPhotoPath = path;

    /*
       Buat signed URL baru agar foto langsung
       terlihat tanpa menunggu cache browser.
    */

    const {
        data: signedData,
        error: signedError
    } = await supabaseClient
        .storage
        .from(PROFILE_BUCKET)
        .createSignedUrl(
            path,
            60 * 60
        );

    if (signedError) {

        console.warn(
            "[SIDAT] Upload berhasil tetapi signed URL gagal:",
            signedError
        );

        // Foto tetap berhasil di-upload.
        setDefaultAvatar();

        return;
    }

    if (!signedData?.signedUrl) {

        console.warn(
            "[SIDAT] Signed URL tidak tersedia."
        );

        setDefaultAvatar();

        return;
    }

    profilePhoto.src =
        `${signedData.signedUrl}&t=${Date.now()}`;

    profilePhoto.style.display =
        "block";

    console.log(
        "[SIDAT] Foto profil berhasil ditampilkan."
    );

}

function setPhotoLoading(isLoading) {

    if (photoLoading) {

        photoLoading.classList.toggle(
            "hidden",
            !isLoading
        );

    }

    if (btnChangePhoto) {

        btnChangePhoto.disabled =
            isLoading;

    }

}

/* =====================================================
   PASSWORD
   ===================================================== */

function setupPasswordEvents() {

    if (btnChangePassword) {

        btnChangePassword.addEventListener(
            "click",
            () => {

                passwordFormCard?.classList.remove(
                    "hidden"
                );

                btnChangePassword.classList.add(
                    "hidden"
                );

                newPassword?.focus();

            }
        );

    }

    if (btnCancelPassword) {

        btnCancelPassword.addEventListener(
            "click",
            resetPasswordForm
        );

    }

    if (btnSavePassword) {

        btnSavePassword.addEventListener(
            "click",
            handleChangePassword
        );

    }

}

function setupPasswordValidation() {

    if (newPassword) {

        newPassword.addEventListener(
            "input",
            updatePasswordRules
        );

    }

    if (confirmPassword) {

        confirmPassword.addEventListener(
            "input",
            updatePasswordRules
        );

    }

}

function updatePasswordRules() {

    const password =
        newPassword?.value || "";

    const confirmation =
        confirmPassword?.value || "";

    const lengthOK =
        password.length >= 6;

    const matchOK =
        password.length > 0 &&
        password === confirmation;

    updateRule(
        ruleLength,
        lengthOK
    );

    updateRule(
        ruleMatch,
        matchOK
    );

}

function updateRule(element, valid) {

    if (!element) {
        return;
    }

    element.classList.toggle(
        "valid",
        valid
    );

    const icon =
        element.querySelector(
            ".rule-icon"
        );

    if (icon) {

        icon.textContent =
            valid ? "✓" : "○";

    }

}

async function handleChangePassword() {

    const password =
        newPassword?.value || "";

    const confirmation =
        confirmPassword?.value || "";

    if (password.length < 6) {

        showToast(
            "Password minimal 6 karakter.",
            "error"
        );

        newPassword?.focus();

        return;
    }

    if (password !== confirmation) {

        showToast(
            "Konfirmasi password tidak sama.",
            "error"
        );

        confirmPassword?.focus();

        return;
    }

    if (!currentUser) {

        showToast(
            "Sesi pengguna tidak ditemukan.",
            "error"
        );

        return;
    }

    try {

        setPasswordSaving(true);

        console.log(
            "[SIDAT] Mengubah password user:",
            currentUser.id
        );

        const {
            data,
            error
        } = await supabaseClient.auth.updateUser(
            {
                password
            }
        );

        if (error) {

            console.error(
                "[SIDAT] Supabase updateUser error:",
                error
            );

            throw error;
        }

        console.log(
            "[SIDAT] Password berhasil diubah.",
            data
        );

        showToast(
            "Password berhasil diubah.",
            "success"
        );

        resetPasswordForm();

    } catch (error) {

        console.error(
            "[SIDAT] Gagal mengubah password:",
            error
        );

        console.error(
            "[SIDAT] Password error detail:",
            error?.message,
            error?.status,
            error?.statusCode,
            error?.name
        );

        showToast(
            error?.message ||
            "Gagal mengubah password.",
            "error"
        );

    } finally {

        setPasswordSaving(false);

    }

}

function resetPasswordForm() {

    if (newPassword) {
        newPassword.value = "";
    }

    if (confirmPassword) {
        confirmPassword.value = "";
    }

    updatePasswordRules();

    passwordFormCard?.classList.add(
        "hidden"
    );

    btnChangePassword?.classList.remove(
        "hidden"
    );

}

function setPasswordSaving(isSaving) {

    if (!btnSavePassword) {
        return;
    }

    btnSavePassword.disabled =
        isSaving;

    btnSavePassword.dataset.originalText ??=
        btnSavePassword.textContent;

    btnSavePassword.textContent =
        isSaving
            ? "Menyimpan..."
            : btnSavePassword.dataset.originalText;

}

/* =====================================================
   TOGGLE PASSWORD
   ===================================================== */

function setupPasswordToggles() {

    const toggleButtons =
        document.querySelectorAll(
            ".password-toggle"
        );

    toggleButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.target;

                    const input =
                        document.getElementById(
                            targetId
                        );

                    if (!input) {
                        return;
                    }

                    const visible =
                        input.type === "text";

                    input.type =
                        visible
                            ? "password"
                            : "text";

                    button.innerHTML =
                        visible
                            ? ICON_EYE
                            : ICON_EYE_OFF;

                    button.setAttribute(
                        "aria-label",
                        visible
                            ? "Tampilkan password"
                            : "Sembunyikan password"
                    );

                }
            );

        }
    );

}

/* =====================================================
   LOADING
   ===================================================== */

function finishLoading() {

    if (loadingProfil) {

        loadingProfil.classList.add(
            "hidden"
        );

    }

    if (profilContent) {

        profilContent.classList.remove(
            "hidden"
        );

    }

}

/* =====================================================
   BACK
   ===================================================== */

function handleBack() {

    window.location.assign(
        "dashboard.html"
    );

}

/* =====================================================
   LOGIN
   ===================================================== */

function redirectToLogin() {

    window.location.assign(
        "../login.html"
    );

}

/* =====================================================
   ERROR
   ===================================================== */

function showError(message) {

    if (loadingProfil) {

        loadingProfil.innerHTML = `
            <div class="loading-error">

                <div class="loading-error-icon">
                    !
                </div>

                <div class="loading-error-title">
                    Gagal Memuat Profil
                </div>

                <div class="loading-error-message">
                    ${escapeHtml(message)}
                </div>

                <button
                    type="button"
                    class="btn-primary"
                    onclick="location.reload()"
                >
                    Coba Lagi
                </button>

            </div>
        `;

    }

}

/* =====================================================
   TOAST
   ===================================================== */

let toastTimer = null;

function showToast(
    message,
    type = "success"
) {

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.className =
        `toast ${type}`;

    toast.classList.remove(
        "hidden"
    );

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(
            () => {

                toast.classList.add(
                    "hidden"
                );

            },
            3000
        );

}

/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

})();