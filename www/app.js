// ==========================================
// SIDAT
// SISTEM INFORMASI DATA WARGA
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// ELEMENT
// ==========================================

const loginChoice =
    document.getElementById("loginChoice");

const wargaLogin =
    document.getElementById("wargaLogin");

const adminLogin =
    document.getElementById("adminLogin");


// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
// ==========================================
// SIDAT SESSION SYNC
// ==========================================

async function syncSidatSession() {

    try {

        const accessToken =
            localStorage.getItem(
                "sidat_access_token"
            );

        const refreshToken =
            localStorage.getItem(
                "sidat_refresh_token"
            );

        if (!accessToken || !refreshToken) {
            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient.auth.setSession({

                access_token:
                    accessToken,

                refresh_token:
                    refreshToken

            });

        if (error) {

            console.error(
                "Restore session gagal:",
                error
            );

            localStorage.removeItem(
                "sidat_access_token"
            );

            localStorage.removeItem(
                "sidat_refresh_token"
            );

            localStorage.removeItem(
                "sidat_user"
            );

            return;
        }

        console.log(
            "Session berhasil dipulihkan."
        );
        const user =
    JSON.parse(
        localStorage.getItem(
            "sidat_user"
        ) || "{}"
    );

if (user.resident_id) {

    window.location.href =
        "warga/dashboard.html";

}

    } catch (err) {

        console.error(
            "syncSidatSession:",
            err
        );

    }

}

// ==========================================
// OTOMATIS UPDATE TOKEN
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

        } else {

            localStorage.removeItem(
                "sidat_access_token"
            );

        }

    }
);


// Jalankan saat aplikasi dibuka
syncSidatSession();

// ==========================================
// NAVIGASI LOGIN
// ==========================================

function showWargaLogin() {

    loginChoice.classList.add("hidden");

    adminLogin.classList.add("hidden");

    wargaLogin.classList.remove("hidden");

}


function showAdminLogin() {

    loginChoice.classList.add("hidden");

    wargaLogin.classList.add("hidden");

    adminLogin.classList.remove("hidden");

}


function showLoginChoice() {

    wargaLogin.classList.add("hidden");

    adminLogin.classList.add("hidden");

    loginChoice.classList.remove("hidden");

}


// ==========================================
// TAMPILKAN PIN WARGA
// ==========================================

function togglePin() {

    const input =
        document.getElementById("wargaPin");

    input.type =
        input.type === "password"
            ? "text"
            : "password";

}


// ==========================================
// TAMPILKAN PASSWORD ADMIN
// ==========================================

function toggleAdminPassword() {

    const input =
        document.getElementById("adminPassword");

    input.type =
        input.type === "password"
            ? "text"
            : "password";

}


// ==========================================
// TAMPILKAN ERROR
// ==========================================

function showError(
    elementId,
    message
) {

    const box =
        document.getElementById(
            elementId
        );

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

    box.textContent =
        "";

    box.classList.add(
        "hidden"
    );

}


// ==========================================
// LOGIN WARGA
// ==========================================

