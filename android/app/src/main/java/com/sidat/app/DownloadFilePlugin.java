package com.sidat.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@CapacitorPlugin(name = "DownloadFile")
public class DownloadFilePlugin extends Plugin {

    @PluginMethod
    public void saveFile(PluginCall call) {

        String fileName = call.getString("filename");
        String data = call.getString("data");
        String mimeType = call.getString(
                "mimeType",
                "application/octet-stream"
        );

        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("Nama file tidak tersedia.");
            return;
        }

        if (data == null) {
            call.reject("Data file tidak tersedia.");
            return;
        }

        try {

            byte[] fileBytes = Base64.getDecoder().decode(data);

            ContentResolver resolver =
                    getContext().getContentResolver();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {

                ContentValues values =
                        new ContentValues();

                values.put(
                        MediaStore.Downloads.DISPLAY_NAME,
                        fileName
                );

                values.put(
                        MediaStore.Downloads.MIME_TYPE,
                        mimeType
                );

                values.put(
                        MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS
                );

                values.put(
                        MediaStore.Downloads.IS_PENDING,
                        1
                );

                Uri uri =
                        resolver.insert(
                                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                                values
                        );

                if (uri == null) {
                    call.reject(
                            "Tidak dapat membuat file di folder Download."
                    );
                    return;
                }

                try (OutputStream outputStream =
                             resolver.openOutputStream(uri)) {

                    if (outputStream == null) {
                        resolver.delete(uri, null, null);

                        call.reject(
                                "Tidak dapat membuka file Download."
                        );
                        return;
                    }

                    outputStream.write(fileBytes);
                    outputStream.flush();
                }

                ContentValues completed =
                        new ContentValues();

                completed.put(
                        MediaStore.Downloads.IS_PENDING,
                        0
                );

                resolver.update(
                        uri,
                        completed,
                        null,
                        null
                );

                JSObject result =
                        new JSObject();

                result.put(
                        "uri",
                        uri.toString()
                );

                result.put(
                        "fileName",
                        fileName
                );

                result.put(
                        "location",
                        "Download"
                );

                call.resolve(result);

            } else {

                call.reject(
                        "Penyimpanan folder Download memerlukan Android 10 atau lebih baru."
                );
            }

        } catch (IllegalArgumentException e) {

            call.reject(
                    "Data file tidak valid."
            );

        } catch (Exception e) {

            call.reject(
                    "Gagal menyimpan file ke Download: "
                            + e.getMessage()
            );
        }
    }
}
