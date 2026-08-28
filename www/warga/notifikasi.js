// ==========================================
// SIDAT
// HALAMAN NOTIFIKASI WARGA
// KHUSUS TABEL notifications
// STATUS BACA: notification_reads
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
// ELEMENT
// ==========================================

const loadingNotifikasi =
    document.getElementById(
        "loadingNotifikasi"
    );


const notifikasiList =
    document.getElementById(
        "notifikasiList"
    );


const emptyNotifikasi =
    document.getElementById(
        "emptyNotifikasi"
    );


const errorNotifikasi =
    document.getElementById(
        "errorNotifikasi"
    );


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

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

function formatTanggal(
    tanggal
) {

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
// AMBIL RESIDENT ID
// ==========================================

function ambilResidentId() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) ||
                "{}"
            );


        return (

            data.resident_id ||

            data.residentId ||

            data.user?.resident_id ||

            data.profile?.resident_id ||

            null

        );

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal membaca resident_id:",
            error
        );


        return null;

    }

}


// ==========================================
// AMBIL USER ID
// ==========================================

function ambilUserId() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) ||
                "{}"
            );


        return (
            data.id ||
            null
        );

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal membaca user_id:",
            error
        );


        return null;

    }

}


// ==========================================
// LOAD NOTIFIKASI
// KHUSUS TABLE notifications
// ==========================================

async function loadNotifikasi() {

    console.log(
        "SIDAT: Memuat notifikasi..."
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


    const residentId =
        ambilResidentId();


    const userId =
        ambilUserId();


    console.log(
        "SIDAT RESIDENT ID:",
        residentId
    );


    console.log(
        "SIDAT USER ID:",
        userId
    );


    if (!residentId) {

        throw new Error(
            "Resident ID tidak ditemukan."
        );

    }


    if (!userId) {

        throw new Error(
            "User ID tidak ditemukan."
        );

    }


    // ======================================
    // QUERY NOTIFICATIONS
    // ======================================

    const urlNotifikasi =
        `${SUPABASE_URL}` +
        `/rest/v1/notifications` +
        `?select=*` +
        `&or=` +
        `(target_type.eq.all,` +
        `and(` +
        `target_type.eq.resident,` +
        `target_resident_id.eq.${encodeURIComponent(
            residentId
        )}` +
        `))` +
        `&order=created_at.desc`;


    console.log(
        "SIDAT URL NOTIFIKASI:",
        urlNotifikasi
    );


    const response =
        await fetch(

            urlNotifikasi,

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
        "SIDAT STATUS NOTIFIKASI:",
        response.status
    );


    if (!response.ok) {

        const errorText =
            await response.text();


        console.error(
            "SIDAT ERROR NOTIFIKASI:",
            errorText
        );


        throw new Error(
            errorText ||
            `Gagal memuat notifikasi (${response.status})`
        );

    }


    const data =
        await response.json();


    console.log(
        "SIDAT DATA NOTIFICATIONS:",
        data
    );


    if (
        !Array.isArray(data)
    ) {

        return [];

    }


    // ======================================
    // AMBIL STATUS SUDAH DIBACA
    // ======================================

    const urlReads =
        `${SUPABASE_URL}` +
        `/rest/v1/notification_reads` +
        `?select=notification_id,read_at` +
        `&user_id=eq.${encodeURIComponent(
            userId
        )}`;


    console.log(
        "SIDAT URL NOTIFICATION READS:",
        urlReads
    );


    const readResponse =
        await fetch(

            urlReads,

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
        "SIDAT STATUS READS:",
        readResponse.status
    );


    if (!readResponse.ok) {

        const errorText =
            await readResponse.text();


        console.error(
            "SIDAT ERROR READS:",
            errorText
        );


        throw new Error(
            errorText ||
            "Gagal mengambil status baca."
        );

    }


    const readData =
        await readResponse.json();


    console.log(
        "SIDAT DATA READS:",
        readData
    );


    // ======================================
    // SET NOTIFIKASI SUDAH DIBACA
    // ======================================

    const sudahDibaca =
        new Set(

            Array.isArray(
                readData
            )

                ? readData.map(
                    item =>
                        String(
                            item.notification_id
                        )
                )

                : []

        );


    // ======================================
    // GABUNGKAN STATUS BACA
    // ======================================

    return data.map(
        item => ({

            ...item,

            is_read:
                sudahDibaca.has(
                    String(
                        item.id
                    )
                )

        })
    );

}


// ==========================================
// RENDER NOTIFIKASI
// ==========================================

function renderNotifikasi(
    data
) {

    console.log(
        "SIDAT: Render notifikasi:",
        data
    );


    if (notifikasiList) {

        notifikasiList.innerHTML =
            "";

    }


    // ======================================
    // KOSONG
    // ======================================

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        if (emptyNotifikasi) {

            emptyNotifikasi.classList.remove(
                "hidden"
            );

        }


        return;

    }


    if (emptyNotifikasi) {

        emptyNotifikasi.classList.add(
            "hidden"
        );

    }


    if (!notifikasiList) {

        console.error(
            "SIDAT: Element #notifikasiList tidak ditemukan."
        );

        return;

    }


    // ======================================
    // RENDER CARD
    // ======================================

    notifikasiList.innerHTML =

        data.map(
            item => {

                const isUnread =
                    item.is_read !== true;


                const unreadClass =
                    isUnread
                        ? " notifikasi-unread"
                        : "";


                const icon =
                    "📝";


                return `

                    <article
                        class="
                            notifikasi-card
                            ${unreadClass}
                        "
                        data-id="${escapeHTML(
                            item.id
                        )}"
                    >

                        <div
                            class="notifikasi-top"
                        >

                            <div
                                class="notifikasi-icon"
                            >
                                ${icon}
                            </div>


                            <div
                                class="notifikasi-heading"
                            >

                                <h3>
                                    ${escapeHTML(
                                        item.title ||
                                        "Notifikasi"
                                    )}
                                </h3>


                                <span
                                    class="notifikasi-date"
                                >
                                    ${formatTanggal(
                                        item.created_at
                                    )}
                                </span>

                            </div>

                        </div>


                        <div
                            class="notifikasi-divider"
                        ></div>


                        <div
                            class="notifikasi-content"
                        >

                            ${escapeHTML(
                                item.message ||
                                ""
                            )}

                        </div>


                        ${
                            isUnread
                                ? `

                                    <div
                                        class="
                                            notifikasi-action
                                        "
                                    >

                                        <button
                                            type="button"
                                            class="
                                                notifikasi-read-button
                                            "
                                            onclick="
                                                tandaiNotifikasiDibaca(
                                                    '${escapeHTML(
                                                        item.id
                                                    )}'
                                                )
                                            "
                                        >

                                            ✓ Tandai sudah dibaca

                                        </button>

                                    </div>

                                `
                                : ""
                        }

                    </article>

                `;

            }
        )

        .join("");

}


