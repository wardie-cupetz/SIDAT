// ==========================================
// SIDAT
// LAPORAN & ADUAN WARGA
// VERSI TERBARU
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem("sidat_access_token");

const wargaData =
    localStorage.getItem("sidat_user");


// ==========================================
// CEK LOGIN
// ==========================================

if (!accessToken || !wargaData) {
    window.location.href = "../index.html";
}


// ==========================================
// DATA WARGA
// ==========================================

let warga = null;

try {
    warga = JSON.parse(wargaData);
} catch (error) {

    console.error(
        "SIDAT: Data warga tidak valid:",
        error
    );

    window.location.href = "../index.html";
}


// ==========================================
// DATA GLOBAL
// ==========================================

let semuaLaporan = [];
let laporanTerpilih = null;
let selectedPhotoFile = null;


// ==========================================
// ELEMENT
// ==========================================

const laporanForm =
    document.getElementById("laporanForm");

const categoryInput =
    document.getElementById("category");

const titleInput =
    document.getElementById("title");

const descriptionInput =
    document.getElementById("description");

const descriptionCounter =
    document.getElementById("descriptionCounter");

const photoInput =
    document.getElementById("photoInput");

const photoPreview =
    document.getElementById("photoPreview");

const photoPreviewContainer =
    document.getElementById("photoPreviewContainer");

const removePhotoButton =
    document.getElementById("removePhotoButton");

const photoInfo =
    document.getElementById("photoInfo");

const submitButton =
    document.getElementById("submitButton");

const formError =
    document.getElementById("formError");

const formSuccess =
    document.getElementById("formSuccess");

const laporanList =
    document.getElementById("laporanList");

const searchLaporan =
    document.getElementById("searchLaporan");

const filterKategori =
    document.getElementById("filterKategori");

const filterStatus =
    document.getElementById("filterStatus");

const detailModal =
    document.getElementById("detailModal");

const detailContent =
    document.getElementById("detailContent");

const closeDetailButton =
    document.getElementById("closeDetailButton");


// ==========================================
// KONFIGURASI STORAGE
// ==========================================

const REPORT_PHOTO_BUCKET =
    "report-photos";


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatTanggal(tanggal) {

    if (!tanggal) {
        return "-";
    }

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// STATUS LABEL
// ==========================================

function statusLabel(status) {

    const value =
        String(status || "")
            .toLowerCase()
            .trim();

    switch (value) {

        case "pending":
            return "Menunggu";

        case "process":
        case "processing":
        case "diproses":
            return "Diproses";

        case "done":
        case "completed":
        case "selesai":
            return "Selesai";

        case "rejected":
        case "ditolak":
            return "Ditolak";

        default:
            return status || "Menunggu";
    }
}


// ==========================================
// STATUS CLASS
// ==========================================

function statusClass(status) {

    const value =
        String(status || "")
            .toLowerCase()
            .trim();

    if (
        value === "done" ||
        value === "completed" ||
        value === "selesai"
    ) {
        return "status-done";
    }

    if (
        value === "process" ||
        value === "processing" ||
        value === "diproses"
    ) {
        return "status-process";
    }

    if (
        value === "rejected" ||
        value === "ditolak"
    ) {
        return "status-rejected";
    }

    return "status-pending";
}


// ==========================================
// SUPABASE HEADER
// ==========================================

function getSupabaseHeaders() {

    return {

        "apikey":
            SUPABASE_KEY,

        "Authorization":
            `Bearer ${accessToken}`,

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };
}


// ==========================================
// SUPABASE REQUEST
// ==========================================

async function supabaseRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {

                    ...getSupabaseHeaders(),

                    ...(options.headers || {})

                }
            }
        );

    const text =
        await response.text();

    if (!response.ok) {

        console.error(
            "SIDAT SUPABASE ERROR:",
            response.status,
            text
        );

        let message = text;

        try {

            const json =
                JSON.parse(text);

            message =
                json.message ||
                json.error_description ||
                json.hint ||
                json.details ||
                text;

        } catch {
            // gunakan text asli
        }

        throw new Error(
            message ||
            `Supabase error ${response.status}`
        );
    }

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}


