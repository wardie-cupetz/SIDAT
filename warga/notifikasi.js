// =========================================================
// SIDAT
// NOTIFIKASI WARGA
//
// Scope dibuat terisolasi agar tidak bentrok dengan
// warga-menu.js atau JavaScript halaman lainnya.
// =========================================================

(function () {

    "use strict";


    // =====================================================
    // ELEMENT
    // =====================================================

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

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );

    const notificationSummary =
        document.getElementById(
            "notificationSummary"
        );

    const totalNotifikasi =
        document.getElementById(
            "totalNotifikasi"
        );

    const totalBelumDibaca =
        document.getElementById(
            "totalBelumDibaca"
        );


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    }


    // =====================================================
    // FORMAT TANGGAL
    // =====================================================

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
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(waktu);

    }


    // =====================================================
    // AMBIL DATA USER
    // =====================================================

    function ambilDataUser() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) || "{}"
            );

        }

        catch (error) {

            console.error(
                "SIDAT: Gagal membaca sidat_user:",
                error
            );

            return {};

        }

    }


    // =====================================================
    // AMBIL RESIDENT ID
    // =====================================================

    function ambilResidentId() {

        const data =
            ambilDataUser();


        return (

            data.resident_id ||

            data.residentId ||

            data.user?.resident_id ||

            data.profile?.resident_id ||

            null

        );

    }


    // =====================================================
    // AMBIL USER ID
    // =====================================================

    function ambilUserId() {

        const data =
            ambilDataUser();


        return (

            data.id ||

            data.user_id ||

            data.user?.id ||

            null

        );

    }


    // =====================================================
    // NORMALISASI JENIS
    // =====================================================

    function normalisasiJenis(item) {

        const sumber = [

            item?.type,

            item?.notification_type,

            item?.category,

            item?.kind,

            item?.target_page,

            item?.target_url

        ];


        const teks =
            sumber
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


        if (
            teks.includes("ronda")
        ) {

            return "jadwal_ronda";

        }


        if (
            teks.includes("agenda")
        ) {

            return "agenda";

        }


        if (
            teks.includes("pengumuman") ||
            teks.includes("announcement")
        ) {

            return "pengumuman";

        }


        if (
            teks.includes("laporan") ||
            teks.includes("report")
        ) {

            return "laporan";

        }


        const isi =
            [
                item?.title,
                item?.message
            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        if (
            isi.includes("ronda")
        ) {

            return "jadwal_ronda";

        }


        if (
            isi.includes("agenda")
        ) {

            return "agenda";

        }


        if (
            isi.includes("pengumuman")
        ) {

            return "pengumuman";

        }


        if (
            isi.includes("laporan")
        ) {

            return "laporan";

        }


        return "umum";

    }


    // =====================================================
    // LABEL JENIS
    // =====================================================

    function labelJenis(jenis) {

        switch (jenis) {

            case "laporan":
                return "Laporan";

            case "pengumuman":
                return "Pengumuman";

            case "agenda":
                return "Agenda";

            case "jadwal_ronda":
                return "Jadwal Ronda";

            default:
                return "Notifikasi";

        }

    }


    // =====================================================
    // ICON JENIS
    // =====================================================

    function iconJenis(jenis) {

        switch (jenis) {

            case "laporan":

                return `
                    <svg viewBox="0 0 24 24">
                        <path d="M6 2h9l3 3v17H6z"></path>
                        <path d="M14 2v4h4"></path>
                        <path d="M9 11h6"></path>
                        <path d="M9 15h6"></path>
                        <path d="M9 19h4"></path>
                    </svg>
                `;


            case "pengumuman":

                return `
                    <svg viewBox="0 0 24 24">
                        <path d="M3 11v2"></path>
                        <path d="M6 9v6"></path>
                        <path d="M9 8v8"></path>
                        <path d="M9 8l10-4v16L9 16"></path>
                        <path d="M6 15l2 6h3l-2-6"></path>
                    </svg>
                `;


            case "agenda":

                return `
                    <svg viewBox="0 0 24 24">
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="17"
                            rx="2"
                        ></rect>

                        <path d="M16 2v4"></path>
                        <path d="M8 2v4"></path>
                        <path d="M3 9h18"></path>

                        <path d="M8 13h3"></path>
                        <path d="M13 13h3"></path>
                        <path d="M8 17h3"></path>
                    </svg>
                `;


            case "jadwal_ronda":

                return `
                    <svg viewBox="0 0 24 24">
                        <path d="M12 3v18"></path>
                        <path d="M7 7h10"></path>
                        <path d="M6 21h12"></path>
                        <path d="M8 7v5a4 4 0 0 0 8 0V7"></path>
                        <path d="M5 3h14"></path>
                    </svg>
                `;


            default:

                return `
                    <svg viewBox="0 0 24 24">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                        <path d="M10 21h4"></path>
                    </svg>
                `;

        }

    }


    // =====================================================
    // REFERENCE ID
    // =====================================================

    function ambilReferenceId(
        item,
        jenis
    ) {

        const kandidat = [

            item?.reference_id,

            item?.target_id,

            item?.data_id,

            item?.record_id,

            item?.source_id,

            item?.report_id,

            item?.laporan_id,

            item?.announcement_id,

            item?.pengumuman_id,

            item?.agenda_id,

            item?.ronda_id,

            item?.schedule_id,

            item?.ronda_schedule_id

        ];


        const ditemukan =
            kandidat.find(
                value =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
            );


        return ditemukan
            ? String(ditemukan)
            : null;

    }


    // =====================================================
    // TARGET URL LANGSUNG
    // =====================================================

    function ambilTargetUrlLangsung(item) {

        const kandidat = [

            item?.target_url,

            item?.url,

            item?.link,

            item?.target_path,

            item?.path

        ];


        const ditemukan =
            kandidat.find(
                value =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
            );


        return ditemukan
            ? String(ditemukan)
            : null;

    }


    // =====================================================
    // TENTUKAN TUJUAN
    // =====================================================

    function tentukanTujuan(item) {

        const jenis =
            normalisasiJenis(
                item
            );


        const referenceId =
            ambilReferenceId(
                item,
                jenis
            );


        const targetLangsung =
            ambilTargetUrlLangsung(
                item
            );


        if (
            targetLangsung
        ) {

            return {

                jenis,

                url:
                    targetLangsung,

                referenceId

            };

        }


        switch (jenis) {

            case "laporan":

                return {

                    jenis,

                    url:
                        "laporan.html",

                    referenceId

                };


            case "pengumuman":

                return {

                    jenis,

                    url:
                        "pengumuman.html",

                    referenceId

                };


            case "agenda":

                return {

                    jenis,

                    url:
                        "agenda.html",

                    referenceId

                };


            case "jadwal_ronda":

                return {

                    jenis,

                    url:
                        "jadwal-ronda.html",

                    referenceId

                };


            default:

                return {

                    jenis,

                    url: null,

                    referenceId

                };

        }

    }


    // =====================================================
    // BANGUN URL
    // =====================================================

    function bangunUrlTujuan(item) {

        const tujuan =
            tentukanTujuan(
                item
            );


        if (
            !tujuan.url
        ) {

            return null;

        }


        let url =
            tujuan.url;


        if (
            tujuan.referenceId
        ) {

            const separator =
                url.includes("?")
                    ? "&"
                    : "?";


            url +=
                `${separator}id=${encodeURIComponent(
                    tujuan.referenceId
                )}`;

        }


        return url;

    }


    // =====================================================
    // LOAD NOTIFIKASI
    // =====================================================

    async function loadNotifikasi() {

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


        // =================================================
        // NOTIFICATIONS
        // =================================================

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


        const response =
            await fetch(
                urlNotifikasi,
                {

                    method: "GET",

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


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                `Gagal memuat notifikasi (${response.status})`
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        // =================================================
        // NOTIFICATION READS
        // =================================================

        const urlReads =
            `${SUPABASE_URL}` +
            `/rest/v1/notification_reads` +
            `?select=notification_id,read_at` +
            `&user_id=eq.${encodeURIComponent(
                userId
            )}`;


        const readResponse =
            await fetch(
                urlReads,
                {

                    method: "GET",

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


        if (!readResponse.ok) {

            const errorText =
                await readResponse.text();


            throw new Error(
                errorText ||
                "Gagal mengambil status baca."
            );

        }


        const readData =
            await readResponse.json();


        const sudahDibaca =
            new Set(

                Array.isArray(readData)

                    ? readData.map(
                        item =>
                            String(
                                item.notification_id
                            )
                    )

                    : []

            );


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


    // =====================================================
    // SUMMARY
    // =====================================================

    function updateSummary(data) {

        if (
            !notificationSummary
        ) {

            return;

        }


        const total =
            Array.isArray(data)
                ? data.length
                : 0;


        const unread =
            Array.isArray(data)
                ? data.filter(
                    item =>
                        item.is_read !== true
                ).length
                : 0;


        if (totalNotifikasi) {

            totalNotifikasi.textContent =
                total;

        }


        if (totalBelumDibaca) {

            totalBelumDibaca.textContent =
                unread;

        }


        notificationSummary.classList.toggle(
            "hidden",
            total === 0
        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    function renderNotifikasi(data) {

        if (
            notifikasiList
        ) {

            notifikasiList.innerHTML =
                "";

        }


        updateSummary(
            data
        );


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

            return;

        }


        notifikasiList.innerHTML =

            data.map(
                item => {

                    const isUnread =
                        item.is_read !== true;


                    const unreadClass =
                        isUnread
                            ? " notifikasi-unread"
                            : "";


                    const jenis =
                        normalisasiJenis(
                            item
                        );


                    const judul =
                        item.title ||
                        labelJenis(
                            jenis
                        );


                    const targetUrl =
                        bangunUrlTujuan(
                            item
                        );


                    const safeId =
                        escapeHTML(
                            item.id
                        );


                    const safeTarget =
                        targetUrl
                            ? escapeHTML(
                                targetUrl
                            )
                            : "";


                    return `

                        <article
                            class="
                                notifikasi-card
                                ${unreadClass}
                            "
                            data-id="${safeId}"
                        >

                            <button
                                type="button"
                                class="notifikasi-open-button"
                                onclick="
                                    bukaNotifikasi(
                                        '${safeId}',
                                        '${safeTarget}'
                                    )
                                "
                            >

                                <div
                                    class="notifikasi-top"
                                >

                                    <div
                                        class="notifikasi-icon"
                                        aria-hidden="true"
                                    >
                                        ${iconJenis(
                                            jenis
                                        )}
                                    </div>


                                    <div
                                        class="notifikasi-heading"
                                    >

                                        <h3>
                                            ${escapeHTML(
                                                judul
                                            )}
                                        </h3>


                                        <span
                                            class="notifikasi-date"
                                        >
                                            ${formatTanggal(
                                                item.created_at
                                            )}
                                        </span>


                                        <span
                                            class="notifikasi-type"
                                        >
                                            ${escapeHTML(
                                                labelJenis(
                                                    jenis
                                                )
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
                                    targetUrl
                                        ? `
                                            <div
                                                class="notifikasi-open-hint"
                                            >

                                                Buka informasi

                                                <svg viewBox="0 0 24 24">
                                                    <path d="M9 18l6-6-6-6"></path>
                                                </svg>

                                            </div>
                                        `
                                        : ""
                                }

                            </button>


                            ${
                                isUnread
                                    ? `

                                        <div
                                            class="notifikasi-action"
                                        >

                                            <button
                                                type="button"
                                                class="notifikasi-read-button"
                                                onclick="
                                                    event.stopPropagation();
                                                    tandaiNotifikasiDibaca(
                                                        '${safeId}'
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


    // =====================================================
    // BUKA NOTIFIKASI
    // =====================================================

    async function bukaNotifikasi(
        notificationId,
        targetUrl
    ) {

        if (!notificationId) {

            return;

        }


        try {

            await tandaiNotifikasiDibaca(
                notificationId,
                false
            );

        }

        catch (error) {

            console.warn(
                "SIDAT: Gagal menandai notifikasi:",
                error
            );

        }


        if (
            targetUrl
        ) {

            window.location.href =
                targetUrl;

            return;

        }


        alert(
            "Halaman tujuan notifikasi belum ditentukan."
        );

    }


    // =====================================================
    // TANDAI DIBACA
    // =====================================================

    async function tandaiNotifikasiDibaca(
        notificationId,
        refresh = true
    ) {

        if (!notificationId) {

            return;

        }


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


        const response =
            await fetch(
                `${SUPABASE_URL}` +
                `/rest/v1/notification_reads`,
                {

                    method: "POST",

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
                            "return=representation,resolution=ignore-duplicates"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            throw new Error(
                responseText ||
                `Gagal menyimpan status baca. HTTP ${response.status}`
            );

        }


        if (refresh) {

            await tampilkanNotifikasi();

        }

    }


    // =====================================================
    // KEMBALI DASHBOARD
    // =====================================================

    function kembaliDashboard() {

        window.location.href =
            "dashboard.html";

    }


    // =====================================================
    // TAMPILKAN NOTIFIKASI
    // =====================================================

    async function tampilkanNotifikasi() {

        console.log(
            "SIDAT: Memuat halaman Notifikasi WARGA..."
        );


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


            if (errorMessage) {

                errorMessage.textContent =
                    error?.message ||
                    "Terjadi kesalahan saat memuat notifikasi.";

            }

        }

    }


    // =====================================================
    // EXPORT KE WINDOW
    //
    // Karena HTML menggunakan onclick=""
    // fungsi harus tersedia secara global.
    // =====================================================

    window.tampilkanNotifikasi =
        tampilkanNotifikasi;

    window.loadNotifikasi =
        loadNotifikasi;

    window.tandaiNotifikasiDibaca =
        tandaiNotifikasiDibaca;

    window.bukaNotifikasi =
        bukaNotifikasi;

    window.kembaliDashboard =
        kembaliDashboard;


    // =====================================================
    // START
    // =====================================================

    function mulaiNotifikasi() {

        console.log(
            "SIDAT: DOM Notifikasi siap."
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

})();