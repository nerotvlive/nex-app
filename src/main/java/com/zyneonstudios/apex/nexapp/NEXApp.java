package com.zyneonstudios.apex.nexapp;

public class NEXApp {

    private boolean launched = false;

    public NEXApp() {

    }

    public void launch() {
        if(launched) {
            throw new IllegalStateException("NEX App already launched!");
        } else {
            launched = true;
        }
    }
}