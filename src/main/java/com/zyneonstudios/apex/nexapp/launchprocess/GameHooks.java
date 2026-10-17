package com.zyneonstudios.apex.nexapp.launchprocess;

import live.nerotv.aminecraftlauncher.launcher.MinecraftLauncher;
import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.search.zyndex.local.LocalInstance;

public class GameHooks {

    public static InstanceLauncherHook getPreLaunchHook(MinecraftLauncher launcher, LocalInstance instance) {
        return new InstanceLauncherHook(launcher, instance) {
            @Override
            public void run() {
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById(\"launch-button\").innerHTML = \"STARTING...\";");
                for(String cmd: getLocalInstance().getPreLaunchHook()) {
                    if(cmd.startsWith("napp ")) {
                        NEXApplication.getInstance().getConsoleHandler().runCommand(cmd.replaceFirst("napp ", ""));
                    } else {
                        runCommand(cmd);
                    }
                }
            }
        };
    }

    public static InstanceLauncherHook getPostLaunchHook(MinecraftLauncher launcher, LocalInstance instance) {
        return new InstanceLauncherHook(launcher, instance) {
            @Override
            public void run() {
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById(\"launch-button\").innerHTML = \"<i class='bi bi-check-lg'></i> RUNNING\";");
                if(NEXApplication.getInstance().getLocalSettings().minimizeApp()) {
                    NEXApplication.getInstance().getApplicationFrame().minimize();
                }
                for(String cmd: getLocalInstance().getOnLaunchHook()) {
                    if(cmd.startsWith("napp ")) {
                        NEXApplication.getInstance().getConsoleHandler().runCommand(cmd.replaceFirst("napp ", ""));
                    } else {
                        runCommand(cmd);
                    }
                }
            }
        };
    }

    public static InstanceLauncherHook getGameCloseHook(MinecraftLauncher launcher, LocalInstance instance) {
        return new InstanceLauncherHook(launcher,instance) {
            @Override
            public void run() {
                NEXApplication.getInstance().getInstanceManager().removeRunningInstance(launcher.getGameProcess());
                if(NEXApplication.getInstance().getApplicationFrame().getURL().contains("page=library")) {
                    NEXApplication.getInstance().getApplicationFrame().reload();
                }
                if(NEXApplication.getInstance().getLocalSettings().minimizeApp()) {
                    NEXApplication.getInstance().getApplicationFrame().setVisible(true);
                }
                for(String cmd: getLocalInstance().getOnExitHook()) {
                    if(cmd.startsWith("napp ")) {
                        NEXApplication.getInstance().getConsoleHandler().runCommand(cmd.replaceFirst("napp ", ""));
                    } else {
                        runCommand(cmd);
                    }
                }
            }
        };
    }

    private static void runCommand(String cmd) {
        /*try {
            Process process;
            String fullCommand;
            if (OperatingSystem.getType().equals(OperatingSystem.Type.Windows)) {
                fullCommand = String.format("cmd.exe /c start " + cmd, NexusApplication.getInstance().getWorkingDir());
            } else {
                fullCommand = String.format("/bin/sh -c nohup " + cmd + " &", NexusApplication.getInstance().getWorkingDir());
            }
            process = Runtime.getRuntime().exec(fullCommand);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }*/
        Main.getLogger().err("External command execution is disabled for security reasons: " + cmd);
    }
}