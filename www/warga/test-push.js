(async function () {

    const notificationId =
        "76b1ca36-f938-4cdc-897c-fdc431da8b5b";

    const url =
        `${SUPABASE_URL}/functions/v1/send-push-notification`;


    try {

        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        notification_id:
                            notificationId
                    })
                }
            );


        const hasil =
            await response.text();


        alert(
            "SIDAT TEST PUSH\n\n" +
            "URL:\n" + url +
            "\n\nStatus: " + response.status +
            "\n\nHasil:\n" + hasil
        );

    }

    catch (error) {

        alert(
            "SIDAT TEST PUSH ERROR\n\n" +
            "URL:\n" + url +
            "\n\nNama error:\n" +
            (error.name || "-") +

            "\n\nPesan:\n" +
            (error.message || String(error))
        );

    }

})();
