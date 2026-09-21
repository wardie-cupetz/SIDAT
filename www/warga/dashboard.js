/* =========================================================
SIDAT - DASHBOARD WARGA
FINAL
========================================================= */

(function () {
"use strict";

const accessToken =
    localStorage.getItem("sidat_access_token");

const wargaRaw =
    localStorage.getItem("sidat_user");

let warga = null;
let wilayahData = null;

let ageChart = null;
let financeChart = null;

let currentBanner = 0;
let bannerTimer = null;

let rondaSchedules = [];
let rondaCurrentDay = 1;
let rondaTimer = null;

if (!accessToken || !wargaRaw) {
    window.location.href = "../index.html";
    return;
}

try {
    warga = JSON.parse(wargaRaw);
} catch (error) {
    localStorage.removeItem("sidat_access_token");
    localStorage.removeItem("sidat_user");
    window.location.href = "../index.html";
    return;
}


/* =====================================================
   UTILITY
   ===================================================== */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value || 0));
}


function formatTanggalWaktu(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function formatJam(value) {
    if (!value) return "";

    const text = String(value);

    return text.length >= 5
        ? text.substring(0, 5)
        : text;
}


function getJakartaDate() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Jakarta"
        })
    );
}


function getJakartaDayOfWeek() {
    const day =
        getJakartaDate().getDay();

    return day === 0
        ? 1
        : day + 1;
}


function getNamaHari(day) {
    const days = {
        1: "Minggu",
        2: "Senin",
        3: "Selasa",
        4: "Rabu",
        5: "Kamis",
        6: "Jumat",
        7: "Sabtu"
    };

    return days[Number(day)] || "-";
}


function getInitials(name) {
    const text =
        String(name || "Warga")
            .trim();

    if (!text) return "W";

    const parts =
        text.split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 1)
            .toUpperCase();
    }

    return (
        parts[0].substring(0, 1) +
        parts[parts.length - 1]
            .substring(0, 1)
    ).toUpperCase();
}


function createInitialAvatar(name) {
    const initials =
        getInitials(name);

    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
        '<rect width="160" height="160" rx="80" fill="#15803d"/>' +
        '<text x="80" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="700" fill="#ffffff">' +
        escapeHTML(initials) +
        "</text>" +
        "</svg>";

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}


function showToast(message) {
    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer =
        setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
}


/* =====================================================
   SUPABASE REST
   ===================================================== */

async function supabaseGet(
    table,
    query
) {
    const url =
        SUPABASE_URL +
        "/rest/v1/" +
        table +
        (query ? "?" + query : "");

    const response =
        await fetch(url, {
            method: "GET",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization:
                    "Bearer " +
                    accessToken,
                Accept:
                    "application/json"
            }
        });

    if (!response.ok) {
        throw new Error(
            "Supabase GET " +
            table +
            " gagal: " +
            response.status
        );
    }

    return response.json();
}


async function supabasePostRPC(
    functionName,
    body
) {
    const response =
        await fetch(
            SUPABASE_URL +
            "/rest/v1/rpc/" +
            functionName,
            {
                method: "POST",
                headers: {
                    apikey:
                        SUPABASE_KEY,
                    Authorization:
                        "Bearer " +
                        accessToken,
                    "Content-Type":
                        "application/json",
                    Accept:
                        "application/json"
                },
                body:
                    JSON.stringify(
                        body || {}
                    )
            }
        );

    if (!response.ok) {
        throw new Error(
            "RPC " +
            functionName +
            " gagal: " +
            response.status
        );
    }

    return response.json();
}


/* =====================================================
   PROFIL
   ===================================================== */

