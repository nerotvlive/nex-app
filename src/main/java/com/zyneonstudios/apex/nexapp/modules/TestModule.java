package com.zyneonstudios.apex.nexapp.modules;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.events.module.ModuleDisableEvent;
import com.zyneonstudios.apex.nexapp.events.module.ModuleEnableEvent;
import com.zyneonstudios.apex.nexapp.events.module.ModuleLoadEvent;

public class TestModule extends AppModule{

    @Override
    public String getModuleId() {
        return "test";
    }

    @Override
    public String getModuleName() {
        return "Test";
    }

    @Override
    public String getModuleVersion() {
        return Main.getNEXApp().getVersion();
    }

    @Override
    public String getModuleOwner() {
        return "Zyneon Apex";
    }

    @Override
    public String[] getModuleContributors() {
        return new String[]{"nerotvlive"};
    }

    @Override
    public ModuleLoadEvent load() {
        return new ModuleLoadEvent(this) {
            @Override
            public boolean execute() {
                return true;
            }
        };
    }

    @Override
    public ModuleEnableEvent enable() {
        return new ModuleEnableEvent(this) {
            @Override
            public boolean execute() {
                return true;
            }
        };
    }

    @Override
    public ModuleDisableEvent disable() {
        return new ModuleDisableEvent(this) {
            @Override
            public boolean execute() {
                return true;
            }
        };
    }
}
