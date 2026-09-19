/* =========================================================
SIDAT
PROFIL ADMIN
Rebuild Baru
Fokus:

- Foto Profil
- Password
  ========================================================= */

/* =========================================================
SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
"https://pxezuuumgzdzdiqsspig.supabase.co";

const SUPABASE_KEY =
"sb_publishable_i--xXc0Jso51OAYj8Vy92g_OVIt8e3x";

/* =========================================================
ELEMENT
========================================================= */

const loadingScreen =
document.getElementById("loadingScreen");

const profileContent =
document.getElementById("profileContent");

const profileImage =
document.getElementById("profileImage");

const profilePlaceholder =
document.getElementById("profilePlaceholder");

const photoInput =
document.getElementById("photoInput");

const changePhotoButton =
document.getElementById("changePhotoButton");

const changePasswordButton =
document.getElementById("changePasswordButton");

const passwordForm =
document.getElementById("passwordForm");

const newPassword =
document.getElementById("newPassword");

const confirmPassword =
document.getElementById("confirmPassword");

const cancelPasswordButton =
document.getElementById("cancelPasswordButton");

const savePasswordButton =
document.getElementById("savePasswordButton");

const backButton =
document.getElementById("backButton");

const toast =
document.getElementById("toast");

/* =========================================================
TOAST
========================================================= */

let toastTimer = null;

function showToast(
message,
type = "success"
) {

if (!toast) return;

clearTimeout(toastTimer);

toast.textContent = message;

toast.className =
    `toast show ${type}`;

toastTimer = setTimeout(() => {

    toast.className = "toast";

}, 3000);

}

/* =========================================================
LOADING
========================================================= */

function showLoading() {

loadingScreen?.classList.remove(
    "hidden"
);

profileContent?.classList.add(
    "hidden"
);

}

function hideLoading() {

loadingScreen?.classList.add(
    "hidden"
);

profileContent?.classList.remove(
    "hidden"
);

}

/* =========================================================
TOKEN
========================================================= */

function getAccessToken() {

try {

    return localStorage.getItem(
        "sidat_access_token"
    );

} catch (error) {

    console.warn(
        "localStorage tidak tersedia:",
        error
    );

    return null;
}

}

/* =========================================================
SUPABASE REQUEST
========================================================= */

async function supabaseRequest(
endpoint,
options = {}
) {

const token =
    getAccessToken();


if (!token) {

    throw new Error(
        "Token login belum tersedia."
    );
}


const response =
    await fetch(
        `${SUPABASE_URL}${endpoint}`,
        {
            ...options,

            headers: {

                "apikey":
                    SUPABASE_KEY,

                "Authorization":
                    `Bearer ${token}`,

                "Content-Type":
                    "application/json",

                ...(options.headers || {})
            }
        }
    );


let data = null;


try {

    data =
        await response.json();

} catch {

    data = null;
}


if (!response.ok) {

    throw new Error(
        data?.message ||
        data?.error_description ||
        data?.error ||
        `Supabase error ${response.status}`
    );
}


return data;

}

/* =========================================================
TUNGGU TOKEN SIDAT
========================================================= */

async function waitForAccessToken(
timeout = 5000
) {

const started =
    Date.now();


while (
    Date.now() - started <
    timeout
) {

    const token =
        getAccessToken();


    if (token) {

        return token;
    }


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                200
            )
    );
}


return null;

}

/* =========================================================
LOAD AUTH USER
========================================================= */

async function loadAuthUser() {

const token =
    await waitForAccessToken();


if (!token) {

    throw new Error(
        "Session login belum tersedia."
    );
}


return await supabaseRequest(
    "/auth/v1/user"
);

}

/* =========================================================
LOAD PROFIL ADMIN
========================================================= */

async function loadAdminProfile(
user
) {

const profiles =
    await supabaseRequest(
        `/rest/v1/profiles?select=role,resident_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`
    );


const profile =
    Array.isArray(profiles)
        ? profiles[0]
        : null;


if (!profile) {

    throw new Error(
        "Profil Admin tidak ditemukan."
    );
}


/*
 * Jika role tersedia dan bukan admin,
 * jangan langsung redirect.
 * Tampilkan error saja.
 */
if (
    profile.role &&
    profile.role !== "admin"
) {

    throw new Error(
        "Akun ini bukan Admin."
    );
}


return profile;

}