async function loadProfilWarga() {

    try {

        /*
         * 1. Ambil user yang sedang login
         *    menggunakan access token yang sudah ada.
         */
        const userResponse =
            await fetch(
                `${SUPABASE_URL}/auth/v1/user`,
                {
                    method: "GET",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!userResponse.ok) {
            throw new Error(
                "Gagal membaca user login."
            );
        }

        const user =
            await userResponse.json();

        const userId =
            user?.id || "";

        if (!userId) {
            throw new Error(
                "ID user login tidak ditemukan."
            );
        }


        /*
         * 2. Ambil resident_id dari profiles.
         */
        const profileRows =
            await supabaseGet(
                "profiles",
                [
                    "select=user_id,role,resident_id",
                    "user_id=eq." +
                        encodeURIComponent(
                            userId
                        ),
                    "limit=1"
                ].join("&")
            );

        const profile =
            Array.isArray(profileRows) &&
            profileRows.length
                ? profileRows[0]
                : null;

        const residentId =
            profile?.resident_id ||
            warga?.resident_id ||
            warga?.residentId ||
            null;


        /*
         * Jika resident_id tidak tersedia,
         * tetap tampilkan data lokal.
         */
        if (!residentId) {

            tampilkanProfilWarga(
                warga
            );

            return;
        }


        /*
         * 3. Ambil data lengkap warga.
         *
         * Termasuk:
         * - name
         * - photo_url
         */
        const rows =
            await supabaseGet(
                "residents",
                [
                    "select=id,resident_code,name,photo_url,phone,jimpitan_balance,is_active,family_status",
                    "id=eq." +
                        encodeURIComponent(
                            residentId
                        ),
                    "limit=1"
                ].join("&")
            );


        /*
         * 4. Gabungkan data resident
         *    dengan data login yang sudah ada.
         */
        if (
            Array.isArray(rows) &&
            rows.length
        ) {

            warga = {
                ...warga,

                user_id:
                    userId,

                resident_id:
                    residentId,

                role:
                    profile?.role ||
                    warga?.role ||
                    "warga",

                ...rows[0]
            };


            /*
             * Simpan kembali ke localStorage
             * supaya nama/foto tersedia saat
             * dashboard dibuka kembali.
             */
            localStorage.setItem(
                "sidat_user",
                JSON.stringify(
                    warga
                )
            );
        }

    } catch (error) {

        console.error(
            "SIDAT profil:",
            error
        );
    }


    /*
     * 5. Tampilkan nama dan foto.
     */
    tampilkanProfilWarga(
        warga
    );
}


function tampilkanProfilWarga(
    data
) {

    const name =
        String(
            data?.name ||
            data?.resident_name ||
            "Warga"
        ).trim();


    const photo =
        String(
            data?.photo_url ||
            ""
        ).trim();


    const image =
        document.getElementById(
            "profilePhoto"
        );


    const nameElement =
        document.getElementById(
            "profileName"
        );


    /*
     * Tampilkan nama warga.
     */
    if (nameElement) {

        nameElement.textContent =
            name;
    }


    /*
     * Tampilkan foto warga.
     */
    if (image) {

        /*
         * Jika ada foto dari residents,
         * gunakan foto tersebut.
         */
        image.src =
            photo ||
            createInitialAvatar(
                name
            );

        image.alt =
            "Foto " + name;


        /*
         * Jika URL foto gagal,
         * otomatis kembali ke avatar inisial.
         */
        image.onerror =
            function () {

                this.onerror =
                    null;

                this.src =
                    createInitialAvatar(
                        name
                    );
            };
    }
}

/* =====================================================
   WILAYAH
   ===================================================== */

async function loadWilayah() {
    try {
        const rows =
            await supabaseGet(
                "wilayah",
                "select=id,nama_aplikasi,nama_dusun,nama_desa,rt,rw,nama_ketua_rt,kecamatan,kabupaten,provinsi,logo_url&limit=1"
            );

        if (
            !Array.isArray(rows) ||
            !rows.length
        ) {
            return;
        }

        wilayahData = rows[0];

        localStorage.setItem(
            "sidat_wilayah_data",
            JSON.stringify(
                wilayahData
            )
        );

        terapkanWilayah(
            wilayahData
        );

    } catch (error) {

        console.error(
            "SIDAT wilayah:",
            error
        );

        /*
         * Gunakan cache jika Supabase
         * sedang tidak dapat diakses.
         */
        try {

            const cache =
                localStorage.getItem(
                    "sidat_wilayah_data"
                );

            if (cache) {

                wilayahData =
                    JSON.parse(
                        cache
                    );

                terapkanWilayah(
                    wilayahData
                );
            }

        } catch (_) {}
    }
}


function terapkanWilayah(data) {

    if (!data) return;


    const info =
        document.getElementById(
            "wilayahInfo"
        );


    const logo =
        document.getElementById(
            "wilayahLogo"
        );


    const fallback =
        document.getElementById(
            "logoFallback"
        );


    /*
     * =================================================
     * RT / RW
     * =================================================
     */

    const rt =
        data.rt
            ? "RT " +
              String(data.rt)
                  .padStart(2, "0")
            : "";


    const rw =
        data.rw
            ? "RW " +
              String(data.rw)
                  .padStart(2, "0")
            : "";


    const region =
        [rt, rw]
            .filter(Boolean)
            .join(" / ");


    /*
     * =================================================
     * WILAYAH LENGKAP
     * =================================================
     */

    const detail =
        [
            data.nama_dusun
                ? "Dusun " +
                  data.nama_dusun
                : "",

            data.nama_desa
                ? "Desa " +
                  data.nama_desa
                : "",

            data.kecamatan
                ? "Kec. " +
                  data.kecamatan
                : "",

            data.kabupaten
                ? "Kab. " +
                  data.kabupaten
                : "",

            data.provinsi
                ? data.provinsi
                : ""
        ]
            .filter(Boolean)
            .join(" • ");


    /*
     * =================================================
     * TAMPILKAN RT/RW + WILAYAH
     * =================================================
     */

    if (info) {

        const wilayahLengkap =
            [region, detail]
                .filter(Boolean)
                .join(" • ");

        info.textContent =
            wilayahLengkap ||
            "Wilayah RT";
    }


    /*
     * =================================================
     * LOGO WILAYAH
     * =================================================
     */

    if (logo) {

        if (data.logo_url) {

            logo.src =
                data.logo_url;

            logo.style.display =
                "block";

            if (fallback) {

                fallback.style.display =
                    "none";
            }

        } else {

            logo.style.display =
                "none";

            if (fallback) {

                fallback.style.display =
                    "flex";
            }
        }


        logo.onerror =
            function () {

                this.style.display =
                    "none";

                if (fallback) {

                    fallback.style.display =
                        "flex";
                }
            };
    }


    /*
     * =================================================
     * JUDUL APLIKASI
     * =================================================
     */

    if (data.nama_aplikasi) {

        document.title =
            data.nama_aplikasi +
            " - Dashboard Warga";
    }
}
  /* =====================================================
   BANNER
   ===================================================== */

let bannerSlides = [];
let bannerDots = [];
let bannerSliderElement = null;
let bannerTouchStartX = 0;


/* =====================================================
   SUPABASE CLIENT UNTUK BANNER
   ===================================================== */

function pastikanSupabase() {

    if (
        typeof supabase === "undefined"
    ) {
        throw new Error(
            "Library Supabase belum tersedia."
        );
    }

    if (
        !window.sidatDashboardSupabaseClient
    ) {
        window.sidatDashboardSupabaseClient =
            supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );
    }

    return window.sidatDashboardSupabaseClient;
}


/* =====================================================
   BANNER STORAGE URL
   ===================================================== */

function getBannerImageUrl(
    banner
) {

    /*
     * Prioritas pertama:
     * image_url yang sudah disimpan oleh Admin.
     */

    const imageUrl =
        String(
            banner?.image_url || ""
        ).trim();

    if (imageUrl) {
        return imageUrl;
    }


    /*
     * Jika Admin hanya menyimpan storage_path,
     * buat Public Storage URL.
     *
     * Bucket:
     * sidat-banners
     */

    const storagePath =
        String(
            banner?.storage_path || ""
        ).trim();

    if (!storagePath) {
        return "";
    }


    const client =
        pastikanSupabase();


    const result =
        client.storage
            .from("sidat-banners")
            .getPublicUrl(
                storagePath
            );


    return (
        result?.data?.publicUrl ||
        ""
    );
}


/* =====================================================
   LOAD BANNER
   ===================================================== */

async function loadBannerData() {

    try {

        const rows = await supabaseGet(
            "banner_slides",
            [
                "select=id,slot,image_url,storage_path,target_url,is_active",
                "is_active=eq.true",
                "order=slot.asc",
                "limit=5"
            ].join("&")
        );

        const banners =
            Array.isArray(rows)
                ? rows
                : [];

        console.log(
            "SIDAT BANNER DATA:",
            banners
        );

        renderBannerData(banners);

    } catch (error) {

        console.error(
            "SIDAT BANNER ERROR:",
            error
        );
      if (
    typeof window.sidatRefreshBannerSlider ===
    "function"
) {
    window.sidatRefreshBannerSlider();
      }

        renderBannerData([]);
    }
}
function pasangEventBanner() {

    const slides =
        document.querySelectorAll(
            ".sidat-banner-slide"
        );

    slides.forEach(
        (slide) => {

            slide.addEventListener(
                "click",
                function () {

                    const targetUrl =
                        String(
                            slide.dataset.link ||
                            ""
                        ).trim();

                    if (!targetUrl) {
                        return;
                    }

                    /*
                     * Konfirmasi sebelum membuka
                     * tautan banner.
                     */
                    const lanjut =
                        window.confirm(
                            "Buka tautan dari banner ini?"
                        );

                    if (!lanjut) {
                        return;
                    }

                    window.location.href =
                        targetUrl;
                }
            );
        }
    );
}

/* =====================================================
   RENDER BANNER
   ===================================================== */

