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
