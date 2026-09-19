// =========================================================
// SIDAT
// PENGATURAN ADMIN
// Identitas RT
// Banner Dashboard
// Backup & Restore
// Dibuat oleh Suwardi
// =========================================================


// =========================================================
// SESSION
// =========================================================

const accessToken =
    localStorage.getItem("sidat_access_token");


if (!accessToken) {

    window.location.href =
        "../index.html";

}


// =========================================================
// SUPABASE
// =========================================================

let sidatSupabase = null;


// =========================================================
// DATA GLOBAL
// =========================================================

let dataWilayah = null;

let userProfile = null;

let logoFileBaru = null;

let bannerData = [];


// =========================================================
// KONSTANTA
// =========================================================

const BANNER_BUCKET =
    "sidat-banners";

const MAX_BANNER =
    5;

const MAX_BANNER_SIZE =
    5 * 1024 * 1024;

const MAX_LOGO_SIZE =
    2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// =========================================================
// ELEMENT HELPER
// =========================================================

function el(id) {

    return document.getElementById(id);

}


// =========================================================
// SUPABASE CLIENT
// =========================================================

function pastikanSupabase() {

    if (sidatSupabase) {

        return sidatSupabase;

    }


    if (
        typeof supabase === "undefined"
    ) {

        throw new Error(
            "Library Supabase belum dimuat."
        );

    }


    if (
        typeof SUPABASE_URL === "undefined" ||
        typeof SUPABASE_KEY === "undefined"
    ) {

        throw new Error(
            "Konfigurasi Supabase tidak ditemukan."
        );

    }


    sidatSupabase =
        supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    return sidatSupabase;

}


// =========================================================
// USER LOGIN
// =========================================================

async function ambilUserLogin() {

    const client =
        pastikanSupabase();


    const {
        data: sessionData,
        error: sessionError
    } =
        await client.auth.getSession();


    if (
        !sessionError &&
        sessionData?.session?.user
    ) {

        return sessionData.session.user;

    }


    const token =
        localStorage.getItem(
            "sidat_access_token"
        );


    if (!token) {

        throw new Error(
            "Sesi login tidak ditemukan."
        );

    }


    const response =
        await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                method: "GET",

                headers: {
                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            "Sesi login tidak valid."
        );

    }


    const user =
        await response.json();


    if (!user?.id) {

        throw new Error(
            "Data user login tidak ditemukan."
        );

    }


    return user;

}


// =========================================================
// CEK ADMIN
// =========================================================

async function cekAdmin() {

    const client =
        pastikanSupabase();

    const user =
        await ambilUserLogin();


    const {
        data,
        error
    } =
        await client
            .from("profiles")
            .select(
                "id,user_id,role,resident_id"
            )
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (error) {

        throw new Error(
            error.message
        );

    }


    if (!data) {

        throw new Error(
            "Profil akun tidak ditemukan."
        );

    }


    userProfile =
        data;


    const role =
        String(
            data.role || ""
        )
        .trim()
        .toLowerCase();


    if (
        role !== "admin" &&
        role !== "administrator"
    ) {

        throw new Error(
            "Halaman ini hanya dapat digunakan oleh admin."
        );

    }


    return user;

}


// =========================================================
// LOADING
// =========================================================

function tampilkanLoading(tampil) {

    const loading =
        el("loadingState");

    const content =
        el("settingsContent");


    if (loading) {

        loading.classList.toggle(
            "hidden",
            !tampil
        );

    }


    if (content) {

        content.classList.toggle(
            "hidden",
            tampil
        );

    }

}


// =========================================================
// PESAN GLOBAL
// =========================================================

