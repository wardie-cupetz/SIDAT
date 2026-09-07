package com.sidat.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupBridge")
public class BackupBridge extends Plugin {

    @PluginMethod
    public void saveBackup(PluginCall call) {

        String fileName = call.getString("filename");
        String data = call.getString("data");

        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("Nama file backup tidak tersedia.");
            return;
        }

        if (data == null) {
            call.reject("Data backup tidak tersedia.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        startActivityForResult(
                call,
                intent,
                "handleSaveBackupResult"
        );
    }

    @ActivityCallback
    private void handleSaveBackupResult(
            PluginCall call,
            ActivityResult result
    ) {

        if (result == null ||
                result.getResultCode() != Activity.RESULT_OK) {

            call.reject("Penyimpanan backup dibatalkan.");
            return;
        }

        Intent dataIntent = result.getData();

        if (dataIntent == null ||
                dataIntent.getData() == null) {

            call.reject(
                    "Lokasi penyimpanan backup tidak tersedia."
            );
            return;
        }

        Uri uri = dataIntent.getData();

        String backupData = call.getString("data");

        if (backupData == null) {
            call.reject("Data backup tidak tersedia.");
            return;
        }

        try (OutputStream outputStream =
                     getContext()
                             .getContentResolver()
                             .openOutputStream(uri)) {

            if (outputStream == null) {
                call.reject(
                        "Tidak dapat membuka lokasi penyimpanan."
                );
                return;
            }

            outputStream.write(
                    backupData.getBytes(StandardCharsets.UTF_8)
            );

            outputStream.flush();

            JSObject resultData = new JSObject();

            resultData.put(
                    "uri",
                    uri.toString()
            );

            resultData.put(
                    "fileName",
                    call.getString("filename")
            );

            call.resolve(resultData);

        } catch (Exception e) {

            call.reject(
                    "Gagal menyimpan file backup: "
                            + e.getMessage()
            );
        }
    }
}
