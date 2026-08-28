// ==========================================
// SIDAT
// OFFLINE DATABASE
// ==========================================

"use strict";

const SIDAT_DB_NAME = "sidat_offline_db";
const SIDAT_DB_VERSION = 1;
const SIDAT_STORE = "sync_queue";

let sidatDB = null;


// ==========================================
// BUKA DATABASE
// ==========================================

function openOfflineDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            SIDAT_DB_NAME,
            SIDAT_DB_VERSION
        );

        request.onerror = () => {

            reject(request.error);

        };

        request.onsuccess = () => {

            sidatDB = request.result;

            resolve(sidatDB);

        };

        request.onupgradeneeded = event => {

            const db = event.target.result;

            if (!db.objectStoreNames.contains(SIDAT_STORE)) {

                db.createObjectStore(
                    SIDAT_STORE,
                    {
                        keyPath: "id"
                    }
                );

            }

        };

    });

}
// ==========================================
// SIMPAN DATA OFFLINE
// ==========================================

function saveOfflineData(data) {

    return new Promise((resolve, reject) => {

        const transaction =
            sidatDB.transaction(
                SIDAT_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                SIDAT_STORE
            );

        const request =
            store.add(data);

        request.onsuccess = () => {

            resolve();

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}
// ==========================================
// LIHAT SEMUA DATA
// ==========================================

function getOfflineData() {

    return new Promise((resolve, reject) => {

        const transaction =
            sidatDB.transaction(
                SIDAT_STORE,
                "readonly"
            );

        const store =
            transaction.objectStore(
                SIDAT_STORE
            );

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}
// ==========================================
// TAMBAH KE ANTREAN SINKRONISASI
// ==========================================

function addToSyncQueue(data) {

    return new Promise((resolve, reject) => {

        const transaction =
            sidatDB.transaction(
                SIDAT_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                SIDAT_STORE
            );

        const request =
            store.put({

                id:
                    crypto.randomUUID(),

                created_at:
                    new Date().toISOString(),

                status:
                    "pending",

                ...data

            });

        request.onsuccess = () => {

            resolve();

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}