function tampilkanError(message) {

    const state =
        el("errorState");

    const text =
        el("errorMessage");


    if (text) {

        text.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    if (state) {

        state.classList.remove(
            "hidden"
        );

    }

}


function sembunyikanError() {

    const state =
        el("errorState");


    if (state) {

        state.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// PESAN SECTION
// =========================================================

function tampilkanPesan(
    elementId,
    message,
    type
) {

    const element =
        el(elementId);


    if (!element) {

        return;

    }


    element.textContent =
        message || "";


    element.classList.remove(
        "hidden",
        "error-message",
        "success-message"
    );


    element.classList.add(
        type === "success"
            ? "success-message"
            : "error-message"
    );

}


function sembunyikanPesan(elementId) {

    const element =
        el(elementId);


    if (element) {

        element.textContent =
            "";

        element.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// VALUE
// =========================================================

function setValue(id, value) {

    const input =
        el(id);


    if (!input) {

        return;

    }


    input.value =
        value == null
            ? ""
            : value;

}


function getValue(id) {

    const input =
        el(id);


    if (!input) {

        return "";

    }


    return String(
        input.value || ""
    ).trim();

}


// =========================================================
// MUAT PENGATURAN
// =========================================================

async function muatPengaturan() {

    tampilkanLoading(true);

    sembunyikanError();


    try {

        await cekAdmin();

        await muatWilayah();

        await muatBanner();

    } catch (error) {

        console.error(
            "SIDAT PENGATURAN ERROR:",
            error
        );


        tampilkanError(
            error?.message ||
            "Gagal memuat pengaturan."
        );

    } finally {

        tampilkanLoading(false);

    }

}


// =========================================================
// WILAYAH
// =========================================================

async function muatWilayah() {

    const client =
        pastikanSupabase();


    const {
        data,
        error
    } =
        await client
            .from("wilayah")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        throw new Error(
            error.message
        );

    }


    dataWilayah =
        data || null;


    if (data) {

        isiFormWilayah(data);

    } else {

        isiFormWilayahKosong();

    }

}


// =========================================================
// ISI FORM WILAYAH
// =========================================================

function isiFormWilayah(data) {

    setValue(
        "namaAplikasi",
        data.nama_aplikasi || "SIDAT"
    );

    setValue(
        "namaDusun",
        data.nama_dusun
    );

    setValue(
        "namaDesa",
        data.nama_desa
    );

    setValue(
        "rt",
        data.rt
    );

    setValue(
        "rw",
        data.rw
    );

    setValue(
        "kecamatan",
        data.kecamatan
    );

    setValue(
        "kabupaten",
        data.kabupaten
    );

    setValue(
        "provinsi",
        data.provinsi
    );

    setValue(
        "namaKetuaRT",
        data.nama_ketua_rt
    );


    logoFileBaru =
        null;


    const input =
        el("logoInput");


    if (input) {

        input.value =
            "";

    }


    tampilkanPreviewLogo(
        data.logo_url
    );

}


// =========================================================
// FORM KOSONG
// =========================================================

function isiFormWilayahKosong() {

    setValue(
        "namaAplikasi",
        "SIDAT"
    );

    setValue(
        "namaDusun",
        ""
    );

    setValue(
        "namaDesa",
        ""
    );

    setValue(
        "rt",
        ""
    );

    setValue(
        "rw",
        ""
    );

    setValue(
        "kecamatan",
        ""
    );

    setValue(
        "kabupaten",
        ""
    );

    setValue(
        "provinsi",
        "Jawa Tengah"
    );

    setValue(
        "namaKetuaRT",
        ""
    );


    logoFileBaru =
        null;


    tampilkanPreviewLogo(null);

}


// =========================================================
// PREVIEW LOGO
// =========================================================

function tampilkanPreviewLogo(url) {

    const image =
        el("logoPreview");

    const placeholder =
        el("logoPlaceholder");


    if (!image) {

        return;

    }


    if (url) {

        image.src =
            url;

        image.classList.remove(
            "hidden"
        );


        if (placeholder) {

            placeholder.classList.add(
                "hidden"
            );

        }


        image.onerror =
            function () {

                image.classList.add(
                    "hidden"
                );

                if (placeholder) {

                    placeholder.classList.remove(
                        "hidden"
                    );

                }

            };

    } else {

        image.removeAttribute(
            "src"
        );

        image.classList.add(
            "hidden"
        );


        if (placeholder) {

            placeholder.classList.remove(
                "hidden"
            );

        }

    }

}


// =========================================================
// LOGO FILE
// =========================================================

function previewLogo() {

    const input =
        el("logoInput");


    if (
        !input?.files?.length
    ) {

        return;

    }


    const file =
        input.files[0];


    if (
        !ALLOWED_IMAGE_TYPES.includes(
            file.type
        )
    ) {

        tampilkanPesan(
            "identityError",
            "Format logo harus JPG, PNG, atau WEBP.",
            "error"
        );

        input.value =
            "";

        return;

    }


    if (
        file.size >
        MAX_LOGO_SIZE
    ) {

        tampilkanPesan(
            "identityError",
            "Ukuran logo maksimal 2 MB.",
            "error"
        );

        input.value =
            "";

        return;

    }


    logoFileBaru =
        file;


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            tampilkanPreviewLogo(
                event.target.result
            );

        };


    reader.readAsDataURL(file);


    sembunyikanPesan(
        "identityError"
    );

}


// =========================================================
// UPLOAD LOGO
// =========================================================

async function uploadLogo(file) {

    if (!file) {

        return null;

    }


    const client =
        pastikanSupabase();


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const filePath =
        `wilayah/logo-rt-${Date.now()}.${extension}`;


    const {
        error
    } =
        await client.storage
            .from("sidat")
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        true,

                    contentType:
                        file.type
                }
            );


    if (error) {

        throw new Error(
            "Gagal upload logo: " +
            error.message
        );

    }


    const {
        data
    } =
        client.storage
            .from("sidat")
            .getPublicUrl(
                filePath
            );


    if (!data?.publicUrl) {

        throw new Error(
            "URL logo tidak berhasil dibuat."
        );

    }


    return data.publicUrl;

}


// =========================================================
// SIMPAN IDENTITAS
// =========================================================

async function simpanIdentitas(event) {

    event.preventDefault();


    const button =
        el("saveIdentityButton");


    const oldText =
        button?.textContent ||
        "Simpan Identitas RT";


    sembunyikanPesan(
        "identityError"
    );

    sembunyikanPesan(
        "identitySuccess"
    );


    try {

        await cekAdmin();


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Menyimpan...";

        }


        let logoUrl =
            dataWilayah?.logo_url ||
            null;


        if (logoFileBaru) {

            logoUrl =
                await uploadLogo(
                    logoFileBaru
                );

        }


        const dataSimpan = {

            nama_aplikasi:
                getValue(
                    "namaAplikasi"
                ) || "SIDAT",

            nama_dusun:
                getValue(
                    "namaDusun"
                ) || null,

            nama_desa:
                getValue(
                    "namaDesa"
                ) || null,

            rt:
                getValue(
                    "rt"
                ) || null,

            rw:
                getValue(
                    "rw"
                ) || null,

            kecamatan:
                getValue(
                    "kecamatan"
                ) || null,

            kabupaten:
                getValue(
                    "kabupaten"
                ) || null,

            provinsi:
                getValue(
                    "provinsi"
                ) || null,

            nama_ketua_rt:
                getValue(
                    "namaKetuaRT"
                ) || null,

            logo_url:
                logoUrl,

            updated_at:
                new Date().toISOString()

        };


        const client =
            pastikanSupabase();


        let result;


        if (
            dataWilayah?.id
        ) {

            result =
                await client
                    .from("wilayah")
                    .update(
                        dataSimpan
                    )
                    .eq(
                        "id",
                        dataWilayah.id
                    )
                    .select()
                    .single();

        } else {

            result =
                await client
                    .from("wilayah")
                    .insert(
                        dataSimpan
                    )
                    .select()
                    .single();

        }


        if (result.error) {

            throw new Error(
                result.error.message
            );

        }


        dataWilayah =
            result.data;


        logoFileBaru =
            null;


        isiFormWilayah(
            result.data
        );


        tampilkanPesan(
            "identitySuccess",
            "✓ Identitas RT berhasil disimpan.",
            "success"
        );


        try {

            localStorage.setItem(
                "sidat_wilayah_updated",
                Date.now().toString()
            );

            localStorage.setItem(
                "sidat_wilayah_data",
                JSON.stringify(
                    result.data
                )
            );

        } catch (error) {

            console.warn(
                "SIDAT cache warning:",
                error
            );

        }


    } catch (error) {

        console.error(
            "SIDAT SIMPAN IDENTITAS ERROR:",
            error
        );


        tampilkanPesan(
            "identityError",
            error?.message ||
            "Gagal menyimpan identitas RT.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                oldText;

        }

    }

}


