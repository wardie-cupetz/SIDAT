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
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        }
    );

// ==========================================
// SIDAT SESSION SYNC
// ==========================================

async function syncSidatSession() {

    try {

        console.log("SIDAT: memeriksa session...");

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();


        // ======================================
        // ERROR SESSION
        // ======================================

        if (error) {

            console.error(
                "SIDAT: gagal membaca session:",
                error
            );

            return;
        }


        // ======================================
        // TIDAK ADA SESSION
        // ======================================

        if (!session) {

            console.log(
                "SIDAT: tidak ada session aktif."
            );

            return;
        }


        // ======================================
        // SESSION MASIH AKTIF
        // ======================================

        console.log(
            "SIDAT: session berhasil dipulihkan."
        );


        // ======================================
        // SIMPAN ACCESS TOKEN
        // Tetap dipertahankan karena
        // dipakai sistem FCM/push notification
        // ======================================

        if (session.access_token) {

            localStorage.setItem(
                "sidat_access_token",
                session.access_token
            );

        }


        // ======================================
        // SIMPAN REFRESH TOKEN
        // Dipertahankan untuk kompatibilitas
        // sistem SIDAT yang sudah ada
        // ======================================

        if (session.refresh_token) {

            localStorage.setItem(
                "sidat_refresh_token",
                session.refresh_token
            );

        }


        // ======================================
        // IDENTITAS USER
        // ======================================

        const user =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) || "{}"
            );


        const adminUser =
            JSON.parse(
                localStorage.getItem(
                    "sidat_admin_user"
                ) || "{}"
            );


        // ======================================
        // CEK PROFILE / ROLE ADMIN
        // ======================================

        try {

            const {
                data: profile,
                error: profileError
            } = await supabaseClient
                .from("profiles")
                .select("role")
                .eq(
                    "user_id",
                    session.user.id
                )
                .maybeSingle();


            if (
                !profileError &&
                profile?.role === "admin"
            ) {

                console.log(
                    "SIDAT: session ADMIN dipulihkan."
                );


                // Pastikan data admin tetap ada
                localStorage.setItem(
                    "sidat_admin_user",
                    JSON.stringify(
                        session.user
                    )
                );


                // ==================================
                // PASTIKAN PUSH/FCM TETAP TERUPDATE
                // ==================================

                await updatePushSubscription();


                // ==================================
                // LANGSUNG KE DASHBOARD ADMIN
                // ==================================

                if (
                    !window.location.pathname.includes(
                        "/admin/dashboard.html"
                    )
                ) {

                    window.location.href =
                        "admin/dashboard.html";

                }

                return;
            }

        } catch (profileCheckError) {

            console.warn(
                "SIDAT: gagal mengecek profile admin:",
                profileCheckError
            );

        }


        // ======================================
        // CEK USER WARGA
        // ======================================

        if (
            user?.resident_id ||
            user?.residentId ||
            user?.id_resident
        ) {

            console.log(
                "SIDAT: session WARGA dipulihkan."
            );


            // ==================================
            // PASTIKAN PUSH/FCM TETAP TERUPDATE
            // ==================================

            await updatePushSubscription();


            // ==================================
            // LANGSUNG KE DASHBOARD WARGA
            // ==================================

            if (
                !window.location.pathname.includes(
                    "/warga/dashboard.html"
                )
            ) {

                window.location.href =
                    "warga/dashboard.html";

            }

            return;
        }


        // ======================================
        // SESSION ADA TAPI IDENTITAS SIDAT
        // TIDAK DIKENALI
        // ======================================

        console.warn(
            "SIDAT: session ada, tetapi identitas SIDAT tidak ditemukan."
        );

    } catch (err) {

        console.error(
            "SIDAT syncSidatSession error:",
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


        // ======================================
        // SESSION AKTIF
        // ======================================

        if (
            session?.access_token
        ) {

            localStorage.setItem(
                "sidat_access_token",
                session.access_token
            );


            if (session.refresh_token) {

                localStorage.setItem(
                    "sidat_refresh_token",
                    session.refresh_token
                );

            }

        }


        // ======================================
        // LOGOUT / SESSION HILANG
        // ======================================

        else {

            localStorage.removeItem(
                "sidat_access_token"
            );

            localStorage.removeItem(
                "sidat_refresh_token"
            );

        }

    }
);


// ==========================================
// JALANKAN SAAT APLIKASI DIBUKA
// ==========================================

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
// ==========================================
// SINKRONISASI FCM TOKEN ADMIN
// ==========================================

