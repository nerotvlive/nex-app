package com.zyneonstudios.apex.nexapp.main;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.events.AppSetupEvent;
import com.zyneonstudios.apex.nexapp.modules.ModuleLoader;
import com.zyneonstudios.apex.nexapp.modules.test.TestModule;
import com.zyneonstudios.apex.nexapp.springboot.controllers.CurseforgeController;
import com.zyneonstudios.apex.nexapp.window.WebviewWindow;

import java.io.InputStream;
import java.util.*;

public class NEXApp {

    private boolean launched = false;
    private WebviewWindow window;
    private String version = "0.0.0";
    private String versionName = "Unknown";
    private String versionType = "unstable";
    private String versionBuild = "000000000000";
    private String curseforgeToken = "";

    private HashMap<UUID, AppSetupEvent> appSetupEvents = new HashMap<>();
    private ModuleLoader moduleLoader;

    public NEXApp() {
        initResourceData();
        CurseforgeController.setApiKey(curseforgeToken);
        registerMainWindow(new WebviewWindow());
    }

    public void registerMainWindow(WebviewWindow webviewWindow) {
        window = webviewWindow;
    }

    private void initResourceData() {
        String[] propertyFiles = {"bootstrap.properties", "application.properties"};
        for (String file : propertyFiles) {
            try (InputStream is = getClass().getClassLoader().getResourceAsStream(file)) {
                if (is != null) {
                    Properties properties = new Properties();
                    properties.load(is);

                    loadProperty(properties, "version")
                            .ifPresent(val -> this.version = val);

                    loadProperty(properties, "versionName")
                            .ifPresent(val -> this.versionName = val);

                    loadProperty(properties, "versionType")
                            .ifPresent(val -> this.versionType = val);

                    loadProperty(properties, "versionBuild")
                            .ifPresent(val -> this.versionBuild = val);

                    loadProperty(properties, "curseforgeToken")
                            .ifPresent(val -> this.curseforgeToken = val);
                }
            } catch (Exception e) {
                System.err.println("Failed to get properties from resource file: " + e.getMessage());
            }
        }
    }

    private Optional<String> loadProperty(Properties properties, String... keys) {
        for (String key : keys) {
            String val = properties.getProperty(key);
            if (val != null && !val.isBlank() && !val.startsWith("${") && !val.startsWith("@")) {
                return Optional.of(val.trim());
            }
        }
        return Optional.empty();
    }

    public void launch() {
        if(launched) {
            throw new IllegalStateException("NEX App already launched!");
        } else {
            launched = true;

            addSetupEvent(new AppSetupEvent() {
                @Override
                public boolean execute() {
                    try {
                        moduleLoader = new ModuleLoader(Main.getNEXApp());
                        moduleLoader.loadModule(new TestModule());
                        moduleLoader.activateModules();
                    } catch (Exception e) {
                        System.err.println("Failed to load modules: " + e.getMessage());
                    }
                    return true;
                }
            });

            window.launchWindow();
        }
    }

    public WebviewWindow getWindow() {
        return window;
    }

    public boolean isLaunched() {
        return launched;
    }

    public String getVersion() {
        return version;
    }

    public String getVersionBuild() {
        return versionBuild;
    }

    public String getVersionName() {
        return versionName;
    }

    public String getVersionType() {
        return versionType;
    }

    public Collection<AppSetupEvent> getSetupEvents() {
        return appSetupEvents.values();
    }

    public void addSetupEvent(AppSetupEvent event) {
        appSetupEvents.put(event.uuid(), event);
    }

    public ModuleLoader getModuleLoader() {
        return moduleLoader;
    }
}