// =========================================================
// BANNER
// =========================================================

async function muatBanner() {

    const client =
        pastikanSupabase();


    const {
        data,
        error
    } =
        await client
            .from("banner_slides")
            .select(
                "id,slot,image_url,storage_path,target_url,is_active,created_by,created_at,updated_at"
            )
            .order(
                "slot",
                {
                    ascending: true
                }
            );


    if (error) {

        throw new Error(
            "Gagal memuat banner: " +
            error.message
        );

    }


    bannerData =
        Array.isArray(data)
            ? data
            : [];


    renderBannerList();

}


// =========================================================
// RENDER BANNER
// =========================================================

function renderBannerList() {

    const container =
        el("bannerList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    for (
        let slot = 1;
        slot <= MAX_BANNER;
        slot++
    ) {

        const banner =
            bannerData.find(
                item =>
                    Number(item.slot) === slot
            );


        container.appendChild(
            buatBannerElement(
                slot,
                banner || null
            )
        );

    }

}


// =========================================================
// BUAT BANNER ELEMENT
// =========================================================

function buatBannerElement(
    slot,
    banner
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "banner-item";


    article.dataset.slot =
        String(slot);


    const active =
        banner
            ? banner.is_active !== false
            : false;


    // =====================================================
    // IKON BANNER
    // =====================================================

    const iconImage = `
        <svg
            viewBox="0 0 24 24"
            class="banner-icon"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="2"
            ></rect>

            <circle
                cx="8"
                cy="9"
                r="1.5"
            ></circle>

            <path
                d="M3 17l5-5 4 4 3-3 6 6"
            ></path>
        </svg>
    `;


    const iconCamera = `
        <svg
            viewBox="0 0 24 24"
            class="button-icon"
            aria-hidden="true"
        >
            <path
                d="M4 7h3l2-2h6l2 2h3v11H4z"
            ></path>

            <circle
                cx="12"
                cy="12"
                r="3"
            ></circle>
        </svg>
    `;


    const iconDelete = `
        <svg
            viewBox="0 0 24 24"
            class="button-icon"
            aria-hidden="true"
        >
            <path
                d="M4 7h16"
            ></path>

            <path
                d="M10 11v6"
            ></path>

            <path
                d="M14 11v6"
            ></path>

            <path
                d="M6 7l1 14h10l1-14"
            ></path>

            <path
                d="M9 7V4h6v3"
            ></path>
        </svg>
    `;


    const iconWarning = `
        <svg
            viewBox="0 0 24 24"
            class="banner-icon"
            aria-hidden="true"
        >
            <path
                d="M12 3l10 18H2L12 3z"
            ></path>

            <path
                d="M12 9v5"
            ></path>

            <path
                d="M12 17h.01"
            ></path>
        </svg>
    `;


    // =====================================================
    // PREVIEW IMAGE
    // =====================================================

    const imageHtml =
        banner?.image_url

            ? `
                <img
                    src="${escapeAttribute(banner.image_url)}"
                    alt="Banner ${slot}"
                    onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                >

                <div class="banner-placeholder hidden">

                    <div class="banner-placeholder-icon">
                        ${iconWarning}
                    </div>

                    <span>
                        Gambar tidak dapat dimuat
                    </span>

                </div>
            `

            : `
                <div class="banner-placeholder">

                    <div class="banner-placeholder-icon">
                        ${iconImage}
                    </div>

                    <span>
                        Belum ada banner
                    </span>

                </div>
            `;


    // =====================================================
    // HTML BANNER
    // =====================================================

    article.innerHTML = `

        <div class="banner-item-head">

            <div class="banner-slot">

                <span class="slot-number">
                    ${slot}
                </span>

                <span>
                    Banner ${slot}
                </span>

            </div>


            <label class="status-toggle">

                <input
                    type="checkbox"
                    class="banner-active-input"
                    ${active ? "checked" : ""}
                >

                <span>
                    Aktif
                </span>

            </label>

        </div>


        <div class="banner-editor">

            <div class="banner-preview">

                ${imageHtml}

            </div>


            <div class="banner-form">

                <div class="banner-form-group">

                    <label>
                        Link tujuan saat banner diklik
                    </label>

                    <input
                        type="url"
                        class="banner-url-input"
                        value="${escapeAttribute(banner?.target_url || "")}"
                        placeholder="https://contoh.com/halaman"
                    >

                </div>


                <div class="banner-form-group">

                    <label>
                        Urutan
                    </label>

                    <input
                        type="number"
                        class="banner-slot-input"
                        min="1"
                        max="5"
                        value="${slot}"
                    >

                </div>


                <div class="banner-actions">

                    <label
                        class="secondary-button banner-action-button"
                    >

                        ${iconCamera}

                        <span>
                            ${banner
                                ? "Ganti Gambar"
                                : "Upload Gambar"}
                        </span>

                        <input
                            type="file"
                            class="banner-file-input"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                        >

                    </label>


                    ${
                        banner

                            ? `
                                <button
                                    type="button"
                                    class="secondary-button banner-action-button danger-button"
                                    onclick="hapusBanner('${banner.id}')"
                                >

                                    ${iconDelete}

                                    <span>
                                        Hapus
                                    </span>

                                </button>
                            `

                            : `
                                <button
                                    type="button"
                                    class="secondary-button banner-action-button"
                                    disabled
                                >

                                    <span>
                                        Kosong
                                    </span>

                                </button>
                            `
                    }

                </div>

            </div>

        </div>

    `;


    // =====================================================
    // FILE INPUT
    // =====================================================

    const fileInput =
        article.querySelector(
            ".banner-file-input"
        );


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                prosesUploadBanner(
                    slot,
                    banner,
                    fileInput.files?.[0],
                    article
                );

            }
        );

    }


    // =====================================================
    // STATUS AKTIF
    // =====================================================

    const activeInput =
        article.querySelector(
            ".banner-active-input"
        );


    if (activeInput) {

        activeInput.addEventListener(
            "change",
            function () {

                if (!banner) {

                    activeInput.checked =
                        false;

                    tampilkanPesan(
                        "bannerError",
                        "Upload gambar terlebih dahulu.",
                        "error"
                    );

                    return;

                }


                ubahStatusBanner(
                    banner.id,
                    activeInput.checked
                );

            }
        );

    }


    // =====================================================
    // URL
    // =====================================================

    const urlInput =
        article.querySelector(
            ".banner-url-input"
        );


    if (urlInput) {

        urlInput.addEventListener(
            "change",
            function () {

                if (!banner) {

                    return;

                }


                simpanUrlBanner(
                    banner.id,
                    urlInput.value.trim()
                );

            }
        );

    }


    // =====================================================
    // URUTAN
    // =====================================================

    const slotInput =
        article.querySelector(
            ".banner-slot-input"
        );


    if (slotInput) {

        slotInput.addEventListener(
            "change",
            function () {

                if (!banner) {

                    return;

                }


                pindahkanSlotBanner(
                    banner,
                    slotInput.value
                );

            }
        );

    }


    return article;

}


