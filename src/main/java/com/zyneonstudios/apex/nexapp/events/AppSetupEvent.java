package com.zyneonstudios.apex.nexapp.events;

import com.zyneonstudios.apex.nexapp.main.NEXApp;

import java.util.UUID;

public abstract class AppSetupEvent implements Event {

    @Override
    public final UUID uuid() {
        return Event.super.uuid();
    }

    @Override
    public final NEXApp app() {
        return Event.super.app();
    }
}
