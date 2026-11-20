package com.zavoia.admin;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WindowBackgroundPlugin.class);
        super.onCreate(savedInstanceState);
        dropNavigationBarInsetUnderKeyboard();
    }

    // SafeArea 8.0.1 keeps the navigation bar inset while the keyboard is open: a blank strip above it on Android 10-14.
    private void dropNavigationBarInsetUnderKeyboard() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        View webViewParent = (View) getBridge().getWebView().getParent();
        ViewCompat.setOnApplyWindowInsetsListener(webViewParent, (view, insets) -> {
            if (!insets.isVisible(WindowInsetsCompat.Type.ime())) return insets;
            int bars = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            Insets barInsets = insets.getInsets(bars);
            int keyboard = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(bars, Insets.of(barInsets.left, barInsets.top, barInsets.right, Math.max(0, barInsets.bottom - keyboard)))
                .build();
        });
    }
}