// ==========================================
// TAMPILKAN NOTIFIKASI
// ==========================================

async function tampilkanNotifikasi() {

    console.log(
        "SIDAT: Menampilkan notifikasi..."
    );


    // ======================================
    // RESET
    // ======================================

    if (loadingNotifikasi) {

        loadingNotifikasi.classList.remove(
            "hidden"
        );

    }


    if (notifikasiList) {

        notifikasiList.innerHTML =
            "";

    }


    if (emptyNotifikasi) {

        emptyNotifikasi.classList.add(
            "hidden"
        );

    }


    if (errorNotifikasi) {

        errorNotifikasi.classList.add(
            "hidden"
        );

    }


    try {

        const data =
            await loadNotifikasi();


        if (loadingNotifikasi) {

            loadingNotifikasi.classList.add(
                "hidden"
            );

        }


        renderNotifikasi(
            data
        );

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal memuat notifikasi:",
            error
        );


        if (loadingNotifikasi) {

            loadingNotifikasi.classList.add(
                "hidden"
            );

        }


        if (errorNotifikasi) {

            errorNotifikasi.classList.remove(
                "hidden"
            );

        }

    }

}


// ==========================================
// TANDAI SUDAH DIBACA
// ==========================================

async function tandaiNotifikasiDibaca(
    notificationId
) {

    if (!notificationId) {

        return;

    }


    try {

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            throw new Error(
                "Session warga tidak ditemukan."
            );

        }


        const userId =
            ambilUserId();


        if (!userId) {

            throw new Error(
                "User ID tidak ditemukan."
            );

        }


        const payload = {

            notification_id:
                notificationId,

            user_id:
                userId,

            read_at:
                new Date().toISOString()

        };


        console.log(
            "SIDAT PAYLOAD READ:",
            payload
        );


        const response =
            await fetch(

                `${SUPABASE_URL}` +
                `/rest/v1/notification_reads`,

                {

                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Prefer":
                            "return=representation"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }

            );


        const responseText =
            await response.text();


        console.log(
            "SIDAT STATUS SIMPAN READ:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                responseText ||
                `Gagal menyimpan status baca. HTTP ${response.status}`
            );

        }


        console.log(
            "SIDAT: Notifikasi berhasil ditandai sudah dibaca."
        );


        await tampilkanNotifikasi();

    }

    catch (error) {

        console.error(
            "SIDAT: Gagal menandai notifikasi:",
            error
        );


        alert(
            "Gagal menandai notifikasi sudah dibaca."
        );

    }

}


// ==========================================
// KEMBALI KE DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// EXPORT
// ==========================================

window.loadNotifikasi =
    loadNotifikasi;

window.tampilkanNotifikasi =
    tampilkanNotifikasi;

window.tandaiNotifikasiDibaca =
    tandaiNotifikasiDibaca;

window.kembaliDashboard =
    kembaliDashboard;


// ==========================================
// START
// ==========================================

function mulaiNotifikasi() {

    console.log(
        "SIDAT: DOM siap."
    );


    tampilkanNotifikasi();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        mulaiNotifikasi
    );

}

else {

    mulaiNotifikasi();

}