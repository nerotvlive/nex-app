package com.zyneonstudios.apex.nexapp.events.module;

import com.zyneonstudios.apex.nexapp.events.Event;
import com.zyneonstudios.apex.nexapp.modules.AppModule;
import com.zyneonstudios.apex.nexapp.modules.ModuleLoader;

public interface ModuleEvent extends Event {

    default ModuleLoader moduleLoader() {
        return app().getModuleLoader();
    }

    AppModule module();
}