function renderBannerData(banners) {

    const slides = Array.from(
        document.querySelectorAll(
            ".sidat-banner-slide"
        )
    );

    const dots = Array.from(
        document.querySelectorAll(
            ".sidat-banner-dot"
        )
    );

    if (!slides.length) {
        console.warn(
            "SIDAT: elemen banner tidak ditemukan."
        );
        return;
    }

    /*
     * Reset semua slide
     */
    slides.forEach(
        (slide, index) => {

            slide.classList.toggle(
                "active",
                index === 0
            );

            slide.dataset.link = "";

            const image =
                slide.querySelector(
                    "img"
                );

            if (image) {
                image.removeAttribute(
                    "src"
                );

                image.style.display =
                    "none";
            }

            const title =
                slide.querySelector(
                    "strong"
                );

            const text =
                slide.querySelector(
                    "span"
                );

            if (title) {
                title.textContent = "";
            }

            if (text) {
                text.textContent = "";
            }
        }
    );

    /*
     * Reset dots
     */
    dots.forEach(
        (dot, index) => {

            dot.classList.toggle(
                "active",
                index === 0
            );

            dot.style.display =
                "none";
        }
    );

    /*
     * Jika tidak ada banner
     */
    if (
        !Array.isArray(banners) ||
        banners.length === 0
    ) {

        console.warn(
            "SIDAT: tidak ada banner aktif."
        );

        return;
    }

    /*
     * Render maksimal 5 banner
     */
    banners
        .slice(0, 5)
        .forEach(
            (banner, index) => {

                const slide =
                    slides[index];

                const dot =
                    dots[index];

                if (!slide) {
                    return;
                }

                /*
                 * URL gambar
                 */
                const imageUrl =
                    String(
                        banner.image_url ||
                        ""
                    ).trim();

                /*
                 * URL tujuan
                 */
                const targetUrl =
                    String(
                        banner.target_url ||
                        ""
                    ).trim();

                slide.dataset.link =
                    targetUrl;

                /*
                 * Gambar
                 */
                const image =
                    slide.querySelector(
                        "img"
                    );

                if (
                    image &&
                    imageUrl
                ) {

                    image.src =
                        imageUrl;

                    image.alt =
                        `Banner SIDAT ${index + 1}`;

                    image.style.display =
                        "block";

                    /*
                     * Debug penting
                     */
                    image.onload =
                        function () {

                            console.log(
                                "SIDAT BANNER IMAGE LOADED:",
                                index + 1,
                                imageUrl
                            );
                        };

                    image.onerror =
                        function () {

                            console.error(
                                "SIDAT BANNER IMAGE ERROR:",
                                index + 1,
                                imageUrl
                            );
                        };
                }

                /*
                 * Judul
                 */
                const title =
                    slide.querySelector(
                        "strong"
                    );

                if (title) {

                    title.textContent =
                        String(
                            banner.title ||
                            ""
                        );
                }

                /*
                 * Deskripsi
                 */
                const text =
                    slide.querySelector(
                        "span"
                    );

                if (text) {

                    text.textContent =
                        String(
                            banner.description ||
                            ""
                        );
                }

                /*
                 * Tampilkan slide
                 */
                slide.style.display =
                    index === 0
                        ? "block"
                        : "none";

                /*
                 * Tampilkan dot
                 */
                if (dot) {

                    dot.style.display =
                        "block";

                    dot.classList.toggle(
                        "active",
                        index === 0
                    );
                }
            }
        );

    /*
     * Pastikan banner pertama aktif
     */
    slides.forEach(
        (slide, index) => {

            slide.classList.toggle(
                "active",
                index === 0
            );
        }
    );

    console.log(
        "SIDAT BANNER RENDERED:",
        banners.length
    );
}


/* =====================================================
   REFRESH SLIDER
   ===================================================== */

function refreshBannerSlider() {

    bannerSlides =
        Array.isArray(
            bannerSlides
        )
            ? bannerSlides
            : [];


    bannerSlides =
        bannerSlides.slice(
            0,
            5
        );


    bannerSlides.forEach(
        function (
            banner,
            index
        ) {

            const slide =
                document.querySelector(
                    ".sidat-banner-slide:nth-child(" +
                    (index + 1) +
                    ")"
                );

            if (!slide) {
                return;
            }

            slide.dataset.link =
                String(
                    banner.target_url ||
                    ""
                ).trim();

        }
    );


    setupBannerSlider();


    /*
     * Pastikan banner pertama langsung tampil.
     */

    showBannerSlide(
        0
    );

}


/* =====================================================
   SETUP SLIDER
   ===================================================== */

function setupBannerSlider() {

    bannerSlides =
        Array.isArray(
            bannerSlides
        )
            ? bannerSlides
            : [];


    const slides =
        Array.from(
            document.querySelectorAll(
                ".sidat-banner-slide"
            )
        );


    const dots =
        Array.from(
            document.querySelectorAll(
                ".sidat-banner-dot"
            )
        );


    bannerDots =
        dots;


    bannerSliderElement =
        document.getElementById(
            "bannerSlider"
        );


    if (!slides.length) {
        return;
    }


    /*
     * Bersihkan event lama dengan clone
     * agar tidak terjadi event ganda.
     */

    slides.forEach(
        function (
            slide
        ) {

            const clone =
                slide.cloneNode(
                    true
                );

            slide.replaceWith(
                clone
            );

        }
    );


    /*
     * Ambil ulang slide setelah clone.
     */

    const freshSlides =
        Array.from(
            document.querySelectorAll(
                ".sidat-banner-slide"
            )
        );


    const freshDots =
        Array.from(
            document.querySelectorAll(
                ".sidat-banner-dot"
            )
        );


    bannerDots =
        freshDots;


    freshSlides.forEach(
        function (
            slide,
            index
        ) {

            slide.onclick =
                function (
                    event
                ) {

                    /*
                     * Jangan membuka link ketika
                     * pengguna sedang swipe.
                     */

                    if (
                        slide.dataset.swiping ===
                        "true"
                    ) {
                        slide.dataset.swiping =
                            "false";

                        return;
                    }


                    const link =
                        String(
                            slide.dataset.link ||
                            ""
                        ).trim();


                    if (!link) {
                        return;
                    }


                    if (
                        window.confirm(
                            "Buka informasi banner ini?"
                        )
                    ) {

                        window.location.href =
                            link;

                    }

                };


            /*
             * Hindari klik saat touch swipe.
             */

            slide.addEventListener(
                "touchstart",
                function () {

                    bannerTouchStartX =
                        0;

                    slide.dataset.swiping =
                        "false";

                },
                {
                    passive: true
                }
            );


            slide.addEventListener(
                "touchmove",
                function (
                    event
                ) {

                    const touch =
                        event.changedTouches[0];

                    if (
                        !touch
                    ) {
                        return;
                    }

                    if (
                        !bannerTouchStartX
                    ) {

                        bannerTouchStartX =
                            touch.clientX;

                    }

                },
                {
                    passive: true
                }
            );


            slide.addEventListener(
                "touchend",
                function (
                    event
                ) {

                    const touch =
                        event.changedTouches[0];

                    if (
                        !touch ||
                        !bannerTouchStartX
                    ) {
                        return;
                    }


                    const diff =
                        bannerTouchStartX -
                        touch.clientX;


                    if (
                        Math.abs(diff) >=
                        45
                    ) {

                        slide.dataset.swiping =
                            "true";


                        if (
                            diff > 0
                        ) {

                            showBannerSlide(
                                currentBanner +
                                1
                            );

                        } else {

                            showBannerSlide(
                                currentBanner -
                                1
                            );

                        }


                        restartBannerTimer();

                    }

                    bannerTouchStartX =
                        0;

                },
                {
                    passive: true
                }
            );

        }
    );


    /*
     * Tombol previous.
     */

    const prev =
        document.getElementById(
            "bannerPrev"
        );


    if (prev) {

        prev.onclick =
            function (
                event
            ) {

                event.stopPropagation();

                showBannerSlide(
                    currentBanner -
                    1
                );

                restartBannerTimer();

            };

    }


    /*
     * Tombol next.
     */

    const next =
        document.getElementById(
            "bannerNext"
        );


    if (next) {

        next.onclick =
            function (
                event
            ) {

                event.stopPropagation();

                showBannerSlide(
                    currentBanner +
                    1
                );

                restartBannerTimer();

            };

    }


    /*
     * Dot.
     */

    freshDots.forEach(
        function (
            dot,
            index
        ) {

            dot.onclick =
                function (
                    event
                ) {

                    event.stopPropagation();

                    showBannerSlide(
                        index
                    );

                    restartBannerTimer();

                };

        }
    );


    /*
     * Jika hanya ada satu banner,
     * sembunyikan kontrol navigasi.
     */

    const total =
        bannerSlides.length;


    if (prev) {

        prev.style.display =
            total > 1
                ? ""
                : "none";

    }


    if (next) {

        next.style.display =
            total > 1
                ? ""
                : "none";

    }


    freshDots.forEach(
        function (
            dot,
            index
        ) {

            dot.style.display =
                index < total
                    ? ""
                    : "none";

        }
    );


    restartBannerTimer();

}


