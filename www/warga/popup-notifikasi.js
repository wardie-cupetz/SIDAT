// ==========================================
// SIDAT
// POPUP NOTIFIKASI WARGA
// ==========================================

(function () {

    "use strict";


    const CEK_INTERVAL = 15000;

    const STORAGE_KEY =
        "sidat_popup_notifikasi_terakhir";

    let sedangMemuat = false;


    // ======================================
    // DATA WARGA
    // ======================================

    function ambilDataWarga() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "sidat_user"
                ) || "{}"
            );

        } catch (error) {

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

        } else {

            url +=
                `&target_type=eq.all`;

        }


        const response =
            await fetch(
                url,
                {

                    method: "GET",

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

async function tampilkanPopup(
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


    try {

        const registration =
            await navigator
                .serviceWorker
                .ready;


        await registration.showNotification(
            notification.title ||
            "SIDAT",
            {

                body:
                    notification.message ||
                    "Ada notifikasi baru.",

                tag:
                    `sidat-${notification.id}`,

                data: {
                    url:
                        "/warga/pengumuman.html"
                }

            }
        );


    } catch (error) {

        console.error(
            "SIDAT: Gagal menampilkan notifikasi:",
            error
        );

    }

}

    // ======================================
    // CEK NOTIFIKASI
    // ======================================

    async function cekNotifikasiBaru() {

        if (sedangMemuat) {
            return;
        }


        sedangMemuat = true;


        try {

            const notifications =
                await ambilNotifikasi();


            if (
                notifications.length === 0
            ) {
                return;
            }


            const terbaru =
                notifications[0];


            const waktuTerakhir =
                localStorage.getItem(
                    STORAGE_KEY
                );


            // ==================================
            // PERTAMA KALI
            // ==================================

            if (!waktuTerakhir) {

                localStorage.setItem(
                    STORAGE_KEY,
                    terbaru.created_at
                );

                return;

            }


            const notifikasiBaru =
                notifications.filter(
                    item =>
                        new Date(
                            item.created_at
                        ).getTime() >
                        new Date(
                            waktuTerakhir
                        ).getTime()
                );


            if (
                notifikasiBaru.length === 0
            ) {
                return;
            }


            const urut =
                [...notifikasiBaru].reverse();


            urut.forEach(
                item => {

                    tampilkanPopup(
                        item
                    );

                }
            );


            localStorage.setItem(
                STORAGE_KEY,
                terbaru.created_at
            );

        }

        catch (error) {

            console.error(
                "SIDAT: Gagal mengecek notifikasi.",
                error
            );

        }

        finally {

            sedangMemuat = false;

        }

    }


    // ======================================
    // MULAI
    // ======================================

    function mulaiPopupNotifikasi() {

        if (
            !("Notification" in window)
        ) {

            console.warn(
                "SIDAT: Notification API tidak tersedia."
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
