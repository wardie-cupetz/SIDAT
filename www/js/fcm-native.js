// =========================================================
// SIDAT
// FCM NATIVE - FINAL
// Capacitor + Firebase Cloud Messaging
// =========================================================
//
// FUNGSI:
// - Register FCM Native
// - Request permission Android
// - Simpan token FCM
// - Sinkron token ke Supabase
// - Admin + Warga
// - Retry sinkronisasi
// - Klik notification -> halaman tujuan
//
// CATATAN:
// - Notifikasi utama ditangani oleh Android Native
//   melalui SidatFirebaseMessagingService.java
// - Tidak membuat popup HTML foreground
// - Tidak menggunakan Web Push / VAPID
// =========================================================

(function () {
  "use strict";

  // =======================================================
  // CONFIG
  // =======================================================

  const STORAGE_KEY = "sidat_fcm_native_token";

  const CHANNEL_ID = "sidat_notification";

  const MAX_RETRY = 5;

  const RETRY_DELAY = 2000;

  // =======================================================
  // DEBUG
  // =======================================================

  function log(...args) {
    console.log("[SIDAT FCM]", ...args);
  }

  function error(...args) {
    console.error("[SIDAT FCM]", ...args);
  }

  // =======================================================
  // CAPACITOR
  // =======================================================

  function getPushNotifications() {
    try {
      if (!window.Capacitor) {
        return null;
      }

      if (
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.PushNotifications
      ) {
        return window.Capacitor.Plugins.PushNotifications;
      }

      if (
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.PushNotification
      ) {
        return window.Capacitor.Plugins.PushNotification;
      }

      return null;
    } catch (e) {
      error("Gagal mengambil PushNotifications:", e);
      return null;
    }
  }

  // =======================================================
  // CEK NATIVE APK
  // =======================================================

  function isNativeApp() {
    try {
      if (!window.Capacitor) {
        return false;
      }

      if (typeof window.Capacitor.isNativePlatform === "function") {
        return window.Capacitor.isNativePlatform();
      }

      if (window.Capacitor.getPlatform) {
        return window.Capacitor.getPlatform() !== "web";
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  // =======================================================
  // SUPABASE CLIENT
  // =======================================================

  function getSupabaseClient() {
    try {
      if (window.supabaseClient) {
        return window.supabaseClient;
      }

      return null;
    } catch (e) {
      error("Supabase client tidak ditemukan:", e);
      return null;
    }
  }

  // =======================================================
  // AMBIL SESSION
  // =======================================================

  async function getSession() {
    const client = getSupabaseClient();

    if (!client || !client.auth) {
      error("Supabase client/auth belum tersedia.");
      return null;
    }

    try {
      const result = await client.auth.getSession();

      if (result.error) {
        error("getSession error:", result.error);
        return null;
      }

      return result.data?.session || null;
    } catch (e) {
      error("Gagal mengambil session:", e);
      return null;
    }
  }

  // =======================================================
  // AMBIL TOKEN LOKAL
  // =======================================================

  function getLocalFCMToken() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      error("Gagal membaca token lokal:", e);
      return "";
    }
  }

  // =======================================================
  // SIMPAN TOKEN LOKAL
  // =======================================================

  function saveLocalFCMToken(token) {
    try {
      if (!token) {
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        String(token)
      );

      log(
        "Token FCM disimpan lokal:",
        String(token).substring(0, 20) + "..."
      );
    } catch (e) {
      error("Gagal menyimpan token FCM:", e);
    }
  }

  // =======================================================
  // AMBIL PROFILE
  // =======================================================

  async function getProfile(userId) {
    const client = getSupabaseClient();

    if (!client || !userId) {
      return null;
    }

    try {
      const result = await client
        .from("profiles")
        .select("user_id,role,resident_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (result.error) {
        error("Gagal mengambil profile:", result.error);
        return null;
      }

      return result.data || null;
    } catch (e) {
      error("Exception getProfile:", e);
      return null;
    }
  }

  // =======================================================
  // SINKRON TOKEN FCM
  // =======================================================

  async function sinkronkanTokenFCM(token) {
    if (!token) {
      error("Token FCM kosong.");
      return false;
    }

    const client = getSupabaseClient();

    if (!client) {
      error("Supabase client belum tersedia.");
      return false;
    }

    try {
      const session = await getSession();

      if (!session || !session.user) {
        log("Session belum tersedia. Sinkronisasi ditunda.");
        return false;
      }

      const user = session.user;

      const profile = await getProfile(user.id);

      if (!profile) {
        error(
          "Profile tidak ditemukan untuk user:",
          user.id
        );

        return false;
      }

      const role = String(
        profile.role || ""
      ).toLowerCase();

      const residentId =
        profile.resident_id || null;

      log(
        "Profile FCM:",
        {
          user_id: user.id,
          role: role,
          resident_id: residentId
        }
      );

      // ===================================================
      // DATA NATIVE FCM
      // ===================================================

      const nativeEndpoint =
        "fcm-native:" + user.id;

      // ===================================================
      // CARI SUBSCRIPTION
      // ===================================================

      let existing = null;

      if (role === "admin") {
        const result = await client
          .from("push_subscriptions")
          .select(
            "id,user_id,resident_id,fcm_token,endpoint"
          )
          .eq("user_id", user.id)
          .eq("endpoint", nativeEndpoint)
          .maybeSingle();

        if (result.error) {
          error(
            "Gagal mencari subscription admin:",
            result.error
          );
        } else {
          existing = result.data || null;
        }
      } else {
        if (!residentId) {
          error(
            "resident_id tidak ditemukan untuk akun warga."
          );

          return false;
        }

        const result = await client
          .from("push_subscriptions")
          .select(
            "id,user_id,resident_id,fcm_token,endpoint"
          )
          .eq("resident_id", residentId)
          .eq("endpoint", nativeEndpoint)
          .maybeSingle();

        if (result.error) {
          error(
            "Gagal mencari subscription warga:",
            result.error
          );
        } else {
          existing = result.data || null;
        }
      }

      // ===================================================
      // DATA YANG DISIMPAN
      // ===================================================

      const data = {
        user_id: user.id,

        resident_id:
          role === "admin"
            ? null
            : residentId,

        fcm_token: String(token),

        endpoint: nativeEndpoint,

        p256dh: "native",

        auth: "native"
      };

      // ===================================================
      // UPDATE
      // ===================================================

      if (existing?.id) {
        const result = await client
          .from("push_subscriptions")
          .update(data)
          .eq("id", existing.id);

        if (result.error) {
          error(
            "Gagal update token FCM:",
            result.error
          );

          return false;
        }

        log(
          "Token FCM berhasil di-update:",
          existing.id
        );

        return true;
      }

      // ===================================================
      // INSERT
      // ===================================================

      const result = await client
        .from("push_subscriptions")
        .insert(data);

      if (result.error) {
        error(
          "Gagal insert token FCM:",
          result.error
        );

        return false;
      }

      log(
        "Token FCM berhasil disimpan ke Supabase."
      );

      return true;

    } catch (e) {
      error(
        "Exception sinkronisasi FCM:",
        e
      );

      return false;
    }
  }

  // =======================================================
  // RETRY SINKRONISASI
  // =======================================================

  async function sinkronkanTokenFCMRetry(
    token,
    attempt = 1
  ) {
    if (!token) {
      return false;
    }

    log(
      `Sinkronisasi FCM percobaan ${attempt}/${MAX_RETRY}`
    );

    const berhasil =
      await sinkronkanTokenFCM(token);

    if (berhasil) {
      log(
        "Sinkronisasi FCM berhasil."
      );

      return true;
    }

    if (attempt >= MAX_RETRY) {
      error(
        "Sinkronisasi FCM gagal setelah",
        MAX_RETRY,
        "percobaan."
      );

      return false;
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          RETRY_DELAY
        )
    );

    return sinkronkanTokenFCMRetry(
      token,
      attempt + 1
    );
  }

  // =======================================================
  // CREATE NOTIFICATION CHANNEL
  // =======================================================

  async function createNotificationChannel(
    PushNotifications
  ) {
    try {
      if (
        !PushNotifications ||
        !PushNotifications.createChannel
      ) {
        return;
      }

      await PushNotifications.createChannel({
        id: CHANNEL_ID,

        name: "Notifikasi SIDAT",

        description:
          "Notifikasi laporan dan informasi SIDAT.",

        importance: 5,

        visibility: 1,

        sound: "default",

        vibration: true,

        lights: true
      });

      log(
        "Notification channel SIDAT siap."
      );

    } catch (e) {
      error(
        "Gagal membuat notification channel:",
        e
      );
    }
  }

  // =======================================================
  // REGISTER FCM
  // =======================================================

  async function registerFCM() {
    if (!isNativeApp()) {
      log(
        "Bukan platform native. FCM Native dilewati."
      );

      return false;
    }

    const PushNotifications =
      getPushNotifications();

    if (!PushNotifications) {
      error(
        "Plugin PushNotifications tidak ditemukan."
      );

      return false;
    }

    try {
      // ===================================================
      // PERMISSION
      // ===================================================

      let permission;

      if (
        PushNotifications.checkPermissions
      ) {
        permission =
          await PushNotifications.checkPermissions();
      }

      if (
        !permission ||
        permission.receive !== "granted"
      ) {
        permission =
          await PushNotifications.requestPermissions();
      }

      log(
        "Status permission FCM:",
        permission
      );

      if (
        !permission ||
        permission.receive !== "granted"
      ) {
        error(
          "Permission notifikasi belum diberikan."
        );

        return false;
      }

      // ===================================================
      // CHANNEL
      // ===================================================

      await createNotificationChannel(
        PushNotifications
      );

      // ===================================================
      // LISTENER REGISTRATION
      // ===================================================

      if (
        PushNotifications.addListener
      ) {
        await PushNotifications.addListener(
          "registration",
          async function (token) {
            try {
              const value =
                token?.value ||
                token?.token ||
                "";

              if (!value) {
                error(
                  "Event registration tidak membawa token."
                );

                return;
              }

              log(
                "FCM registration berhasil."
              );

              saveLocalFCMToken(value);

              await sinkronkanTokenFCMRetry(
                value
              );

            } catch (e) {
              error(
                "Error pada registration listener:",
                e
              );
            }
          }
        );

        // =================================================
        // REGISTRATION ERROR
        // =================================================

        await PushNotifications.addListener(
          "registrationError",
          function (err) {
            error(
              "FCM registration error:",
              err
            );
          }
        );

        // =================================================
        // NOTIFICATION ACTION
        // =================================================

        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          function (event) {
            try {
              log(
                "Notification diketuk:",
                event
              );

              const notification =
                event?.notification || {};

              const data =
                notification?.data || {};

              bukaTujuanNotifikasi(
                data
              );

            } catch (e) {
              error(
                "Gagal menangani klik notification:",
                e
              );
            }
          }
        );
      }

      // ===================================================
      // REGISTER
      // ===================================================

      await PushNotifications.register();

      log(
        "PushNotifications.register() berhasil dipanggil."
      );

      return true;

    } catch (e) {
      error(
        "Gagal register FCM:",
        e
      );

      return false;
    }
  }

  // =======================================================
  // BUKA TUJUAN NOTIFIKASI
  // =======================================================

  function bukaTujuanNotifikasi(data) {
    if (!data) {
      return;
    }

    let url =
      data.url ||
      "";

    const reportId =
      data.report_id ||
      "";

    const targetType =
      data.target_type ||
      "";

    // ===================================================
    // JIKA URL SUDAH ADA
    // ===================================================

    if (url) {
      if (
        url.startsWith("http://") ||
        url.startsWith("https://")
      ) {
        window.location.href = url;
      } else {
        window.location.href = url;
      }

      return;
    }

    // ===================================================
    // FALLBACK REPORT
    // ===================================================

    if (reportId) {
      if (
        targetType === "admin"
      ) {
        window.location.href =
          "/admin/admin-laporan.html?report_id=" +
          encodeURIComponent(reportId);
      } else {
        window.location.href =
          "/warga/laporan.html?report_id=" +
          encodeURIComponent(reportId);
      }

      return;
    }

    // ===================================================
    // FALLBACK UMUM
    // ===================================================

    if (
      targetType === "admin"
    ) {
      window.location.href =
        "/admin/pengumuman.html";
    } else {
      window.location.href =
        "/warga/pengumuman.html";
    }
  }

  // =======================================================
  // SINKRON TOKEN LOKAL
  // =======================================================

  async function syncExistingToken() {
    const token =
      getLocalFCMToken();

    if (!token) {
      log(
        "Belum ada token FCM lokal."
      );

      return false;
    }

    log(
      "Mencoba sinkronisasi token FCM lokal..."
    );

    return sinkronkanTokenFCMRetry(
      token
    );
  }

  // =======================================================
  // PUBLIC API
  // =======================================================

  window.SIDATRegisterFCM =
    registerFCM;

  window.SIDATGetFCMToken =
    getLocalFCMToken;

  window.SIDATSinkronkanFCM =
    sinkronkanTokenFCM;

  window.SIDATSinkronkanFCMRetry =
    sinkronkanTokenFCMRetry;

  // =======================================================
  // AUTO START
  // =======================================================

  async function startFCM() {
    try {
      log(
        "Memulai FCM Native SIDAT..."
      );

      if (!isNativeApp()) {
        log(
          "SIDAT berjalan bukan sebagai APK Native."
        );

        return;
      }

      // Tunggu Supabase / WebView siap
      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1500
          )
      );

      await registerFCM();

      // ===================================================
      // COBA SINKRON TOKEN YANG SUDAH ADA
      // ===================================================

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1500
          )
      );

      await syncExistingToken();

      // ===================================================
      // RETRY TAMBAHAN
      // ===================================================

      setTimeout(
        async function () {
          const token =
            getLocalFCMToken();

          if (token) {
            await sinkronkanTokenFCMRetry(
              token
            );
          }
        },
        7000
      );

    } catch (e) {
      error(
        "FCM startup error:",
        e
      );
    }
  }

  // =======================================================
  // JALANKAN SETELAH DOM SIAP
  // =======================================================

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startFCM,
      {
        once: true
      }
    );
  } else {
    startFCM();
  }

})();