/* =========================================================
   SIDAT — NATIVE PRINT BRIDGE
   File : js/print-bridge.js

   WEB  : tidak mengubah perilaku cetak browser
   APK  : menggunakan Android Print Framework
   ========================================================= */

(function () {
    "use strict";

    function isSidatAPK() {
        return Boolean(
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.PrintBridge
        );
    }

    async function cetakHTMLNative(html, jobName = "SIDAT") {

        if (!html || !String(html).trim()) {
            throw new Error("Dokumen cetak tidak tersedia.");
        }

        if (!isSidatAPK()) {
            return false;
        }

        const PrintBridge =
            window.Capacitor.Plugins.PrintBridge;

        await PrintBridge.printHtml({
            html: String(html),
            jobName: String(jobName || "SIDAT")
        });

        return true;
    }

    window.SIDATPrint = {
        isNativeAvailable: isSidatAPK,
        printHTML: cetakHTMLNative
    };

    console.log(
        "[SIDAT PRINT] Native Print Bridge siap:",
        isSidatAPK()
    );
})();
