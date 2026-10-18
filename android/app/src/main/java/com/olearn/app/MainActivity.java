package com.olearn.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-local plugins must be registered before super.onCreate (Capacitor 7).
        registerPlugin(VoiceHelperPlugin.class);
        super.onCreate(savedInstanceState);
        // Android's font size setting must never scale the app; the in-app Text size setting is the only control.
        getBridge().getWebView().getSettings().setTextZoom(100);
    }
}
