package com.zyneonstudios.apex.nexapp;

import com.zyneonstudios.apex.nexapp.window.WebviewWindow;

import java.io.InputStream;
import java.util.Optional;
import java.util.Properties;

public class NEXApp {

    private boolean launched = false;
    private WebviewWindow window;
    private String version = "0.0.0";
    private String versionName = "Unknown";
    private String versionType = "unstable";
    private String versionBuild = "000000000000";
    private String curseforgeToken = "";

    public NEXApp() {
        window = new WebviewWindow();
        initResourceData();
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
                e.printStackTrace();
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
}