/* =====================================================
   TAMPILKAN SLIDE
   ===================================================== */

function showBannerSlide(
    index
) {

    const slides =
        Array.from(
            document.querySelectorAll(
                ".sidat-banner-slide"
            )
        );


    const dots =
        Array.from(
            document.querySelectorAll(
                ".sidat-banner-dot"
            )
        );


    if (!slides.length) {
        return;
    }


    const total =
        bannerSlides.length ||
        slides.filter(
            function (slide) {
                return !slide.classList.contains(
                    "hidden"
                );
            }
        ).length;


    if (total <= 0) {
        return;
    }


    if (index < 0) {
        index =
            total - 1;
    }


    if (index >= total) {
        index = 0;
    }


    currentBanner =
        index;


    slides.forEach(
        function (
            slide,
            slideIndex
        ) {

            slide.classList.toggle(
                "active",
                slideIndex ===
                    currentBanner &&
                    slideIndex <
                        total
            );

        }
    );


    dots.forEach(
        function (
            dot,
            dotIndex
        ) {

            dot.classList.toggle(
                "active",
                dotIndex ===
                    currentBanner &&
                    dotIndex <
                        total
            );

        }
    );

}


/* =====================================================
   AUTOPLAY
   ===================================================== */

function restartBannerTimer() {

    clearInterval(
        bannerTimer
    );


    if (
        bannerSlides.length <= 1
    ) {
        return;
    }


    bannerTimer =
        setInterval(
            function () {

                showBannerSlide(
                    currentBanner +
                    1
                );

            },
            6000
        );

}


/* =====================================================
   URL ESCAPE
   ===================================================== */

function escapeBannerUrl(
    url
) {

    return String(
        url || ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\r/g,
            ""
        )
        .replace(
            /\n/g,
            ""
        );

}


/* =====================================================
   PUBLIC REFRESH
   ===================================================== */

window.sidatRefreshBannerSlider =
    function () {

        refreshBannerSlider();

    };


