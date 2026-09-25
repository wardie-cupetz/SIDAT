// ==========================================
// SIDAT
// SISTEM INFORMASI DATA WARGA
// Dibuat oleh Suwardi
// ==========================================

"use strict";


// ==========================================
// ELEMENT
// ==========================================

const loginChoice =
    document.getElementById("loginChoice");

const wargaLogin =
    document.getElementById("wargaLogin");

const wargaChangePin =
    document.getElementById("wargaChangePin");

const adminLogin =
    document.getElementById("adminLogin");


// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        }
    );

window.supabaseClient = supabaseClient;


// ==========================================
// ROLE SIDAT
// ==========================================

const SIDAT_ROLES = {

    ADMIN: "admin",

    KETUA_RT: "ketua_rt",

    BENDAHARA: "bendahara",

    KOPERASI_RT: "koperasi_rt",

    WARGA: "warga",

    NOTULA: "notula"

};


// ==========================================
// LABEL ROLE
// ==========================================

const SIDAT_ROLE_LABELS = {

    admin:
        "ADMIN",

    ketua_rt:
        "KETUA RT",

    bendahara:
        "BENDAHARA",

    koperasi_rt:
        "KOPERASI RT",

    warga:
        "WARGA",

    notula:
        "NOTULA"

};


// ==========================================
// DASHBOARD
// ==========================================

const SIDAT_AVAILABLE_DASHBOARDS = {
    admin: "admin/dashboard.html",
    ketua_rt: "ketua-rt/dashboard.html",
    bendahara: "bendahara/dashboard.html",
    koperasi_rt: "koperasi/dashboard.html",
    warga: "warga/dashboard.html",
    notula: "notula/dashboard.html"
};

// ==========================================
// SESSION SYNC
// ==========================================

async function syncSidatSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Gagal membaca session:",
                error
            );

            return;

        }


        const session =
            data?.session;


        if (
            session?.access_token
        ) {

            localStorage.setItem(
                "sidat_access_token",
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


            console.log(
                "SIDAT: access token tersinkron."
            );

        } else {

            localStorage.removeItem(
                "sidat_access_token"
            );

            localStorage.removeItem(
                "sidat_refresh_token"
            );

        }

    } catch (error) {

        console.error(
            "Session sync error:",
            error
        );

    }

}


// ==========================================
// AUTH STATE
// ==========================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "SIDAT AUTH EVENT:",
            event
        );


        if (
            session?.access_token
        ) {

            localStorage.setItem(
                "sidat_access_token",
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

        } else {

            localStorage.removeItem(
                "sidat_access_token"
            );

            localStorage.removeItem(
                "sidat_refresh_token"
            );

        }

    }
);


syncSidatSession();


// ==========================================
// DETEKSI APK / WEB
// ==========================================

if (window.Capacitor) {
    document.documentElement.classList.add("sidat-apk");
}

// ==========================================
// RESTORE SESSION SAAT APLIKASI DIBUKA
// ==========================================

async function restoreSidatSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) { console.error("Gagal restore session:", error); return; }
        const session = data?.session;
        if (!session?.user) { console.log("SIDAT: Tidak ada session aktif."); return; }
        const user = session.user;
        console.log("SIDAT: Session ditemukan:", user.id);
        const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("role").eq("user_id", user.id).single();
        if (profileError) { console.error("Gagal membaca role session:", profileError); return; }
        if (!profile?.role) { console.warn("SIDAT: Role session tidak ditemukan."); return; }
        const role = String(profile.role).trim().toLowerCase();
        if (!isValidSidatRole(role)) { console.warn("SIDAT: Role session tidak valid:", role); return; }
        saveSidatRole(role);
        const oldUser =
            JSON.parse(
                localStorage.getItem("sidat_user") || "null"
            );

        const restoredUser = {
            ...(oldUser || {}),
            ...user
        };

        localStorage.setItem(
            "sidat_user",
            JSON.stringify(restoredUser)
        );
        if (role === SIDAT_ROLES.ADMIN) localStorage.setItem("sidat_admin_user", JSON.stringify(user));
        const dashboard = SIDAT_AVAILABLE_DASHBOARDS[role];
        if (!dashboard) { console.warn("SIDAT: Dashboard role tidak ditemukan:", role); return; }
        console.log("SIDAT: Restore login →", role, dashboard);
        window.location.href = dashboard;
    } catch (error) {
        console.error("Restore session error:", error);
    }
}

