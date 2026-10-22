package com.zyneonstudios.apex.nexapp.events.module;

import com.zyneonstudios.apex.nexapp.modules.AppModule;

public abstract class ModuleLoadEvent implements ModuleEvent {

    private final AppModule module;

    public ModuleLoadEvent(AppModule module) {
        this.module = module;
    }

    @Override
    public AppModule module() {
        return module;
    }
}