/* =========================================================
LOAD FOTO
========================================================= */

async function loadProfilePhoto(
profile,
user
) {

let photoUrl = null;


/*
 * Prioritas pertama:
 * residents.photo_url
 */
if (profile?.resident_id) {

    try {

        const residents =
            await supabaseRequest(
                `/rest/v1/residents?select=photo_url&id=eq.${encodeURIComponent(profile.resident_id)}&limit=1`
            );


        if (
            Array.isArray(
                residents
            ) &&
            residents.length
        ) {

            photoUrl =
                residents[0]?.photo_url ||
                null;
        }

    } catch (error) {

        console.warn(
            "Tidak dapat membaca foto residents:",
            error
        );
    }
}


/*
 * Fallback Auth metadata.
 */
if (!photoUrl) {

    photoUrl =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        null;
}


if (photoUrl) {

    renderPhoto(photoUrl);

} else {

    renderPlaceholder();
}

}

/* =========================================================
RENDER PHOTO
========================================================= */

function renderPhoto(
url
) {

if (!profileImage) return;


profileImage.src = url;

profileImage.classList.remove(
    "hidden"
);

profilePlaceholder?.classList.add(
    "hidden"
);


profileImage.onerror = () => {

    renderPlaceholder();
};

}

function renderPlaceholder() {

profileImage?.classList.add(
    "hidden"
);

profilePlaceholder?.classList.remove(
    "hidden"
);

}

/* =========================================================
UPLOAD PHOTO
========================================================= */

async function uploadProfilePhoto(
file,
profile,
user
) {

if (!file) return;


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
        "Gunakan foto JPG, PNG, atau WebP.",
        "error"
    );

    return;
}


if (
    file.size >
    2 * 1024 * 1024
) {

    showToast(
        "Ukuran foto maksimal 2 MB.",
        "error"
    );

    return;
}


const token =
    getAccessToken();


if (!token) {

    showToast(
        "Session login belum tersedia.",
        "error"
    );

    return;
}


changePhotoButton.disabled = true;


try {

    /*
     * Nama file tetap per Admin.
     */
    const filePath =
        `${user.id}/profile.${file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
                ? "webp"
                : "jpg"
        }`;


    /*
     * Upload Storage.
     */
    const uploadResponse =
        await fetch(
            `${SUPABASE_URL}/storage/v1/object/profile-photos/${filePath}`,
            {
                method: "POST",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        file.type,

                    "x-upsert":
                        "true",

                    "Cache-Control":
                        "3600"
                },

                body: file
            }
        );


    let uploadData = null;


    try {

        uploadData =
            await uploadResponse.json();

    } catch {

        uploadData = null;
    }


    if (!uploadResponse.ok) {

        throw new Error(
            uploadData?.message ||
            uploadData?.error ||
            "Upload foto gagal."
        );
    }


    /*
     * URL publik.
     */
    const publicUrl =
        `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${filePath}`;


    /*
     * Simpan photo_url bila Admin
     * memiliki resident_id.
     */
    if (profile?.resident_id) {

        await supabaseRequest(
            `/rest/v1/residents?id=eq.${encodeURIComponent(profile.resident_id)}`,
            {
                method: "PATCH",

                headers: {
                    "Prefer":
                        "return=minimal"
                },

                body:
                    JSON.stringify({
                        photo_url:
                            `${publicUrl}?v=${Date.now()}`
                    })
            }
        );
    }


    renderPhoto(
        `${publicUrl}?v=${Date.now()}`
    );


    showToast(
        "Foto profil berhasil diperbarui.",
        "success"
    );


} catch (error) {

    console.error(
        "Upload foto gagal:",
        error
    );


    showToast(
        error?.message ||
        "Gagal mengganti foto profil.",
        "error"
    );


} finally {

    changePhotoButton.disabled =
        false;


    if (photoInput) {

        photoInput.value = "";
    }
}

}

/* =========================================================
PASSWORD FORM
========================================================= */

function openPasswordForm() {

passwordForm?.classList.remove(
    "hidden"
);

changePasswordButton?.classList.add(
    "hidden"
);

newPassword?.focus();

}

function closePasswordForm() {

passwordForm?.classList.add(
    "hidden"
);

changePasswordButton?.classList.remove(
    "hidden"
);


if (newPassword) {

    newPassword.value = "";
}


if (confirmPassword) {

    confirmPassword.value = "";
}

}

