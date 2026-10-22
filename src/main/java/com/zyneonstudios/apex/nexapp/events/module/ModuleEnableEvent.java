package com.zyneonstudios.apex.nexapp.events.module;

import com.zyneonstudios.apex.nexapp.modules.AppModule;

public abstract class ModuleEnableEvent implements ModuleEvent {

    private final AppModule module;

    public ModuleEnableEvent(AppModule module) {
        this.module = module;
    }

    @Override
    public AppModule module() {
        return module;
    }
}