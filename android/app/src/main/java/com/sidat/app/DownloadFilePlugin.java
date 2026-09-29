package com.sidat.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.OutputStream;
import java.util.Base64;

@CapacitorPlugin(name = "DownloadFile")
public class DownloadFilePlugin extends Plugin {

    private static final String TAG = "SIDAT_DOWNLOAD";

    @PluginMethod
    public void saveFile(PluginCall call) {

        Log.d(TAG, "========================================");
        Log.d(TAG, "saveFile() DIPANGGIL");

        String fileName = call.getString("filename");
        String data = call.getString("data");
        String mimeType = call.getString(
                "mimeType",
                "application/octet-stream"
        );

        Log.d(TAG, "filename = " + fileName);
        Log.d(TAG, "mimeType = " + mimeType);
        Log.d(TAG, "data tersedia = " + (data != null));
        Log.d(TAG, "Android SDK = " + Build.VERSION.SDK_INT);

        if (fileName == null || fileName.trim().isEmpty()) {
            Log.e(TAG, "GAGAL: filename kosong");
            call.reject("Nama file tidak tersedia.");
            return;
        }

        if (data == null || data.isEmpty()) {
            Log.e(TAG, "GAGAL: data kosong");
            call.reject("Data file tidak tersedia.");
            return;
        }

        try {

            byte[] fileBytes;

            try {
                fileBytes = Base64.getDecoder().decode(data);
            } catch (Exception e) {
                Log.e(TAG, "GAGAL decode Base64", e);
                call.reject(
                        "Data file Base64 tidak valid: "
                                + e.getMessage()
                );
                return;
            }

            Log.d(TAG, "Ukuran file = " + fileBytes.length + " bytes");

            ContentResolver resolver =
                    getContext().getContentResolver();

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {

                Log.e(
                        TAG,
                        "Android terlalu lama untuk MediaStore Downloads"
                );

                call.reject(
                        "Penyimpanan folder Download memerlukan Android 10 atau lebih baru."
                );

                return;
            }

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

            Log.d(TAG, "Memanggil MediaStore.insert()...");

            Uri uri =
                    resolver.insert(
                            MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                            values
                    );

            if (uri == null) {

                Log.e(
                        TAG,
                        "GAGAL: MediaStore.insert() mengembalikan NULL"
                );

                call.reject(
                        "Android tidak dapat membuat file di folder Download."
                );

                return;
            }

            Log.d(TAG, "URI berhasil dibuat: " + uri);

            boolean penulisanBerhasil = false;

            try (
                    OutputStream outputStream =
                            resolver.openOutputStream(uri)
            ) {

                if (outputStream == null) {

                    Log.e(
                            TAG,
                            "GAGAL: openOutputStream() mengembalikan NULL"
                    );

                    resolver.delete(uri, null, null);

                    call.reject(
                            "Android tidak dapat membuka file Download."
                    );

                    return;
                }

                Log.d(TAG, "Menulis " + fileBytes.length + " bytes...");

                outputStream.write(fileBytes);
                outputStream.flush();

                penulisanBerhasil = true;

                Log.d(TAG, "Penulisan file BERHASIL");

            } catch (Exception e) {

                Log.e(
                        TAG,
                        "GAGAL saat menulis file",
                        e
                );

                resolver.delete(uri, null, null);

                call.reject(
                        "Gagal menulis file Download: "
                                + e.getMessage()
                );

                return;
            }

            if (!penulisanBerhasil) {

                Log.e(
                        TAG,
                        "GAGAL: penulisan tidak selesai"
                );

                resolver.delete(uri, null, null);

                call.reject(
                        "Penulisan file tidak selesai."
                );

                return;
            }

            ContentValues completed =
                    new ContentValues();

            completed.put(
                    MediaStore.Downloads.IS_PENDING,
                    0
            );

            Log.d(
                    TAG,
                    "Menyelesaikan file IS_PENDING=0..."
            );

            int updateResult =
                    resolver.update(
                            uri,
                            completed,
                            null,
                            null
                    );

            Log.d(
                    TAG,
                    "Hasil update = " + updateResult
            );

            if (updateResult <= 0) {

                Log.e(
                        TAG,
                        "GAGAL: update IS_PENDING=0"
                );

                resolver.delete(uri, null, null);

                call.reject(
                        "File berhasil ditulis tetapi gagal diselesaikan di folder Download."
                );

                return;
            }

            /*
             * Verifikasi bahwa file benar-benar masih ada
             * setelah IS_PENDING diubah menjadi 0.
             */
            long ukuranTersimpan = -1;

            Cursor cursor = null;

            try {

                cursor =
                        resolver.query(
                                uri,
                                new String[]{
                                        MediaStore.Downloads.SIZE,
                                        MediaStore.Downloads.DISPLAY_NAME,
                                        MediaStore.Downloads.MIME_TYPE
                                },
                                null,
                                null,
                                null
                        );

                if (cursor != null && cursor.moveToFirst()) {

                    int sizeIndex =
                            cursor.getColumnIndex(
                                    MediaStore.Downloads.SIZE
                            );

                    if (sizeIndex >= 0) {
                        ukuranTersimpan =
                                cursor.getLong(sizeIndex);
                    }

                    Log.d(
                            TAG,
                            "Verifikasi file berhasil"
                    );

                    Log.d(
                            TAG,
                            "Nama = "
                                    + cursor.getString(
                                            cursor.getColumnIndex(
                                                    MediaStore.Downloads.DISPLAY_NAME
                                            )
                                    )
                    );

                    Log.d(
                            TAG,
                            "Ukuran tersimpan = "
                                    + ukuranTersimpan
                    );
                } else {

                    Log.e(
                            TAG,
                            "PERINGATAN: query URI tidak menemukan file"
                    );
                }

            } catch (Exception e) {

                Log.e(
                        TAG,
                        "Gagal melakukan verifikasi query",
                        e
                );

            } finally {

                if (cursor != null) {
                    cursor.close();
                }
            }

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

            result.put(
                    "bytes",
                    fileBytes.length
            );

            result.put(
                    "storedBytes",
                    ukuranTersimpan
            );

            result.put(
                    "androidSdk",
                    Build.VERSION.SDK_INT
            );

            result.put(
                    "success",
                    true
            );

            Log.d(TAG, "========================================");
            Log.d(TAG, "DOWNLOAD BERHASIL");
            Log.d(TAG, "URI = " + uri);
            Log.d(TAG, "bytes = " + fileBytes.length);
            Log.d(TAG, "storedBytes = " + ukuranTersimpan);
            Log.d(TAG, "========================================");

            call.resolve(result);

        } catch (Exception e) {

            Log.e(
                    TAG,
                    "ERROR TIDAK TERDUGA",
                    e
            );

            call.reject(
                    "Gagal menyimpan file ke Download: "
                            + e.getClass().getSimpleName()
                            + " - "
                            + e.getMessage()
            );
        }
    }
}
