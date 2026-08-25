import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL");

const SIDAT_SERVICE_ROLE_KEY =
  Deno.env.get("SIDAT_SERVICE_ROLE_KEY");

const VAPID_PRIVATE_KEY =
  Deno.env.get("VAPID_PRIVATE_KEY");

const VAPID_PUBLIC_KEY =
  Deno.env.get("VAPID_PUBLIC_KEY");

const VAPID_SUBJECT_RAW =
  Deno.env.get("VAPID_SUBJECT");

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL tidak tersedia.");
}

if (!SIDAT_SERVICE_ROLE_KEY) {
  throw new Error("SIDAT_SERVICE_ROLE_KEY belum tersedia.");
}

if (!VAPID_PRIVATE_KEY) {
  throw new Error("VAPID_PRIVATE_KEY belum tersedia.");
}

if (!VAPID_PUBLIC_KEY) {
  throw new Error("VAPID_PUBLIC_KEY belum tersedia.");
}

if (!VAPID_SUBJECT_RAW) {
  throw new Error("VAPID_SUBJECT belum tersedia.");
}


/*
==========================================
VAPID SUBJECT
==========================================
*/

const VAPID_SUBJECT =
  VAPID_SUBJECT_RAW.startsWith("mailto:")
    ? VAPID_SUBJECT_RAW
    : `mailto:${VAPID_SUBJECT_RAW}`;


/*
==========================================
VAPID CHECK
==========================================
*/

console.log(
  "SIDAT VAPID CHECK:",
  {
    subject:
      VAPID_SUBJECT.startsWith("mailto:")
        ? "MAILTO_OK"
        : "MAILTO_INVALID",

    publicKeyLength:
      VAPID_PUBLIC_KEY.length,

    privateKeyLength:
      VAPID_PRIVATE_KEY.length,

    publicKeyHasEquals:
      VAPID_PUBLIC_KEY.includes("="),

    publicKeyHasPlus:
      VAPID_PUBLIC_KEY.includes("+"),

    publicKeyHasSlash:
      VAPID_PUBLIC_KEY.includes("/"),
  }
);


/*
==========================================
SUPABASE ADMIN CLIENT
==========================================
*/

const supabase =
  createClient(
    SUPABASE_URL,
    SIDAT_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );


/*
==========================================
VAPID
==========================================
*/

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);


/*
==========================================
RESPONSE
==========================================
*/

function jsonResponse(
  data: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    }
  );
}


/*
==========================================
SERVER
==========================================
*/

