(async function () {

    const notificationId =
        "76b1ca36-f938-4cdc-897c-fdc431da8b5b";


    const token =
        localStorage.getItem(
            "sidat_access_token"
        );


    if (!token) {

        alert(
            "SIDAT TEST PUSH\n\n" +
            "ERROR: Access token tidak ditemukan."
        );

        return;

    }


    try {

        const response =
            await fetch(

                `${SUPABASE_URL}` +
                `/functions/v1/send-push-notification`,

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


        const hasil =
            await response.text();


        alert(

            "SIDAT TEST PUSH\n\n" +

            "Status: " +
            response.status +

            "\n\nHasil:\n" +
            hasil

        );


    }

    catch (error) {

        alert(

            "SIDAT TEST PUSH ERROR\n\n" +

            String(error)

        );

    }

})();
