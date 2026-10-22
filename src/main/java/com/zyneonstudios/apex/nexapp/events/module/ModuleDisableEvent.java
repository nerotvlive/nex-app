package com.zyneonstudios.apex.nexapp.events.module;

import com.zyneonstudios.apex.nexapp.modules.AppModule;

public abstract class ModuleDisableEvent implements ModuleEvent {

    private final AppModule module;

    public ModuleDisableEvent(AppModule module) {
        this.module = module;
    }

    @Override
    public AppModule module() {
        return module;
    }
}