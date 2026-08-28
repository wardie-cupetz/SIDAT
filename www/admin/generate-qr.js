// ==========================================
// SIDAT
// GENERATE QR KK
// Dibuat oleh Suwardi
// ==========================================


// ==========================================
// SESSION
// ==========================================

const accessToken =
    localStorage.getItem(
        "sidat_access_token"
    );


if (!accessToken) {

    window.location.href =
        "../index.html";

}


// ==========================================
// ELEMENT
// ==========================================

const residentList =
    document.getElementById(
        "residentList"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const selectAll =
    document.getElementById(
        "selectAll"
    );

const selectedCount =
    document.getElementById(
        "selectedCount"
    );

const printCount =
    document.getElementById(
        "printCount"
    );

const printButton =
    document.getElementById(
        "printButton"
    );

const loadingState =
    document.getElementById(
        "loadingState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );


// ==========================================
// DATA
// ==========================================

let daftarKepalaKeluarga = [];

let wargaTerpilih = [];


// ==========================================
// LOAD KEPALA KELUARGA
// ==========================================

async function muatKepalaKeluarga() {

    tampilkanLoading();

    try {

        const response =
            await fetch(

                `${SUPABASE_URL}/rest/v1/households` +
                `?select=` +
                `id,` +
                `kk_number,` +
                `head_resident_id,` +
                `qr_token,` +
                `address,` +
                `head:residents!households_head_resident_id_fkey(` +
                    `id,` +
                    `resident_code,` +
                    `name,` +
                    `is_active` +
                `)` +
                `&order=kk_number.asc`,

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${accessToken}`

                    }

                }

            );


        if (!response.ok) {

            throw new Error(
                await response.text()
            );

        }


        const data =
            await response.json();


        daftarKepalaKeluarga =
            Array.isArray(data)

                ? data
                    .filter(
                        kk =>
                            kk &&
                            kk.kk_number &&
                            kk.head &&
                            kk.head.is_active !== false
                    )
                    .map(
                        kk => ({

                            id:
                                kk.head.id,

                            resident_code:
                                kk.head.resident_code,

                            name:
                                kk.head.name,

                            kk_number:
                                kk.kk_number,

                            qr_token:
                                kk.qr_token,

                            household_id:
                                kk.id,

                            head_resident_id:
                                kk.head_resident_id,

                            address:
                                kk.address

                        })
                    )

                : [];


        console.log(
            "SIDAT QR JUMLAH KK:",
            daftarKepalaKeluarga.length
        );


        sembunyikanLoading();


        tampilkanKepalaKeluarga(
            daftarKepalaKeluarga
        );


    } catch (error) {

        console.error(
            "SIDAT QR ERROR:",
            error
        );


        sembunyikanLoading();


        if (errorState) {

            errorState.classList.remove(
                "hidden"
            );

        }


        if (errorMessage) {

            errorMessage.textContent =
                error.message ||
                "Gagal mengambil data KK.";

        }

    }

}


// ==========================================
// TAMPILKAN LIST
// ==========================================

function tampilkanKepalaKeluarga(
    data
) {

    if (!residentList) {

        return;

    }


    residentList.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        updateSelectionUI();

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    data.forEach(
        warga => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "resident-item";


            item.dataset.id =
                warga.id;


            const sudahDipilih =
                wargaTerpilih.some(
                    selected =>
                        selected.id ===
                        warga.id
                );


            if (sudahDipilih) {

                item.classList.add(
                    "selected"
                );

            }


            const qrTersedia =
                !!warga.qr_token;


            item.innerHTML =
                `

                <div class="resident-check">

                    <input
                        type="checkbox"
                        class="resident-checkbox"
                        ${sudahDipilih ? "checked" : ""}
                    >

                </div>


                <div class="resident-avatar">
                    👤
                </div>


                <div class="resident-info">

                    <strong>
                        ${escapeHTML(
                            warga.name ||
                            "Tanpa Nama"
                        )}
                    </strong>

                    <span>
                        ID Warga:
                        ${escapeHTML(
                            warga.resident_code ||
                            "-"
                        )}
                    </span>

                    <small>
                        No. KK:
                        ${escapeHTML(
                            warga.kk_number ||
                            "-"
                        )}
                    </small>

                </div>


                <div class="resident-qr-status ${
                    qrTersedia
                        ? "qr-ready"
                        : "qr-new"
                }">

                    ${
                        qrTersedia
                            ? "✓ QR"
                            : "＋ QR"
                    }

                </div>

                `;


            item.addEventListener(
                "click",
                function(event) {

                    if (
                        event.target.tagName ===
                        "INPUT"
                    ) {

                        return;

                    }


                    toggleWarga(
                        warga,
                        item
                    );

                }
            );


            const checkbox =
                item.querySelector(
                    ".resident-checkbox"
                );


            if (checkbox) {

                checkbox.addEventListener(
                    "change",
                    function() {

                        toggleWarga(
                            warga,
                            item
                        );

                    }
                );

            }


            residentList.appendChild(
                item
            );

        }
    );


    updateSelectionUI();

}


// ==========================================
// PILIH / BATAL PILIH
// ==========================================

function toggleWarga(
    warga,
    item
) {

    const index =
        wargaTerpilih.findIndex(
            selected =>
                selected.id ===
                warga.id
        );


    if (index >= 0) {

        wargaTerpilih.splice(
            index,
            1
        );


        item.classList.remove(
            "selected"
        );


    } else {

        wargaTerpilih.push(
            warga
        );


        item.classList.add(
            "selected"
        );

    }


    const checkbox =
        item.querySelector(
            ".resident-checkbox"
        );


    if (checkbox) {

        checkbox.checked =
            wargaTerpilih.some(
                selected =>
                    selected.id ===
                    warga.id
            );

    }


    updateSelectionUI();

}


// ==========================================
// UPDATE SELECTION
// ==========================================

function updateSelectionUI() {

    const jumlah =
        wargaTerpilih.length;


    if (selectedCount) {

        selectedCount.textContent =
            `${jumlah} dipilih`;

    }


    if (printCount) {

        printCount.textContent =
            jumlah;

    }


    if (printButton) {

        printButton.disabled =
            jumlah === 0;

    }


    if (selectAll) {

        const terlihat =
            getDataTampilan();


        const semuaTerpilih =
            terlihat.length > 0 &&
            terlihat.every(
                warga =>
                    wargaTerpilih.some(
                        selected =>
                            selected.id ===
                            warga.id
                    )
            );


        selectAll.checked =
            semuaTerpilih;

    }

}


// ==========================================
// PILIH SEMUA
// ==========================================

if (selectAll) {

    selectAll.addEventListener(
        "change",
        function() {

            const data =
                getDataTampilan();


            if (selectAll.checked) {

                data.forEach(
                    warga => {

                        const sudahAda =
                            wargaTerpilih.some(
                                selected =>
                                    selected.id ===
                                    warga.id
                            );


                        if (!sudahAda) {

                            wargaTerpilih.push(
                                warga
                            );

                        }

                    }
                );


            } else {

                data.forEach(
                    warga => {

                        wargaTerpilih =
                            wargaTerpilih.filter(
                                selected =>
                                    selected.id !==
                                    warga.id
                            );

                    }
                );

            }


            tampilkanKepalaKeluarga(
                data
            );

        }
    );

}


// ==========================================
// DATA SESUAI PENCARIAN
// ==========================================

function getDataTampilan() {

    const keyword =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    if (!keyword) {

        return daftarKepalaKeluarga;

    }


    return daftarKepalaKeluarga.filter(
        warga => {

            return (

                String(
                    warga.name ||
                    ""
                )
                .toLowerCase()
                .includes(
                    keyword
                )

                ||

                String(
                    warga.resident_code ||
                    ""
                )
                .toLowerCase()
                .includes(
                    keyword
                )

                ||

                String(
                    warga.kk_number ||
                    ""
                )
                .toLowerCase()
                .includes(
                    keyword
                )

            );

        }
    );

}


// ==========================================
// PENCARIAN
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            const keyword =
                searchInput.value.trim();


            if (clearSearch) {

                clearSearch.classList.toggle(
                    "hidden",
                    !keyword
                );

            }


            tampilkanKepalaKeluarga(
                getDataTampilan()
            );

        }
    );

}


// ==========================================
// BERSIHKAN PENCARIAN
// ==========================================

function bersihkanPencarian() {

    if (searchInput) {

        searchInput.value =
            "";

    }


    if (clearSearch) {

        clearSearch.classList.add(
            "hidden"
        );

    }


    tampilkanKepalaKeluarga(
        daftarKepalaKeluarga
    );

}


// ==========================================
// BUAT TOKEN QR
// ==========================================

function buatTokenQR() {

    const array =
        new Uint8Array(
            8
        );


    crypto.getRandomValues(
        array
    );


    const random =
        Array.from(
            array
        )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("")
        .toUpperCase();


    return (
        "SIDAT-KK-" +
        random
    );

}


// ==========================================
// PASTIKAN TOKEN
// ==========================================

function pastikanToken(
    warga
) {

    if (
        warga.qr_token &&
        String(
            warga.qr_token
        )
        .toUpperCase()
        .startsWith(
            "SIDAT-KK-"
        )
    ) {

        return String(
            warga.qr_token
        )
        .toUpperCase();

    }


    return buatTokenQR();

}


// ==========================================
// BUAT QR
// ==========================================

function buatQR(
    element,
    token
) {

    if (!element) {

        throw new Error(
            "Elemen QR tidak ditemukan."
        );

    }


    if (
        typeof QRCode ===
        "undefined"
    ) {

        throw new Error(
            "Library QR belum termuat."
        );

    }


    element.innerHTML =
        "";


    new QRCode(
        element,
        {

            text:
                token,

            width:
                200,

            height:
                200,

            colorDark:
                "#111827",

            colorLight:
                "#ffffff",

            correctLevel:
                QRCode.CorrectLevel.H

        }
    );

}
// ==========================================
// AMBIL GAMBAR QR
// ==========================================

async function ambilGambarQR(
    token
) {

    return new Promise(
        function (resolve, reject) {

            const qrBox =
                document.createElement(
                    "div"
                );

            qrBox.style.position =
                "fixed";

            qrBox.style.left =
                "0";

            qrBox.style.top =
                "0";

            qrBox.style.width =
                "210px";

            qrBox.style.height =
                "210px";

            qrBox.style.padding =
                "10px";

            qrBox.style.background =
                "#ffffff";

            qrBox.style.zIndex =
                "999999";

            document.body.appendChild(
                qrBox
            );


            try {

                qrBox.innerHTML =
                    "";


                new QRCode(
                    qrBox,
                    {

                        text:
                            String(token),

                        width:
                            190,

                        height:
                            190,

                        colorDark:
                            "#111827",

                        colorLight:
                            "#ffffff",

                        correctLevel:
                            QRCode.CorrectLevel.H

                    }
                );


            } catch (error) {

                if (
                    qrBox.parentNode
                ) {

                    qrBox.parentNode.removeChild(
                        qrBox
                    );

                }

                reject(
                    error
                );

                return;

            }


            let percobaan =
                0;


            const cekQR =
                setInterval(
                    function () {

                        percobaan++;


                        const canvas =
                            qrBox.querySelector(
                                "canvas"
                            );


                        const img =
                            qrBox.querySelector(
                                "img"
                            );


                        // ==========================
                        // CANVAS
                        // ==========================

                        if (canvas) {

                            try {

                                const imageData =
                                    canvas.toDataURL(
                                        "image/png"
                                    );


                                if (
                                    imageData &&
                                    imageData.length > 100
                                ) {

                                    clearInterval(
                                        cekQR
                                    );


                                    if (
                                        qrBox.parentNode
                                    ) {

                                        qrBox.parentNode.removeChild(
                                            qrBox
                                        );

                                    }


                                    resolve(
                                        imageData
                                    );

                                    return;

                                }

                            } catch (error) {

                                console.warn(
                                    "Canvas QR:",
                                    error
                                );

                            }

                        }


                        // ==========================
                        // IMAGE
                        // ==========================

                        if (
                            img &&
                            img.src &&
                            img.complete &&
                            img.naturalWidth > 0
                        ) {

                            clearInterval(
                                cekQR
                            );


                            const imageData =
                                img.src;


                            if (
                                qrBox.parentNode
                            ) {

                                qrBox.parentNode.removeChild(
                                    qrBox
                                );

                            }


                            resolve(
                                imageData
                            );

                            return;

                        }


                        // ==========================
                        // TIMEOUT
                        // ==========================

                        if (
                            percobaan >= 50
                        ) {

                            clearInterval(
                                cekQR
                            );


                            if (
                                qrBox.parentNode
                            ) {

                                qrBox.parentNode.removeChild(
                                    qrBox
                                );

                            }


                            reject(
                                new Error(
                                    "QR tidak berhasil dibuat oleh library QRCode."
                                )
                            );

                        }

                    },
                    100
                );

        }
    );

}

// ==========================================
// CETAK QR
// ==========================================

async function cetakQR() {

    if (
        !wargaTerpilih ||
        wargaTerpilih.length === 0
    ) {

        alert(
            "Pilih minimal satu kepala keluarga."
        );

        return;

    }


    if (printButton) {

        printButton.disabled =
            true;

        printButton.textContent =
            "⏳ Menyiapkan QR...";

    }


    try {

        const hasil =
            [];


        // ==================================
        // SIAPKAN TOKEN DAN GAMBAR
        // ==================================

        for (
            const warga
            of wargaTerpilih
        ) {

            const token =
                pastikanToken(
                    warga
                );


            /*
             * Token sekarang disimpan langsung
             * berdasarkan ID households.
             */

            if (
                !warga.qr_token ||
                String(
                    warga.qr_token
                ).toUpperCase() !== token
            ) {

                await simpanTokenQR(
                    warga.household_id,
                    token
                );


                warga.qr_token =
                    token;

            }


            // Buat gambar QR
            const image =
                await ambilGambarQR(
                    token
                );


            hasil.push({

                warga:
                    warga,

                token:
                    token,

                image:
                    image

            });

        }


        if (
            hasil.length === 0
        ) {

            throw new Error(
                "Tidak ada QR yang berhasil dibuat."
            );

        }


        bukaJendelaCetak(
            hasil
        );


    } catch (error) {

        console.error(
            "SIDAT CETAK QR ERROR:",
            error
        );


        alert(
            "Gagal menyiapkan QR.\n\n" +
            (
                error.message ||
                "Terjadi kesalahan."
            )
        );


    } finally {

        if (printButton) {

            printButton.disabled =
                wargaTerpilih.length === 0;

            printButton.textContent =
                "🖨️ Cetak QR";

        }

    }

}


// ==========================================
// SIMPAN TOKEN KE HOUSEHOLDS
// ==========================================

async function simpanTokenQR(
    householdId,
    token
) {

    if (!householdId) {

        throw new Error(
            "ID KK tidak ditemukan."
        );

    }


    const response =
        await fetch(

            `${SUPABASE_URL}/rest/v1/households?id=eq.${encodeURIComponent(
                householdId
            )}`,

            {

                method:
                    "PATCH",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=minimal"

                },

                body:
                    JSON.stringify({

                        qr_token:
                            token

                    })

            }

        );


    if (!response.ok) {

        throw new Error(
            await response.text()
        );

    }

}


// ==========================================
// JENDELA CETAK
// ==========================================

function bukaJendelaCetak(
    data
) {

    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Popup diblokir browser. Izinkan popup untuk mencetak QR."
        );

        return;

    }


    let cards =
        "";


    data.forEach(
        item => {

            cards +=
                `

                <div class="qr-card">

                    <div class="qr-brand">
                        SIDAT
                    </div>

                    <div class="qr-title">
                        QR JIMPITAN
                    </div>

                    <img
                        src="${item.image}"
                        class="qr-image"
                        alt="QR Jimpitan"
                    >

                    <div class="qr-name">
                        ${escapeHTML(
                            item.warga.name ||
                            "Tanpa Nama"
                        )}
                    </div>


                    <div class="qr-token">
                        ${escapeHTML(
                            item.token
                        )}
                    </div>

                    <div class="qr-footer">
                        Sistem Data Warga<br>
                        Dibuat oleh Suwardi
                    </div>

                </div>

                `;

        }
    );


    printWindow.document.open();


    printWindow.document.write(
        `

        <!DOCTYPE html>

        <html lang="id">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                QR Jimpitan SIDAT
            </title>

            <style>

                * {
                    box-sizing:
                        border-box;
                }


                body {

                    margin:
                        0;

                    padding:
                        15px;

                    font-family:
                        Arial,
                        sans-serif;

                    background:
                        #ffffff;

                }


                .print-grid {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(
                                0,
                                1fr
                            )
                        );

                    gap:
                        15px;

                }


                .qr-card {

                    padding:
                        16px;

                    border:
                        2px solid
                        #15803d;

                    border-radius:
                        16px;

                    text-align:
                        center;

                    page-break-inside:
                        avoid;

                    break-inside:
                        avoid;

                }


                .qr-brand {

                    font-size:
                        22px;

                    font-weight:
                        bold;

                    color:
                        #15803d;

                }


                .qr-title {

                    margin-top:
                        4px;

                    margin-bottom:
                        10px;

                    font-size:
                        14px;

                    font-weight:
                        bold;

                }


                .qr-image {

                    width:
                        200px;

                    height:
                        200px;

                    display:
                        block;

                    margin:
                        0 auto 12px;

                    object-fit:
                        contain;

                }


                .qr-name {

                    font-size:
                        17px;

                    font-weight:
                        bold;

                    margin-top:
                        5px;

                }


                .qr-kk {

                    margin-top:
                        5px;

                    font-size:
                        13px;

                }


                .qr-token {

                    margin-top:
                        8px;

                    padding:
                        5px;

                    background:
                        #f3f4f6;

                    border-radius:
                        6px;

                    font-size:
                        10px;

                    word-break:
                        break-all;

                }


                .qr-footer {

                    margin-top:
                        8px;

                    font-size:
                        10px;

                    color:
                        #6b7280;

                    line-height:
                        1.4;

                }


                @media print {

                    body {

                        padding:
                            8px;

                    }


                    .qr-card {

                        page-break-inside:
                            avoid;

                        break-inside:
                            avoid;

                    }

                }

            </style>

        </head>

        <body>

            <div class="print-grid">

                ${cards}

            </div>


            <script>

                window.onload =
                    function() {

                        setTimeout(
                            function() {

                                window.print();

                            },
                            500
                        );

                    };

            <\/script>

        </body>

        </html>

        `
    );


    printWindow.document.close();

}


// ==========================================
// LOADING
// ==========================================

function tampilkanLoading() {

    if (loadingState) {

        loadingState.classList.remove(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }

}


function sembunyikanLoading() {

    if (loadingState) {

        loadingState.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// UTIL
// ==========================================

function tunggu(
    waktu
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                waktu
            )
    );

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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
// KEMBALI
// ==========================================

function kembaliDashboard() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// EXPORT
// ==========================================

window.muatKepalaKeluarga =
    muatKepalaKeluarga;

window.bersihkanPencarian =
    bersihkanPencarian;

window.cetakQR =
    cetakQR;

window.kembaliDashboard =
    kembaliDashboard;


// ==========================================
// START
// ==========================================

muatKepalaKeluarga();
