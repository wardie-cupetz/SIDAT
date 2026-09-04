import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

/* =========================================================
   SIDAT
   SEND PUSH NOTIFICATION
   FIREBASE CLOUD MESSAGING - HTTP v1
   WEB PUSH / VAPID
   ========================================================= */


/* =========================================================
   CORS
   ========================================================= */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


/* =========================================================
   ENVIRONMENT
   ========================================================= */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SIDAT_SERVICE_ROLE_KEY");

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL");
const FIREBASE_PRIVATE_KEY_RAW = Deno.env.get("FIREBASE_PRIVATE_KEY");

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT_RAW") ||
  Deno.env.get("VAPID_SUBJECT");


/* =========================================================
   VALIDATE ENVIRONMENT
   ========================================================= */

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL tidak tersedia.");
}

if (!SERVICE_ROLE) {
  throw new Error("SIDAT_SERVICE_ROLE_KEY belum tersedia.");
}

if (!FIREBASE_PROJECT_ID) {
  throw new Error("FIREBASE_PROJECT_ID belum tersedia.");
}

if (!FIREBASE_CLIENT_EMAIL) {
  throw new Error("FIREBASE_CLIENT_EMAIL belum tersedia.");
}

if (!FIREBASE_PRIVATE_KEY_RAW) {
  throw new Error("FIREBASE_PRIVATE_KEY belum tersedia.");
}


/* =========================================================
   FIREBASE PRIVATE KEY
   ========================================================= */

const FIREBASE_PRIVATE_KEY =
  FIREBASE_PRIVATE_KEY_RAW.replace(/\\n/g, "\n");


/* =========================================================
   SUPABASE ADMIN CLIENT
   ========================================================= */

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);


/* =========================================================
   WEB PUSH READY
   ========================================================= */

const webPushReady = Boolean(
  VAPID_PUBLIC_KEY &&
  VAPID_PRIVATE_KEY &&
  VAPID_SUBJECT,
);

if (webPushReady) {
  webpush.setVapidDetails(
    VAPID_SUBJECT!,
    VAPID_PUBLIC_KEY!,
    VAPID_PRIVATE_KEY!,
  );
}


/* =========================================================
   RESPONSE HELPER
   ========================================================= */

function response(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}


/* =========================================================
   BASE64URL
   ========================================================= */

function b64url(bytes: Uint8Array) {
  let s = "";

  for (
    let i = 0;
    i < bytes.length;
    i += 0x8000
  ) {
    s += String.fromCharCode(
      ...bytes.subarray(
        i,
        Math.min(i + 0x8000, bytes.length),
      ),
    );
  }

  return btoa(s)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}


function b64urlText(value: string) {
  return b64url(
    new TextEncoder().encode(value),
  );
}


/* =========================================================
   PEM → ARRAYBUFFER
   ========================================================= */

function pemToBuffer(pem: string) {
  const b64 = pem
    .replace(
      /-----BEGIN PRIVATE KEY-----/g,
      "",
    )
    .replace(
      /-----END PRIVATE KEY-----/g,
      "",
    )
    .replace(/\s/g, "");

  const bin = atob(b64);

  const bytes = new Uint8Array(
    bin.length,
  );

  for (
    let i = 0;
    i < bin.length;
    i++
  ) {
    bytes[i] = bin.charCodeAt(i);
  }

  return bytes.buffer;
}


/* =========================================================
   FIREBASE ACCESS TOKEN
   ========================================================= */

async function firebaseAccessToken() {
  const now = Math.floor(
    Date.now() / 1000,
  );

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope:
      "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned =
    `${b64urlText(JSON.stringify(header))}.${b64urlText(JSON.stringify(payload))}`;

  const key =
    await crypto.subtle.importKey(
      "pkcs8",
      pemToBuffer(
        FIREBASE_PRIVATE_KEY,
      ),
      {
        name:
          "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

  const sig =
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(
        unsigned,
      ),
    );

  const jwt =
    `${unsigned}.${b64url(
      new Uint8Array(sig),
    )}`;

  const r = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type:
          "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    },
  );

  const d = await r.json();

  if (!r.ok || !d.access_token) {
    throw new Error(
      `Firebase access token gagal: ${
        d?.error_description ||
        d?.error ||
        r.status
      }`,
    );
  }

  return d.access_token as string;
}


