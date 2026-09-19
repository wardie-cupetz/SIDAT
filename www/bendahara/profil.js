/* =========================================================
   SIDAT - PROFIL BENDAHARA
   File: bendahara/profil.js

   Fungsi:
   1. Validasi session & role BENDAHARA
   2. Memuat profil akun
   3. Memuat foto profil
   4. Ganti foto profil
   5. Ganti password
   6. Toast notification
   7. Tombol kembali ke dashboard

   Bucket Supabase:
   profile-photos

   Path foto:
   {auth.uid()}/profile.webp
   ========================================================= */

(() => {
    "use strict";

    const ROLE = "bendahara";
    const ROLE_LABEL = "BENDAHARA";
    const PHOTO_BUCKET = "profile-photos";

    const ACCESS_TOKEN_KEY = "sidat_access_token";

    let currentUser = null;
    let currentProfile = null;

    const $ = (id) => {
        return document.getElementById(id);
    };


    /* =========================================================
       INIT
    ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            console.log(
                "[SIDAT] DOMContentLoaded Profil Bendahara."
            );

            initProfil();
        }
    );


    async function initProfil() {

        try {

            console.log(
                "[SIDAT] Memulai Profil Bendahara..."
            );


            /* -------------------------------------------------
               CEK SUPABASE CLIENT
            ------------------------------------------------- */

            if (!window.supabaseClient) {

                throw new Error(
                    "Supabase client belum tersedia."
                );
            }


            console.log(
                "[SIDAT] Supabase client tersedia."
            );


            /* -------------------------------------------------
               EVENT
            ------------------------------------------------- */

            bindEvents();


            /* -------------------------------------------------
               SESSION
            ------------------------------------------------- */

            await validateSession();


            /* -------------------------------------------------
               PROFILE
            ------------------------------------------------- */

            await loadProfile();


            /* -------------------------------------------------
               FOTO
            ------------------------------------------------- */

            await loadProfilePhoto();


            /* -------------------------------------------------
               TAMPILKAN KONTEN
            ------------------------------------------------- */

            showProfileContent();


            console.log(
                "[SIDAT] Profil Bendahara berhasil dimuat."
            );

        } catch (error) {

            console.error(
                "[SIDAT] Gagal memuat profil:",
                error
            );


            console.error(
                "[SIDAT] Error message:",
                error?.message
            );


            console.error(
                "[SIDAT] Error name:",
                error?.name
            );


            console.error(
                "[SIDAT] Error stack:",
                error?.stack
            );


            showError(
                getErrorMessage(
                    error,
                    "Gagal memuat profil Bendahara."
                )
            );
        }
    }


    /* =========================================================
       EVENT
    ========================================================= */

    function bindEvents() {

        const photoInput =
            $("photoInput");

        const btnChangePhoto =
            $("btnChangePhoto");

        const btnChangePassword =
            $("btnChangePassword");

        const btnCancelPassword =
            $("btnCancelPassword");

        const btnSavePassword =
            $("btnSavePassword");

        const btnBack =
            $("btnBack");


        /* -------------------------------------------------
           FOTO
        ------------------------------------------------- */

        if (btnChangePhoto) {

            btnChangePhoto.addEventListener(
                "click",
                () => {

                    if (photoInput) {
                        photoInput.click();
                    }
                }
            );
        }


        if (photoInput) {

            photoInput.addEventListener(
                "change",
                handlePhotoSelected
            );
        }


        /* -------------------------------------------------
           PASSWORD
        ------------------------------------------------- */

        if (btnChangePassword) {

            btnChangePassword.addEventListener(
                "click",
                openPasswordForm
            );
        }


        if (btnCancelPassword) {

            btnCancelPassword.addEventListener(
                "click",
                closePasswordForm
            );
        }


        if (btnSavePassword) {

            btnSavePassword.addEventListener(
                "click",
                changePassword
            );
        }


        /* -------------------------------------------------
           BACK
        ------------------------------------------------- */

        if (btnBack) {

            btnBack.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "dashboard.html";
                }
            );
        }


        /* -------------------------------------------------
           PASSWORD VALIDATION
        ------------------------------------------------- */

        const newPassword =
            $("newPassword");

        const confirmPassword =
            $("confirmPassword");


        if (newPassword) {

            newPassword.addEventListener(
                "input",
                validatePasswordForm
            );
        }


        if (confirmPassword) {

            confirmPassword.addEventListener(
                "input",
                validatePasswordForm
            );
        }
    }


    /* =========================================================
       SESSION
    ========================================================= */

    async function validateSession() {

        console.log(
            "[SIDAT] Memeriksa session..."
        );


        let session = null;


        /* -------------------------------------------------
           1. Coba getSession
        ------------------------------------------------- */

        try {

            const result =
                await window.supabaseClient.auth.getSession();


            if (result.error) {

                console.error(
                    "[SIDAT] getSession error:",
                    result.error
                );

            } else {

                session =
                    result.data?.session || null;
            }

        } catch (error) {

            console.error(
                "[SIDAT] getSession exception:",
                error
            );
        }


        /* -------------------------------------------------
           2. Jika session tersedia
        ------------------------------------------------- */

        if (
            session?.user
        ) {

            currentUser =
                session.user;


            console.log(
                "[SIDAT] Session ditemukan:",
                currentUser.id,
                currentUser.email
            );


            saveSessionTokens(
                session
            );


            return;
        }


        /* -------------------------------------------------
           3. Fallback menggunakan access token
        ------------------------------------------------- */

        const accessToken =
            localStorage.getItem(
                ACCESS_TOKEN_KEY
            );


        console.log(
            "[SIDAT] Access token lokal:",
            accessToken
                ? "TERSEDIA"
                : "TIDAK ADA"
        );


        if (accessToken) {

            try {

                const userResult =
                    await window.supabaseClient.auth.getUser(
                        accessToken
                    );


                if (
                    userResult.error
                ) {

                    console.error(
                        "[SIDAT] getUser error:",
                        userResult.error
                    );

                } else if (
                    userResult.data?.user
                ) {

                    currentUser =
                        userResult.data.user;


                    console.log(
                        "[SIDAT] User dari access token:",
                        currentUser.id,
                        currentUser.email
                    );


                    return;
                }

            } catch (error) {

                console.error(
                    "[SIDAT] getUser exception:",
                    error
                );
            }
        }


        /* -------------------------------------------------
           4. Tidak ada session
        ------------------------------------------------- */

        throw new Error(
            "Sesi login tidak ditemukan. Silakan login kembali."
        );
    }


    function saveSessionTokens(session) {

        if (
            session?.access_token
        ) {

            localStorage.setItem(
                ACCESS_TOKEN_KEY,
                session.access_token
            );
        }


        if (
            session?.refresh_token
        ) {

            localStorage.setItem(
                "sidat_refresh_token",
                session.refresh_token
            );
        }
    }


    /* =========================================================
       LOAD PROFILE
    ========================================================= */

    async function loadProfile() {

        console.log(
            "[SIDAT] Mengambil profile Bendahara..."
        );


        if (!currentUser?.id) {

            throw new Error(
                "User login tidak tersedia."
            );
        }


        const result =
            await window.supabaseClient
                .from("profiles")
                .select(
                    "user_id, role, resident_id"
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (result.error) {

            console.error(
                "[SIDAT] Query profiles gagal:",
                result.error
            );


            throw new Error(
                result.error.message ||
                "Gagal mengambil data profil akun."
            );
        }


        if (!result.data) {

            throw new Error(
                "Data profil akun tidak ditemukan."
            );
        }


        currentProfile =
            result.data;


        console.log(
            "[SIDAT] Profile:",
            currentProfile
        );


        /* -------------------------------------------------
           VALIDASI ROLE
        ------------------------------------------------- */

        if (
            currentProfile.role !== ROLE
        ) {

            throw new Error(
                `Role akun tidak sesuai. Role saat ini: ${currentProfile.role}`
            );
        }


        console.log(
            "[SIDAT] Role tervalidasi:",
            currentProfile.role
        );


        /* -------------------------------------------------
           NAMA DEFAULT
        ------------------------------------------------- */

        let displayName =
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email ||
            "Bendahara";


        /* -------------------------------------------------
           JIKA TERHUBUNG KE RESIDENT
        ------------------------------------------------- */

        if (
            currentProfile.resident_id
        ) {

            try {

                const residentResult =
                    await window.supabaseClient
                        .from("residents")
                        .select("name")
                        .eq(
                            "id",
                            currentProfile.resident_id
                        )
                        .maybeSingle();


                if (
                    !residentResult.error &&
                    residentResult.data?.name
                ) {

                    displayName =
                        residentResult.data.name;
                }

            } catch (error) {

                console.warn(
                    "[SIDAT] Nama resident tidak dapat dimuat:",
                    error
                );
            }
        }


        /* -------------------------------------------------
           ISI HTML
        ------------------------------------------------- */

        const profileName =
            $("profileName");


        if (profileName) {

            profileName.textContent =
                displayName;
        }


        const profileRole =
            document.querySelector(
                ".profile-role"
            );


        if (profileRole) {

            profileRole.textContent =
                ROLE_LABEL;
        }


        const profileEmail =
            $("profileEmail");


        if (profileEmail) {

            profileEmail.textContent =
                currentUser.email || "";
        }


        console.log(
            "[SIDAT] Nama profil:",
            displayName
        );
    }


    /* =========================================================
       LOAD PROFILE PHOTO
    ========================================================= */

    async function loadProfilePhoto() {

        const profilePhoto =
            $("profilePhoto");


        if (
            !profilePhoto ||
            !currentUser
        ) {

            return;
        }


        const photoPath =
            `${currentUser.id}/profile.webp`;


        console.log(
            "[SIDAT] Memeriksa foto:",
            photoPath
        );


        try {

            const publicResult =
                window.supabaseClient
                    .storage
                    .from(PHOTO_BUCKET)
                    .getPublicUrl(
                        photoPath
                    );


            const publicUrl =
                publicResult.data?.publicUrl;


            if (!publicUrl) {

                setDefaultPhoto();

                hidePhotoLoading();

                return;
            }


            profilePhoto.onload = () => {

                hidePhotoLoading();
            };


            profilePhoto.onerror = () => {

                hidePhotoLoading();

                console.log(
                    "[SIDAT] Foto profil belum tersedia."
                );


                setDefaultPhoto();
            };


            profilePhoto.src =
                `${publicUrl}?t=${Date.now()}`;

        } catch (error) {

            console.warn(
                "[SIDAT] Gagal memuat foto:",
                error
            );


            hidePhotoLoading();

            setDefaultPhoto();
        }
    }


    /* =========================================================
       PHOTO SELECTED
    ========================================================= */

    async function handlePhotoSelected(event) {

        const file =
            event.target.files?.[0];


        event.target.value = "";


        if (!file) {
            return;
        }


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

            showToast(
                "Foto harus JPG, PNG, atau WEBP.",
                "error"
            );

            return;
        }


        const maxSize =
            2 * 1024 * 1024;


        if (
            file.size > maxSize
        ) {

            showToast(
                "Ukuran foto maksimal 2 MB.",
                "error"
            );

            return;
        }


        if (!currentUser) {

            showToast(
                "Sesi login tidak tersedia.",
                "error"
            );

            return;
        }


        try {

            showPhotoLoading();


            const previewUrl =
                URL.createObjectURL(file);


            const profilePhoto =
                $("profilePhoto");


            if (profilePhoto) {

                profilePhoto.src =
                    previewUrl;
            }


            const webpBlob =
                await convertToWebP(file);


            if (!webpBlob) {

                throw new Error(
                    "Foto tidak dapat diproses."
                );
            }


            const photoPath =
                `${currentUser.id}/profile.webp`;


            const uploadResult =
                await window.supabaseClient
                    .storage
                    .from(PHOTO_BUCKET)
                    .upload(
                        photoPath,
                        webpBlob,
                        {
                            cacheControl: "3600",
                            contentType:
                                "image/webp",
                            upsert: true
                        }
                    );


            if (
                uploadResult.error
            ) {

                throw uploadResult.error;
            }


            console.log(
                "[SIDAT] Foto berhasil diupload:",
                photoPath
            );


            const publicResult =
                window.supabaseClient
                    .storage
                    .from(PHOTO_BUCKET)
                    .getPublicUrl(
                        photoPath
                    );


            const publicUrl =
                publicResult.data?.publicUrl;


            if (
                publicUrl &&
                profilePhoto
            ) {

                profilePhoto.src =
                    `${publicUrl}?t=${Date.now()}`;
            }


            hidePhotoLoading();


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
                "[SIDAT] Upload error message:",
                error?.message
            );


            hidePhotoLoading();


            showToast(
                getErrorMessage(
                    error,
                    "Gagal mengganti foto profil."
                ),
                "error"
            );
        }
    }


    /* =========================================================
       CONVERT IMAGE TO WEBP
    ========================================================= */

    function convertToWebP(file) {

        return new Promise(
            (resolve, reject) => {

                const image =
                    new Image();


                const objectUrl =
                    URL.createObjectURL(file);


                image.onload = () => {

                    URL.revokeObjectURL(
                        objectUrl
                    );


                    try {

                        const maxDimension =
                            1200;


                        let width =
                            image.naturalWidth;

                        let height =
                            image.naturalHeight;


                        if (
                            width >
                                maxDimension ||
                            height >
                                maxDimension
                        ) {

                            if (
                                width >
                                height
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        (
                                            maxDimension /
                                            width
                                        )
                                    );

                                width =
                                    maxDimension;

                            } else {

                                width =
                                    Math.round(
                                        width *
                                        (
                                            maxDimension /
                                            height
                                        )
                                    );

                                height =
                                    maxDimension;
                            }
                        }


                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            width;

                        canvas.height =
                            height;


                        const ctx =
                            canvas.getContext(
                                "2d"
                            );


                        if (!ctx) {

                            reject(
                                new Error(
                                    "Browser tidak mendukung pemrosesan gambar."
                                )
                            );

                            return;
                        }


                        ctx.fillStyle =
                            "#ffffff";


                        ctx.fillRect(
                            0,
                            0,
                            width,
                            height
                        );


                        ctx.drawImage(
                            image,
                            0,
                            0,
                            width,
                            height
                        );


                        canvas.toBlob(
                            (blob) => {

                                if (!blob) {

                                    reject(
                                        new Error(
                                            "Gagal mengubah foto menjadi WEBP."
                                        )
                                    );

                                    return;
                                }


                                resolve(blob);
                            },
                            "image/webp",
                            0.85
                        );

                    } catch (error) {

                        reject(error);
                    }
                };


                image.onerror = () => {

                    URL.revokeObjectURL(
                        objectUrl
                    );


                    reject(
                        new Error(
                            "File gambar tidak dapat dibaca."
                        )
                    );
                };


                image.src =
                    objectUrl;
            }
        );
    }


    /* =========================================================
       PASSWORD FORM
    ========================================================= */

    function openPasswordForm() {

        const card =
            $("passwordFormCard");


        if (!card) {
            return;
        }


        card.classList.remove(
            "hidden"
        );


        card.hidden = false;


        card.style.display =
            "block";


        const newPassword =
            $("newPassword");


        const confirmPassword =
            $("confirmPassword");


        if (newPassword) {

            newPassword.value = "";
        }


        if (confirmPassword) {

            confirmPassword.value = "";
        }


        resetPasswordRules();


        if (newPassword) {

            newPassword.focus();
        }
    }


    function closePasswordForm() {

        const card =
            $("passwordFormCard");


        if (card) {

            card.classList.add(
                "hidden"
            );

            card.hidden = true;

            card.style.display =
                "none";
        }


        const newPassword =
            $("newPassword");


        const confirmPassword =
            $("confirmPassword");


        if (newPassword) {

            newPassword.value = "";
        }


        if (confirmPassword) {

            confirmPassword.value = "";
        }


        resetPasswordRules();
    }


    /* =========================================================
       PASSWORD VALIDATION
    ========================================================= */

    function validatePasswordForm() {

        const newPassword =
            $("newPassword")?.value || "";


        const confirmPassword =
            $("confirmPassword")?.value || "";


        const ruleLength =
            $("ruleLength");


        const ruleMatch =
            $("ruleMatch");


        const btnSavePassword =
            $("btnSavePassword");


        const lengthValid =
            newPassword.length >= 6;


        const matchValid =
            confirmPassword.length > 0 &&
            newPassword ===
                confirmPassword;


        if (ruleLength) {

            ruleLength.classList.toggle(
                "valid",
                lengthValid
            );
        }


        if (ruleMatch) {

            ruleMatch.classList.toggle(
                "valid",
                matchValid
            );
        }


        if (btnSavePassword) {

            btnSavePassword.disabled =
                !(
                    lengthValid &&
                    matchValid
                );
        }


        return {
            lengthValid,
            matchValid
        };
    }


    function resetPasswordRules() {

        const ruleLength =
            $("ruleLength");


        const ruleMatch =
            $("ruleMatch");


        const btnSavePassword =
            $("btnSavePassword");


        if (ruleLength) {

            ruleLength.classList.remove(
                "valid"
            );
        }


        if (ruleMatch) {

            ruleMatch.classList.remove(
                "valid"
            );
        }


        if (btnSavePassword) {

            btnSavePassword.disabled =
                true;
        }
    }


    /* =========================================================
       CHANGE PASSWORD
    ========================================================= */

    async function changePassword() {

        const newPassword =
            $("newPassword")?.value || "";


        const confirmPassword =
            $("confirmPassword")?.value || "";


        const validation =
            validatePasswordForm();


        if (
            !validation.lengthValid
        ) {

            showToast(
                "Password minimal 6 karakter.",
                "error"
            );

            return;
        }


        if (
            !validation.matchValid
        ) {

            showToast(
                "Konfirmasi password tidak sama.",
                "error"
            );

            return;
        }


        const btnSavePassword =
            $("btnSavePassword");


        const originalText =
            btnSavePassword?.textContent ||
            "Simpan Password";


        try {

            if (btnSavePassword) {

                btnSavePassword.disabled =
                    true;

                btnSavePassword.textContent =
                    "Menyimpan...";
            }


            const result =
                await window.supabaseClient
                    .auth
                    .updateUser({
                        password:
                            newPassword
                    });


            if (
                result.error
            ) {

                throw result.error;
            }


            console.log(
                "[SIDAT] Password berhasil diperbarui."
            );


            closePasswordForm();


            showToast(
                "Password berhasil diperbarui.",
                "success"
            );


        } catch (error) {

            console.error(
                "[SIDAT] Ganti password gagal:",
                error
            );


            showToast(
                getErrorMessage(
                    error,
                    "Gagal mengganti password."
                ),
                "error"
            );


        } finally {

            if (btnSavePassword) {

                btnSavePassword.textContent =
                    originalText;

                validatePasswordForm();
            }
        }
    }


    /* =========================================================
       PHOTO LOADING
    ========================================================= */

    function showPhotoLoading() {

        const loading =
            $("photoLoading");


        if (loading) {

            loading.classList.remove(
                "hidden"
            );

            loading.hidden = false;

            loading.style.display =
                "flex";
        }
    }


    function hidePhotoLoading() {

        const loading =
            $("photoLoading");


        if (loading) {

            loading.classList.add(
                "hidden"
            );

            loading.hidden = true;

            loading.style.display =
                "none";
        }
    }


    /* =========================================================
       DEFAULT PHOTO
    ========================================================= */

    function setDefaultPhoto() {

        const profilePhoto =
            $("profilePhoto");


        if (!profilePhoto) {
            return;
        }


        const svg = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 120 120"
            >
                <rect
                    width="120"
                    height="120"
                    rx="60"
                    fill="#e5e7eb"
                />

                <circle
                    cx="60"
                    cy="43"
                    r="21"
                    fill="#9ca3af"
                />

                <path
                    d="M24 101c4-21 18-32 36-32s32 11 36 32"
                    fill="#9ca3af"
                />
            </svg>
        `;


        profilePhoto.src =
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg);
    }


    /* =========================================================
       PROFILE CONTENT
    ========================================================= */

    function showProfileContent() {

        const loading =
            $("loadingProfil");


        const content =
            $("profilContent");


        console.log(
            "[SIDAT] Menampilkan konten profil..."
        );


        /* -------------------------------------------------
           LOADING
        ------------------------------------------------- */

        if (loading) {

            loading.classList.add(
                "hidden"
            );

            loading.hidden = true;

            loading.style.display =
                "none";
        }


        /* -------------------------------------------------
           CONTENT
        ------------------------------------------------- */

        if (content) {

            content.classList.remove(
                "hidden"
            );

            content.hidden = false;


            /*
             * Paksa tampil.
             */
            content.style.display =
                "block";


            console.log(
                "[SIDAT] profilContent DISPLAY:",
                getComputedStyle(content).display
            );

        } else {

            console.error(
                "[SIDAT] ERROR: #profilContent tidak ditemukan!"
            );
        }
    }


    /* =========================================================
       ERROR
    ========================================================= */

    function showError(message) {

        const loading =
            $("loadingProfil");


        const content =
            $("profilContent");


        if (loading) {

            loading.classList.add(
                "hidden"
            );

            loading.hidden = true;

            loading.style.display =
                "none";
        }


        if (content) {

            content.classList.remove(
                "hidden"
            );

            content.hidden = false;

            content.style.display =
                "block";
        }


        console.error(
            "[SIDAT] Menampilkan error:",
            message
        );


        showToast(
            message,
            "error"
        );
    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        message,
        type = "success"
    ) {

        const toast =
            $("toast");


        if (!toast) {

            console.log(
                `[SIDAT ${type}]`,
                message
            );

            return;
        }


        toast.textContent =
            message;


        toast.className =
            "toast";


        toast.classList.add(
            type
        );


        toast.hidden = false;


        clearTimeout(
            showToast._timer
        );


        showToast._timer =
            setTimeout(
                () => {

                    toast.hidden =
                        true;

                },
                3500
            );
    }


    /* =========================================================
       ERROR MESSAGE
    ========================================================= */

    function getErrorMessage(
        error,
        fallback
    ) {

        if (!error) {
            return fallback;
        }


        const message =
            error.message ||
            error.error_description ||
            error.msg ||
            String(error);


        if (!message) {
            return fallback;
        }


        const lower =
            message.toLowerCase();


        if (
            lower.includes(
                "password should be at least"
            )
        ) {

            return "Password minimal 6 karakter.";
        }


        if (
            lower.includes(
                "same password"
            )
        ) {

            return "Password baru tidak boleh sama dengan password lama.";
        }


        if (
            lower.includes(
                "invalid password"
            )
        ) {

            return "Password tidak valid.";
        }


        if (
            lower.includes(
                "not authenticated"
            )
        ) {

            return "Sesi login sudah berakhir. Silakan login kembali.";
        }


        if (
            lower.includes(
                "permission"
            ) ||
            lower.includes(
                "row-level security"
            )
        ) {

            return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
        }


        if (
            lower.includes(
                "jwt"
            ) ||
            lower.includes(
                "token"
            )
        ) {

            return "Sesi login tidak valid. Silakan login kembali.";
        }


        if (
            lower.includes(
                "already exists"
            ) ||
            lower.includes(
                "duplicate"
            )
        ) {

            return "Data foto sudah ada. Silakan coba lagi.";
        }


        return message;
    }


    /* =========================================================
       AUTH STATE
    ========================================================= */

    function setupAuthStateListener() {

        if (
            !window.supabaseClient?.auth
        ) {

            return;
        }


        window.supabaseClient.auth.onAuthStateChange(
            (
                event,
                session
            ) => {

                console.log(
                    "[SIDAT] AUTH EVENT:",
                    event
                );


                if (
                    session?.access_token
                ) {

                    localStorage.setItem(
                        ACCESS_TOKEN_KEY,
                        session.access_token
                    );


                    if (
                        session.refresh_token
                    ) {

                        localStorage.setItem(
                            "sidat_refresh_token",
                            session.refresh_token
                        );
                    }


                } else if (
                    event === "SIGNED_OUT"
                ) {

                    localStorage.removeItem(
                        ACCESS_TOKEN_KEY
                    );

                    localStorage.removeItem(
                        "sidat_refresh_token"
                    );
                }
            }
        );
    }


    /* =========================================================
       START AUTH LISTENER
    ========================================================= */

    /*
     * Supabase client dibuat di profil.html
     * sebelum profil.js dipanggil.
     */
    setupAuthStateListener();

})();