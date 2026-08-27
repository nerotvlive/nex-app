package com.zyneonstudios.apex.nexapp;

import com.zyneonstudios.apex.nexapp.window.ApplicationWindowLauncher;

public class NEXApp {

    private boolean launched = false;
    private ApplicationWindowLauncher window;

    public NEXApp() {
        window = new ApplicationWindowLauncher();
    }

    public void launch() {
        if(launched) {
            throw new IllegalStateException("NEX App already launched!");
        } else {
            launched = true;
            window.launchWindow();
        }
    }

    public ApplicationWindowLauncher getWindow() {
        return window;
    }

    public boolean isLaunched() {
        return launched;
    }
}