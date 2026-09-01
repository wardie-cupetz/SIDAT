import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================================
   SIDAT
   SEND PUSH NOTIFICATION
   FIREBASE CLOUD MESSAGING - HTTP v1
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

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL");

const SIDAT_SERVICE_ROLE_KEY =
  Deno.env.get("SIDAT_SERVICE_ROLE_KEY");

const FIREBASE_PROJECT_ID =
  Deno.env.get("FIREBASE_PROJECT_ID");

const FIREBASE_CLIENT_EMAIL =
  Deno.env.get("FIREBASE_CLIENT_EMAIL");

const FIREBASE_PRIVATE_KEY_RAW =
  Deno.env.get("FIREBASE_PRIVATE_KEY");


/* =========================================================
   ENV VALIDATION
   ========================================================= */

if (!SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL tidak tersedia."
  );
}

if (!SIDAT_SERVICE_ROLE_KEY) {
  throw new Error(
    "SIDAT_SERVICE_ROLE_KEY belum tersedia."
  );
}

if (!FIREBASE_PROJECT_ID) {
  throw new Error(
    "FIREBASE_PROJECT_ID belum tersedia."
  );
}

if (!FIREBASE_CLIENT_EMAIL) {
  throw new Error(
    "FIREBASE_CLIENT_EMAIL belum tersedia."
  );
}

if (!FIREBASE_PRIVATE_KEY_RAW) {
  throw new Error(
    "FIREBASE_PRIVATE_KEY belum tersedia."
  );
}


/* =========================================================
   FIREBASE PRIVATE KEY
   ========================================================= */

const FIREBASE_PRIVATE_KEY =
  FIREBASE_PRIVATE_KEY_RAW.replace(
    /\\n/g,
    "\n"
  );


/* =========================================================
   SUPABASE ADMIN CLIENT
   ========================================================= */

const supabaseAdmin =
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


/* =========================================================
   RESPONSE
   ========================================================= */

function jsonResponse(
  data: unknown,
  status = 200,
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
    },
  );

}


/* =========================================================
   LOGGING
   ========================================================= */

function logInfo(
  event: string,
  data: Record<string, unknown> = {},
) {

  console.log(
    JSON.stringify({
      level: "info",
      service:
        "send-push-notification",
      event,
      timestamp:
        new Date().toISOString(),
      ...data,
    }),
  );

}


function logError(
  event: string,
  data: Record<string, unknown> = {},
) {

  console.error(
    JSON.stringify({
      level: "error",
      service:
        "send-push-notification",
      event,
      timestamp:
        new Date().toISOString(),
      ...data,
    }),
  );

}


/* =========================================================
   BASE64URL
   ========================================================= */

function base64UrlEncode(
  input: Uint8Array,
): string {

  let binary = "";

  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < input.length;
    i += chunkSize
  ) {

    binary += String.fromCharCode(
      ...input.subarray(
        i,
        Math.min(
          i + chunkSize,
          input.length
        )
      )
    );

  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

}


function stringToBase64Url(
  value: string,
): string {

  return base64UrlEncode(
    new TextEncoder().encode(value)
  );

}


/* =========================================================
   PEM -> DER
   ========================================================= */

function pemToArrayBuffer(
  pem: string,
): ArrayBuffer {

  const base64 =
    pem
      .replace(
        /-----BEGIN PRIVATE KEY-----/g,
        ""
      )
      .replace(
        /-----END PRIVATE KEY-----/g,
        ""
      )
      .replace(
        /\s/g,
        ""
      );

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }

  return bytes.buffer;

}


/* =========================================================
   GOOGLE SERVICE ACCOUNT JWT
   ========================================================= */

async function createGoogleAccessToken(): Promise<string> {

  const now =
    Math.floor(
      Date.now() / 1000
    );

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: FIREBASE_CLIENT_EMAIL,

    scope:
      "https://www.googleapis.com/auth/firebase.messaging",

    aud:
      "https://oauth2.googleapis.com/token",

    iat: now,

    exp:
      now + 3600,
  };


  const encodedHeader =
    stringToBase64Url(
      JSON.stringify(header)
    );

  const encodedClaim =
    stringToBase64Url(
      JSON.stringify(claimSet)
    );


  const unsignedToken =
    `${encodedHeader}.${encodedClaim}`;


  const privateKey =
    await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(
        FIREBASE_PRIVATE_KEY
      ),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );


  const signature =
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(
        unsignedToken
      ),
    );


  const signedJwt =
    `${unsignedToken}.${base64UrlEncode(
      new Uint8Array(signature)
    )}`;


  const response =
    await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams({
            grant_type:
              "urn:ietf:params:oauth:grant-type:jwt-bearer",

            assertion:
              signedJwt,
          }),
      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    logError(
      "firebase_access_token_failed",
      {
        status:
          response.status,

        response:
          result,
      }
    );

    throw new Error(
      `Gagal mendapatkan Firebase access token: ${
        result?.error_description ||
        result?.error ||
        response.status
      }`
    );

  }


  if (!result.access_token) {

    throw new Error(
      "Firebase tidak memberikan access token."
    );

  }


  return result.access_token;

}