document
    .getElementById(
        "wargaLoginForm"
    )
    .addEventListener(
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


            // ==================================
            // VALIDASI ID
            // ==================================

            if (!residentCode) {

                showError(
                    "wargaError",
                    "ID warga wajib diisi."
                );

                return;

            }


            // ==================================
            // VALIDASI PIN
            // ==================================

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


            // ==================================
            // LOADING
            // ==================================

            button.disabled =
                true;

            button.textContent =
                "MEMPROSES...";


            try {

                // ==================================
                // PANGGIL EDGE FUNCTION
                // ==================================

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


                // ==================================
                // LOGIN GAGAL
                // ==================================

                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(

                        result.message ||
                        "Login warga gagal."

                    );

                }


                // ==================================
                // CEK SESSION DARI EDGE FUNCTION
                // ==================================

                if (
                    !result.session ||
                    !result.session.access_token ||
                    !result.session.refresh_token
                ) {

                    throw new Error(
                        "Session login warga tidak ditemukan."
                    );

                }


                // ==================================
                // SET SESSION SUPABASE
                // ==================================

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


if (sessionError) {

    throw sessionError;

}


// ==========================================
// SIMPAN SESSION WARGA
// ==========================================

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


localStorage.setItem(
    "sidat_access_token",
    session.access_token
);


localStorage.setItem(
    "sidat_refresh_token",
    session.refresh_token
);


// DEBUG
console.log(
    "SUPABASE SESSION WARGA:",
    session
);

console.log(
    "ACCESS TOKEN SIDAT:",
    session.access_token
);

                // ==================================
                // SIMPAN DATA SIDAT
                // ==================================

                localStorage.setItem(
                    "sidat_user",
                    JSON.stringify(
                        result.user
                    )
                );
                
// ==========================================
// SIMPAN FCM TOKEN SETELAH LOGIN
// ==========================================
await updatePushSubscription();

                // ==================================
                // CEK USER SESSION
                // ==================================

                console.log(
                    "LOGIN WARGA BERHASIL"
                );

                console.log(
                    "USER:",
                    sessionData?.user
                );

                console.log(
                    "SESSION:",
                    sessionData?.session
                );


                // ==================================
                // PINDAH KE DASHBOARD WARGA
                // ==================================

                window.location.href =
                    "warga/dashboard.html";


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


// ==========================================
// LOGIN ADMIN
// ==========================================

document
    .getElementById(
        "adminLoginForm"
    )
    .addEventListener(
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


            // ==================================
            // VALIDASI
            // ==================================

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


            // ==================================
            // LOADING
            // ==================================

            button.disabled =
                true;

            button.textContent =
                "MEMPROSES...";


            try {

                // ==================================
                // LOGIN SUPABASE AUTH
                // ==================================

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


                // ==================================
                // CEK ERROR LOGIN
                // ==================================

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
                        "Session admin tidak berhasil dibuat."
                    );

                }
                // ==================================
// SIMPAN ACCESS TOKEN ADMIN
// ==================================

localStorage.setItem(
    "sidat_access_token",
    data.session.access_token
);


                // ==================================
                // LOG LOGIN
                // ==================================

                console.log(
                    "LOGIN ADMIN BERHASIL"
                );

                console.log(
                    "USER:",
                    data.user
                );

                console.log(
                    "SESSION:",
                    data.session
                );


                // ==================================
                // CEK PROFILE ADMIN
                // ==================================

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


                // ==================================
                // VALIDASI ROLE
                // ==================================

                if (
                    !profile ||
                    profile.role !== "admin"
                ) {

                    await supabaseClient
                        .auth
                        .signOut();


                    throw new Error(
                        "Akun ini bukan akun admin."
                    );

                }


                // ==================================
                // SIMPAN DATA ADMIN
                // ==================================

                localStorage.setItem(
                    "sidat_admin_user",
                    JSON.stringify(
                        data.user
                    )
                );


                // ==================================
                // CEK IS ADMIN
                // ==================================

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


                    throw new Error(
                        "Session berhasil dibuat, tetapi akun belum dikenali sebagai admin."
                    );

                }


                // ==================================
                // PINDAH DASHBOARD ADMIN
                // ==================================

                window.location.href =
                    "admin/dashboard.html";


            } catch (error) {

                console.error(
                    "Login admin error:",
                    error
                );


                showError(
                    "adminError",
                    error.message ||
                    "Login admin gagal."
                );


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "MASUK";

            }

        }
    );

// ======================================
// CEK VERSI APLIKASI
// ======================================

async function checkAppVersion() {

    try {

        const response = await fetch(
            "/SIDAT/version.json?ts=" + Date.now()
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (data.version !== SIDAT_APP_VERSION) {

            alert(
                "Versi baru SIDAT tersedia.\nHalaman akan dimuat ulang."
            );

            location.reload();

        }

    } catch (err) {

        console.error("Gagal cek versi:", err);

    }

}

checkAppVersion();


openOfflineDatabase()
    .then(() => {

        console.log(
            "SIDAT Offline DB siap."
        );

    })
    .catch(err => {

        console.error(err);

    });
async function updatePushSubscription() {

    const token =
        localStorage.getItem(
            "sidat_fcm_native_token"
        );

    if (!token) {
        return;
    }

    const accessToken =
        localStorage.getItem(
            "sidat_access_token"
        );

    if (!accessToken) {
        return;
    }

    const user =
        JSON.parse(
            localStorage.getItem(
                "sidat_user"
            ) || "{}"
        );

    const residentId =
        user.resident_id ||
        user.residentId ||
        user.id_resident;

    if (!residentId) {
        return;
    }

    const response =
        await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?resident_id=eq.${residentId}`,
            {
                method: "PATCH",

                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                        `Bearer ${accessToken}`,
                    "Content-Type":
                        "application/json",
                    Prefer: "return=minimal"
                },

                body: JSON.stringify({
                    fcm_token: token,
                    updated_at:
                        new Date().toISOString()
                })
            }
        );

    if (!response.ok) {

        console.error(
            await response.text()
        );

    } else {

        console.log(
            "FCM token berhasil disimpan."
        );

    }

}
