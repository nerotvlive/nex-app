package com.zyneonstudios.apex.nexapp;

import com.zyneonstudios.apex.nexapp.window.WebviewWindow;

public class NEXApp {

    private boolean launched = false;
    private WebviewWindow window;

    public NEXApp() {
        window = new WebviewWindow();
    }

    public void launch() {
        if(launched) {
            throw new IllegalStateException("NEX App already launched!");
        } else {
            launched = true;
            window.launchWindow();
        }
    }

    public WebviewWindow getWindow() {
        return window;
    }

    public boolean isLaunched() {
        return launched;
    }
}