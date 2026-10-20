package com.zyneonstudios.apex.nexapp.events;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.main.NEXApp;

import java.util.UUID;

public interface Event {

    default UUID uuid() {
        return UUID.randomUUID();
    }

    boolean execute();

    default NEXApp app() {
        return Main.getNEXApp();
    }
}