// =========================================================
// UPLOAD / GANTI BANNER
// =========================================================

async function prosesUploadBanner(
    slot,
    banner,
    file,
    article
) {

    if (!file) {

        return;

    }


    sembunyikanPesan(
        "bannerError"
    );

    sembunyikanPesan(
        "bannerSuccess"
    );


    try {

        await cekAdmin();


        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {

            throw new Error(
                "Format banner harus JPG, PNG, atau WEBP."
            );

        }


        if (
            file.size >
            MAX_BANNER_SIZE
        ) {

            throw new Error(
                "Ukuran banner maksimal 5 MB."
            );

        }


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const filePath =
            `banner-${slot}-${Date.now()}.${extension}`;


        const client =
            pastikanSupabase();


        const {
            error: uploadError
        } =
            await client.storage
                .from(BANNER_BUCKET)
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type
                    }
                );


        if (uploadError) {

            throw new Error(
                "Gagal upload banner: " +
                uploadError.message
            );

        }


        const {
            data: publicData
        } =
            client.storage
                .from(BANNER_BUCKET)
                .getPublicUrl(
                    filePath
                );


        const imageUrl =
            publicData?.publicUrl;


        if (!imageUrl) {

            throw new Error(
                "URL banner tidak berhasil dibuat."
            );

        }


        const urlInput =
            article.querySelector(
                ".banner-url-input"
            );


        const targetUrl =
            urlInput
                ? urlInput.value.trim()
                : null;


        if (
            targetUrl &&
            !/^https?:\/\//i.test(
                targetUrl
            )
        ) {

            throw new Error(
                "Link tujuan harus diawali http:// atau https://."
            );

        }


        const activeInput =
            article.querySelector(
                ".banner-active-input"
            );


        const isActive =
            activeInput
                ? activeInput.checked
                : true;


        const user =
            await ambilUserLogin();


        const dataSimpan = {

            slot:
                Number(slot),

            image_url:
                imageUrl,

            storage_path:
                filePath,

            target_url:
                targetUrl || null,

            is_active:
                isActive,

            created_by:
                user.id,

            updated_at:
                new Date().toISOString()

        };


        let result;


        if (banner?.id) {

            result =
                await client
                    .from("banner_slides")
                    .update(
                        dataSimpan
                    )
                    .eq(
                        "id",
                        banner.id
                    )
                    .select()
                    .single();

        } else {

            result =
                await client
                    .from("banner_slides")
                    .insert(
                        dataSimpan
                    )
                    .select()
                    .single();

        }


        if (result.error) {

            await client.storage
                .from(BANNER_BUCKET)
                .remove([
                    filePath
                ]);


            throw new Error(
                "Gagal menyimpan data banner: " +
                result.error.message
            );

        }


        if (
            banner?.storage_path &&
            banner.storage_path !== filePath
        ) {

            await client.storage
                .from(BANNER_BUCKET)
                .remove([
                    banner.storage_path
                ]);

        }


        tampilkanPesan(
            "bannerSuccess",
            `✓ Banner ${slot} berhasil disimpan.`,
            "success"
        );


        await muatBanner();


    } catch (error) {

        console.error(
            "SIDAT BANNER UPLOAD ERROR:",
            error
        );


        tampilkanPesan(
            "bannerError",
            error?.message ||
            "Gagal menyimpan banner.",
            "error"
        );

    }

}