// ==========================================
// LOAD LAPORAN
// SEMUA WARGA
// ==========================================

async function loadLaporan() {

    if (!laporanList) {
        return;
    }

    laporanList.innerHTML = `
        <div class="loading">
            Memuat riwayat laporan warga...
        </div>
    `;

    try {

        console.log(
            "SIDAT: Memuat semua laporan..."
        );

        const reports =
            await supabaseRequest(

                `${SUPABASE_URL}/rest/v1/reports?select=id,resident_id,category,title,description,photo_url,status,admin_note,created_at,updated_at&order=created_at.desc`,

                {
                    method: "GET"
                }

            );

        const data =
            Array.isArray(reports)
                ? reports
                : [];

        console.log(
            "SIDAT REPORTS:",
            data
        );


        // ==================================
        // AMBIL ID RESIDENT
        // ==================================

        const residentIds =
            [
                ...new Set(

                    data
                        .map(
                            item =>
                                item.resident_id
                        )
                        .filter(Boolean)

                )
            ];

        let residents = [];


        // ==================================
        // LOAD NAMA WARGA
        // ==================================

        if (residentIds.length > 0) {

            const ids =
                residentIds
                    .map(
                        id =>
                            `"${id}"`
                    )
                    .join(",");

            residents =
                await supabaseRequest(

                    `${SUPABASE_URL}/rest/v1/residents?select=id,name,resident_code&or=(id.in.(${ids}))`,

                    {
                        method: "GET"
                    }

                );
        }


        // ==================================
        // GABUNG DATA
        // ==================================

        const residentMap =
            new Map();

        (
            residents || []
        ).forEach(
            resident => {

                residentMap.set(
                    String(resident.id),
                    resident
                );

            }
        );


        semuaLaporan =
            data.map(
                laporan => {

                    const resident =
                        residentMap.get(
                            String(
                                laporan.resident_id
                            )
                        );

                    return {

                        ...laporan,

                        resident_name:
                            resident?.name ||
                            "Warga",

                        resident_code:
                            resident?.resident_code ||
                            "-"

                    };
                }
            );


        console.log(
            "SIDAT SEMUA LAPORAN:",
            semuaLaporan
        );


        tampilkanLaporan(
            semuaLaporan
        );

    } catch (error) {

        console.error(
            "SIDAT: Gagal memuat laporan:",
            error
        );

        laporanList.innerHTML = `

            <div class="empty">

                ❌ Gagal memuat riwayat laporan.

                <br><br>

                <small>
                    ${escapeHTML(
                        error.message
                    )}
                </small>

            </div>

        `;
    }
}


// ==========================================
// TAMPILKAN LAPORAN
// ==========================================

function tampilkanLaporan(data) {

    if (!laporanList) {
        return;
    }

    if (!data || data.length === 0) {

        laporanList.innerHTML = `

            <div class="empty">

                📭

                <br><br>

                Belum ada laporan warga.

            </div>

        `;

        return;
    }

    laporanList.innerHTML =
        data
            .map(
                laporan => {

                    const foto =
                        laporan.photo_url;

                    return `

                        <article
                            class="laporan-item"
                            onclick="bukaDetailLaporan('${escapeHTML(
                                laporan.id
                            )}')"
                        >

                            ${
                                foto
                                ? `

                                    <div
                                        class="laporan-thumbnail-wrapper"
                                    >

                                        <img
                                            class="laporan-thumbnail"
                                            src="${escapeHTML(
                                                foto
                                            )}"
                                            alt="Foto laporan"
                                            loading="lazy"
                                            onerror="
                                                this.style.display='none'
                                            "
                                        >

                                    </div>

                                `
                                : `

                                    <div
                                        class="
                                            laporan-thumbnail
                                            laporan-no-photo
                                        "
                                    >

                                        📢

                                    </div>

                                `
                            }

                            <div
                                class="laporan-item-content"
                            >

                                <div
                                    class="laporan-item-top"
                                >

                                    <div
                                        class="laporan-pelapor"
                                    >

                                        👤

                                        ${escapeHTML(
                                            laporan.resident_name ||
                                            "Warga"
                                        )}

                                    </div>

                                    <span
                                        class="
                                            status
                                            ${statusClass(
                                                laporan.status
                                            )}
                                        "
                                    >

                                        ${escapeHTML(
                                            statusLabel(
                                                laporan.status
                                            )
                                        )}

                                    </span>

                                </div>

                                <div
                                    class="laporan-category"
                                >

                                    ${escapeHTML(
                                        laporan.category ||
                                        "-"
                                    )}

                                </div>

                                <h3
                                    class="laporan-title"
                                >

                                    ${escapeHTML(
                                        laporan.title ||
                                        "-"
                                    )}

                                </h3>

                                <p
                                    class="laporan-preview"
                                >

                                    ${escapeHTML(
                                        laporan.description ||
                                        "-"
                                    )}

                                </p>

                                <div
                                    class="laporan-date"
                                >

                                    ${formatTanggal(
                                        laporan.created_at
                                    )}

                                </div>

                            </div>

                        </article>

                    `;
                }
            )
            .join("");
}


