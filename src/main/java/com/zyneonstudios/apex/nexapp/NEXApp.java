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

                    loadProperty(properties, "version", "app.version", "nex.version", "project.version")
                            .ifPresent(val -> this.version = val);

                    loadProperty(properties, "versionName", "version.name", "nex.name", "app.versionName", "project.name")
                            .ifPresent(val -> this.versionName = val);

                    loadProperty(properties, "versionType", "version.type", "nex.type", "app.versionType")
                            .ifPresent(val -> this.versionType = val);
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

    public String getVersionName() {
        return versionName;
    }

    public String getVersionType() {
        return versionType;
    }
}