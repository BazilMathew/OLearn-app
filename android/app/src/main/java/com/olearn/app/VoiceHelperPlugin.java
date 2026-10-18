package com.olearn.app;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Facts for voice input (see src/services/VoiceHelper.ts). Read-only: it never listens or records.
 * The speech plugin crashes the app if its voice box is opened on a phone without one, so the app asks here first.
 */
@CapacitorPlugin(name = "VoiceHelper")
public class VoiceHelperPlugin extends Plugin {

    private static final String GOOGLE_APP = "com.google.android.googlequicksearchbox";

    /** Whether an app can show Android's voice box (RecognizerIntent), and which one. */
    @PluginMethod
    public void canShowVoiceDialog(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        ResolveInfo info = getContext().getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
        boolean found = info != null && info.activityInfo != null;
        JSObject result = new JSObject();
        result.put("value", found);
        result.put("handler", found ? info.activityInfo.packageName : "");
        call.resolve(result);
    }

    /** Phone model, Android version, the phone's default voice service and the Google app's state. */
    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        JSObject result = new JSObject();
        result.put("manufacturer", Build.MANUFACTURER);
        result.put("model", Build.MODEL);
        result.put("sdkInt", Build.VERSION.SDK_INT);
        result.put("release", Build.VERSION.RELEASE);
        result.put("defaultVoiceService", defaultVoiceService());
        result.put("googleApp", googleAppState());
        call.resolve(result);
    }

    private String defaultVoiceService() {
        try {
            String value = Settings.Secure.getString(getContext().getContentResolver(), "voice_recognition_service");
            return value == null || value.isEmpty() ? "not set" : value;
        } catch (Exception ex) {
            // Newer Android may refuse to let apps read this setting.
            return "not readable";
        }
    }

    private String googleAppState() {
        try {
            ApplicationInfo info = getContext().getPackageManager().getApplicationInfo(GOOGLE_APP, 0);
            return info.enabled ? "installed" : "disabled";
        } catch (PackageManager.NameNotFoundException ex) {
            return "missing";
        }
    }
}