/* =========================================================
   SEND FCM
   ========================================================= */

async function sendFCM(
  token: string,
  access: string,
  n: any,
) {
  const r = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${access}`,
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        message: {
          token,

          notification: {
            title: n.title,
            body: n.message,
          },

          data: {
            notification_id:
              String(n.id),

            report_id:
              n.report_id
                ? String(n.report_id)
                : "",

            created_at:
              n.created_at
                ? String(n.created_at)
                : "",

            url:
              n.url || "",
          },

          android: {
            priority: "high",

            notification: {
              channel_id:
                "sidat_notification",

              sound: "default",
            },
          },
        },
      }),
    },
  );

  const text = await r.text();

  if (!r.ok) {
    const e: any =
      new Error(
        text ||
        `FCM HTTP ${r.status}`,
      );

    e.statusCode = r.status;
    e.body = text;

    throw e;
  }

  return text;
}


/* =========================================================
   SEND WEB PUSH
   ========================================================= */

async function sendWeb(
  subscription: any,
  n: any,
) {
  if (!webPushReady) {
    throw new Error(
      "VAPID belum dikonfigurasi.",
    );
  }

  return webpush.sendNotification(
    {
      endpoint:
        subscription.endpoint,

      keys: {
        p256dh:
          subscription.p256dh,

        auth:
          subscription.auth,
      },
    },

    JSON.stringify({
      title: n.title,
      body: n.message,

      notification_id:
        String(n.id),

      report_id:
        n.report_id
          ? String(n.report_id)
          : "",

      created_at:
        n.created_at
          ? String(n.created_at)
          : "",

      url:
        n.url || "",

      data: {
        notification_id:
          String(n.id),

        report_id:
          n.report_id
            ? String(n.report_id)
            : "",

        url:
          n.url || "",
      },
    }),
  );
}


/* =========================================================
   AUTH CALLER
   ========================================================= */

async function caller(req: Request) {
  const h =
    req.headers.get(
      "Authorization",
    ) || "";

  if (!h.startsWith("Bearer ")) {
    return {
      error:
        "Authorization Bearer wajib dikirim.",
      status: 401,
    };
  }

  const token =
    h.slice(7).trim();

  const {
    data: { user },
    error,
  } =
    await supabaseAdmin.auth.getUser(
      token,
    );

  if (error || !user) {
    return {
      error:
        "Token tidak valid atau sudah kedaluwarsa.",
      status: 401,
    };
  }


  /* =======================================================
     PROFILE
     ======================================================= */

  const {
    data: profile,
  } =
    await supabaseAdmin
      .from("profiles")
      .select(
        "user_id,role,resident_id",
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();


  /* =======================================================
     ADMIN
     ======================================================= */

  if (
    profile?.role === "admin"
  ) {
    return {
      user,
      role: "admin",
      residentId: null,
      token,
    };
  }


  /* =======================================================
     RESIDENT ID
     ======================================================= */

  let residentId =
    profile?.resident_id ||
    null;


  /* =======================================================
     FALLBACK RESIDENTS
     ======================================================= */

  if (!residentId) {
    const {
      data: resident,
    } =
      await supabaseAdmin
        .from("residents")
        .select(
          "id,auth_id",
        )
        .eq(
          "auth_id",
          user.id,
        )
        .maybeSingle();

    if (resident) {
      residentId =
        resident.id;
    }
  }


  /* =======================================================
     VALIDATE RESIDENT
     ======================================================= */

  if (!residentId) {
    return {
      error:
        "Akun warga tidak valid.",
      status: 403,
    };
  }


  return {
    user,
    role: "resident",
    residentId,
    token,
  };
}


/* =========================================================
   CREATE REPORT NOTIFICATIONS
   ========================================================= */

async function createReportNotifications(
  reportId: string,
  auth: any,
) {
  const {
    data: report,
    error,
  } =
    await supabaseAdmin
      .from("reports")
      .select(
        "id,resident_id,title,created_at",
      )
      .eq(
        "id",
        reportId,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Gagal mengambil laporan: ${error.message}`,
    );
  }

  if (!report) {
    throw new Error(
      "Laporan tidak ditemukan.",
    );
  }


  /* =======================================================
     SECURITY
     ======================================================= */

  if (
    auth.role === "resident" &&
    report.resident_id !==
      auth.residentId
  ) {
    const e: any =
      new Error(
        "Warga tidak berhak mengirim notifikasi untuk laporan ini.",
      );

    e.statusCode = 403;

    throw e;
  }


  const now =
    new Date().toISOString();


  const message =
    `Ada laporan warga baru: "${report.title || "Laporan baru"}".`;


  /* =======================================================
     NOTIFICATION ALL
     ======================================================= */

  const rows = [
    {
      id:
        crypto.randomUUID(),

      title:
        "📢 Laporan Warga",

      message,

      target_type:
        "all",

      target_resident_id:
        null,

      is_read:
        false,

      created_by:
        auth.user.id,

      created_at:
        now,

      report_id:
        report.id,
    },


    /* =====================================================
       NOTIFICATION ADMIN
       ===================================================== */

    {
      id:
        crypto.randomUUID(),

      title:
        "📢 Laporan Baru",

      message,

      target_type:
        "admin",

      target_resident_id:
        null,

      is_read:
        false,

      created_by:
        auth.user.id,

      created_at:
        now,

      report_id:
        report.id,
    },
  ];


  const {
    error: insertError,
  } =
    await supabaseAdmin
      .from("notifications")
      .insert(rows);


  if (insertError) {
    throw new Error(
      `Gagal membuat notifikasi: ${insertError.message}`,
    );
  }


  return rows;
}