restoreSidatSession();

// ==========================================
// NAVIGASI
// ==========================================

function showWargaLogin() {

    loginChoice.classList.add(
        "hidden"
    );

    adminLogin.classList.add(
        "hidden"
    );

    if (wargaChangePin) {

        wargaChangePin.classList.add(
            "hidden"
        );

    }

    wargaLogin.classList.remove(
        "hidden"
    );

}


function showAdminLogin() {

    loginChoice.classList.add(
        "hidden"
    );

    wargaLogin.classList.add(
        "hidden"
    );

    if (wargaChangePin) {

        wargaChangePin.classList.add(
            "hidden"
        );

    }

    adminLogin.classList.remove(
        "hidden"
    );

}


function showLoginChoice() {

    wargaLogin.classList.add(
        "hidden"
    );

    adminLogin.classList.add(
        "hidden"
    );

    if (wargaChangePin) {

        wargaChangePin.classList.add(
            "hidden"
        );

    }

    loginChoice.classList.remove(
        "hidden"
    );

}


// ==========================================
// TOGGLE PIN
// ==========================================

function toggleWargaPin() {

    const input =
        document.getElementById(
            "wargaPin"
        );


    if (!input) {

        return;

    }


    input.type =
        input.type === "password"
            ? "text"
            : "password";

}


function togglePin() {

    toggleWargaPin();

}


function toggleWargaNewPin() {

    const input =
        document.getElementById(
            "wargaNewPin"
        );


    if (!input) {

        return;

    }


    input.type =
        input.type === "password"
            ? "text"
            : "password";

}


function toggleWargaConfirmPin() {

    const input =
        document.getElementById(
            "wargaConfirmPin"
        );


    if (!input) {

        return;

    }


    input.type =
        input.type === "password"
            ? "text"
            : "password";

}


function toggleAdminPassword() {

    const input =
        document.getElementById(
            "adminPassword"
        );


    if (!input) {

        return;

    }


    input.type =
        input.type === "password"
            ? "text"
            : "password";

}


// ==========================================
// ERROR
// ==========================================

function showError(
    elementId,
    message
) {

    const box =
        document.getElementById(
            elementId
        );


    if (!box) {

        return;

    }


    box.textContent =
        message;

    box.classList.remove(
        "hidden"
    );

}


function hideError(
    elementId
) {

    const box =
        document.getElementById(
            elementId
        );


    if (!box) {

        return;

    }


    box.textContent =
        "";

    box.classList.add(
        "hidden"
    );

}


// ==========================================
// ROLE
// ==========================================

function saveSidatRole(
    role
) {

    localStorage.setItem(
        "sidat_role",
        role
    );


    localStorage.setItem(
        "sidat_role_label",
        SIDAT_ROLE_LABELS[role] ||
        role
    );

}


function clearSidatRole() {

    localStorage.removeItem(
        "sidat_role"
    );

    localStorage.removeItem(
        "sidat_role_label"
    );

}


function getSidatRoleLabel(
    role
) {

    return (
        SIDAT_ROLE_LABELS[role] ||
        role
    );

}


function isValidSidatRole(
    role
) {

    return [

        SIDAT_ROLES.ADMIN,

        SIDAT_ROLES.KETUA_RT,

        SIDAT_ROLES.BENDAHARA,

        SIDAT_ROLES.KOPERASI_RT,

        SIDAT_ROLES.WARGA,

        SIDAT_ROLES.NOTULA

    ].includes(
        role
    );

}


function hasSidatDashboard(
    role
) {

    return Boolean(
        SIDAT_AVAILABLE_DASHBOARDS[role]
    );

}


function getRoleDashboardMessage(
    role
) {

    const label =
        getSidatRoleLabel(
            role
        );


    return (

        "Login berhasil sebagai " +
        label +
        ", tetapi dashboard " +
        label +
        " belum tersedia. " +
        "Silakan tunggu dashboard role tersebut dibuat."

    );

}


// ==========================================
// TAMPILKAN FORM GANTI PIN
// ==========================================