try {

    const fcmToken =
        localStorage.getItem(
            "sidat_fcm_native_token"
        );

    if (fcmToken) {

        console.log(
            "SIDAT ADMIN: FCM token ditemukan."
        );

        const adminUserId =
            data.user.id;

        const {
            error: fcmError
        } =
            await supabaseClient
                .from("push_subscriptions")
                .upsert(
                    {
                        user_id:
                            adminUserId,

                        resident_id:
                            null,

                        fcm_token:
                            fcmToken,

                        updated_at:
                            new Date().toISOString()
                    },
                    {
                        onConflict:
                            "user_id"
                    }
                );

        if (fcmError) {

            console.error(
                "SIDAT ADMIN: Gagal menyimpan FCM token:",
                fcmError
            );

        } else {

            console.log(
                "SIDAT ADMIN: FCM token berhasil disimpan."
            );

        }

    } else {

        console.warn(
            "SIDAT ADMIN: FCM token belum tersedia."
        );

    }

} catch (error) {

    console.error(
        "SIDAT ADMIN: Sinkronisasi FCM gagal:",
        error
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
// ==========================================
// UPDATE FCM TOKEN - WARGA + ADMIN
// ==========================================

async function updatePushSubscription() {

    try {

        // ======================================
        // AMBIL FCM TOKEN
        // ======================================

        const token =
            localStorage.getItem(
                "sidat_fcm_native_token"
            );

        if (!token) {

            console.log(
                "SIDAT FCM: Token belum tersedia."
            );

            return;
        }


        // ======================================
        // AMBIL SESSION ACCESS TOKEN
        // ======================================

        const accessToken =
            localStorage.getItem(
                "sidat_access_token"
            );

        if (!accessToken) {

            console.log(
                "SIDAT FCM: Access token belum tersedia."
            );

            return;
        }


        // ======================================
        // AMBIL USER WARGA
        // ======================================

        const wargaUser =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) || "null"
            );


        // ======================================
        // AMBIL USER ADMIN
        // ======================================

        const adminUser =
            JSON.parse(
                localStorage.getItem(
                    "sidat_admin_user"
                ) || "null"
            );


        // ======================================
        // TENTUKAN USER AKTIF
        // ======================================

        const user =
            adminUser ||
            wargaUser;


        if (!user) {

            console.log(
                "SIDAT FCM: User belum tersedia."
            );

            return;
        }


        // ======================================
        // USER ID SUPABASE AUTH
        // ======================================

        const userId =
            user.id ||
            user.user_id;


        if (!userId) {

            console.error(
                "SIDAT FCM: user_id tidak ditemukan."
            );

            return;
        }


        // ======================================
        // CEK RESIDENT ID
        // ======================================

        const residentId =
            user.resident_id ||
            user.residentId ||
            user.id_resident ||
            null;


        // ======================================
        // CEK ROLE
        // ======================================

        const role =
            user.role ||
            (
                adminUser
                    ? "admin"
                    : "warga"
            );


        console.log(
            "SIDAT FCM: Sinkronisasi token."
        );

        console.log(
            "ROLE:",
            role
        );

        console.log(
            "USER ID:",
            userId
        );

        console.log(
            "RESIDENT ID:",
            residentId
        );


        // ======================================
        // CARI SUBSCRIPTION
        // ======================================

        let queryUrl =
            `${SUPABASE_URL}/rest/v1/push_subscriptions` +
            `?user_id=eq.${encodeURIComponent(userId)}`;


        const response =
            await fetch(
                queryUrl,
                {
                    method: "GET",

                    headers: {
                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "SIDAT FCM: Gagal mencari subscription:",
                errorText
            );

            return;
        }


        const subscriptions =
            await response.json();


        // ======================================
        // DATA YANG DISIMPAN
        // ======================================

        const payload = {

            fcm_token:
                token,

            updated_at:
                new Date().toISOString()

        };


        // WARGA
        if (
            role === "warga" &&
            residentId
        ) {

            payload.resident_id =
                residentId;

        }


        // ADMIN
        if (
            role === "admin"
        ) {

            payload.resident_id =
                null;

        }


        // ======================================
        // UPDATE DATA YANG SUDAH ADA
        // ======================================

        if (
            Array.isArray(
                subscriptions
            ) &&
            subscriptions.length > 0
        ) {

            const subscription =
                subscriptions[0];


            const updateResponse =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/push_subscriptions` +
                    `?id=eq.${encodeURIComponent(subscription.id)}`,
                    {
                        method: "PATCH",

                        headers: {
                            apikey:
                                SUPABASE_KEY,

                            Authorization:
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json",

                            Prefer:
                                "return=minimal"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            if (!updateResponse.ok) {

                console.error(
                    "SIDAT FCM: Gagal update token:",
                    await updateResponse.text()
                );

                return;
            }


            console.log(
                "SIDAT FCM: Token berhasil diperbarui."
            );

            return;
        }


        // ======================================
        // BELUM ADA → INSERT BARU
        // ======================================

        payload.user_id =
            userId;


        if (
            role === "warga" &&
            residentId
        ) {

            payload.resident_id =
                residentId;

        } else {

            payload.resident_id =
                null;

        }


        const insertResponse =
            await fetch(
                `${SUPABASE_URL}/rest/v1/push_subscriptions`,
                {
                    method: "POST",

                    headers: {
                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (!insertResponse.ok) {

            console.error(
                "SIDAT FCM: Gagal membuat subscription:",
                await insertResponse.text()
            );

            return;
        }


        console.log(
            "SIDAT FCM: FCM token berhasil disimpan."
        );


    } catch (error) {

        console.error(
            "SIDAT FCM: Error updatePushSubscription:",
            error
        );

    }

}


// ==========================================
// EXPORT AGAR FCM NATIVE DAPAT MEMANGGILNYA
// ==========================================

window.updatePushSubscription =
    updatePushSubscription;