/* =========================================================
   FIREBASE SEND
   ========================================================= */

async function sendFCM(
  accessToken: string,
  token: string,
  notification: {
    title: string;
    body: string;
    notification_id: string;
    report_id: string | null;
    created_at: string | null;
    url: string;
  },
) {

  const url =
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;


  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message: {

              token,

              notification: {
                title:
                  notification.title,

                body:
                  notification.body,
              },

              data: {
                notification_id:
                  notification.notification_id,

                report_id:
                  notification.report_id ||
                  "",

                created_at:
                  notification.created_at ||
                  "",

                url:
                  notification.url,
              },

              android: {
                priority: "high",

                notification: {
                  channel_id:
                    "sidat_notification",

                  sound:
                    "default",
                },
              },

            },
          }),
      }
    );


  const responseText =
    await response.text();


  let responseData:
    Record<string, unknown> | null =
      null;


  try {

    responseData =
      responseText
        ? JSON.parse(
            responseText
          )
        : null;

  } catch {

    responseData = null;

  }


  if (!response.ok) {

    const errorCode =
      String(
        (
          responseData?.error as
            Record<string, unknown> |
            undefined
        )?.details
          ? JSON.stringify(
              (
                responseData
                  ?.error as
                  Record<
                    string,
                    unknown
                  >
              ).details
            )
          : ""
      );


    const errorMessage =
      String(
        (
          responseData?.error as
            Record<string, unknown> |
            undefined
        )?.message ||
        responseText ||
        `HTTP ${response.status}`
      );


    const error =
      new Error(
        errorMessage
      ) as Error & {
        statusCode?: number;
        responseData?: unknown;
        fcmErrorCode?: string;
      };


    error.statusCode =
      response.status;

    error.responseData =
      responseData;

    error.fcmErrorCode =
      errorCode;


    throw error;

  }


  return responseData;

}


/* =========================================================
   AUTHENTICATION ADMIN
   ========================================================= */

