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
// SIDAT SESSION SYNC
// ==========================================

async function syncSidatSession() {

    try {

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "syncSidatSession:",
                error
            );

            return;

        }

        if (!session) {

            console.log(
                "Belum ada session."
            );

            return;

        }

        console.log(
            "Session berhasil dipulihkan."
        );

        localStorage.setItem(
            "sidat_access_token",
            session.access_token
        );

        localStorage.setItem(
            "sidat_refresh_token",
            session.refresh_token
        );

        const warga =
            JSON.parse(
                localStorage.getItem("sidat_user") || "null"
            );

        const admin =
            JSON.parse(
                localStorage.getItem("sidat_admin_user") || "null"
            );

        // ==========================================
        // AUTO LOGIN WARGA
        // ==========================================

        if (
            warga?.resident_id &&
            !location.pathname.includes("/warga/")
        ) {

            window.location.replace(
                "warga/dashboard.html"
            );

            return;

        }

        // ==========================================
        // AUTO LOGIN ADMIN
        // ==========================================

        if (
            admin &&
            admin.role === "admin" &&
            !location.pathname.includes("/admin/")
        ) {

            window.location.replace(
                "admin/dashboard.html"
            );

            return;

        }

    } catch (err) {

        console.error(
            "syncSidatSession:",
            err
        );

    }

}


// ==========================================
// LISTENER AUTH
// ==========================================

supabaseClient.auth.onAuthStateChange(

    (event, session) => {

        console.log(
            "SIDAT AUTH EVENT:",
            event
        );

        if (session) {

            localStorage.setItem(
                "sidat_access_token",
                session.access_token
            );

            localStorage.setItem(
                "sidat_refresh_token",
                session.refresh_token
            );

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


// ==========================================
// JALANKAN SESSION SYNC
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        syncSidatSession();

    }
);


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
// LOGIN ADMIN
// ==========================================

document
    .getElementById("adminLoginForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideError("adminError");

            const button =
                document.getElementById(
                    "adminLoginButton"
                );

            const email =
                document
                    .getElementById("adminEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("adminPassword")
                    .value;

            // ==================================
            // VALIDASI
            // ==================================

            if (!email || !password) {

                showError(
                    "adminError",
                    "Email dan password wajib diisi."
                );

                return;

            }

            button.disabled = true;
            button.textContent = "MEMPROSES...";

            try {

                // ==================================
                // LOGIN ADMIN
                // ==================================

                const {
                    data,
                    error
                } =
                await supabaseClient.auth
                .signInWithPassword({

                    email,
                    password

                });

                if (error)
                    throw error;

                if (
                    !data?.session
                ) {

                    throw new Error(
                        "Session admin tidak berhasil dibuat."
                    );

                }

                // ==================================
                // SIMPAN TOKEN
                // ==================================

                localStorage.setItem(
                    "sidat_access_token",
                    data.session.access_token
                );

                localStorage.setItem(
                    "sidat_refresh_token",
                    data.session.refresh_token
                );

                // ==================================
                // AMBIL PROFILE
                // ==================================

                const {
                    data: profile,
                    error: profileError
                } =
                await supabaseClient
                    .from("profiles")
                    .select("*")
                    .eq(
                        "user_id",
                        data.user.id
                    )
                    .single();

                if (profileError)
                    throw profileError;

                if (
                    profile.role !== "admin"
                ) {

                    await supabaseClient
                        .auth
                        .signOut();

                    throw new Error(
                        "Akun ini bukan admin."
                    );

                }

                // ==================================
                // SIMPAN ADMIN
                // ==================================

                localStorage.setItem(

                    "sidat_admin_user",

                    JSON.stringify({

                        user_id:
                            data.user.id,

                        email:
                            data.user.email,

                        role:
                            profile.role

                    })

                );

                // ==================================
                // VALIDASI RPC
                // ==================================

                const {

                    data: isAdmin,
                    error: rpcError

                } =
                await supabaseClient
                    .rpc("is_admin");

                if (rpcError)
                    throw rpcError;

                if (!isAdmin) {

                    await supabaseClient
                        .auth
                        .signOut();

                    throw new Error(
                        "Hak akses admin ditolak."
                    );

                }

                // ==================================
                // LOGIN BERHASIL
                // ==================================

                console.log(
                    "LOGIN ADMIN BERHASIL"
                );

                window.location.replace(
                    "admin/dashboard.html"
                );

            }

            catch (error) {

                console.error(error);

                showError(
                    "adminError",
                    error.message
                );

            }

            finally {

                button.disabled = false;

                button.textContent =
                    "MASUK";

            }

        }
    );
document.addEventListener("DOMContentLoaded", () => {

    const App = window.Capacitor?.Plugins?.App;

    if (!App) {
        return;
    }

    App.addListener("backButton", () => {

        if (window.history.length > 1) {

            window.history.back();
            return;

        }

        if (confirm("Keluar dari aplikasi SIDAT?")) {

            App.exitApp();

        }

    });

});