// ==========================================
// FILTER LAPORAN
// ==========================================

function terapkanFilter() {

    const kata =
        (
            searchLaporan?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const kategori =
        filterKategori?.value ||
        "";

    const status =
        filterStatus?.value ||
        "";

    const hasil =
        semuaLaporan.filter(
            laporan => {

                const nama =
                    String(
                        laporan.resident_name ||
                        ""
                    ).toLowerCase();

                const kode =
                    String(
                        laporan.resident_code ||
                        ""
                    ).toLowerCase();

                const judul =
                    String(
                        laporan.title ||
                        ""
                    ).toLowerCase();

                const isi =
                    String(
                        laporan.description ||
                        ""
                    ).toLowerCase();

                const cocokSearch =

                    !kata ||

                    nama.includes(kata) ||

                    kode.includes(kata) ||

                    judul.includes(kata) ||

                    isi.includes(kata);

                const cocokKategori =

                    !kategori ||

                    laporan.category ===
                    kategori;

                const statusLaporan =
                    String(
                        laporan.status ||
                        ""
                    ).toLowerCase();

                const cocokStatus =

                    !status ||

                    statusLaporan ===
                    status;

                return (
                    cocokSearch &&
                    cocokKategori &&
                    cocokStatus
                );
            }
        );

    tampilkanLaporan(
        hasil
    );
}


// ==========================================
// EVENT FILTER
// ==========================================

if (searchLaporan) {

    searchLaporan.addEventListener(
        "input",
        terapkanFilter
    );
}

if (filterKategori) {

    filterKategori.addEventListener(
        "change",
        terapkanFilter
    );
}

if (filterStatus) {

    filterStatus.addEventListener(
        "change",
        terapkanFilter
    );
}


// ==========================================
// PREVIEW FOTO
// ==========================================

if (photoInput) {

    photoInput.addEventListener(
        "change",
        function () {

            hapusPesan();

            const file =
                photoInput.files?.[0];

            if (!file) {
                return;
            }


            // ==================================
            // CEK FORMAT FOTO
            // ==================================

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

                tampilkanError(
                    "Format foto harus JPG, PNG, atau WEBP."
                );

                photoInput.value = "";

                selectedPhotoFile = null;

                return;
            }


            // ==================================
            // CEK UKURAN FOTO
            // ==================================

            const maxSize =
                2 * 1024 * 1024;

            if (file.size > maxSize) {

                tampilkanError(
                    "Ukuran foto maksimal 2 MB."
                );

                photoInput.value = "";

                selectedPhotoFile = null;

                return;
            }


            // ==================================
            // SIMPAN FILE
            // ==================================

            selectedPhotoFile =
                file;


            // ==================================
            // PREVIEW
            // ==================================

            const reader =
                new FileReader();

            reader.onload =
                function (event) {

                    if (photoPreview) {

                        photoPreview.src =
                            event.target.result;

                    }

                    if (
                        photoPreviewContainer
                    ) {

                        photoPreviewContainer
                            .classList
                            .remove("hidden");

                    }

                    if (photoInfo) {

                        const ukuranKB =
                            (
                                file.size /
                                1024
                            ).toFixed(0);

                        photoInfo.textContent =
                            `${file.name} • ${ukuranKB} KB`;
                    }
                };

            reader.readAsDataURL(
                file
            );
        }
    );
}