async function authenticateAdmin(
  req: Request,
) {

  const authorization =
    req.headers.get(
      "Authorization"
    );


  if (!authorization) {

    return {
      user: null,
      error:
        "Authorization header wajib dikirim.",
      status: 401,
    };

  }


  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {

    return {
      user: null,
      error:
        "Format Authorization tidak valid.",
      status: 401,
    };

  }


  const token =
    authorization
      .substring(7)
      .trim();


  if (!token) {

    return {
      user: null,
      error:
        "Token authorization kosong.",
      status: 401,
    };

  }


  const {
    data: {
      user
    },
    error: userError,
  } =
    await supabaseAdmin
      .auth
      .getUser(token);


  if (
    userError ||
    !user
  ) {

    logError(
      "authentication_failed",
      {
        reason:
          userError?.message ??
          "User tidak ditemukan.",
      }
    );


    return {
      user: null,
      error:
        "Token tidak valid atau sudah kedaluwarsa.",
      status: 401,
    };

  }


  const {
    data: profile,
    error: profileError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select(
        "id, user_id, role"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();


  if (profileError) {

    logError(
      "admin_role_lookup_failed",
      {
        userId:
          user.id,

        error:
          profileError.message,
      }
    );


    return {
      user: null,
      error:
        "Gagal memverifikasi hak akses admin.",
      status: 500,
    };

  }


  if (
    !profile ||
    profile.role !==
      "admin"
  ) {

    logError(
      "admin_access_denied",
      {
        userId:
          user.id,

        role:
          profile?.role ??
          null,
      }
    );


    return {
      user: null,
      error:
        "Akses hanya untuk admin.",
      status: 403,
    };

  }


  return {
    user,
    error: null,
    status: 200,
  };

}


/* =========================================================
   SERVER
   ========================================================= */

Deno.serve(
  async (req) => {

    /* =====================================================
       CORS PREFLIGHT
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
        }
      );

    }


    const requestId =
      crypto.randomUUID();


    try {

      /* ===================================================
         METHOD
         =================================================== */

      if (
        req.method !==
        "POST"
      ) {

        return jsonResponse(
          {
            success: false,

            message:
              "Method harus POST.",

            request_id:
              requestId,
          },

          405
        );

      }


      /* ===================================================
         AUTHENTICATION
         =================================================== */

      const authResult =
        await authenticateAdmin(
          req
        );


      if (
        !authResult.user
      ) {

        return jsonResponse(
          {
            success: false,

            message:
              authResult.error,

            request_id:
              requestId,
          },

          authResult.status
        );

      }


      const adminUser =
        authResult.user;


      logInfo(
        "request_authenticated",
        {
          requestId,

          userId:
            adminUser.id,
        }
      );


      /* ===================================================
         BODY
         =================================================== */

      let body:
        Record<
          string,
          unknown
        >;


      try {

        const parsed =
          await req.json();


        if (
          !parsed ||
          typeof parsed !==
            "object" ||
          Array.isArray(parsed)
        ) {

          return jsonResponse(
            {
              success: false,

              message:
                "Body JSON harus berupa object.",

              request_id:
                requestId,
            },

            400
          );

        }


        body =
          parsed as Record<
            string,
            unknown
          >;


      } catch {

        return jsonResponse(
          {
            success: false,

            message:
              "Body JSON tidak valid.",

            request_id:
              requestId,
          },

          400
        );

      }


      /* ===================================================
         NOTIFICATION ID
         =================================================== */

      const notificationId =
        String(
          body.notification_id ||
          ""
        ).trim();


      if (
        !notificationId
      ) {

        return jsonResponse(
          {
            success: false,

            message:
              "notification_id wajib dikirim.",

            request_id:
              requestId,
          },

          400
        );

      }


      /* ===================================================
         GET NOTIFICATION
         =================================================== */

      const {
        data:
          notification,
        error:
          notificationError,
      } =
        await supabaseAdmin
          .from(
            "notifications"
          )
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


      if (
        notificationError
      ) {

        logError(
          "notification_lookup_failed",
          {
            requestId,

            notificationId,

            error:
              notificationError.message,
          }
        );


        return jsonResponse(
          {
            success: false,

            message:
              "Gagal mengambil notifikasi.",

            request_id:
              requestId,
          },

          500
        );

      }


      if (
        !notification
      ) {

        return jsonResponse(
          {
            success: false,

            message:
              "Notifikasi tidak ditemukan.",

            request_id:
              requestId,
          },

          404
        );

      }


      /* ===================================================
         TARGET
         =================================================== */

      let query =
        supabaseAdmin
          .from(
            "push_subscriptions"
          )
          .select(
            `
              id,
              resident_id,
              fcm_token
            `
          )
          .not(
            "fcm_token",
            "is",
            null
          );


      if (
        notification.target_type ===
        "all"
      ) {

        logInfo(
          "target_all",
          {
            requestId,

            notificationId,
          }
        );

      } else if (
        notification.target_type ===
        "resident"
      ) {

        if (
          !notification.target_resident_id
        ) {

          return jsonResponse(
            {
              success: false,

              message:
                "target_resident_id tidak tersedia.",

              request_id:
                requestId,
            },

            400
          );

        }


        query =
          query.eq(
            "resident_id",
            notification
              .target_resident_id
          );


        logInfo(
          "target_resident",
          {
            requestId,

            notificationId,

            residentId:
              notification
                .target_resident_id,
          }
        );


      } else {

        return jsonResponse(
          {
            success: false,

            message:
              "target_type tidak didukung.",

            target_type:
              notification
                .target_type,

            request_id:
              requestId,
          },

          400
        );

      }


      /* ===================================================
         GET FCM SUBSCRIPTIONS
         =================================================== */

      const {
        data:
          subscriptions,
        error:
          subscriptionError,
      } =
        await query;


      if (
        subscriptionError
      ) {

        logError(
          "subscription_lookup_failed",
          {
            requestId,

            notificationId,

            error:
              subscriptionError.message,
          }
        );


        return jsonResponse(
          {
            success: false,

            message:
              "Gagal mengambil FCM token.",

            request_id:
              requestId,
          },

          500
        );

      }


      const daftar =
        (
          subscriptions ||
          []
        ).filter(
          (
            item
          ) =>
            !!item.fcm_token
        );


      logInfo(
        "fcm_tokens_loaded",
        {
          requestId,

          notificationId,

          total:
            daftar.length,
        }
      );


      if (
        daftar.length ===
        0
      ) {

        return jsonResponse(
          {
            success: true,

            message:
              "Tidak ada FCM token yang terdaftar.",

            notification_id:
              notification.id,

            target_type:
              notification
                .target_type,

            total: 0,

            sent: 0,

            failed: 0,

            removed: 0,

            request_id:
              requestId,
          }
        );

      }


      /* ===================================================
         FIREBASE ACCESS TOKEN
         =================================================== */

      logInfo(
        "firebase_auth_start",
        {
          requestId,

          projectId:
            FIREBASE_PROJECT_ID,
        }
      );


      const firebaseAccessToken =
        await createGoogleAccessToken();


      logInfo(
        "firebase_auth_success",
        {
          requestId,
        }
      );


      /* ===================================================
         NOTIFICATION PAYLOAD
         =================================================== */

      const notificationPayload = {

        title:
          notification.title ||
          "📢 SIDAT",

        body:
          notification.message ||
          "Ada notifikasi baru dari SIDAT.",

        notification_id:
          String(
            notification.id
          ),

        report_id:
          notification.report_id
            ? String(
                notification.report_id
              )
            : null,

        created_at:
          notification.created_at
            ? String(
                notification.created_at
              )
            : null,

        url:
          "/warga/pengumuman.html",

      };


      /* ===================================================
         SEND
         =================================================== */

      let sent = 0;

      let failed = 0;

      let removed = 0;


      for (
        const subscription
          of daftar
      ) {

        const fcmToken =
          String(
            subscription
              .fcm_token ||
            ""
          ).trim();


        if (
          !fcmToken
        ) {

          continue;

        }


        try {

          const result =
            await sendFCM(
              firebaseAccessToken,

              fcmToken,

              notificationPayload
            );


          sent++;


          logInfo(
            "fcm_push_sent",
            {
              requestId,

              notificationId,

              subscriptionId:
                subscription.id,

              residentId:
                subscription
                  .resident_id,

              firebaseMessage:
                result,
            }
          );


        } catch (
          pushError
        ) {

          failed++;


          const statusCode =
            (
              pushError as
                Error & {
                  statusCode?:
                    number;
                }
            )
              .statusCode;


          const responseData =
            (
              pushError as
                Error & {
                  responseData?:
                    unknown;
                }
            )
              .responseData;


          const responseText =
            JSON.stringify(
              responseData ||
              {}
            );


          /*
           * FCM mengembalikan
           * UNREGISTERED jika token
           * sudah tidak valid.
           */

          const tokenInvalid =
            responseText.includes(
              "UNREGISTERED"
            ) ||
            responseText.includes(
              "registration-token-not-registered"
            );


          if (
            tokenInvalid
          ) {

            const {
              error:
                deleteError,
            } =
              await supabaseAdmin
                .from(
                  "push_subscriptions"
                )
                .delete()
                .eq(
                  "id",
                  subscription.id
                );


            if (
              !deleteError
            ) {

              removed++;


              logInfo(
                "fcm_token_removed",
                {
                  requestId,

                  notificationId,

                  subscriptionId:
                    subscription.id,

                  residentId:
                    subscription
                      .resident_id,
                }
              );


            } else {

              logError(
                "fcm_token_remove_failed",
                {
                  requestId,

                  notificationId,

                  subscriptionId:
                    subscription.id,

                  error:
                    deleteError.message,
                }
              );

            }

          }


          logError(
            "fcm_push_failed",
            {
              requestId,

              notificationId,

              subscriptionId:
                subscription.id,

              residentId:
                subscription
                  .resident_id,

              statusCode:
                statusCode ||
                null,

              error:
                pushError instanceof
                Error
                  ? pushError.message
                  : String(
                      pushError
                    ),

              response:
                responseData ||
                null,
            }
          );

        }

      }


      /* ===================================================
         RESULT
         =================================================== */

      logInfo(
        "fcm_push_completed",
        {
          requestId,

          notificationId,

          targetType:
            notification
              .target_type,

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
            "Firebase FCM notification selesai.",

          notification_id:
            notification.id,

          target_type:
            notification
              .target_type,

          total:
            daftar.length,

          sent,

          failed,

          removed,

          request_id:
            requestId,
        }
      );


    } catch (
      error
    ) {

      logError(
        "fatal_error",
        {
          requestId,

          error:
            error instanceof
            Error
              ? error.message
              : "Unknown error",
        }
      );


      return jsonResponse(
        {
          success: false,

          message:
            "Gagal memproses Firebase FCM notification.",

          request_id:
            requestId,
        },

        500
      );

    }

  }
);