// =========================================================
// STATUS BANNER
// =========================================================

async function ubahStatusBanner(
    id,
    isActive
) {

    try {

        await cekAdmin();


        const client =
            pastikanSupabase();


        const {
            error
        } =
            await client
                .from("banner_slides")
                .update({
                    is_active:
                        Boolean(isActive),

                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw new Error(
                error.message
            );

        }


        tampilkanPesan(
            "bannerSuccess",
            isActive
                ? "✓ Banner diaktifkan."
                : "✓ Banner dinonaktifkan.",
            "success"
        );


        await muatBanner();


    } catch (error) {

        console.error(
            "SIDAT STATUS BANNER ERROR:",
            error
        );


        tampilkanPesan(
            "bannerError",
            error?.message ||
            "Gagal mengubah status banner.",
            "error"
        );


        await muatBanner();

    }

}


// =========================================================
// SIMPAN URL BANNER
// =========================================================

async function simpanUrlBanner(
    id,
    value
) {

    try {

        if (
            value &&
            !/^https?:\/\//i.test(
                value
            )
        ) {

            throw new Error(
                "Link tujuan harus diawali http:// atau https://."
            );

        }


        await cekAdmin();


        const client =
            pastikanSupabase();


        const {
            error
        } =
            await client
                .from("banner_slides")
                .update({

                    target_url:
                        value || null,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw new Error(
                error.message
            );

        }


        tampilkanPesan(
            "bannerSuccess",
            "✓ Link banner berhasil disimpan.",
            "success"
        );


    } catch (error) {

        console.error(
            "SIDAT URL BANNER ERROR:",
            error
        );


        tampilkanPesan(
            "bannerError",
            error?.message ||
            "Gagal menyimpan link banner.",
            "error"
        );

    }

}


// =========================================================
// PINDAH SLOT
// =========================================================

async function pindahkanSlotBanner(
    banner,
    tujuan
) {

    const newSlot =
        Number(tujuan);


    if (
        !Number.isInteger(newSlot) ||
        newSlot < 1 ||
        newSlot > MAX_BANNER
    ) {

        tampilkanPesan(
            "bannerError",
            "Urutan banner harus antara 1 sampai 5.",
            "error"
        );

        await muatBanner();

        return;

    }


    if (
        newSlot ===
        Number(banner.slot)
    ) {

        return;

    }


    try {

        await cekAdmin();


        const client =
            pastikanSupabase();


        const targetBanner =
            bannerData.find(
                item =>
                    Number(item.slot) ===
                    newSlot
            );


        if (!targetBanner) {

            const {
                error
            } =
                await client
                    .from("banner_slides")
                    .update({
                        slot:
                            newSlot,

                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "id",
                        banner.id
                    );


            if (error) {

                throw new Error(
                    error.message
                );

            }

        } else {

            const temporarySlot =
                99;


            let result =
                await client
                    .from("banner_slides")
                    .update({
                        slot:
                            temporarySlot
                    })
                    .eq(
                        "id",
                        targetBanner.id
                    );


            if (result.error) {

                throw new Error(
                    result.error.message
                );

            }


            result =
                await client
                    .from("banner_slides")
                    .update({
                        slot:
                            newSlot
                    })
                    .eq(
                        "id",
                        banner.id
                    );


            if (result.error) {

                throw new Error(
                    result.error.message
                );

            }


            result =
                await client
                    .from("banner_slides")
                    .update({
                        slot:
                            Number(banner.slot)
                    })
                    .eq(
                        "id",
                        targetBanner.id
                    );


            if (result.error) {

                throw new Error(
                    result.error.message
                );

            }

        }


        tampilkanPesan(
            "bannerSuccess",
            "✓ Urutan banner berhasil diperbarui.",
            "success"
        );


        await muatBanner();


    } catch (error) {

        console.error(
            "SIDAT PINDAH BANNER ERROR:",
            error
        );


        tampilkanPesan(
            "bannerError",
            error?.message ||
            "Gagal mengubah urutan banner.",
            "error"
        );


        await muatBanner();

    }

}


// =========================================================
// HAPUS BANNER
// =========================================================

async function hapusBanner(id) {

    const banner =
        bannerData.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!banner) {

        return;

    }


    const yakin =
        confirm(
            `Hapus Banner ${banner.slot}?\n\nGambar banner juga akan dihapus dari Storage.`
        );


    if (!yakin) {

        return;

    }


    try {

        await cekAdmin();


        const client =
            pastikanSupabase();


        const {
            error
        } =
            await client
                .from("banner_slides")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw new Error(
                error.message
            );

        }


        if (
            banner.storage_path
        ) {

            const {
                error: storageError
            } =
                await client.storage
                    .from(BANNER_BUCKET)
                    .remove([
                        banner.storage_path
                    ]);


            if (storageError) {

                console.warn(
                    "SIDAT STORAGE DELETE WARNING:",
                    storageError
                );

            }

        }


        tampilkanPesan(
            "bannerSuccess",
            `✓ Banner ${banner.slot} berhasil dihapus.`,
            "success"
        );


        await muatBanner();


    } catch (error) {

        console.error(
            "SIDAT HAPUS BANNER ERROR:",
            error
        );


        tampilkanPesan(
            "bannerError",
            error?.message ||
            "Gagal menghapus banner.",
            "error"
        );

    }

}


