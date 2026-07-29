package com.zyneonstudios.apex.nexapp.main;

import java.util.ArrayList;
import java.util.HashMap;

public class ApplicationSettings {

    private final HashMap<String, Object> temporarySettings = new HashMap<>();
    private boolean minimizeApp = true;
    private double uiScale = 0;
    private boolean keepRunning = true;
    private boolean discoverSearchNEX = true;
    private boolean discoverSearchCurseForge = true;
    private boolean discoverSearchModrinth = true;
    private boolean killOnExit = false;
    private String theme = "auto";
    private String lastInstanceId = "";
    private String jre25path = "";
    private String jre21path = "";
    private String jre17path = "";
    private String jre8path = "";

    private String defaultMinecraftPath = "instances/";
    private boolean defaultMinecraftFullscreen = false;
    private int defaultMinecraftWindowWidth = 854;
    private int defaultMinecraftWindowHeight = 480;
    private int defaultMinecraftMemory = 2048;
    private ArrayList<String> defaultMinecraftJVMArgs = new ArrayList<>();
    private ArrayList<String> defaultMinecraftEnvArgs = new ArrayList<>();
    private ArrayList<String> defaultMinecraftPreLaunchCommands = new ArrayList<>();
    private ArrayList<String> defaultMinecraftOnLaunchCommands = new ArrayList<>();
    private ArrayList<String> defaultMinecraftOnExitCommands = new ArrayList<>();

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
        NEXApplication.getInstance().getSettings().set("settings.window.theme", this.theme);
    }

    public boolean useKillOnExit() {
        return killOnExit;
    }

    public void setKillOnExit(boolean killOnExit) {
        this.killOnExit = killOnExit;
        NEXApplication.getInstance().getSettings().set("settings.behavior.killOnExit", killOnExit);
    }

    public HashMap<String, Object> getTemporarySettings() {
        return temporarySettings;
    }

    public void setTemporarySetting(String path, Object value) {
        temporarySettings.put(path, value);
    }

    public Object getTemporarySetting(String path) {
        return temporarySettings.get(path);
    }

    public String getTemporaryString(String path) {
        return (String) temporarySettings.get(path);
    }

    public int getTemporaryInt(String path) {
        return (int) temporarySettings.get(path);
    }

    public boolean getTemporaryBoolean(String path) {
        return (boolean) temporarySettings.get(path);
    }

    public double getTemporaryDouble(String path) {
        return (double) temporarySettings.get(path);
    }

    public void clearTemporarySettings() {
        temporarySettings.clear();
    }

    public void removeTemporarySetting(String path) {
        temporarySettings.remove(path);
    }

    public boolean keepRunning() {
        return keepRunning;
    }

    public void setKeepRunning(boolean keepRunning) {
        this.keepRunning = keepRunning;
        NEXApplication.getInstance().getSettings().set("settings.behavior.keepRunning", keepRunning);
    }

    public String getJava25Path() {
        if(jre25path==null) {
            return NEXApplication.getInstance().getWorkingPath()+"/libs/java-25";
        }
        return jre25path;
    }

    public String getJava21Path() {
        if(jre21path==null) {
            return NEXApplication.getInstance().getWorkingPath()+"/libs/java-21";
        }
        return jre21path;
    }

    public String getJava17Path() {
        if(jre17path==null) {
            return NEXApplication.getInstance().getWorkingPath()+"/libs/java-17";
        }
        return jre17path;
    }

    public String getJava8Path() {
        if(jre8path==null) {
            return NEXApplication.getInstance().getWorkingPath()+"/libs/java-8";
        }
        return jre8path;
    }

    public void setJre25path(String jre25path) {
        this.jre25path = jre25path;
        NEXApplication.getInstance().getSettings().set("settings.java.path25", jre25path);
    }

    public void setJre21path(String jre21path) {
        this.jre21path = jre21path;
        NEXApplication.getInstance().getSettings().set("settings.java.path21", jre21path);
    }

    public void setJre17path(String jre17path) {
        this.jre17path = jre17path;
        NEXApplication.getInstance().getSettings().set("settings.java.path17", jre17path);
    }

    public void setJre8path(String jre8path) {
        this.jre8path = jre8path;
        NEXApplication.getInstance().getSettings().set("settings.java.path8", jre8path);
    }

    public boolean minimizeApp() {
        return minimizeApp;
    }

    public double getUiScale() {
        return uiScale;
    }

    public void setMinimizeApp(boolean minimizeApp) {
        this.minimizeApp = minimizeApp;
        NEXApplication.getInstance().getSettings().set("settings.window.minimizeOnStart", minimizeApp);
    }

    public void setUiScale(double uiScale) {
        this.uiScale = uiScale;
        NEXApplication.getInstance().getSettings().set("settings.window.uiScale", uiScale);
    }

    public void setDiscoverSearchCurseForge(boolean discoverSearchCurseForge) {
        this.discoverSearchCurseForge = discoverSearchCurseForge;
        NEXApplication.getInstance().getSettings().set("settings.discover.search.curseforge.enabled", discoverSearchCurseForge);
    }

    public void setDiscoverSearchModrinth(boolean discoverSearchModrinth) {
        this.discoverSearchModrinth = discoverSearchModrinth;
        NEXApplication.getInstance().getSettings().set("settings.discover.search.modrinth.enabled", discoverSearchModrinth);
    }

    public void setDiscoverSearchNEX(boolean discoverSearchNEX) {
        this.discoverSearchNEX = discoverSearchNEX;
        NEXApplication.getInstance().getSettings().set("settings.discover.search.nex.enabled", discoverSearchNEX);
    }

    public boolean isDiscoverSearchNEX() {
        return discoverSearchNEX;
    }

    public boolean isDiscoverSearchCurseForge() {
        return discoverSearchCurseForge;
    }

    public boolean isDiscoverSearchModrinth() {
        return discoverSearchModrinth;
    }

    public String getLastInstanceId() {
        return lastInstanceId;
    }

    public void setLastInstanceId(String lastInstanceId) {
        this.lastInstanceId = lastInstanceId;
        NEXApplication.getInstance().getSettings().set("settings.library.instance.last", lastInstanceId);
    }

    public String getDefaultMinecraftPath() {
        if(defaultMinecraftPath==null) {
            return NEXApplication.getInstance().getWorkingPath()+"/instances/";
        }
        return defaultMinecraftPath;
    }

    public boolean getDefaultMinecraftFullscreen() {
        return defaultMinecraftFullscreen;
    }

    public int getDefaultMinecraftWindowWidth() {
        return defaultMinecraftWindowWidth;
    }

    public int getDefaultMinecraftWindowHeight() {
        return defaultMinecraftWindowHeight;
    }

    public int getDefaultMinecraftMemory() {
        return defaultMinecraftMemory;
    }

    public ArrayList<String> getDefaultMinecraftJVMArgs() {
        return defaultMinecraftJVMArgs;
    }

    public ArrayList<String> getDefaultMinecraftEnvArgs() {
        return defaultMinecraftEnvArgs;
    }

    public ArrayList<String> getDefaultMinecraftPreLaunchCommands() {
        return defaultMinecraftPreLaunchCommands;
    }

    public ArrayList<String> getDefaultMinecraftOnLaunchCommands() {
        return defaultMinecraftOnLaunchCommands;
    }

    public ArrayList<String> getDefaultMinecraftOnExitCommands() {
        return defaultMinecraftOnExitCommands;
    }

    public void setDefaultMinecraftPath(String defaultMinecraftPath) {
        this.defaultMinecraftPath = defaultMinecraftPath;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.path", defaultMinecraftPath);
    }

    public void setDefaultMinecraftFullscreen(boolean defaultMinecraftFullscreen) {
        this.defaultMinecraftFullscreen = defaultMinecraftFullscreen;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.fullscreen", defaultMinecraftFullscreen);
    }

    public void setDefaultMinecraftWindowWidth(int defaultMinecraftWindowWidth) {
        this.defaultMinecraftWindowWidth = defaultMinecraftWindowWidth;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.width", defaultMinecraftWindowWidth);
    }

    public void setDefaultMinecraftWindowHeight(int defaultMinecraftWindowHeight) {
        this.defaultMinecraftWindowHeight = defaultMinecraftWindowHeight;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.height", defaultMinecraftWindowHeight);
    }

    public void setDefaultMinecraftJVMArgs(ArrayList<String> defaultMinecraftJVMArgs) {
        this.defaultMinecraftJVMArgs = defaultMinecraftJVMArgs;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.jvmArgs", defaultMinecraftJVMArgs);
    }

    public void setDefaultMinecraftEnvArgs(ArrayList<String> defaultMinecraftEnvArgs) {
        this.defaultMinecraftEnvArgs = defaultMinecraftEnvArgs;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.envArgs", defaultMinecraftEnvArgs);
    }

    public void setDefaultMinecraftPreLaunchCommands(ArrayList<String> defaultMinecraftPreLaunchCommands) {
        this.defaultMinecraftPreLaunchCommands = defaultMinecraftPreLaunchCommands;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.preLaunchCommands", defaultMinecraftPreLaunchCommands);
    }

    public void setDefaultMinecraftOnLaunchCommands(ArrayList<String> defaultMinecraftOnLaunchCommands) {
        this.defaultMinecraftOnLaunchCommands = defaultMinecraftOnLaunchCommands;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.onLaunchCommands", defaultMinecraftOnLaunchCommands);
    }

    public void setDefaultMinecraftOnExitCommands(ArrayList<String> defaultMinecraftOnExitCommands) {
        this.defaultMinecraftOnExitCommands = defaultMinecraftOnExitCommands;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.onExitCommands", defaultMinecraftOnExitCommands);
    }

    public void setDefaultMinecraftMemory(int memory) {
        this.defaultMinecraftMemory = memory;
        NEXApplication.getInstance().getSettings().set("settings.minecraft.memory", memory);
    }
}