/* =========================================================
SAVE PASSWORD
========================================================= */

async function savePassword() {

const password =
    newPassword?.value || "";

const confirmation =
    confirmPassword?.value || "";


if (
    password.length < 6
) {

    showToast(
        "Password minimal 6 karakter.",
        "error"
    );

    newPassword?.focus();

    return;
}


if (
    password !==
    confirmation
) {

    showToast(
        "Konfirmasi password tidak sama.",
        "error"
    );

    confirmPassword?.focus();

    return;
}


const token =
    getAccessToken();


if (!token) {

    showToast(
        "Session login belum tersedia.",
        "error"
    );

    return;
}


savePasswordButton.disabled =
    true;

cancelPasswordButton.disabled =
    true;


try {

    await supabaseRequest(
        "/auth/v1/user",
        {
            method: "PUT",

            body:
                JSON.stringify({
                    password:
                        password
                })
        }
    );


    showToast(
        "Password berhasil diperbarui.",
        "success"
    );


    closePasswordForm();


} catch (error) {

    console.error(
        "Ganti password gagal:",
        error
    );


    showToast(
        error?.message ||
        "Gagal mengganti password.",
        "error"
    );


} finally {

    savePasswordButton.disabled =
        false;

    cancelPasswordButton.disabled =
        false;
}

}

/* =========================================================
TOGGLE PASSWORD
========================================================= */

function togglePassword(
button
) {

const target =
    button.dataset.target;

const input =
    document.getElementById(
        target
    );


if (!input) return;


if (
    input.type === "password"
) {

    input.type = "text";

    button.setAttribute(
        "aria-label",
        "Sembunyikan password"
    );

} else {

    input.type = "password";

    button.setAttribute(
        "aria-label",
        "Tampilkan password"
    );
}

}

/* =========================================================
EVENTS
========================================================= */

function setupEvents() {

/*
 * Kembali ke Dashboard.
 */
backButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "../dashboard.html";
    }
);


/*
 * Tombol foto.
 */
changePhotoButton?.addEventListener(
    "click",
    () => {

        photoInput?.click();
    }
);


/*
 * Pilih foto.
 */
photoInput?.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files?.[0];


        if (!file) return;


        try {

            const user =
                await loadAuthUser();

            const profile =
                await loadAdminProfile(
                    user
                );


            await uploadProfilePhoto(
                file,
                profile,
                user
            );


        } catch (error) {

            console.error(
                "Persiapan upload gagal:",
                error
            );


            showToast(
                error?.message ||
                "Gagal memproses foto.",
                "error"
            );


            photoInput.value = "";
        }
    }
);


/*
 * Password.
 */
changePasswordButton?.addEventListener(
    "click",
    openPasswordForm
);


cancelPasswordButton?.addEventListener(
    "click",
    closePasswordForm
);


savePasswordButton?.addEventListener(
    "click",
    savePassword
);


/*
 * Toggle password.
 */
document
    .querySelectorAll(
        ".password-toggle"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                togglePassword(
                    button
                );
            }
        );
    });


/*
 * Enter = simpan.
 */
[
    newPassword,
    confirmPassword
].forEach(input => {

    input?.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                savePassword();
            }
        }
    );
});

}

/* =========================================================
INIT
========================================================= */

async function initProfilAdmin() {

showLoading();


try {

    setupEvents();


    /*
     * Tunggu token yang disinkronkan
     * oleh sistem SIDAT.
     */
    const token =
        await waitForAccessToken(
            7000
        );


    /*
     * Jangan langsung lempar ke login.
     * Jika token belum ada, tampilkan pesan.
     */
    if (!token) {

        hideLoading();

        showToast(
            "Session Admin belum siap. Silakan buka kembali Profil.",
            "error"
        );

        return;
    }


    const user =
        await loadAuthUser();


    const profile =
        await loadAdminProfile(
            user
        );


    await loadProfilePhoto(
        profile,
        user
    );


    hideLoading();


} catch (error) {

    console.error(
        "Profil Admin gagal dimuat:",
        error
    );


    hideLoading();


    showToast(
        error?.message ||
        "Gagal memuat Profil Admin.",
        "error"
    );
}

}

/* =========================================================
START
========================================================= */

initProfilAdmin();