// =========================================================
// ESCAPE ATTRIBUTE
// =========================================================

function escapeAttribute(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    );

}


// =========================================================
// BACKUP
// =========================================================

const BACKUP_TABLES = [

    "wilayah",

    "banner_slides",

    "households",

    "residents",

    "profiles",

    "reports",

    "cash_transactions",

    "jimpitan_transactions",

    "notifications",

    "notification_reads",

    "announcements",

    "announcement_reads"

];


// =========================================================
// BUAT BACKUP
// =========================================================

async function buatBackup() {

    const button =
        el("backupButton");


    const oldText =
        button?.textContent ||
        "Buat Backup";


    try {

        await cekAdmin();


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Membuat backup...";

        }


        tampilkanBackupStatus(
            "Sedang mengambil data..."
        );


        const client =
            pastikanSupabase();


        const backup = {

            format:
                "SIDAT_BACKUP",

            version:
                1,

            application:
                "SIDAT",

            created_at:
                new Date().toISOString(),

            created_by:
                userProfile?.user_id ||
                null,

            tables: {}

        };


        for (
            const tableName of BACKUP_TABLES
        ) {

            tampilkanBackupStatus(
                `Membackup tabel: ${tableName}...`
            );


            const {
                data,
                error
            } =
                await client
                    .from(tableName)
                    .select("*");


            if (error) {

                console.warn(
                    `SIDAT BACKUP ${tableName}:`,
                    error.message
                );


                backup.tables[
                    tableName
                ] = {

                    success:
                        false,

                    error:
                        error.message,

                    rows:
                        []

                };


                continue;

            }


            backup.tables[
                tableName
            ] = {

                success:
                    true,

                rows:
                    data || []

            };

        }


        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const tanggal =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


        const anchor =
            document.createElement(
                "a"
            );


        anchor.href =
            url;


        anchor.download =
            `SIDAT-backup-${tanggal}.json`;


        document.body.appendChild(
            anchor
        );


        anchor.click();


        anchor.remove();


        URL.revokeObjectURL(
            url
        );


        tampilkanBackupStatus(
            "✓ Backup berhasil dibuat dan file JSON sudah diunduh."
        );


    } catch (error) {

        console.error(
            "SIDAT BACKUP ERROR:",
            error
        );


        tampilkanBackupStatus(
            "Backup gagal: " +
            (
                error?.message ||
                "Terjadi kesalahan."
            )
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                oldText;

        }

    }

}


