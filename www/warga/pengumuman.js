 // ==========================================
// SIDAT
// HALAMAN PENGUMUMAN WARGA
// KHUSUS TABEL announcements
// ==========================================


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );

const wargaData =
    localStorage.getItem(
        "sidat_user"
    );


// ==========================================
// CEK LOGIN
// ==========================================

if (
    !accessToken ||
    !wargaData
) {

    window.location.href =
        "../index.html";

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

    .replaceAll(
        "&",
        "&amp;"
    )

    .replaceAll(
        "<",
        "&lt;"
    )

    .replaceAll(
        ">",
        "&gt;"
    )

    .replaceAll(
        '"',
        "&quot;"
    )

    .replaceAll(
        "'",
        "&#039;"
    );

}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatTanggal(tanggal) {

    if (!tanggal) {

        return "-";

    }


    const waktu =
        new Date(
            tanggal
        );


    if (
        Number.isNaN(
            waktu.getTime()
        )
    ) {

        return "-";

    }


    return new Intl.DateTimeFormat(
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

    ).format(
        waktu
    );

}


// ==========================================
// AMBIL ELEMENT
// ==========================================

function ambilElementPengumuman() {

    return {

        loading:
            document.getElementById(
                "loading"
            ),

        announcementList:
            document.getElementById(
                "announcementList"
            ),

        emptyState:
            document.getElementById(
                "emptyState"
            ),

        errorState:
            document.getElementById(
                "errorState"
            )

    };

}


// ==========================================
// LOAD PENGUMUMAN
// ==========================================
// HANYA TABEL announcements
// ==========================================

async function loadPengumuman() {

    console.log(
        "SIDAT: Memuat pengumuman..."
    );


    const token =
        localStorage.getItem(
            "sidat_access_token"
        );


    if (!token) {

        throw new Error(
            "Session warga tidak ditemukan."
        );

    }


    const url =
        `${SUPABASE_URL}` +
        `/rest/v1/announcements` +
        `?select=id,title,content,created_at,is_active` +
        `&is_active=eq.true` +
        `&order=created_at.desc`;


    console.log(
        "SIDAT URL PENGUMUMAN:",
        url
    );


    const response =
        await fetch(
            url,
            {

                method:
                    "GET",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"

                }

            }
        );


    console.log(
        "SIDAT STATUS PENGUMUMAN:",
        response.status
    );


    if (!response.ok) {

        const errorText =
            await response.text();


        console.error(
            "SIDAT RESPONSE PENGUMUMAN:",
            errorText
        );


        throw new Error(
            errorText ||
            `Gagal memuat pengumuman. HTTP ${response.status}`
        );

    }


    const data =
        await response.json();


    console.log(
        "SIDAT DATA ANNOUNCEMENTS:",
        data
    );


    if (
        !Array.isArray(
            data
        )
    ) {

        console.warn(
            "SIDAT: Data announcements bukan array."
        );


        return [];

    }


    console.log(
        "SIDAT JUMLAH PENGUMUMAN:",
        data.length
    );


    return data;

}


// ==========================================
// RENDER PENGUMUMAN
// ==========================================

function renderPengumuman(
    data
) {

    console.log(
        "SIDAT: Render pengumuman:",
        data
    );


    // ======================================
    // AMBIL ELEMENT TERBARU
    // ======================================

    const {

        announcementList,
        emptyState

    } =
        ambilElementPengumuman();


    console.log(
        "SIDAT ELEMENT announcementList:",
        announcementList
    );


    // ======================================
    // CEK ELEMENT
    // ======================================

    if (
        !announcementList
    ) {

        console.error(
            "SIDAT: Element #announcementList tidak ditemukan."
        );


        console.error(
            "SIDAT: URL halaman:",
            window.location.href
        );


        console.error(
            "SIDAT: HTML BODY:",
            document.body?.innerHTML
        );


        return;

    }


    // ======================================
    // BERSIHKAN
    // ======================================

    announcementList.innerHTML =
        "";


    // ======================================
    // CEK DATA
    // ======================================

    if (
        !Array.isArray(
            data
        ) ||
        data.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }


        return;

    }


    // ======================================
    // SEMBUNYIKAN EMPTY
    // ======================================

    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    // ======================================
    // RENDER CARD
    // ======================================

    data.forEach(
        item => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "notification-card";


            card.dataset.id =
                String(
                    item.id ?? ""
                );


            const top =
                document.createElement(
                    "div"
                );


            top.className =
                "notification-top";


            const icon =
                document.createElement(
                    "div"
                );


            icon.className =
                "notification-icon";


            icon.textContent =
                "📢";


            const heading =
                document.createElement(
                    "div"
                );


            heading.className =
                "notification-heading";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                item.title ||
                "Pengumuman RT";


            const date =
                document.createElement(
                    "span"
                );


            date.className =
                "notification-date";


            date.textContent =
                formatTanggal(
                    item.created_at
                );


            heading.appendChild(
                title
            );


            heading.appendChild(
                date
            );


            top.appendChild(
                icon
            );


            top.appendChild(
                heading
            );


            const divider =
                document.createElement(
                    "div"
                );


            divider.className =
                "notification-divider";


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "notification-content";


            content.textContent =
                item.content ||
                "";


            card.appendChild(
                top
            );


            card.appendChild(
                divider
            );


            card.appendChild(
                content
            );


            announcementList.appendChild(
                card
            );

        }
    );


    console.log(
        "SIDAT: Pengumuman berhasil ditampilkan:",
        data.length
    );

}


// ==========================================
// TAMPILKAN PENGUMUMAN
// ==========================================

async function tampilkanPengumuman() {

    console.log(
        "SIDAT: Menampilkan pengumuman..."
    );


    const {

        loading,
        announcementList,
        emptyState,
        errorState

    } =
        ambilElementPengumuman();


    // ======================================
    // DEBUG ELEMENT
    // ======================================

    console.log(
        "SIDAT ELEMENT HTML:",
        {

            loading:
                !!loading,

            announcementList:
                !!announcementList,

            emptyState:
                !!emptyState,

            errorState:
                !!errorState

        }
    );


    // ======================================
    // RESET
    // ======================================

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (announcementList) {

        announcementList.innerHTML =
            "";

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }


    try {

        // ==================================
        // AMBIL DATA
        // ==================================

        const data =
            await loadPengumuman();


        console.log(
            "SIDAT JUMLAH PENGUMUMAN:",
            data.length
        );


        // ==================================
        // HILANGKAN LOADING
        // ==================================

        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        // ==================================
        // RENDER
        // ==================================

        renderPengumuman(
            data
        );

    }

    catch (
        error
    ) {

        console.error(
            "SIDAT: Gagal memuat pengumuman:",
            error
        );


        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        if (errorState) {

            errorState.classList.remove(
                "hidden"
            );

        }

    }

}


// ==========================================
// KEMBALI DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// EXPORT
// ==========================================

window.kembaliDashboard =
    kembaliDashboard;

window.loadPengumuman =
    loadPengumuman;

window.tampilkanPengumuman =
    tampilkanPengumuman;


// ==========================================
// START
// ==========================================

function mulaiPengumuman() {

    console.log(
        "SIDAT: DOM siap."
    );


    console.log(
        "SIDAT: announcementList:",
        document.getElementById(
            "announcementList"
        )
    );


    tampilkanPengumuman();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        mulaiPengumuman
    );

}

else {

    mulaiPengumuman();

}