// ==========================================
// HAPUS FOTO
// ==========================================

if (removePhotoButton) {

    removePhotoButton.addEventListener(
        "click",
        hapusFoto
    );
}


function hapusFoto() {

    selectedPhotoFile =
        null;

    if (photoInput) {
        photoInput.value = "";
    }

    if (photoPreview) {
        photoPreview.src = "";
    }

    if (photoPreviewContainer) {

        photoPreviewContainer
            .classList
            .add("hidden");

    }

    if (photoInfo) {
        photoInfo.textContent = "";
    }
}


// ==========================================
// COUNTER DESKRIPSI
// ==========================================

if (descriptionInput) {

    descriptionInput.addEventListener(
        "input",
        function () {

            if (descriptionCounter) {

                descriptionCounter.textContent =
                    descriptionInput.value.length;

            }
        }
    );
}


// ==========================================
// PESAN FORM
// ==========================================

function hapusPesan() {

    if (formError) {

        formError.textContent = "";

        formError.classList.add(
            "hidden"
        );
    }

    if (formSuccess) {

        formSuccess.textContent = "";

        formSuccess.classList.add(
            "hidden"
        );
    }
}


function tampilkanError(pesan) {

    if (!formError) {

        alert(pesan);

        return;
    }

    formError.textContent =
        pesan;

    formError.classList.remove(
        "hidden"
    );

    if (formSuccess) {

        formSuccess.textContent =
            "";

        formSuccess.classList.add(
            "hidden"
        );
    }
}


function tampilkanSuccess(pesan) {

    if (formSuccess) {

        formSuccess.textContent =
            pesan;

        formSuccess.classList.remove(
            "hidden"
        );
    }
}


// ==========================================
// UPLOAD FOTO LAPORAN
// ==========================================

async function uploadFotoLaporan(file) {

    if (!file) {
        return null;
    }

    if (!warga || !warga.resident_id) {

        throw new Error(
            "ID warga tidak ditemukan."
        );
    }

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const fileName =
        `${Date.now()}.${extension}`;

    const filePath =
        `${warga.resident_id}/${fileName}`;

    console.log(
        "SIDAT: Upload foto laporan:",
        filePath
    );

    const response =
        await fetch(

            `${SUPABASE_URL}/storage/v1/object/${REPORT_PHOTO_BUCKET}/${filePath}`,

            {
                method: "POST",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "x-upsert":
                        "false",

                    "Content-Type":
                        file.type

                },

                body:
                    file
            }
        );

    const responseText =
        await response.text();

    if (!response.ok) {

        console.error(
            "SIDAT Storage Error:",
            response.status,
            responseText
        );

        let errorMessage =
            responseText;

        try {

            const errorJson =
                JSON.parse(responseText);

            errorMessage =
                errorJson.message ||
                errorJson.error ||
                errorJson.statusCode ||
                responseText;

        } catch {
            // gunakan response asli
        }

        if (response.status === 403) {

            throw new Error(
                "Upload foto ditolak oleh Supabase Storage. Periksa policy INSERT pada bucket report-photos."
            );
        }

        throw new Error(
            `Gagal upload foto: ${errorMessage}`
        );
    }


    const publicUrl =
        `${SUPABASE_URL}/storage/v1/object/public/${REPORT_PHOTO_BUCKET}/${filePath}`;

    console.log(
        "SIDAT: URL foto:",
        publicUrl
    );

    return publicUrl;
}


// ==========================================
// BUAT NOTIFIKASI ADMIN
// LAPORAN BARU
// ==========================================

