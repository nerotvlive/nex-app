package com.zyneonstudios.apex.nexapp.launchprocess;

import live.nerotv.aminecraftlauncher.launcher.LauncherHook;
import live.nerotv.aminecraftlauncher.launcher.MinecraftLauncher;
import com.zyneonstudios.apex.nexapp.search.zyndex.local.LocalInstance;

public class InstanceLauncherHook extends LauncherHook {

    private final LocalInstance localInstance;

    public InstanceLauncherHook(MinecraftLauncher launcher, LocalInstance instance) {
        super(launcher);
        this.localInstance = instance;
    }

    public LocalInstance getLocalInstance() {
        return localInstance;
    }

    @Override
    public void run() {

    }
}
