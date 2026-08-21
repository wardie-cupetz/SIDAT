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


    const token =
        getAdminToken();


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
// INIT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SIDAT: INIT NOTIFIKASI ADMIN"
        );


        loadNotifikasiAdmin();

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