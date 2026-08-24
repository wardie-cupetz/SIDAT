// ==========================================
// SIDAT
// POPUP NOTIFIKASI WARGA
// ==========================================

(function () {

    "use strict";


    // ======================================
    // KONFIGURASI
    // ======================================

    const CEK_INTERVAL =
        15000;


    const STORAGE_KEY =
        "sidat_popup_notifikasi_terakhir";


    let sedangMemuat =
        false;


    // ======================================
    // AMBIL DATA WARGA
    // ======================================

    function ambilDataWarga() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) ||
                "{}"
            );

        }

        catch (error) {

            console.error(
                "SIDAT: Data warga tidak valid.",
                error
            );

            return {};

        }

    }


    // ======================================
    // AMBIL NOTIFIKASI
    // ======================================

    async function ambilNotifikasi() {

        const token =
            localStorage.getItem(
                "sidat_access_token"
            );


        if (!token) {

            return [];

        }


        const dataWarga =
            ambilDataWarga();


        const residentId =
            dataWarga.resident_id ||
            dataWarga.residentId ||
            dataWarga.id_resident ||
            null;


        let url =
            `${SUPABASE_URL}` +
            `/rest/v1/notifications` +
            `?select=id,title,message,target_type,target_resident_id,created_at` +
            `&order=created_at.desc` +
            `&limit=20`;


        if (residentId) {

            url +=
                `&or=` +
                `(target_type.eq.all,` +
                `and(` +
                `target_type.eq.resident,` +
                `target_resident_id.eq.${encodeURIComponent(
                    residentId
                )}` +
                `))`;

        }

        else {

            url +=
                `&target_type=eq.all`;

        }


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
                "Gagal mengambil notifikasi."
            );

        }


        const data =
            await response.json();


        return Array.isArray(data)
            ? data
            : [];

    }


    // ======================================
    // TAMPILKAN POPUP
    // ======================================

    function tampilkanPopup(
        notification
    ) {

        if (
            !("Notification" in window)
        ) {

            return;

        }


        if (
            Notification.permission !==
            "granted"
        ) {

            return;

        }


        const popup =
            new Notification(
                notification.title ||
                "SIDAT",
                {

                    body:
                        notification.message ||
                        "Ada notifikasi baru.",

                    tag:
                        `sidat-${notification.id}`

                }
            );


        popup.onclick =
            function () {

                window.focus();

                popup.close();

            };

    }


    // ======================================
    // CEK NOTIFIKASI BARU
    // ======================================

    async function cekNotifikasiBaru() {

        if (sedangMemuat) {

            return;

        }


        sedangMemuat =
            true;


        try {

            const notifications =
                await ambilNotifikasi();


            if (
                notifications.length ===
                0
            ) {

                return;

            }


            const terakhir =
                localStorage.getItem(
                    STORAGE_KEY
                );


            // ==================================
            // PERTAMA KALI
            // Jangan tampilkan notifikasi lama
            // ==================================

            if (!terakhir) {

                localStorage.setItem(
                    STORAGE_KEY,
                    notifications[0].created_at
                );

                return;

            }


            const notifikasiBaru =
                notifications.filter(
                    notification =>
                        new Date(
                            notification.created_at
                        ).getTime() >
                        new Date(
                            terakhir
                        ).getTime()
                );


            if (
                notifikasiBaru.length ===
                0
            ) {

                return;

            }


            // ==================================
            // TAMPILKAN YANG BARU
            // ==================================

            const urut =
                [
                    ...notifikasiBaru
                ].reverse();


            urut.forEach(
                notification => {

                    tampilkanPopup(
                        notification
                    );

                }
            );


            // ==================================
            // SIMPAN WAKTU TERBARU
            // ==================================

            localStorage.setItem(
                STORAGE_KEY,
                notifications[0].created_at
            );

        }

        catch (error) {

            console.error(
                "SIDAT: Gagal mengecek popup notifikasi:",
                error
            );

        }

        finally {

            sedangMemuat =
                false;

        }

    }


    // ======================================
    // START
    // ======================================

    function mulaiPopupNotifikasi() {

        if (
            !("Notification" in window)
        ) {

            console.warn(
                "SIDAT: Browser tidak mendukung Notification API."
            );

            return;

        }


        cekNotifikasiBaru();


        setInterval(
            cekNotifikasiBaru,
            CEK_INTERVAL
        );

    }


    // ======================================
    // EXPORT
    // ======================================

    window.cekPopupNotifikasi =
        cekNotifikasiBaru;


    window.mulaiPopupNotifikasi =
        mulaiPopupNotifikasi;


})();


// ==========================================
// TES POPUP SIDAT
// ==========================================

setTimeout(function () {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            "🔔 Tes Popup SIDAT",
            {
                body:
                    "Jika pesan ini muncul, popup SIDAT berhasil."
            }
        );

    }

}, 5000);