function initBannerSlider() {

    const slider =
        document.getElementById(
            "bannerSlider"
        );

    if (!slider) {
        return;
    }

    const slides =
        Array.from(
            slider.querySelectorAll(
                ".sidat-banner-slide"
            )
        );

    const dots =
        Array.from(
            slider.querySelectorAll(
                ".sidat-banner-dot"
            )
        );

    const prevButton =
        document.getElementById(
            "bannerPrev"
        );

    const nextButton =
        document.getElementById(
            "bannerNext"
        );

    if (!slides.length) {
        return;
    }

    let currentBanner = 0;
    let bannerTimer = null;

    /*
     * Ambil hanya slide yang
     * benar-benar memiliki gambar.
     */
    function getActiveSlides() {

        return slides.filter(
            (slide) => {

                const image =
                    slide.querySelector(
                        "img"
                    );

                return (
                    image &&
                    image.getAttribute(
                        "src"
                    )
                );
            }
        );
    }

    function tampilkanBanner(
        index
    ) {

        const activeSlides =
            getActiveSlides();

        if (!activeSlides.length) {
            return;
        }

        /*
         * Pastikan index valid.
         */
        if (
            index < 0
        ) {
            index =
                activeSlides.length - 1;
        }

        if (
            index >=
            activeSlides.length
        ) {
            index = 0;
        }

        currentBanner = index;

        /*
         * Sembunyikan semua slide.
         */
        slides.forEach(
            (slide) => {

                slide.classList.remove(
                    "active"
                );

                slide.style.display =
                    "none";
            }
        );

        /*
         * Tampilkan slide aktif.
         */
        const activeSlide =
            activeSlides[
                currentBanner
            ];

        if (activeSlide) {

            activeSlide.classList.add(
                "active"
            );

            activeSlide.style.display =
                "block";
        }

        /*
         * Atur dot sesuai jumlah
         * banner yang benar-benar aktif.
         */
        dots.forEach(
            (dot, dotIndex) => {

                if (
                    dotIndex <
                    activeSlides.length
                ) {

                    dot.style.display =
                        "block";

                    dot.classList.toggle(
                        "active",
                        dotIndex ===
                        currentBanner
                    );

                } else {

                    dot.style.display =
                        "none";
                }
            }
        );
    }

    function mulaiTimer() {

        if (bannerTimer) {

            clearInterval(
                bannerTimer
            );
        }

        /*
         * Tidak perlu timer kalau
         * hanya ada satu banner.
         */
        if (
            getActiveSlides().length <= 1
        ) {
            return;
        }

        bannerTimer =
            setInterval(
                () => {

                    tampilkanBanner(
                        currentBanner + 1
                    );

                },
                5000
            );
    }

    /*
     * Tombol sebelumnya.
     */
    if (prevButton) {

        prevButton.onclick =
            function (event) {

                event.stopPropagation();

                tampilkanBanner(
                    currentBanner - 1
                );

                mulaiTimer();
            };
    }

    /*
     * Tombol berikutnya.
     */
    if (nextButton) {

        nextButton.onclick =
            function (event) {

                event.stopPropagation();

                tampilkanBanner(
                    currentBanner + 1
                );

                mulaiTimer();
            };
    }

    /*
     * Dot navigasi.
     */
    dots.forEach(
        (dot, index) => {

            dot.onclick =
                function (event) {

                    event.stopPropagation();

                    tampilkanBanner(
                        index
                    );

                    mulaiTimer();
                };
        }
    );

    /*
     * Swipe kiri / kanan
     * untuk Android/mobile.
     */
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener(
        "touchstart",
        function (event) {

            if (
                !event.touches ||
                !event.touches.length
            ) {
                return;
            }

            touchStartX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );

    slider.addEventListener(
        "touchend",
        function (event) {

            if (
                !event.changedTouches ||
                !event.changedTouches.length
            ) {
                return;
            }

            touchEndX =
                event.changedTouches[0].clientX;

            const distance =
                touchEndX -
                touchStartX;

            /*
             * Minimal swipe 50px.
             */
            if (
                Math.abs(distance) < 50
            ) {
                return;
            }

            if (distance < 0) {

                tampilkanBanner(
                    currentBanner + 1
                );

            } else {

                tampilkanBanner(
                    currentBanner - 1
                );
            }

            mulaiTimer();
        },
        {
            passive: true
        }
    );

    /*
     * Klik banner tetap ditangani
     * oleh pasangEventBanner().
     */

    /*
     * Render pertama.
     */
    tampilkanBanner(0);

    /*
     * Jalankan autoplay.
     */
    mulaiTimer();

    /*
     * Simpan controller global supaya
     * renderBannerData() dapat
     * me-refresh slider setelah
     * data Supabase masuk.
     */
    window.sidatRefreshBannerSlider =
        function () {

            tampilkanBanner(0);

            mulaiTimer();
        };
}
/* =====================================================
   PENGUMUMAN
   ===================================================== */

async function loadPengumuman() {
    try {
        let rows;

        try {
            rows =
                await supabaseGet(
                    "announcements",
                    "select=*&is_active=eq.true&order=created_at.desc&limit=1"
                );
        } catch (_) {
            rows =
                await supabaseGet(
                    "announcements",
                    "select=*&order=created_at.desc&limit=1"
                );
        }

        if (
            !Array.isArray(rows) ||
            !rows.length
        ) {
            return;
        }

        const item =
            rows[0];

        const title =
            item.title ||
            item.judul ||
            "Pengumuman";

        const content =
            item.content ||
            item.message ||
            item.description ||
            "";

        const date =
            item.published_at ||
            item.created_at;

        const titleElement =
            document.getElementById(
                "announcementTitle"
            );

        const messageElement =
            document.getElementById(
                "announcementMessage"
            );

        const dateElement =
            document.getElementById(
                "announcementDate"
            );

        if (titleElement) {
            titleElement.textContent =
                title;
        }

        if (messageElement) {
            messageElement.textContent =
                content ||
                "Tidak ada keterangan.";
        }

        if (dateElement) {
            dateElement.textContent =
                formatTanggalWaktu(
                    date
                );
        }
    } catch (error) {
        console.error(
            "SIDAT pengumuman:",
            error
        );
    }
}


/* =====================================================
   NOTIFIKASI
   ===================================================== */

async function loadNotifikasi() {
    const list =
        document.getElementById(
            "notificationList"
        );

    if (!list) return;

    try {
        const rows =
            await supabaseGet(
                "notifications",
                "select=*&order=created_at.desc&limit=20"
            );

        const userId =
            warga?.id ||
            warga?.user_id ||
            "";

        const residentId =
            warga?.resident_id ||
            warga?.residentId ||
            "";

        const notifications =
            (
                Array.isArray(rows)
                    ? rows
                    : []
            ).filter(
                function (item) {
                    const type =
                        item.target_type ||
                        "all";

                    const target =
                        item.target_resident_id ||
                        item.resident_id ||
                        "";

                    if (
                        type === "all" ||
                        type === "warga"
                    ) {
                        return true;
                    }

                    if (
                        type === "resident" ||
                        type === "user"
                    ) {
                        return (
                            String(target) ===
                                String(
                                    residentId
                                ) ||
                            String(target) ===
                                String(userId)
                        );
                    }

                    return false;
                }
            );

        if (!notifications.length) {
            list.innerHTML =
                '<div class="notification-empty">Belum ada notifikasi.</div>';

            return;
        }

        list.innerHTML =
            notifications
                .slice(0, 5)
                .map(
                    function (
                        item
                    ) {
                        const title =
                            item.title ||
                            item.judul ||
                            "Notifikasi SIDAT";

                        const message =
                            item.message ||
                            item.content ||
                            item.body ||
                            "";

                        return (
                            '<button type="button" class="dashboard-notification-item">' +
                            '<span class="dashboard-notification-icon">' +
                            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                            '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>' +
                            '<path d="M10 21h4"/>' +
                            "</svg>" +
                            "</span>" +
                            '<span class="dashboard-notification-body">' +
                            "<strong>" +
                            escapeHTML(title) +
                            "</strong>" +
                            "<span>" +
                            escapeHTML(message) +
                            "</span>" +
                            "<small>" +
                            escapeHTML(
                                formatTanggalWaktu(
                                    item.created_at
                                )
                            ) +
                            "</small>" +
                            "</span>" +
                            "</button>"
                        );
                    }
                )
                .join("");

        list
            .querySelectorAll(
                ".dashboard-notification-item"
            )
            .forEach(
                function (item) {
                    item.onclick =
                        function () {
                            window.location.href =
                                "notifikasi.html";
                        };
                }
            );
    } catch (error) {
        console.error(
            "SIDAT notifikasi:",
            error
        );

        list.innerHTML =
            '<div class="notification-empty">Notifikasi belum dapat dimuat.</div>';
    }
}


/* =====================================================
   RONDA
   ===================================================== */

async function loadJadwalRonda() {
    const list =
        document.getElementById(
            "rondaScheduleList"
        );

    if (!list) return;

    try {
        const rows =
            await supabaseGet(
                "ronda_schedule",
                "select=id,day_of_week,resident_id,start_time,end_time,is_active,residents(id,resident_code,name)&is_active=eq.true&order=day_of_week.asc,start_time.asc"
            );

        rondaSchedules =
            Array.isArray(rows)
                ? rows
                : [];

        renderRondaCarousel();

    } catch (error) {
        console.error(
            "SIDAT ronda:",
            error
        );

        list.innerHTML =
            '<div class="ronda-day-slide active">' +
            '<div class="ronda-day-name">Jadwal Ronda</div>' +
            '<div class="ronda-empty-day">Jadwal belum dapat dimuat.</div>' +
            "</div>";
    }
}


function renderRondaCarousel() {
    const list =
        document.getElementById(
            "rondaScheduleList"
        );

    const dots =
        document.getElementById(
            "rondaDots"
        );

    const todayText =
        document.getElementById(
            "rondaTodayText"
        );

    if (!list) return;

    const today =
        getJakartaDayOfWeek();

    rondaCurrentDay =
        today;

    const myResidentId =
        warga?.resident_id ||
        warga?.residentId ||
        "";

    let html = "";

    for (
        let day = 1;
        day <= 7;
        day++
    ) {
        const rows =
            rondaSchedules.filter(
                function (row) {
                    return (
                        Number(
                            row.day_of_week
                        ) === day
                    );
                }
            );

        const active =
            day === rondaCurrentDay
                ? "active"
                : "";

        html +=
            '<article class="ronda-day-slide ' +
            active +
            '" data-ronda-day="' +
            day +
            '">' +

            '<div class="ronda-day-name">' +
            escapeHTML(
                getNamaHari(day)
            ) +
            "</div>" +

            (
                day === today
                    ? '<div class="ronda-day-date">Hari ini</div>'
                    : '<div class="ronda-day-date">Jadwal mingguan</div>'
            ) +

            '<div class="ronda-person-list">';

        if (!rows.length) {
            html +=
                '<div class="ronda-empty-day">' +
                "Belum ada jadwal untuk hari ini." +
                "</div>";
        } else {
            rows.forEach(
                function (
                    row
                ) {
                    const resident =
                        row.residents ||
                        {};

                    const name =
                        resident.name ||
                        "Warga";

                    const isMine =
                        String(
                            row.resident_id
                        ) ===
                        String(
                            myResidentId
                        );

                    const time =
                        row.start_time
                            ? formatJam(
                                  row.start_time
                              )
                            : "";

                    const end =
                        row.end_time
                            ? formatJam(
                                  row.end_time
                              )
                            : "";

                    html +=
                        '<div class="ronda-person ' +
                        (
                            isMine
                                ? "mine"
                                : ""
                        ) +
                        '">' +

                        '<div class="ronda-person-avatar">' +
                        escapeHTML(
                            getInitials(
                                name
                            )
                        ) +
                        "</div>" +

                        '<div class="ronda-person-info">' +
                        "<strong>" +
                        escapeHTML(
                            name
                        ) +
                        "</strong>" +

                        (
                            time
                                ? "<span>" +
                                  escapeHTML(
                                      time +
                                      (
                                          end
                                              ? " – " +
                                                end
                                              : ""
                                      )
                                  ) +
                                  "</span>"
                                : ""
                        ) +

                        "</div>" +

                        "</div>";
                }
            );
        }

        html +=
            "</div>" +
            "</article>";
    }

    list.innerHTML =
        html;

    renderRondaDots();

    updateRondaTodayText();

    pasangKontrolRonda();

    startRondaAutoSlide();
}


function renderRondaDots() {
    const dots =
        document.getElementById(
            "rondaDots"
        );

    if (!dots) return;

    let html = "";

    for (
        let day = 1;
        day <= 7;
        day++
    ) {
        html +=
            '<button type="button" class="ronda-dot ' +
            (
                day ===
                rondaCurrentDay
                    ? "active"
                    : ""
            ) +
            '" data-ronda-dot="' +
            day +
            '" aria-label="Jadwal ' +
            escapeHTML(
                getNamaHari(day)
            ) +
            '"></button>';
    }

    dots.innerHTML =
        html;

    dots
        .querySelectorAll(
            ".ronda-dot"
        )
        .forEach(
            function (dot) {
                dot.onclick =
                    function () {
                        showRondaDay(
                            Number(
                                dot.dataset
                                    .rondaDot
                            )
                        );

                        restartRondaTimer();
                    };
            }
        );
}


function showRondaDay(day) {
    if (
        day < 1 ||
        day > 7
    ) {
        return;
    }

    rondaCurrentDay =
        day;

    document
        .querySelectorAll(
            ".ronda-day-slide"
        )
        .forEach(
            function (
                slide
            ) {
                slide.classList.toggle(
                    "active",
                    Number(
                        slide.dataset
                            .rondaDay
                    ) === day
                );
            }
        );

    document
        .querySelectorAll(
            ".ronda-dot"
        )
        .forEach(
            function (
                dot
            ) {
                dot.classList.toggle(
                    "active",
                    Number(
                        dot.dataset
                            .rondaDot
                    ) === day
                );
            }
        );

    updateRondaTodayText();
}


function updateRondaTodayText() {
    const element =
        document.getElementById(
            "rondaTodayText"
        );

    const today =
        getJakartaDayOfWeek();

    const myResidentId =
        warga?.resident_id ||
        warga?.residentId ||
        "";

    const todayRows =
        rondaSchedules.filter(
            function (row) {
                return (
                    Number(
                        row.day_of_week
                    ) === today
                );
            }
        );

    const mine =
        todayRows.find(
            function (row) {
                return (
                    String(
                        row.resident_id
                    ) ===
                    String(
                        myResidentId
                    )
                );
            }
        );

    if (!element) return;

    if (mine) {
        element.textContent =
            "Anda mendapat jadwal ronda hari ini.";
    } else if (
        todayRows.length
    ) {
        element.textContent =
            todayRows.length +
            " warga bertugas hari ini.";
    } else {
        element.textContent =
            "Tidak ada jadwal ronda hari ini.";
    }
}


function pasangKontrolRonda() {
    const prev =
        document.getElementById(
            "rondaPrev"
        );

    const next =
        document.getElementById(
            "rondaNext"
        );

    if (prev) {
        prev.onclick =
            function () {
                let day =
                    rondaCurrentDay -
                    1;

                if (day < 1) {
                    day = 7;
                }

                showRondaDay(day);
                restartRondaTimer();
            };
    }

    if (next) {
        next.onclick =
            function () {
                let day =
                    rondaCurrentDay +
                    1;

                if (day > 7) {
                    day = 1;
                }

                showRondaDay(day);
                restartRondaTimer();
            };
    }
}


function startRondaAutoSlide() {
    clearInterval(
        rondaTimer
    );

    rondaTimer =
        setInterval(
            function () {
                let day =
                    rondaCurrentDay +
                    1;

                if (day > 7) {
                    day = 1;
                }

                showRondaDay(day);
            },
            7000
        );
}


function restartRondaTimer() {
    startRondaAutoSlide();
}


/* =====================================================
   STATISTIK
   ===================================================== */

async function loadStatistikWarga() {
    try {
        const result =
            await supabasePostRPC(
                "get_resident_statistics"
            );

        const data =
            Array.isArray(result)
                ? result[0] || {}
                : result || {};

        const totalWarga =
            data.total_warga ??
            data.total_residents ??
            data.warga ??
            0;

        const totalKK =
            data.total_kk ??
            data.total_households ??
            data.kk ??
            0;

        const wargaElement =
            document.getElementById(
                "totalWarga"
            );

        const kkElement =
            document.getElementById(
                "totalKK"
            );

        if (wargaElement) {
            wargaElement.textContent =
                Number(
                    totalWarga
                ).toLocaleString(
                    "id-ID"
                );
        }

        if (kkElement) {
            kkElement.textContent =
                Number(
                    totalKK
                ).toLocaleString(
                    "id-ID"
                );
        }
    } catch (error) {
        console.error(
            "SIDAT statistik:",
            error
        );
    }
}


/* =====================================================
   JIMPITAN
   ===================================================== */

async function loadSaldoJimpitan() {
    const element =
        document.getElementById(
            "saldoJimpitan"
        );

    if (!element) return;

    try {
        const result =
            await supabasePostRPC(
                "get_jimpitan_balance"
            );

        let balance = 0;

        if (
            typeof result ===
            "number"
        ) {
            balance = result;
        } else if (
            Array.isArray(result)
        ) {
            const row =
                result[0] || {};

            balance =
                row.balance ??
                row.saldo ??
                row.get_jimpitan_balance ??
                0;
        } else if (
            result &&
            typeof result ===
                "object"
        ) {
            balance =
                result.balance ??
                result.saldo ??
                result.get_jimpitan_balance ??
                0;
        }

        element.textContent =
            formatRupiah(
                balance
            );
    } catch (error) {
        console.error(
            "SIDAT jimpitan:",
            error
        );

        element.textContent =
            formatRupiah(0);
    }
}


/* =====================================================
   KAS
   ===================================================== */

async function loadSaldoKas() {
    const element =
        document.getElementById(
            "saldoKas"
        );

    if (!element) return;

    try {
        const rows =
            await supabaseGet(
                "cash_transactions",
                "select=transaction_type,amount"
            );

        let saldo = 0;

        (
            Array.isArray(rows)
                ? rows
                : []
        ).forEach(
            function (row) {
                const type =
                    String(
                        row.transaction_type ||
                            ""
                    ).toLowerCase();

                const amount =
                    Number(
                        row.amount ||
                            0
                    );

                if (
                    [
                        "masuk",
                        "income",
                        "pemasukan",
                        "jimpitan_transfer"
                    ].includes(type)
                ) {
                    saldo += amount;
                }

                if (
                    [
                        "keluar",
                        "expense",
                        "pengeluaran"
                    ].includes(type)
                ) {
                    saldo -= amount;
                }
            }
        );

        element.textContent =
            formatRupiah(
                saldo
            );
    } catch (error) {
        console.error(
            "SIDAT kas:",
            error
        );

        element.textContent =
            formatRupiah(0);
    }
}


/* =====================================================
   GRAFIK WARGA
   ===================================================== */

async function loadGrafikWarga() {
    try {
        const rows =
            await supabaseGet(
                "residents",
                "select=gender,birth_date,family_status,is_active"
            );

        window.sidatDashboardResidents =
            Array.isArray(rows)
                ? rows
                : [];

        renderGrafikWarga(
            "semua"
        );

        pasangFilterGrafikWarga();
    } catch (error) {
        console.error(
            "SIDAT grafik warga:",
            error
        );
    }
}


function hitungUmur(
    birthDate
) {
    if (!birthDate) return null;

    const birth =
        new Date(birthDate);

    if (
        Number.isNaN(
            birth.getTime()
        )
    ) {
        return null;
    }

    const today =
        getJakartaDate();

    let age =
        today.getFullYear() -
        birth.getFullYear();

    const month =
        today.getMonth() -
        birth.getMonth();

    if (
        month < 0 ||
        (
            month === 0 &&
            today.getDate() <
                birth.getDate()
        )
    ) {
        age--;
    }

    return age;
}


function normalizeGender(
    value
) {
    const gender =
        String(value || "")
            .trim()
            .toLowerCase();

    if (
        [
            "l",
            "laki-laki",
            "laki laki",
            "male",
            "pria"
        ].includes(gender)
    ) {
        return "laki";
    }

    if (
        [
            "p",
            "perempuan",
            "female",
            "wanita"
        ].includes(gender)
    ) {
        return "perempuan";
    }

    return "lainnya";
}


function isKepalaKeluarga(
    value
) {
    const text =
        String(value || "")
            .trim()
            .toLowerCase();

    return (
        text ===
            "kepala keluarga" ||
        text ===
            "kepala_keluarga" ||
        text === "kk"
    );
}


function renderGrafikWarga(
    filter
) {
    const rows =
        window.sidatDashboardResidents ||
        [];

    const canvas =
        document.getElementById(
            "ageChart"
        );

    const empty =
        document.getElementById(
            "ageChartEmpty"
        );

    if (!canvas) return;

    let filtered =
        rows.filter(
            function (row) {
                return (
                    row.is_active !==
                    false
                );
            }
        );

    if (filter === "kk") {
        filtered =
            filtered.filter(
                function (row) {
                    return isKepalaKeluarga(
                        row.family_status
                    );
                }
            );
    }

    if (filter === "laki") {
        filtered =
            filtered.filter(
                function (row) {
                    return (
                        normalizeGender(
                            row.gender
                        ) ===
                        "laki"
                    );
                }
            );
    }

    if (
        filter ===
        "perempuan"
    ) {
        filtered =
            filtered.filter(
                function (row) {
                    return (
                        normalizeGender(
                            row.gender
                        ) ===
                        "perempuan"
                    );
                }
            );
    }

    const groups = {
        "0–5": 0,
        "6–12": 0,
        "13–17": 0,
        "18–30": 0,
        "31–45": 0,
        "46–60": 0,
        "61+": 0
    };

    filtered.forEach(
        function (row) {
            const age =
                hitungUmur(
                    row.birth_date
                );

            if (
                age === null ||
                age < 0
            ) {
                return;
            }

            if (age <= 5) {
                groups["0–5"]++;
            } else if (age <= 12) {
                groups["6–12"]++;
            } else if (age <= 17) {
                groups["13–17"]++;
            } else if (age <= 30) {
                groups["18–30"]++;
            } else if (age <= 45) {
                groups["31–45"]++;
            } else if (age <= 60) {
                groups["46–60"]++;
            } else {
                groups["61+"]++;
            }
        }
    );

    const values =
        Object.values(groups);

    if (empty) {
        empty.style.display =
            values.some(
                function (value) {
                    return value > 0;
                }
            )
                ? "none"
                : "block";
    }

    if (!window.Chart) return;

    if (ageChart) {
        ageChart.destroy();
    }

    ageChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels:
                        Object.keys(
                            groups
                        ),

                    datasets: [
                        {
                            label:
                                "Jumlah Warga",

                            data:
                                values,

                            borderWidth:
                                1,

                            borderRadius:
                                8,

                            backgroundColor:
                                "#15803d"
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio:
                        false,

                    plugins: {
                        legend: {
                            display:
                                false
                        }
                    },

                    scales: {
                        y: {
                            beginAtZero:
                                true,

                            ticks: {
                                precision:
                                    0
                            }
                        }
                    }
                }
            }
        );
}