async function buatNotifikasiAdminLaporan(
    laporan
) {

    console.log(
        "SIDAT: buatNotifikasiAdminLaporan()"
    );

    if (!laporan) {

        console.error(
            "SIDAT: Data laporan untuk notifikasi kosong."
        );

        return false;
    }

    try {

        // ======================================
        // REPORT ID
        // ======================================

        const reportId =
            laporan.report_id ||
            laporan.id ||
            null;

        if (!reportId) {

            console.error(
                "SIDAT: Report ID tidak ditemukan."
            );

            return false;
        }

        console.log(
            "SIDAT DEBUG: reportId:",
            reportId
        );


        // ======================================
// AMBIL AUTH ID DARI DATA WARGA
// ======================================

let authUserId = null;

try {

    const residentId =
        laporan.resident_id ||
        null;

    if (!residentId) {

        console.error(
            "SIDAT: Resident ID laporan tidak ditemukan."
        );

        return false;
    }

    const residentResponse =
        await supabaseRequest(

            `${SUPABASE_URL}/rest/v1/residents?id=eq.${encodeURIComponent(residentId)}&select=auth_id`,

            {
                method: "GET"
            }
        );

    const resident =
        Array.isArray(residentResponse)
            ? residentResponse[0]
            : residentResponse;

    authUserId =
        resident?.auth_id ||
        null;

} catch (authError) {

    console.error(
        "SIDAT: Gagal mengambil auth_id warga:",
        authError
    );
}

console.log(
    "SIDAT: AUTH USER ID UNTUK NOTIF ADMIN:",
    authUserId
);

if (!authUserId) {

    console.error(
        "SIDAT: auth_id warga tidak ditemukan."
    );

    return false;
}


        // ======================================
        // VALIDASI AUTH USER
        // ======================================

        if (!authUserId) {

            console.error(
                "SIDAT: UUID Auth warga tidak ditemukan."
            );

            return false;
        }


        // ======================================
        // PAYLOAD NOTIFIKASI ADMIN
        // ======================================

        const notificationPayload = {

            title:
                "📢 Laporan Baru",

            message:
                `Warga mengirim laporan baru: "${laporan.title}".`,

            target_type:
                "admin",

            target_resident_id:
                null,

            is_read:
                false,

            created_by:
                authUserId,

            created_at:
                new Date().toISOString(),

            report_id:
                reportId
        };


        console.log(
            "SIDAT DEBUG: NOTIF ADMIN PAYLOAD:",
            notificationPayload
        );

        console.log(
            "SIDAT DEBUG: CREATED_BY:",
            notificationPayload.created_by
        );


        // ======================================
        // INSERT NOTIFIKASI ADMIN
        // ======================================

        const response =
            await supabaseRequest(

                `${SUPABASE_URL}/rest/v1/notifications`,

                {

                    method: "POST",

                    headers: {

                        "Prefer":
                            "return=representation"

                    },

                    body:
                        JSON.stringify(
                            notificationPayload
                        )

                }
            );


        console.log(
            "SIDAT: HASIL INSERT NOTIFIKASI ADMIN:",
            response
        );


        const notification =
            Array.isArray(response)
                ? response[0]
                : response;


        const notificationId =
            notification?.id ||
            null;


        if (!notificationId) {

            console.error(
                "SIDAT: Notification ID tidak ditemukan."
            );

            return false;
        }


        console.log(
            "SIDAT: NOTIFICATION ID:",
            notificationId
        );


        // ======================================
        // PUSH NOTIFICATION
        // ======================================
        //
        // Infrastruktur VAPID / FCM yang sekarang
        // tetap dipertahankan.
        //

        console.log(
            "SIDAT: MEMANGGIL SEND-PUSH-NOTIFICATION..."
        );


        const pushResponse =
            await fetch(

                `${SUPABASE_URL}/functions/v1/send-push-notification`,

                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            notification_id:
                                notificationId

                        })

                }
            );


        const pushText =
            await pushResponse.text();


        let pushData =
            null;


        try {

            pushData =
                pushText
                    ? JSON.parse(pushText)
                    : null;

        } catch {

            pushData =
                pushText;

        }


        console.log(
            "SIDAT: RESPONSE SEND-PUSH-NOTIFICATION:",
            pushResponse.status,
            pushData
        );


        // ======================================
        // PUSH GAGAL
        // ======================================
        //
        // Database notification sudah berhasil.
        // Jangan menggagalkan laporan warga hanya
        // karena push gagal.
        //

        if (!pushResponse.ok) {

            console.error(
                "SIDAT: Push admin gagal:",
                pushResponse.status,
                pushData
            );

            return true;
        }


        console.log(
            "SIDAT: Push notification admin berhasil."
        );


        return true;

    } catch (error) {

        console.error(
            "SIDAT: GAGAL NOTIFIKASI ADMIN:",
            error
        );

        return false;
    }
}
// ==========================================
// KIRIM LAPORAN
// ==========================================

