(async function () {

    console.log("SIDAT TEST PUSH: mulai...");

    const token =
        localStorage.getItem(
            "sidat_access_token"
        );

    if (!token) {

        console.error(
            "SIDAT TEST PUSH: access token tidak ditemukan."
        );

        return;

    }

    const notificationId =
        "76b1ca36-f938-4cdc-897c-fdc431da8b5b";


    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/functions/v1/send-push-notification`,
                {

                    method: "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            notification_id:
                                notificationId
                        })

                }
            );


        const text =
            await response.text();


        console.log(
            "SIDAT TEST PUSH STATUS:",
            response.status
        );


        console.log(
            "SIDAT TEST PUSH HASIL:",
            text
        );


    }

    catch (error) {

        console.error(
            "SIDAT TEST PUSH ERROR:",
            error
        );

    }

})();
