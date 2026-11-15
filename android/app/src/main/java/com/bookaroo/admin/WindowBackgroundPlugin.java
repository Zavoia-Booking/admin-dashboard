package com.zavoia.admin;

import android.content.res.Configuration;
import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Recolors the window's decor view to match the app theme (see
 * src/shared/lib/nativeWindowBackground.ts; iOS has its own counterpart).
 *
 * When the WebView is not drawn edge-to-edge, the safe-area plugin pads the
 * decor view by the system-bar insets, so the status- and navigation-bar
 * strips show the decor background. Capacitor core's SystemBars resets that
 * background to the theme's windowBackground (#303030 on a dark-mode phone)
 * on every setStyle call and configuration change, which is why the color is
 * remembered here and re-applied after core.
 */
@CapacitorPlugin(name = "WindowBackground")
public class WindowBackgroundPlugin extends Plugin {

    private Integer color = null;

    @PluginMethod
    public void setColor(PluginCall call) {
        String value = call.getString("color");
        int parsed;
        try {
            parsed = Color.parseColor(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            call.reject("Invalid color: " + value);
            return;
        }

        getBridge().executeOnMainThread(() -> {
            color = parsed;
            apply();
            call.resolve();
        });
    }

    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);
        // Posted, so it runs after core SystemBars' synchronous reset.
        getBridge().executeOnMainThread(this::apply);
    }

    private void apply() {
        if (color != null) {
            getActivity().getWindow().getDecorView().setBackgroundColor(color);
        }
    }
}