async function kirimLaporan(event) {

    event.preventDefault();

    hapusPesan();


    // ======================================
    // AMBIL FORM
    // ======================================

    const category =
        categoryInput?.value?.trim() ||
        "";

    const title =
        titleInput?.value?.trim() ||
        "";

    const description =
        descriptionInput?.value?.trim() ||
        "";


    // ======================================
    // VALIDASI KATEGORI
    // ======================================

    if (!category) {

        tampilkanError(
            "Silakan pilih kategori laporan."
        );

        if (categoryInput) {
            categoryInput.focus();
        }

        return;
    }


    // ======================================
    // VALIDASI JUDUL
    // ======================================

    if (!title) {

        tampilkanError(
            "Judul laporan wajib diisi."
        );

        if (titleInput) {
            titleInput.focus();
        }

        return;
    }


    if (title.length < 3) {

        tampilkanError(
            "Judul laporan minimal 3 karakter."
        );

        if (titleInput) {
            titleInput.focus();
        }

        return;
    }


    // ======================================
    // VALIDASI DESKRIPSI
    // ======================================

    if (!description) {

        tampilkanError(
            "Isi laporan wajib diisi."
        );

        if (descriptionInput) {
            descriptionInput.focus();
        }

        return;
    }


    if (description.length < 10) {

        tampilkanError(
            "Isi laporan minimal 10 karakter."
        );

        if (descriptionInput) {
            descriptionInput.focus();
        }

        return;
    }


    // ======================================
    // VALIDASI WARGA
    // ======================================

    const residentId =
        warga?.resident_id;

    if (!residentId) {

        tampilkanError(
            "ID warga tidak ditemukan. Silakan login kembali."
        );

        return;
    }


    try {

        // ==================================
        // DISABLE BUTTON
        // ==================================

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "⏳ Mengirim...";
        }


        let photoUrl = null;


        // ==================================
        // UPLOAD FOTO
        // ==================================

        if (selectedPhotoFile) {

            if (submitButton) {

                submitButton.textContent =
                    "⏳ Upload foto...";
            }

            photoUrl =
                await uploadFotoLaporan(
                    selectedPhotoFile
                );
        }


        // ==================================
        // PAYLOAD REPORT
        // ==================================

        const payload = {

            resident_id:
                residentId,

            category:
                category,

            title:
                title,

            description:
                description,

            photo_url:
                photoUrl,

            status:
                "pending"

        };


        console.log(
            "SIDAT: INSERT REPORT:",
            payload
        );


        // ==================================
        // INSERT REPORT
        // ==================================

        if (submitButton) {

            submitButton.textContent =
                "⏳ Menyimpan laporan...";
        }


        const hasilLaporan =
            await supabaseRequest(

                `${SUPABASE_URL}/rest/v1/reports`,

                {

                    method: "POST",

                    headers: {

                        "Prefer":
                            "return=representation"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        console.log(
            "SIDAT: HASIL INSERT LAPORAN:",
            hasilLaporan
        );


        // ==================================
        // AMBIL DATA LAPORAN
        // ==================================

        const laporanBaru =
            Array.isArray(
                hasilLaporan
            )
                ? hasilLaporan[0]
                : hasilLaporan;


        const reportId =
            laporanBaru?.id ||
            null;


        console.log(
            "SIDAT: REPORT ID BARU:",
            reportId
        );


        if (!reportId) {

            throw new Error(
                "Laporan berhasil disimpan tetapi ID laporan tidak ditemukan."
            );
        }


        console.log(
            "SIDAT: Laporan berhasil dibuat:",
            reportId
        );


        // ==========================================
        // NOTIFIKASI LAPORAN BARU
        // ==========================================

        try {

            // ======================================
            // NOTIFIKASI SEMUA WARGA
            // ======================================

            const notifikasiWarga = {

                title:
                    "📢 Laporan Baru",

                message:
                    `Ada laporan baru dari warga: "${title}".`,

                target_type:
                    "all",

                target_resident_id:
                    null,

                is_read:
                    false,

                created_by:
                    warga?.id ||
                    null,

                created_at:
                    new Date().toISOString(),

                report_id:
                    reportId

            };


            console.log(
                "SIDAT: NOTIFIKASI SEMUA WARGA:",
                notifikasiWarga
            );


            await supabaseRequest(

                `${SUPABASE_URL}/rest/v1/notifications`,

                {

                    method: "POST",

                    headers: {

                        "Prefer":
                            "return=minimal"

                    },

                    body:
                        JSON.stringify(
                            notifikasiWarga
                        )

                }
            );


            console.log(
                "SIDAT: Notifikasi semua warga berhasil dibuat."
            );


            // ======================================
            // NOTIFIKASI ADMIN
            // ======================================

            const adminNotificationCreated =
                await buatNotifikasiAdminLaporan({

                    ...payload,

                    id:
                        reportId,

                    report_id:
                        reportId

                });


            if (
                adminNotificationCreated
            ) {

                console.log(
                    "SIDAT: Notifikasi admin berhasil dibuat."
                );

            } else {

                console.warn(
                    "SIDAT: Notifikasi admin tidak berhasil dibuat."
                );

            }

        } catch (notificationError) {

            console.error(
                "SIDAT: Gagal membuat notifikasi laporan baru:",
                notificationError
            );

        }


        console.log(
            "SIDAT: Laporan berhasil dibuat."
        );


        // ==================================
        // SUCCESS
        // ==================================

        tampilkanSuccess(
            "✅ Laporan berhasil dikirim."
        );


        // ==================================
        // RESET FORM
        // ==================================

        if (laporanForm) {
            laporanForm.reset();
        }

        hapusFoto();


        if (descriptionCounter) {

            descriptionCounter.textContent =
                "0";
        }


        // ==================================
        // LOAD ULANG RIWAYAT
        // ==================================

        await loadLaporan();


        // ==================================
        // SCROLL KE RIWAYAT
        // ==================================

        setTimeout(
            function () {

                const riwayat =
                    document.querySelector(
                        ".riwayat-card"
                    );

                if (riwayat) {

                    riwayat.scrollIntoView(
                        {
                            behavior: "smooth",
                            block: "start"
                        }
                    );
                }

            },
            300
        );


    } catch (error) {

        console.error(
            "SIDAT: Gagal mengirim laporan:",
            error
        );


        tampilkanError(
            error.message ||
            "Gagal mengirim laporan."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "📤 Kirim Laporan";
        }
    }
}


// ==========================================
// EVENT FORM
// ==========================================

if (laporanForm) {

    laporanForm.addEventListener(
        "submit",
        kirimLaporan
    );
}


// ==========================================
// DETAIL LAPORAN
// ==========================================

function bukaDetailLaporan(id) {

    const laporan =
        semuaLaporan.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!laporan) {

        console.error(
            "SIDAT: Laporan tidak ditemukan:",
            id
        );

        return;
    }


    laporanTerpilih =
        laporan;


    if (!detailModal) {
        return;
    }


    if (detailContent) {

        const fotoHTML =
            laporan.photo_url

                ? `

                    <div
                        class="detail-photo"
                    >

                        <img
                            src="${escapeHTML(
                                laporan.photo_url
                            )}"
                            alt="Foto bukti laporan"
                            onerror="
                                this.parentElement.style.display='none'
                            "
                        >

                    </div>

                `

                : "";


        const adminNoteHTML =
            laporan.admin_note

                ? `

                    <div
                        class="detail-section admin-note"
                    >

                        <span>
                            💬 Tanggapan Admin
                        </span>

                        <p>
                            ${escapeHTML(
                                laporan.admin_note
                            )}
                        </p>

                    </div>

                `

                : `

                    <div
                        class="
                            detail-section
                            admin-note
                            empty-note
                        "
                    >

                        <span>
                            💬 Tanggapan Admin
                        </span>

                        <p>
                            Belum ada tanggapan dari admin.
                        </p>

                    </div>

                `;


        detailContent.innerHTML = `

            ${fotoHTML}

            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Pelapor
                </div>

                <strong>
                    👤 ${escapeHTML(
                        laporan.resident_name ||
                        "Warga"
                    )}
                </strong>

                <small>
                    ID:
                    ${escapeHTML(
                        laporan.resident_code ||
                        "-"
                    )}
                </small>

            </div>


            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Kategori
                </div>

                <strong>
                    ${escapeHTML(
                        laporan.category ||
                        "-"
                    )}
                </strong>

            </div>


            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Judul
                </div>

                <strong>
                    ${escapeHTML(
                        laporan.title ||
                        "-"
                    )}
                </strong>

            </div>


            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Isi Laporan
                </div>

                <p
                    class="detail-description"
                >
                    ${escapeHTML(
                        laporan.description ||
                        "-"
                    )}
                </p>

            </div>


            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Status
                </div>

                <span
                    class="
                        status
                        ${statusClass(
                            laporan.status
                        )}
                    "
                >

                    ${escapeHTML(
                        statusLabel(
                            laporan.status
                        )
                    )}

                </span>

            </div>


            <div
                class="detail-section"
            >

                <div
                    class="detail-label"
                >
                    Tanggal Laporan
                </div>

                <strong>
                    ${formatTanggal(
                        laporan.created_at
                    )}
                </strong>

            </div>


            ${adminNoteHTML}

        `;
    }


    // ======================================
    // TAMPILKAN MODAL
    // ======================================

    detailModal
        .classList
        .remove("hidden");


    document.body.style.overflow =
        "hidden";
}


// ==========================================
// TUTUP DETAIL LAPORAN
// ==========================================

function tutupDetail() {

    if (detailModal) {

        detailModal
            .classList
            .add("hidden");
    }


    document.body.style.overflow =
        "";


    laporanTerpilih =
        null;
}


// ==========================================
// KEMBALI KE DASHBOARD
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";
}