Deno.serve(
  async (req) => {

    /*
    ======================================
    CORS
    ======================================
    */

    if (req.method === "OPTIONS") {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders,
        }
      );
    }


    try {

      /*
      ====================================
      METHOD
      ====================================
      */

      if (req.method !== "POST") {
        return jsonResponse(
          {
            success: false,
            message:
              "Method harus POST.",
          },
          405
        );
      }


      /*
      ====================================
      BODY
      ====================================
      */

      let body;

      try {
        body = await req.json();
      } catch {
        return jsonResponse(
          {
            success: false,
            message:
              "Body JSON tidak valid.",
          },
          400
        );
      }


      const notificationId =
        String(
          body?.notification_id || ""
        ).trim();


      if (!notificationId) {
        return jsonResponse(
          {
            success: false,
            message:
              "notification_id wajib dikirim.",
          },
          400
        );
      }


      console.log(
        "SIDAT PUSH:",
        "notification_id =",
        notificationId
      );


      /*
      ====================================
      NOTIFICATION
      ====================================
      */

      const {
        data: notification,
        error:
          notificationError,
      } =
        await supabase
          .from("notifications")
          .select(
            `
              id,
              title,
              message,
              target_type,
              target_resident_id,
              report_id,
              created_at
            `
          )
          .eq(
            "id",
            notificationId
          )
          .maybeSingle();


      if (notificationError) {
        console.error(
          "SIDAT PUSH:",
          notificationError
        );

        throw new Error(
          "Gagal mengambil notifikasi: " +
          notificationError.message
        );
      }


      if (!notification) {
        throw new Error(
          "Notifikasi tidak ditemukan."
        );
      }


      console.log(
        "SIDAT PUSH NOTIFICATION:",
        notification
      );


      /*
      ====================================
      SUBSCRIPTIONS
      ====================================
      */

      let query =
        supabase
          .from(
            "push_subscriptions"
          )
          .select(
            `
              id,
              resident_id,
              endpoint,
              p256dh,
              auth
            `
          );


      /*
      ====================================
      TARGET ALL
      ====================================
      */

      if (
        notification.target_type ===
        "all"
      ) {

        console.log(
          "SIDAT PUSH: target ALL"
        );

      }


      /*
      ====================================
      TARGET RESIDENT
      ====================================
      */

      else if (
        notification.target_type ===
        "resident"
      ) {

        if (
          !notification
            .target_resident_id
        ) {
          throw new Error(
            "target_resident_id tidak tersedia."
          );
        }


        query =
          query.eq(
            "resident_id",
            notification
              .target_resident_id
          );


        console.log(
          "SIDAT PUSH: target resident =",
          notification
            .target_resident_id
        );

      }


      /*
      ====================================
      TARGET INVALID
      ====================================
      */

      else {

        return jsonResponse(
          {
            success: false,
            message:
              "target_type tidak didukung.",
            target_type:
              notification.target_type,
          },
          400
        );

      }


      /*
      ====================================
      GET SUBSCRIPTIONS
      ====================================
      */

      const {
        data: subscriptions,
        error:
          subscriptionError,
      } =
        await query;


      if (subscriptionError) {

        console.error(
          "SIDAT PUSH:",
          subscriptionError
        );

        throw new Error(
          "Gagal mengambil push subscription: " +
          subscriptionError.message
        );
      }


      const daftar =
        subscriptions || [];


      console.log(
        "SIDAT PUSH: subscription =",
        daftar.length
      );


      if (
        daftar.length === 0
      ) {

        return jsonResponse(
          {
            success: true,
            message:
              "Tidak ada perangkat yang terdaftar.",
            notification_id:
              notification.id,
            target_type:
              notification.target_type,
            total: 0,
            sent: 0,
            failed: 0,
            removed: 0,
          }
        );

      }


      /*
      ====================================
      PAYLOAD
      ====================================
      */

      const payload =
        JSON.stringify(
          {
            title:
              notification.title ||
              "📢 SIDAT",

            message:
              notification.message ||
              "Ada notifikasi baru dari SIDAT.",

            notification_id:
              notification.id,

            report_id:
              notification.report_id ||
              null,

            created_at:
              notification.created_at,

            url:
              "/warga/pengumuman.html",
          }
        );


      /*
      ====================================
      SEND
      ====================================
      */

      let sent = 0;
      let failed = 0;
      let removed = 0;


      for (
        const subscription
        of daftar
      ) {

        const pushSubscription = {
          endpoint:
            subscription.endpoint,

          keys: {
            p256dh:
              subscription.p256dh,

            auth:
              subscription.auth,
          },
        };


        try {

          console.log(
            "SIDAT PUSH: mengirim ke",
            subscription.resident_id
          );


          /*
          ==================================
          DEBUG SUBSCRIPTION
          ==================================
          */

          console.log(
            "SIDAT PUSH ENDPOINT:",
            subscription.endpoint
              .split("/")[2]
          );

          console.log(
            "SIDAT PUSH KEY LENGTH:",
            {
              p256dh:
                subscription.p256dh?.length ||
                0,

              auth:
                subscription.auth?.length ||
                0,
            }
          );


          await webpush.sendNotification(
            pushSubscription,
            payload,
            {
              TTL: 60,
            }
          );


          sent++;


          console.log(
            "SIDAT PUSH: BERHASIL",
            subscription.id
          );

        }


        catch (pushError) {

          failed++;


          console.error(
            "SIDAT PUSH ERROR:",
            subscription.id,
            pushError
          );


          const statusCode =
            pushError?.statusCode;


          /*
          ==================================
          404 / 410 = SUBSCRIPTION MATI
          ==================================
          */

          if (
            statusCode === 404 ||
            statusCode === 410
          ) {

            const {
              error:
                deleteError,
            } =
              await supabase
                .from(
                  "push_subscriptions"
                )
                .delete()
                .eq(
                  "id",
                  subscription.id
                );


            if (!deleteError) {
              removed++;

              console.log(
                "SIDAT PUSH: subscription dihapus",
                subscription.id
              );
            }

          }

        }

      }


      /*
      ====================================
      RESULT
      ====================================
      */

      console.log(
        "SIDAT PUSH SELESAI",
        {
          total:
            daftar.length,

          sent,

          failed,

          removed,
        }
      );


      return jsonResponse(
        {
          success: true,

          message:
            "Push notification selesai.",

          notification_id:
            notification.id,

          target_type:
            notification.target_type,

          total:
            daftar.length,

          sent,

          failed,

          removed,
        }
      );

    }


    catch (error) {

      console.error(
        "SIDAT PUSH FATAL:",
        error
      );


      return jsonResponse(
        {
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Gagal mengirim push notification.",
        },
        500
      );

    }

  }
);
