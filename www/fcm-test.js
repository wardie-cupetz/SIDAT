(async () => {
  if (!window.Capacitor) {
    alert("Capacitor tidak terdeteksi.");
    return;
  }

  const { PushNotifications } =
    Capacitor.Plugins;

  try {
    const perm =
      await PushNotifications.requestPermissions();

    if (perm.receive !== "granted") {
      alert("Izin notifikasi ditolak.");
      return;
    }

    PushNotifications.addListener(
      "registration",
      token => {
        alert(
          "FCM TOKEN\n\n" +
          token.value
        );

        console.log(
          "FCM TOKEN:",
          token.value
        );
      }
    );

    PushNotifications.addListener(
      "registrationError",
      err => {
        alert(
          JSON.stringify(err)
        );
      }
    );

    await PushNotifications.register();

  } catch (e) {
    alert(
      e.message || String(e)
    );
  }
})();
