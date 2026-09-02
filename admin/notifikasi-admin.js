// ==========================================
// SIDAT
// NOTIFIKASI ADMIN
// ==========================================

console.log(
    "SIDAT: NOTIFIKASI ADMIN JS AKTIF"
);


// ==========================================
// ELEMENT
// ==========================================

const notificationList =
    document.getElementById(
        "notificationList"
    );

const notificationLoading =
    document.getElementById(
        "notificationLoading"
    );

const notificationEmpty =
    document.getElementById(
        "notificationEmpty"
    );

const notificationMessage =
    document.getElementById(
        "notificationMessage"
    );

const unreadCount =
    document.getElementById(
        "unreadCount"
    );


// ==========================================
// TOKEN
// ==========================================

function getAdminToken() {

    return localStorage.getItem(
        "sidat_access_token"
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTMLAdmin(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// FORMAT WAKTU
// ==========================================

function formatWaktuAdmin(
    tanggal
) {

    if (!tanggal) {

        return "";

    }


    const date =
        new Date(
            tanggal
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        "id-ID",
        {

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


// ==========================================
// TAMPILKAN PESAN
// ==========================================

function tampilkanPesanAdmin(
    pesan
) {

    if (!notificationMessage) {

        return;

    }


    notificationMessage.textContent =
        pesan;


    notificationMessage.classList.remove(
        "hidden"
    );

}


// ==========================================
// SEMBUNYIKAN PESAN
// ==========================================

function sembunyikanPesanAdmin() {

    if (!notificationMessage) {

        return;

    }


    notificationMessage.classList.add(
        "hidden"
    );

}


// ==========================================
// LOAD NOTIFIKASI ADMIN
// ==========================================

async function loadNotifikasiAdmin() {

    console.log(
        "SIDAT: Memuat notifikasi admin..."
    );

    if (!notificationList) {
        return;
    }

    const {
        data: {
            session
        },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {

        console.error(
            "SIDAT: Session admin tidak ditemukan.",
            sessionError
        );

        tampilkanPesanAdmin(
            "Session admin tidak ditemukan."
        );

        return;
    }

    const token =
        session.access_token;

    localStorage.setItem(
        "sidat_access_token",
        token
    );

    // lanjutkan kode lama di bawah sini...
    if (!token) {

        console.error(
            "SIDAT: Session admin tidak ditemukan."
        );

        tampilkanPesanAdmin(
            "Session admin tidak ditemukan."
        );

        return;

    }


    if (notificationLoading) {

        notificationLoading.style.display =
            "block";

    }


    if (notificationEmpty) {

        notificationEmpty.classList.add(
            "hidden"
        );

    }


    sembunyikanPesanAdmin();


    try {

        const response =
            await fetch(

                `${SUPABASE_URL}` +
                `/rest/v1/notifications` +
                `?select=*` +
                `&target_type=eq.admin` +
                `&order=created_at.desc`,

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"

                    }

                }

            );


        console.log(
            "SIDAT STATUS NOTIFIKASI ADMIN:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "SIDAT ERROR:",
                errorText
            );


            throw new Error(
                errorText ||
                "Gagal mengambil notifikasi admin."
            );

        }


        const data =
            await response.json();


        console.log(
            "SIDAT DATA NOTIFIKASI ADMIN:",
            data
        );


        if (notificationLoading) {

            notificationLoading.style.display =
                "none";

        }


        renderNotifikasiAdmin(
            data
        );

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal memuat notifikasi admin:",
            error
        );


        if (notificationLoading) {

            notificationLoading.style.display =
                "none";

        }


        tampilkanPesanAdmin(
            "Gagal memuat notifikasi."
        );

    }

}


// ==========================================
// RENDER
// ==========================================

function renderNotifikasiAdmin(
    data
) {

    if (!Array.isArray(data)) {

        data = [];

    }


    const belumDibaca =
        data.filter(
            item =>
                item.is_read === false
        ).length;


    if (unreadCount) {

        unreadCount.textContent =
            belumDibaca;

    }


    if (
        data.length === 0
    ) {

        notificationList.innerHTML =
            "";


        if (notificationEmpty) {

            notificationEmpty.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (notificationEmpty) {

        notificationEmpty.classList.add(
            "hidden"
        );

    }


    notificationList.innerHTML =
        data
            .map(
                item => {

                    const unread =
                        item.is_read === false;


                    return `

                        <article
                            class="notification-card ${
                                unread
                                    ? "unread"
                                    : "read"
                            }"
                        >

                            <div
                                class="notification-top"
                            >

                                <div
                                    class="notification-icon"
                                >
                                    📢
                                </div>


                                <div
                                    class="notification-content"
                                >

                                    <h3
                                        class="notification-title"
                                    >
                                        ${escapeHTMLAdmin(
                                            item.title
                                        )}
                                    </h3>


                                    <p
                                        class="notification-message-text"
                                    >
                                        ${escapeHTMLAdmin(
                                            item.message
                                        )}
                                    </p>


                                    <div
                                        class="notification-time"
                                    >
                                        ${formatWaktuAdmin(
                                            item.created_at
                                        )}
                                    </div>

                                </div>


                                ${
                                    unread
                                        ? `
                                            <span
                                                class="unread-dot"
                                            ></span>
                                        `
                                        : ""
                                }

                            </div>


                            <div
                                class="notification-actions"
                            >

                                ${
                                    unread
                                        ? `
                                            <button
                                                type="button"
                                                class="notification-action btn-read"
                                                onclick="
                                                    tandaiNotifikasiAdminDibaca(
                                                        '${item.id}'
                                                    )
                                                "
                                            >
                                                ✓ Tandai sudah dibaca
                                            </button>
                                        `
                                        : `
                                            <button
                                                type="button"
                                                class="notification-action btn-read"
                                                disabled
                                            >
                                                ✓ Sudah dibaca
                                            </button>
                                        `
                                }


                               <button
    type="button"
    class="notification-action btn-report"
    onclick="
        bukaLaporanAdmin(
            '${item.report_id || ""}'
        )
    "
>
    👁 Lihat Laporan
</button>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


// ==========================================
// TANDAI SUDAH DIBACA
// ==========================================

async function tandaiNotifikasiAdminDibaca(
    id
) {

    if (!id) {

        return;

    }


    const token =
        getAdminToken();


    if (!token) {

        alert(
            "Session admin tidak ditemukan."
        );

        return;

    }


    try {

        console.log(
            "SIDAT: Menandai notifikasi admin:",
            id
        );


        const response =
            await fetch(

                `${SUPABASE_URL}` +
                `/rest/v1/notifications` +
                `?id=eq.${encodeURIComponent(
                    id
                )}` +
                `&target_type=eq.admin`,

                {

                    method:
                        "PATCH",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"

                    },

                    body:
                        JSON.stringify({
                            is_read:
                                true
                        })

                }

            );


        console.log(
            "SIDAT STATUS UPDATE:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "SIDAT ERROR UPDATE:",
                errorText
            );


            throw new Error(
                errorText ||
                "Gagal menandai notifikasi."
            );

        }


        await loadNotifikasiAdmin();

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal menandai sudah dibaca:",
            error
        );


        alert(
            "Gagal menandai notifikasi sudah dibaca."
        );

    }

}


// ==========================================
// BUKA LAPORAN TERTENTU
// ==========================================

// ==========================================
// BUKA LAPORAN TERTENTU
// ==========================================

function bukaLaporanAdmin(reportId) {

    if (!reportId) {

        console.warn(
            "SIDAT: report_id tidak tersedia."
        );

        window.location.href =
            "admin-laporan.html";

        return;

    }


    console.log(
        "SIDAT: Membuka laporan:",
        reportId
    );


    window.location.href =
        "admin-laporan.html?report_id=" +
        encodeURIComponent(
            reportId
        );

}


// ==========================================
// KEMBALI DASHBOARD
// ==========================================

function kembaliDashboardAdmin() {

    window.location.href =
        "dashboard.html";

}
// ==========================================
// POPUP NOTIFIKASI ADMIN
// ==========================================

let notifikasiAdminTerakhir = null;
let popupNotifikasiAdminAktif = false;


// ------------------------------------------
// BUAT POPUP
// ------------------------------------------

function tampilkanPopupNotifikasiAdmin(
    notification
) {

    if (!notification) {
        return;
    }

    // Jangan tampilkan popup yang sama
    if (
        popupNotifikasiAdminAktif
    ) {
        return;
    }

    popupNotifikasiAdminAktif = true;


    let popup =
        document.getElementById(
            "sidatAdminNotificationPopup"
        );


    if (!popup) {

        popup =
            document.createElement(
                "div"
            );

        popup.id =
            "sidatAdminNotificationPopup";

        popup.innerHTML = `

            <div
                style="
                    position:fixed;
                    top:20px;
                    left:20px;
                    right:20px;
                    z-index:99999;
                    background:#ffffff;
                    border-radius:16px;
                    box-shadow:0 8px 30px rgba(0,0,0,.25);
                    padding:18px;
                    border-left:5px solid #198754;
                    font-family:Arial,sans-serif;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:flex-start;
                        gap:12px;
                    "
                >

                    <div
                        style="
                            font-size:30px;
                            line-height:1;
                        "
                    >
                        🔔
                    </div>

                    <div
                        style="
                            flex:1;
                        "
                    >

                        <div
                            style="
                                font-size:16px;
                                font-weight:700;
                                margin-bottom:6px;
                            "
                        >
                            Laporan Baru
                        </div>

                        <div
                            id="sidatAdminPopupTitle"
                            style="
                                font-size:15px;
                                font-weight:600;
                                margin-bottom:4px;
                            "
                        ></div>

                        <div
                            id="sidatAdminPopupMessage"
                            style="
                                font-size:14px;
                                color:#555;
                            "
                        ></div>

                    </div>

                </div>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        margin-top:15px;
                    "
                >

                    <button
                        type="button"
                        id="sidatAdminPopupLihat"
                        style="
                            flex:1;
                            border:0;
                            border-radius:10px;
                            padding:11px;
                            background:#198754;
                            color:white;
                            font-weight:600;
                        "
                    >
                        👁 Lihat Laporan
                    </button>


                    <button
                        type="button"
                        id="sidatAdminPopupTutup"
                        style="
                            border:1px solid #ddd;
                            border-radius:10px;
                            padding:11px 15px;
                            background:#fff;
                        "
                    >
                        Tutup
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        document
            .getElementById(
                "sidatAdminPopupTutup"
            )
            .onclick =
            function () {

                popup.remove();

                popupNotifikasiAdminAktif =
                    false;

            };


        document
            .getElementById(
                "sidatAdminPopupLihat"
            )
            .onclick =
            function () {

                const reportId =
                    notification.report_id;

                popup.remove();

                popupNotifikasiAdminAktif =
                    false;

                bukaLaporanAdmin(
                    reportId
                );

            };

    }


    document
        .getElementById(
            "sidatAdminPopupTitle"
        )
        .textContent =
        notification.title ||
        "Ada laporan baru";


    document
        .getElementById(
            "sidatAdminPopupMessage"
        )
        .textContent =
        notification.message ||
        "Warga mengirim laporan baru.";

}


// ==========================================
// CEK NOTIFIKASI BARU
// ==========================================

async function cekNotifikasiBaruAdmin() {

    try {

        const {
            data: {
                session
            }
        } =
            await supabaseClient.auth.getSession();


        if (!session) {
            return;
        }


        const token =
            session.access_token;


        const response =
            await fetch(

                `${SUPABASE_URL}` +
                `/rest/v1/notifications` +
                `?select=*` +
                `&target_type=eq.admin` +
                `&is_read=eq.false` +
                `&order=created_at.desc` +
                `&limit=1`,

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"

                    }

                }

            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {
            return;
        }


        const terbaru =
            data[0];


        // Pertama kali halaman dibuka:
        // jangan munculkan popup untuk
        // notifikasi lama.
        if (
            notifikasiAdminTerakhir === null
        ) {

            notifikasiAdminTerakhir =
                terbaru.id;

            return;

        }


        // Tidak ada notifikasi baru
        if (
            terbaru.id ===
            notifikasiAdminTerakhir
        ) {
            return;
        }


        // Ada notifikasi baru
        notifikasiAdminTerakhir =
            terbaru.id;


        console.log(
            "SIDAT: NOTIFIKASI ADMIN BARU:",
            terbaru
        );


        tampilkanPopupNotifikasiAdmin(
            terbaru
        );


        // Perbarui daftar notifikasi
        await loadNotifikasiAdmin();

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal mengecek notifikasi baru:",
            error
        );

    }

}


// ==========================================
// MULAI PEMANTAUAN POPUP
// ==========================================

let intervalNotifikasiAdmin =
    null;


function mulaiPemantauanNotifikasiAdmin() {

    if (
        intervalNotifikasiAdmin
    ) {
        clearInterval(
            intervalNotifikasiAdmin
        );
    }


    // Cek setiap 5 detik
    intervalNotifikasiAdmin =
        setInterval(
            cekNotifikasiBaruAdmin,
            5000
        );


    // Cek awal
    cekNotifikasiBaruAdmin();

            }


// ==========================================
// INIT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SIDAT: INIT NOTIFIKASI ADMIN"
        );


        loadNotifikasiAdmin();

        mulaiPemantauanNotifikasiAdmin();

    }
);

// ==========================================
// EXPORT
// ==========================================

window.loadNotifikasiAdmin =
    loadNotifikasiAdmin;

window.tandaiNotifikasiAdminDibaca =
    tandaiNotifikasiAdminDibaca;

window.bukaLaporanAdmin =
    bukaLaporanAdmin;

window.kembaliDashboardAdmin =
    kembaliDashboardAdmin;

console.log(
    "SIDAT: NOTIFIKASI ADMIN SIAP."
);