// =========================================================
// RESTORE
// =========================================================

async function restoreBackup(file) {

    if (!file) {

        return;

    }


    const yakin =
        confirm(
            "PERINGATAN!\n\nRestore dapat mengubah data yang ada di database.\n\nPastikan file backup berasal dari SIDAT dan dibuat oleh admin yang terpercaya.\n\nLanjutkan?"
        );


    if (!yakin) {

        const input =
            el("restoreInput");


        if (input) {

            input.value =
                "";

        }


        return;

    }


    try {

        await cekAdmin();


        tampilkanBackupStatus(
            "Membaca file backup..."
        );


        const text =
            await file.text();


        const backup =
            JSON.parse(
                text
            );


        if (
            backup?.format !==
            "SIDAT_BACKUP"
        ) {

            throw new Error(
                "File bukan backup SIDAT yang valid."
            );

        }


        if (
            !backup.tables ||
            typeof backup.tables !== "object"
        ) {

            throw new Error(
                "Struktur backup tidak valid."
            );

        }


        const client =
            pastikanSupabase();


        const restoreOrder = [

            "wilayah",

            "profiles",

            "residents",

            "households",

            "banner_slides",

            "cash_transactions",

            "jimpitan_transactions",

            "reports",

            "announcements",

            "announcement_reads",

            "notifications",

            "notification_reads"

        ];


        let totalRows =
            0;

        let successTables =
            0;


        for (
            const tableName of restoreOrder
        ) {

            const tableBackup =
                backup.tables[
                    tableName
                ];


            if (
                !tableBackup ||
                !tableBackup.success ||
                !Array.isArray(
                    tableBackup.rows
                ) ||
                !tableBackup.rows.length
            ) {

                continue;

            }


            tampilkanBackupStatus(
                `Restore ${tableName}...`
            );


            const rows =
                tableBackup.rows;


            const {
                error
            } =
                await client
                    .from(tableName)
                    .upsert(
                        rows,
                        {
                            onConflict:
                                "id"
                        }
                    );


            if (error) {

                throw new Error(
                    `Restore ${tableName} gagal: ${error.message}`
                );

            }


            totalRows +=
                rows.length;

            successTables++;

        }


        tampilkanBackupStatus(
            `✓ Restore selesai. ${successTables} tabel diproses, total ${totalRows} baris data.`
        );


        await muatPengaturan();


    } catch (error) {

        console.error(
            "SIDAT RESTORE ERROR:",
            error
        );


        tampilkanBackupStatus(
            "Restore gagal: " +
            (
                error?.message ||
                "Terjadi kesalahan."
            )
        );

    } finally {

        const input =
            el("restoreInput");


        if (input) {

            input.value =
                "";

        }

    }

}


