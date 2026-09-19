package com.sidat.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class SidatFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID = "sidat_notification";
    private static final String CHANNEL_NAME = "Notifikasi SIDAT";
    private static final String CHANNEL_DESCRIPTION =
            "Notifikasi dari aplikasi SIDAT";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {

        String title = null;
        String body = null;

        /*
         * Ambil dari notification payload jika tersedia.
         */
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }

        /*
         * Ambil dari data payload jika notification payload kosong.
         */
        Map<String, String> data = remoteMessage.getData();

        if (data != null && !data.isEmpty()) {

            if (title == null || title.trim().isEmpty()) {
                title = data.get("title");
            }

            if (body == null || body.trim().isEmpty()) {
                body = data.get("body");
            }
        }

        /*
         * Fallback SIDAT.
         */
        if (title == null || title.trim().isEmpty()) {
            title = "SIDAT";
        }

        if (body == null || body.trim().isEmpty()) {
            body = "Ada notifikasi baru.";
        }

        createNotificationChannel();

        showNotification(
                title,
                body,
                data
        );
    }

    /*
     * Membuat notification channel SIDAT.
     */
    private void createNotificationChannel() {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager =
                (NotificationManager)
                        getSystemService(Context.NOTIFICATION_SERVICE);

        if (manager == null) {
            return;
        }

        NotificationChannel channel =
                new NotificationChannel(
                        CHANNEL_ID,
                        CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                );

        channel.setDescription(CHANNEL_DESCRIPTION);

        channel.enableVibration(true);

        channel.setVibrationPattern(
                new long[]{
                        0,
                        250,
                        200,
                        250
                }
        );

        channel.setShowBadge(true);

        manager.createNotificationChannel(channel);
    }

    /*
     * Menampilkan notification bar Android.
     */
    private void showNotification(
            String title,
            String body,
            Map<String, String> data
    ) {

        /*
         * Klik notifikasi membuka MainActivity.
         */
        Intent intent =
                new Intent(
                        this,
                        MainActivity.class
                );

        intent.addFlags(
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        /*
         * Kirim seluruh data FCM ke MainActivity.
         */
        if (data != null) {

            for (Map.Entry<String, String> entry :
                    data.entrySet()) {

                if (entry.getKey() != null &&
                        entry.getValue() != null) {

                    intent.putExtra(
                            entry.getKey(),
                            entry.getValue()
                    );
                }
            }
        }

        PendingIntent pendingIntent =
                PendingIntent.getActivity(
                        this,
                        (int)
                                (System.currentTimeMillis()
                                        & 0x7fffffff),

                        intent,

                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );

        /*
         * Untuk diagnostic native, gunakan icon Android
         * yang pasti tersedia.
         */
        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(
                        this,
                        CHANNEL_ID
                )
                        .setSmallIcon(
                                android.R.drawable.ic_dialog_info
                        )
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(
                                new NotificationCompat
                                        .BigTextStyle()
                                        .bigText(body)
                        )
                        .setPriority(
                                NotificationCompat.PRIORITY_HIGH
                        )
                        .setCategory(
                                NotificationCompat.CATEGORY_MESSAGE
                        )
                        .setAutoCancel(true)
                        .setVibrate(
                                new long[]{
                                        0,
                                        250,
                                        200,
                                        250
                                }
                        )
                        .setContentIntent(pendingIntent);

        /*
         * Pastikan izin notification aktif.
         */
        NotificationManagerCompat notificationManager =
                NotificationManagerCompat.from(this);

        if (!notificationManager.areNotificationsEnabled()) {
            return;
        }

        /*
         * ID notification unik.
         */
        int notificationId =
                (int)
                        (System.currentTimeMillis()
                                & 0x7fffffff);

        notificationManager.notify(
                notificationId,
                builder.build()
        );
    }
}