function pasangFilterGrafikWarga() {
    document
        .querySelectorAll(
            "#filterGrafikWarga [data-filter]"
        )
        .forEach(
            function (
                button
            ) {
                button.onclick =
                    function () {
                        document
                            .querySelectorAll(
                                "#filterGrafikWarga [data-filter]"
                            )
                            .forEach(
                                function (
                                    item
                                ) {
                                    item.classList.toggle(
                                        "active",
                                        item ===
                                            button
                                    );
                                }
                            );

                        renderGrafikWarga(
                            button.dataset
                                .filter
                        );
                    };
            }
        );
}


/* =====================================================
   GRAFIK KEUANGAN
   ===================================================== */

async function loadGrafikKeuangan() {
    try {
        const rows =
            await supabaseGet(
                "cash_transactions",
                "select=*&order=created_at.asc"
            );

        window.sidatDashboardCash =
            Array.isArray(rows)
                ? rows
                : [];

        renderGrafikKeuangan(
            30
        );

        pasangFilterGrafikKeuangan();
    } catch (error) {
        console.error(
            "SIDAT grafik keuangan:",
            error
        );
    }
}


function getTransactionDate(
    row
) {
    return (
        row.transaction_date ||
        row.date ||
        row.created_at ||
        null
    );
}


function renderGrafikKeuangan(
    days
) {
    const rows =
        window.sidatDashboardCash ||
        [];

    const canvas =
        document.getElementById(
            "financeChart"
        );

    const empty =
        document.getElementById(
            "financeChartEmpty"
        );

    if (!canvas) return;

    const now =
        getJakartaDate();

    const start =
        new Date(now);

    start.setDate(
        start.getDate() -
            Number(days)
    );

    const grouped = {};

    rows.forEach(
        function (row) {
            const dateValue =
                getTransactionDate(
                    row
                );

            if (!dateValue) return;

            const date =
                new Date(
                    dateValue
                );

            if (
                Number.isNaN(
                    date.getTime()
                ) ||
                date < start
            ) {
                return;
            }

            const key =
                date.toLocaleDateString(
                    "id-ID",
                    {
                        day: "2-digit",
                        month: "2-digit"
                    }
                );

            if (!grouped[key]) {
                grouped[key] = {
                    income: 0,
                    expense: 0
                };
            }

            const type =
                String(
                    row.transaction_type ||
                        ""
                ).toLowerCase();

            const amount =
                Number(
                    row.amount ||
                        0
                );

            if (
                [
                    "masuk",
                    "income",
                    "pemasukan",
                    "jimpitan_transfer"
                ].includes(type)
            ) {
                grouped[key]
                    .income +=
                    amount;
            }

            if (
                [
                    "keluar",
                    "expense",
                    "pengeluaran"
                ].includes(type)
            ) {
                grouped[key]
                    .expense +=
                    amount;
            }
        }
    );

    const labels =
        Object.keys(grouped);

    if (empty) {
        empty.style.display =
            labels.length
                ? "none"
                : "block";
    }

    if (!window.Chart) return;

    if (financeChart) {
        financeChart.destroy();
    }

    financeChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label:
                                "Pemasukan",

                            data:
                                labels.map(
                                    function (
                                        label
                                    ) {
                                        return grouped[
                                            label
                                        ].income;
                                    }
                                ),

                            borderColor:
                                "#15803d",

                            backgroundColor:
                                "rgba(21,128,61,.12)",

                            fill: true,

                            tension:
                                .3
                        },

                        {
                            label:
                                "Pengeluaran",

                            data:
                                labels.map(
                                    function (
                                        label
                                    ) {
                                        return grouped[
                                            label
                                        ].expense;
                                    }
                                ),

                            borderColor:
                                "#dc2626",

                            backgroundColor:
                                "rgba(220,38,38,.08)",

                            fill: true,

                            tension:
                                .3
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio:
                        false,

                    interaction: {
                        mode:
                            "index",

                        intersect:
                            false
                    },

                    scales: {
                        y: {
                            beginAtZero:
                                true,

                            ticks: {
                                callback:
                                    function (
                                        value
                                    ) {
                                        return formatRupiah(
                                            value
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );
}


function pasangFilterGrafikKeuangan() {
    document
        .querySelectorAll(
            "#filterGrafikKeuangan [data-days]"
        )
        .forEach(
            function (
                button
            ) {
                button.onclick =
                    function () {
                        document
                            .querySelectorAll(
                                "#filterGrafikKeuangan [data-days]"
                            )
                            .forEach(
                                function (
                                    item
                                ) {
                                    item.classList.toggle(
                                        "active",
                                        item ===
                                            button
                                    );
                                }
                            );

                        renderGrafikKeuangan(
                            Number(
                                button.dataset
                                    .days
                            )
                        );
                    };
            }
        );
}


/* =====================================================
   NAVIGASI
   ===================================================== */

function pasangNavigasi() {
    const profile =
        document.getElementById(
            "profileButton"
        );

    const announcement =
        document.getElementById(
            "btnLihatPengumuman"
        );

    const notification =
        document.getElementById(
            "btnLihatNotifikasi"
        );

    if (profile) {
        profile.onclick =
            function () {
                window.location.href =
                    "profil.html";
            };
    }

    if (announcement) {
        announcement.onclick =
            function () {
                window.location.href =
                    "pengumuman.html";
            };
    }

    if (notification) {
        notification.onclick =
            function () {
                window.location.href =
                    "notifikasi.html";
            };
    }
}


/* =====================================================
   LOADING
   ===================================================== */

function tutupLoading() {
    const loading =
        document.getElementById(
            "loadingScreen"
        );

    if (!loading) return;

    loading.classList.add(
        "hidden"
    );

    loading.style.pointerEvents =
        "none";
}


/* =====================================================
   INIT
   ===================================================== */

async function initDashboard() {

    try {

        pasangNavigasi();

        tampilkanProfilWarga(
            warga
        );

        initBannerSlider();

        if (
            typeof window.mulaiPopupNotifikasi ===
            "function"
        ) {
            try {
                window.mulaiPopupNotifikasi();
            } catch (error) {
                console.warn(
                    "Popup notifikasi tidak dimulai.",
                    error
                );
            }
        }
pasangEventBanner();
        await Promise.allSettled([
            loadProfilWarga(),
            loadWilayah(),
            loadBannerData(),
            loadPengumuman(),
            loadNotifikasi(),
            loadJadwalRonda(),
            loadStatistikWarga(),
            loadSaldoJimpitan(),
            loadSaldoKas(),
            loadGrafikWarga(),
            loadGrafikKeuangan()
        ]);

    } catch (error) {

        console.error(
            "SIDAT dashboard:",
            error
        );

    } finally {

        tutupLoading();
    }
}


/* =====================================================
   START
   ===================================================== */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initDashboard
    );
} else {
    initDashboard();
}

})();