// =========================================================
// STATUS BACKUP
// =========================================================

function tampilkanBackupStatus(
    message
) {

    const element =
        el("backupStatus");


    if (!element) {

        return;

    }


    element.textContent =
        message || "";


    element.classList.remove(
        "hidden"
    );

}


// =========================================================
// KEMBALI DASHBOARD
// =========================================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// =========================================================
// EVENT
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const identityForm =
            el("identityForm");


        if (identityForm) {

            identityForm.addEventListener(
                "submit",
                simpanIdentitas
            );

        }


        const logoInput =
            el("logoInput");


        if (logoInput) {

            logoInput.addEventListener(
                "change",
                previewLogo
            );

        }


        const backupButton =
            el("backupButton");


        if (backupButton) {

            backupButton.addEventListener(
                "click",
                buatBackup
            );

        }


        const restoreInput =
            el("restoreInput");


        if (restoreInput) {

            restoreInput.addEventListener(
                "change",
                function () {

                    restoreBackup(
                        restoreInput.files?.[0]
                    );

                }
            );

        }


        muatPengaturan();

    }
);


// =========================================================
// EXPORT GLOBAL
// =========================================================

window.muatPengaturan =
    muatPengaturan;

window.kembaliDashboard =
    kembaliDashboard;

window.hapusBanner =
    hapusBanner;