/* =========================================================
   SEND ONE NOTIFICATION
   ========================================================= */

async function sendOne(
  notification: any,
) {
  let q =
    supabaseAdmin
      .from("push_subscriptions")
      .select(
        "id,resident_id,user_id,fcm_token,endpoint,p256dh,auth",
      );


  /* =======================================================
     TARGET ALL WARGA
     ======================================================= */

  if (
    notification.target_type ===
    "all"
  ) {
    q =
      q.not(
        "resident_id",
        "is",
        null,
      );
  }


  /* =======================================================
     TARGET SATU WARGA
     ======================================================= */

  else if (
    notification.target_type ===
    "resident"
  ) {
    q =
      q.eq(
        "resident_id",
        notification.target_resident_id,
      );
  }


  /* =======================================================
     TARGET ADMIN
     ======================================================= */

  else if (
    notification.target_type ===
    "admin"
  ) {
    const {
      data: admins,
      error,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "user_id",
        )
        .eq(
          "role",
          "admin",
        );

    if (error) {
      throw new Error(
        `Gagal mengambil admin: ${error.message}`,
      );
    }

    const ids =
      (admins || [])
        .map(
          (x: any) =>
            x.user_id,
        )
        .filter(Boolean);

    if (!ids.length) {
      return {
        total: 0,
        fcmSent: 0,
        fcmFailed: 0,
        webSent: 0,
        webFailed: 0,
        removed: 0,
      };
    }

    q =
      q.in(
        "user_id",
        ids,
      );
  }


  /* =======================================================
     INVALID TARGET
     ======================================================= */

  else {
    throw new Error(
      `target_type tidak didukung: ${notification.target_type}`,
    );
  }


  /* =======================================================
     GET SUBSCRIPTIONS
     ======================================================= */

  const {
    data: subs,
    error,
  } =
    await q;

  if (error) {
    throw new Error(
      `Gagal mengambil push subscription: ${error.message}`,
    );
  }


  const list =
    subs || [];


  /* =======================================================
     URL
     ======================================================= */

  const n = {
    ...notification,

    url:
      notification.target_type ===
      "admin"

        ? `/admin/admin-laporan.html?report_id=${encodeURIComponent(
            notification.report_id || "",
          )}`

        : `/warga/laporan.html?report_id=${encodeURIComponent(
            notification.report_id || "",
          )}`,
  };


  /* =======================================================
     FIREBASE ACCESS TOKEN
     HANYA JIKA ADA FCM
     ======================================================= */

  const hasFCM =
    list.some(
      (x: any) =>
        Boolean(
          x.fcm_token,
        ),
    );


  const access =
    hasFCM
      ? await firebaseAccessToken()
      : "";


  /* =======================================================
     RESULT
     ======================================================= */

  const result = {
    total:
      list.length,

    fcmSent:
      0,

    fcmFailed:
      0,

    webSent:
      0,

    webFailed:
      0,

    removed:
      0,
  };


  /* =======================================================
     SEND
     ======================================================= */

  for (
    const sub of list
  ) {

    /* =====================================================
       NATIVE FCM APK
       ===================================================== */

    if (
      sub.fcm_token
    ) {
      try {

        await sendFCM(
          String(
            sub.fcm_token,
          ),
          access,
          n,
        );

        result.fcmSent++;

      } catch (
        e: any
      ) {

        result.fcmFailed++;

        const body =
          String(
            e?.body || "",
          );


        /* ===============================================
           INVALID / EXPIRED FCM TOKEN
           =============================================== */

        const invalidToken =
          body.includes(
            "UNREGISTERED",
          ) ||
          body.includes(
            "registration-token-not-registered",
          ) ||
          body.includes(
            "INVALID_ARGUMENT",
          );


        if (
          invalidToken
        ) {
          const {
            error: de,
          } =
            await supabaseAdmin
              .from(
                "push_subscriptions",
              )
              .delete()
              .eq(
                "id",
                sub.id,
              );

          if (!de) {
            result.removed++;
          }
        }
      }
    }


    /* =====================================================
       WEB PUSH
       =====================================================

       PENTING:
       Subscription native APK menggunakan:

       endpoint = fcm-native:<user_id>

       Jadi JANGAN kirim Web Push ke subscription native.
       ===================================================== */

    const isNativeFCM =
      typeof sub.endpoint ===
        "string" &&
      sub.endpoint.startsWith(
        "fcm-native:",
      );


    if (
      !isNativeFCM &&
      sub.endpoint &&
      sub.p256dh &&
      sub.auth
    ) {

      try {

        await sendWeb(
          sub,
          n,
        );

        result.webSent++;

      } catch (
        e: any
      ) {

        result.webFailed++;


        /* ===============================================
           WEB PUSH SUBSCRIPTION EXPIRED
           =============================================== */

        if (
          e?.statusCode ===
            404 ||
          e?.statusCode ===
            410
        ) {

          const {
            error: de,
          } =
            await supabaseAdmin
              .from(
                "push_subscriptions",
              )
              .delete()
              .eq(
                "id",
                sub.id,
              );

          if (!de) {
            result.removed++;
          }
        }
      }
    }
  }


  return result;
}