function showWargaChangePin() {

    loginChoice.classList.add(
        "hidden"
    );

    wargaLogin.classList.add(
        "hidden"
    );

    adminLogin.classList.add(
        "hidden"
    );

    if (wargaChangePin) {

        wargaChangePin.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// LOGIN WARGA
// ==========================================

const wargaLoginForm =
    document.getElementById(
        "wargaLoginForm"
    );


if (wargaLoginForm) {

    wargaLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideError(
                "wargaError"
            );


            const button =
                document.getElementById(
                    "wargaLoginButton"
                );


            const residentCode =
                document
                    .getElementById(
                        "wargaId"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const pin =
                document
                    .getElementById(
                        "wargaPin"
                    )
                    .value
                    .trim();


            if (!residentCode) {

                showError(
                    "wargaError",
                    "ID warga wajib diisi."
                );

                return;

            }


            if (
                !/^\d{4,6}$/.test(
                    pin
                )
            ) {

                showError(
                    "wargaError",
                    "PIN harus terdiri dari 4–6 digit."
                );

                return;

            }


            button.disabled =
                true;

            button.textContent =
                "MEMPROSES...";


            try {

                /*
                ==========================================
                PANGGIL resident-login
                ==========================================
                */

                const response =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/resident-login`,

                        {

                            method:
                                "POST",

                            headers:
                                {

                                    "apikey":
                                        SUPABASE_KEY,

                                    "Content-Type":
                                        "application/json"

                                },

                            body:
                                JSON.stringify({

                                    resident_code:
                                        residentCode,

                                    pin:
                                        pin

                                })

                        }

                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(

                        result.message ||
                        result.error ||
                        "Login warga gagal."

                    );

                }


                /*
                ==========================================
                SESSION WAJIB ADA
                ==========================================
                */

                if (
                    !result.session ||
                    !result.session.access_token ||
                    !result.session.refresh_token
                ) {

                    throw new Error(
                        "Session login warga tidak ditemukan."
                    );

                }


                /*
                ==========================================
                SET SESSION SUPABASE
                ==========================================
                */

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient
                        .auth
                        .setSession({

                            access_token:
                                result.session.access_token,

                            refresh_token:
                                result.session.refresh_token

                        });


                if (
                    sessionError
                ) {

                    throw sessionError;

                }


                const session =
                    sessionData?.session;


                if (
                    !session ||
                    !session.access_token
                ) {

                    throw new Error(
                        "Session Supabase warga tidak berhasil dibuat."
                    );

                }


                /*
                ==========================================
                SIMPAN TOKEN
                ==========================================
                */

                localStorage.setItem(
                    "sidat_access_token",
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


                /*
                ==========================================
                ROLE WARGA
                ==========================================
                */

                saveSidatRole(
                    SIDAT_ROLES.WARGA
                );


                localStorage.setItem(
                    "sidat_user",
                    JSON.stringify(
                        result.user
                    )
                );


                /*
                ==========================================
                CEK WAJIB GANTI PIN
                ==========================================
                */

                const mustChangePin =
                    result.user?.must_change_pin === true;


                console.log(
                    "LOGIN WARGA BERHASIL"
                );


                console.log(
                    "ROLE:",
                    SIDAT_ROLES.WARGA
                );


                console.log(
                    "MUST CHANGE PIN:",
                    mustChangePin
                );


                /*
                ==========================================
                JIKA WAJIB GANTI PIN
                ==========================================
                */

                if (
                    mustChangePin
                ) {

                    showWargaChangePin();

                    return;

                }


                /*
                ==========================================
                LANGSUNG DASHBOARD
                ==========================================
                */

                window.location.href =
                    SIDAT_AVAILABLE_DASHBOARDS.warga;


            } catch (error) {

                console.error(
                    "Login warga error:",
                    error
                );


                showError(
                    "wargaError",
                    error.message ||
                    "Login warga gagal."
                );


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "MASUK";

            }

        }
    );

}


// ==========================================
// GANTI PIN WARGA
// ==========================================

async function changeWargaPin() {

    hideError(
        "wargaChangePinError"
    );


    const newPinInput =
        document.getElementById(
            "wargaNewPin"
        );


    const confirmPinInput =
        document.getElementById(
            "wargaConfirmPin"
        );


    const button =
        document.getElementById(
            "wargaChangePinButton"
        );


    const newPin =
        newPinInput?.value
            ?.trim() || "";


    const confirmPin =
        confirmPinInput?.value
            ?.trim() || "";


    /*
    ==========================================
    VALIDASI
    ==========================================
    */

    if (
        !/^\d{4,6}$/.test(
            newPin
        )
    ) {

        showError(
            "wargaChangePinError",
            "PIN baru harus terdiri dari 4–6 digit."
        );

        return;

    }


    if (
        newPin !== confirmPin
    ) {

        showError(
            "wargaChangePinError",
            "Konfirmasi PIN tidak sama."
        );

        return;

    }


    if (
        newPin === "123456"
    ) {

        showError(
            "wargaChangePinError",
            "PIN baru harus berbeda dari PIN awal."
        );

        return;

    }


    /*
    ==========================================
    AMBIL SESSION TERBARU
    ==========================================
    */

    button.disabled =
        true;

    button.textContent =
        "MENYIMPAN...";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            throw error;

        }


        const session =
            data?.session;


        if (
            !session?.access_token
        ) {

            throw new Error(
                "Sesi WARGA tidak ditemukan. Silakan login kembali."
            );

        }


        /*
        ==========================================
        SIMPAN TOKEN TERBARU
        ==========================================
        */

        localStorage.setItem(
            "sidat_access_token",
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


        /*
        ==========================================
        PANGGIL change-resident-pin
        ==========================================
        */

        const response =
            await fetch(

                `${SUPABASE_URL}/functions/v1/change-resident-pin`,

                {

                    method:
                        "POST",

                    headers:
                        {

                            "apikey":
                                SUPABASE_KEY,

                            "Authorization":
                                `Bearer ${session.access_token}`,

                            "Content-Type":
                                "application/json"

                        },

                    body:
                        JSON.stringify({

                            new_pin:
                                newPin,

                            confirm_pin:
                                confirmPin

                        })

                }

            );


        const result =
            await response.json();


        /*
        ==========================================
        ERROR FUNCTION
        ==========================================
        */

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.error ||
                result.message ||
                "Gagal mengubah PIN."

            );

        }


        /*
        ==========================================
        UPDATE DATA USER LOCAL
        ==========================================
        */

        const oldUser =
            localStorage.getItem(
                "sidat_user"
            );


        if (oldUser) {

            try {

                const user =
                    JSON.parse(
                        oldUser
                    );


                user.must_change_pin =
                    false;


                localStorage.setItem(
    "sidat_user",
    JSON.stringify(user)
);
                

            } catch (e) {

                console.warn(
                    "SIDAT: gagal memperbarui sidat_user.",
                    e
                );

            }

        }


        /*
        ==========================================
        BERHASIL
        ==========================================
        */

        console.log(
            "SIDAT: PIN WARGA berhasil diubah."
        );


        /*
        ==========================================
        KE DASHBOARD
        ==========================================
        */

        window.location.href =
            SIDAT_AVAILABLE_DASHBOARDS.warga;


    } catch (error) {

        console.error(
            "Ganti PIN warga error:",
            error
        );


        showError(
            "wargaChangePinError",
            error.message ||
            "Gagal mengubah PIN."
        );


    } finally {

        button.disabled =
            false;

        button.textContent =
            "SIMPAN PIN BARU";

    }

}


// ==========================================
// LOGIN PENGELOLA
// ==========================================

const adminLoginForm =
    document.getElementById(
        "adminLoginForm"
    );


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideError(
                "adminError"
            );


            const button =
                document.getElementById(
                    "adminLoginButton"
                );


            const email =
                document
                    .getElementById(
                        "adminEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "adminPassword"
                    )
                    .value;


            if (
                !email ||
                !password
            ) {

                showError(
                    "adminError",
                    "Email dan password wajib diisi."
                );

                return;

            }


            button.disabled =
                true;

            button.textContent =
                "MEMPROSES...";


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (
                    error
                ) {

                    throw error;

                }


                if (
                    !data ||
                    !data.user ||
                    !data.session
                ) {

                    throw new Error(
                        "Session pengelola tidak berhasil dibuat."
                    );

                }


                localStorage.setItem(
                    "sidat_access_token",
                    data.session.access_token
                );


                if (
                    data.session.refresh_token
                ) {

                    localStorage.setItem(
                        "sidat_refresh_token",
                        data.session.refresh_token
                    );

                }


                console.log(
                    "LOGIN PENGELOLA BERHASIL"
                );


                const {
                    data: profile,
                    error: profileError
                } =
                    await supabaseClient
                        .from(
                            "profiles"
                        )
                        .select(
                            "role"
                        )
                        .eq(
                            "user_id",
                            data.user.id
                        )
                        .single();


                if (
                    profileError
                ) {

                    throw profileError;

                }


                console.log(
                    "PROFILE:",
                    profile
                );


                if (
                    !profile ||
                    !profile.role
                ) {

                    await supabaseClient
                        .auth
                        .signOut();


                    clearSidatRole();


                    throw new Error(
                        "Role akun tidak ditemukan."
                    );

                }


                const role =
                    String(
                        profile.role
                    )
                    .trim()
                    .toLowerCase();


                console.log(
                    "ROLE SIDAT:",
                    role
                );


                if (
                    !isValidSidatRole(
                        role
                    )
                ) {

                    await supabaseClient
                        .auth
                        .signOut();


                    clearSidatRole();


                    throw new Error(
                        "Role akun tidak dikenali oleh SIDAT."
                    );

                }


                if (
                    role === SIDAT_ROLES.WARGA
                ) {

                    await supabaseClient
                        .auth
                        .signOut();


                    clearSidatRole();


                    throw new Error(
                        "Akun WARGA harus masuk melalui Login Warga."
                    );

                }


                saveSidatRole(
                    role
                );


                localStorage.setItem(
                    "sidat_user",
                    JSON.stringify(
                        data.user
                    )
                );


                if (
                    role === SIDAT_ROLES.ADMIN
                ) {

                    localStorage.setItem(
                        "sidat_admin_user",
                        JSON.stringify(
                            data.user
                        )
                    );


                    const {
                        data: adminStatus,
                        error: adminError
                    } =
                        await supabaseClient
                            .rpc(
                                "is_admin"
                            );


                    if (
                        adminError
                    ) {

                        await supabaseClient
                            .auth
                            .signOut();

                        clearSidatRole();

                        throw adminError;

                    }


                    console.log(
                        "STATUS ADMIN:",
                        adminStatus
                    );


                    if (
                        adminStatus !== true
                    ) {

                        await supabaseClient
                            .auth
                            .signOut();

                        clearSidatRole();

                        throw new Error(
                            "Session berhasil dibuat, tetapi akun belum dikenali sebagai admin."
                        );

                    }


                    window.location.href =
                        SIDAT_AVAILABLE_DASHBOARDS.admin;


                    return;

                }


                if (
                    !hasSidatDashboard(
                        role
                    )
                ) {

                    const message =
                        getRoleDashboardMessage(
                            role
                        );


                    console.warn(
                        message
                    );


                    await supabaseClient
                        .auth
                        .signOut();


                    clearSidatRole();


                    localStorage.removeItem(
                        "sidat_user"
                    );


                    localStorage.removeItem(
                        "sidat_admin_user"
                    );


                    throw new Error(
                        message
                    );

                }


                window.location.href =
                    SIDAT_AVAILABLE_DASHBOARDS[
                        role
                    ];

            } catch (error) {

                console.error(
                    "Login pengelola error:",
                    error
                );


                showError(
                    "adminError",
                    error.message ||
                    "Login pengelola gagal."
                );


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "MASUK";

            }

        }
    );

}


// ==========================================
// VERSI APLIKASI
// ==========================================

async function checkAppVersion() {

    try {

        const response =
            await fetch(
                "/SIDAT/version.json?ts=" +
                Date.now()
            );


        if (
            !response.ok
        ) {

            return;

        }


        const data =
            await response.json();


        if (
            data.version !==
            SIDAT_APP_VERSION
        ) {

            alert(
                "Versi baru SIDAT tersedia.\nHalaman akan dimuat ulang."
            );


            location.reload();

        }

    } catch (err) {

        console.error(
            "Gagal cek versi:",
            err
        );

    }

}


checkAppVersion();


// ==========================================
// OFFLINE DATABASE
// ==========================================

openOfflineDatabase()

    .then(() => {

        console.log(
            "SIDAT Offline DB siap."
        );

    })

    .catch(err => {

        console.error(
            "SIDAT Offline DB gagal:",
            err
        );

    });


openOfflineDatabase()

    .then(() => {

        console.log(
            "SIDAT Offline DB siap."
        );


        if (
            typeof syncOfflineQueue ===
            "function"
        ) {

            syncOfflineQueue();

        }

    })

    .catch(err => {

        console.error(
            "SIDAT Offline DB / Sync error:",
            err
        );

    });


// ==========================================
// DEBUG ROLE
// ==========================================

console.log(
    "SIDAT ROLE SAAT INI:",
    localStorage.getItem(
        "sidat_role"
    )
);