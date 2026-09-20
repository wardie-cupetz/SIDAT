package com.sidat.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "PrintBridge")
public class PrintBridge extends Plugin {

    @PluginMethod
    public void printHtml(PluginCall call) {

        String html = call.getString("html");
        String jobName = call.getString("jobName", "SIDAT");

        if (html == null || html.trim().isEmpty()) {
            call.reject("Dokumen cetak tidak tersedia.");
            return;
        }

        if (jobName == null || jobName.trim().isEmpty()) {
            jobName = "SIDAT";
        }

        final String finalJobName = jobName;

        getActivity().runOnUiThread(() -> {

            try {

                WebView printWebView = new WebView(getContext());

                printWebView.getSettings().setJavaScriptEnabled(true);

                printWebView.setWebViewClient(
                        new WebViewClient() {

                            @Override
                            public void onPageFinished(
                                    WebView view,
                                    String url
                            ) {

                                PrintManager printManager =
                                        (PrintManager)
                                                getContext()
                                                        .getSystemService(
                                                                Context.PRINT_SERVICE
                                                        );

                                if (printManager == null) {
                                    call.reject(
                                            "Layanan cetak Android tidak tersedia."
                                    );
                                    return;
                                }

                                PrintDocumentAdapter adapter =
                                        view.createPrintDocumentAdapter(
                                                finalJobName
                                        );

                                PrintAttributes attributes =
                                        new PrintAttributes.Builder()
                                                .setMediaSize(
                                                        PrintAttributes.MediaSize.ISO_A4
                                                )
                                                .setResolution(
                                                        new PrintAttributes.Resolution(
                                                                "sidat_print",
                                                                "SIDAT Print",
                                                                300,
                                                                300
                                                        )
                                                )
                                                .setMinMargins(
                                                        PrintAttributes.Margins.NO_MARGINS
                                                )
                                                .build();

                                printManager.print(
                                        finalJobName,
                                        adapter,
                                        attributes
                                );

                                call.resolve();
                            }
                        }
                );

                printWebView.loadDataWithBaseURL(
                        null,
                        html,
                        "text/html",
                        "UTF-8",
                        null
                );

            } catch (Exception e) {

                call.reject(
                        "Gagal membuka cetak Android: "
                                + e.getMessage()
                );
            }
        });
    }
}