/* =========================================================
   MAIN
   ========================================================= */

Deno.serve(
  async (
    req,
  ) => {

    /* =====================================================
       OPTIONS
       ===================================================== */

    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders,
        },
      );
    }


    /* =====================================================
       ONLY POST
       ===================================================== */

    if (
      req.method !==
      "POST"
    ) {
      return response(
        {
          success:
            false,

          message:
            "Method harus POST.",
        },
        405,
      );
    }


    try {

      /* ===================================================
         AUTH
         =================================================== */

      const auth: any =
        await caller(
          req,
        );

      if (
        auth.error
      ) {
        return response(
          {
            success:
              false,

            message:
              auth.error,
          },
          auth.status,
        );
      }


      /* ===================================================
         BODY
         =================================================== */

      const body =
        await req.json();

      const action =
        String(
          body?.action ||
            "",
        ).trim();


      /* ===================================================
         NEW REPORT
         ===================================================

         WARGA MENGIRIM LAPORAN

         → notification ALL
         → notification ADMIN
         → FCM warga
         → FCM admin
         → Web Push jika ada
         =================================================== */

      if (
        action ===
        "new_report"
      ) {

        const reportId =
          String(
            body?.report_id ||
              "",
          ).trim();


        if (!reportId) {
          return response(
            {
              success:
                false,

              message:
                "report_id wajib untuk action new_report.",
            },
            400,
          );
        }


        if (
          auth.role !==
            "admin" &&
          auth.role !==
            "resident"
        ) {
          return response(
            {
              success:
                false,

              message:
                "Tidak diizinkan.",
            },
            403,
          );
        }


        const notifications =
          await createReportNotifications(
            reportId,
            auth,
          );


        const results: any[] =
          [];


        for (
          const n of
            notifications
        ) {

          results.push(
            {
              notification_id:
                n.id,

              target_type:
                n.target_type,

              ...(
                await sendOne(
                  n,
                )
              ),
            },
          );
        }


        return response(
          {
            success:
              true,

            action,

            report_id:
              reportId,

            notifications:
              results,
          },
        );
      }


      /* ===================================================
         JALUR LAMA
         ===================================================

         Dipakai untuk:

         - Pengumuman
         - Update status laporan
         - Notifikasi manual

         Client membuat row notifications
         kemudian mengirim notification_id.
         =================================================== */

      const notificationId =
        String(
          body?.notification_id ||
            "",
        ).trim();


      if (
        !notificationId
      ) {
        return response(
          {
            success:
              false,

            message:
              "notification_id wajib dikirim.",
          },
          400,
        );
      }


      /* ===================================================
         GET NOTIFICATION
         =================================================== */

      const {
        data: notification,
        error:
          notificationError,
      } =
        await supabaseAdmin
          .from(
            "notifications",
          )
          .select(
            "id,title,message,target_type,target_resident_id,created_by,report_id,created_at",
          )
          .eq(
            "id",
            notificationId,
          )
          .maybeSingle();


      if (
        notificationError
      ) {
        return response(
          {
            success:
              false,

            message:
              notificationError.message,
          },
          500,
        );
      }


      if (
        !notification
      ) {
        return response(
          {
            success:
              false,

            message:
              "Notifikasi tidak ditemukan.",
          },
          404,
        );
      }


      /* ===================================================
         SECURITY FOR RESIDENT
         ===================================================

         Warga hanya boleh memicu push untuk
         notifikasi ALL yang berhubungan dengan
         laporan miliknya.
         =================================================== */

      if (
        auth.role ===
        "resident"
      ) {

        if (
          notification.target_type !==
            "all" ||
          !notification.report_id
        ) {
          return response(
            {
              success:
                false,

              message:
                "Warga tidak diizinkan memicu notifikasi ini.",
            },
            403,
          );
        }


        const {
          data: report,
        } =
          await supabaseAdmin
            .from(
              "reports",
            )
            .select(
              "resident_id",
            )
            .eq(
              "id",
              notification.report_id,
            )
            .maybeSingle();


        if (
          !report ||
          report.resident_id !==
            auth.residentId
        ) {
          return response(
            {
              success:
                false,

              message:
                "Laporan bukan milik warga ini.",
            },
            403,
          );
        }
      }
/* ===================================================
         SEND
         =================================================== */

      const result =
        await sendOne(
          notification,
        );


      /* ===================================================
         RESPONSE
         =================================================== */

      return response(
        {
          success:
            true,

          notification_id:
            notification.id,

          target_type:
            notification.target_type,

          ...result,
        },
      );

    } catch (
      e: any
    ) {

      const status =
        e?.statusCode ||
        500;


      console.error(
        "send-push-notification error:",
        e,
      );


      return response(
        {
          success:
            false,

          message:
            e?.message ||
            String(e),
        },
        status,
      );
    }
  },
);