// ==========================================
// TUTUP MODAL DENGAN OVERLAY
// ==========================================

if (detailModal) {

    detailModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                detailModal
            ) {

                tutupDetail();
            }
        }
    );
}


// ==========================================
// TOMBOL TUTUP DETAIL
// ==========================================

if (closeDetailButton) {

    closeDetailButton.addEventListener(
        "click",
        tutupDetail
    );
}


// ==========================================
// ESCAPE UNTUK TUTUP MODAL
// ==========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            tutupDetail();
        }
    }
);


// ==========================================
// START APPLICATION
// ==========================================

async function initLaporan() {

    console.log(
        "SIDAT: Memulai halaman laporan..."
    );


    // ======================================
    // CEK TOKEN
    // ======================================

    if (!accessToken) {

        console.error(
            "SIDAT: Access token tidak ditemukan."
        );

        window.location.href =
            "../index.html";

        return;
    }


    // ======================================
    // CEK DATA WARGA
    // ======================================

    if (!warga) {

        console.error(
            "SIDAT: Data warga tidak ditemukan."
        );

        window.location.href =
            "../index.html";

        return;
    }


    console.log(
        "SIDAT AUTH:",
        warga
    );


    // ======================================
    // LOAD LAPORAN
    // ======================================

    await loadLaporan();


    console.log(
        "SIDAT: Halaman laporan siap."
    );
}


// ==========================================
// START APPLICATION
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initLaporan
    );

} else {

    initLaporan();
}


// ==========================================
// EXPORT GLOBAL
// ==========================================

window.bukaDetailLaporan =
    bukaDetailLaporan;

window.tutupDetail =
    tutupDetail;

window.kembaliDashboard =
    kembaliDashboard;

window.kirimLaporan =
    kirimLaporan;

window.hapusFoto =
    hapusFoto;

window.loadLaporan =
    loadLaporan;

window.buatNotifikasiAdminLaporan =
    buatNotifikasiAdminLaporan;
