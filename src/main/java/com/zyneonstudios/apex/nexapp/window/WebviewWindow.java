package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.Main;
import io.avaje.webview.Webview;

import java.awt.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;

public class WebviewWindow {

    private static final HashMap<String,WebviewWindow> windows = new HashMap<>();
    private Webview webview = null;

    private final String id;
    private String url = Main.getBaseUrl();
    private int width;
    private int height;
    private boolean secondary = false;
    private final boolean isBorderless =  !Main.useNativeFrame();
    private boolean restart = false;

    public WebviewWindow() {
        this("main");
    }

    public WebviewWindow(String id) {
        this.width = 1280;
        this.height = 720;
        this.id = id;
        if(!this.id.equals("main")) {
            this.secondary = true;
        }
        windows.put(this.id, this);
    }

    private String buildUrl() {
        return buildUrl(null);
    }

    private String buildUrl(String targetUrl) {
        String url = (targetUrl == null || targetUrl.isBlank()) ? this.url : targetUrl;
        if (url == null) return "";

        String lowerUrl = url.toLowerCase();

        if (!lowerUrl.contains("?borderless=") && !lowerUrl.contains("&borderless=")) {
            url += (url.contains("?") ? "&" : "?") + "borderless=" + isBorderless;
            lowerUrl = url.toLowerCase();
        }

        if (!lowerUrl.contains("?mode=") && !lowerUrl.contains("&mode=")) {
            String mode = (id == null || id.isBlank() || id.equals("main")) ? "primary" : "secondary";
            url += (url.contains("?") ? "&" : "?") + "mode=" + mode;
        }

        return url;
    }

    @SuppressWarnings("all")
    public void launchWindow() {
        try {
            Thread.ofPlatform().start(() -> {
                try {
                    this.webview = Webview.builder()
                            .title("NEX App")
                            .minSize(1024, 576)
                            .width(width)
                            .height(height)
                            .enableDeveloperTools(Main.isDev())
                            .navigate(buildUrl())
                            .borderless(isBorderless, isBorderless)
                            .transparent(true)
                            .build();

                    initWindowControls();
                    initBindings();
                    initIcon();

                    this.webview.run();

                    if(!restart) {
                        windows.remove(this.id);
                        if (windows.isEmpty()) {
                            System.exit(0);
                        }
                    }
                } catch (Throwable e) {
                    throw new RuntimeException("Failed to launch native WebView", e);
                }
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to launch native WebView", e);
        }
    }

    private void initIcon() {
        try {
            var iconStream = getClass().getResourceAsStream("/icon.ico");
            if (iconStream != null) {
                Path tempIcon = Files.createTempFile("icon", ".ico");
                tempIcon.toFile().deleteOnExit();
                try (iconStream) {
                    Files.copy(iconStream, tempIcon, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
                this.webview.setIcon(tempIcon);
            }
        } catch (IOException e) {
            if(System.getProperty("os.name").toLowerCase().contains("windows")) {
                System.err.println("Failed to load icon: " + e.getMessage());
            }
        }
    }

    private void initWindowControls() {
        this.webview.bind("startWindowDrag", (_) -> {
            if(Main.useNativeFrame()) {
                return null;
            }
            this.webview.startWindowDrag();
            return null;
        });

        this.webview.bind("closeWindow", (_) -> {
            close();
            return null;
        });

        this.webview.bind("minimizeWindow", (_) -> {
            minimize();
            return null;
        });

        this.webview.bind("unminimizeWindow", (_) -> {
            unminimize();
            return null;
        });

        this.webview.bind("toggleMinimizeWindow", (_) -> {
            toggleMinimize();
            return null;
        });

        this.webview.bind("maximizeWindow", (_) -> {
            maximize();
            return null;
        });

        this.webview.bind("unmaximizeWindow", (_) -> {
            unmaximize();
            return null;
        });

        this.webview.bind("toggleMaximizeWindow", (_) -> {
            toggleMaximize();
            return null;
        });

        this.webview.bind("hideWindow", (_) -> {
            hide();
            return null;
        });

        this.webview.bind("showWindow", (_) -> {
            show();
            return null;
        });

        this.webview.bind("toggleHideWindow", (_) -> {
            toggleHidden();
            return null;
        });

        this.webview.bind("reloadWindow", (_) -> {
            reload();
            return null;
        });

        this.webview.bind("restartWindow", (_) -> {
            restart();
            return null;
        });
    }

    private void initBindings() {
        this.webview.bind("openSecondaryFrame", (path) -> {
            path = path.replace("[\"","").replace("\"]","");
            if(!windows.containsKey(path)) {
                WebviewWindow toolWindow = new WebviewWindow(path);
                toolWindow.setSize(1024, 576);
                toolWindow.loadUrl(Main.getBaseUrl() + path);
                toolWindow.launchWindow();
            } else {
                WebviewWindow toolWindow = windows.get(path);
                toolWindow.webview.showWindow();
                toolWindow.unminimize();
            }
            return null;
        });

        webview.bind("getUrl", href -> {
            href = href.replace("[\"","").replace("\"]","");
            this.url = href;
            return null;
        });

        if(secondary) {
            this.webview.bind("reloadMain", (_) -> {
                if(windows.containsKey("main")) {
                    windows.get("main").reload();
                }
                return null;
            });

            this.webview.bind("openMain", (_) -> {
                if(!windows.containsKey("main")) {
                    WebviewWindow mainWindow = new WebviewWindow();
                    mainWindow.launchWindow();
                } else {
                    WebviewWindow toolWindow = windows.get("main");
                    toolWindow.webview.showWindow();
                    toolWindow.unminimize();
                }
                return null;
            });
        }

        this.webview.bind("openUrl", (args) -> {
            if (args != null && !args.isBlank()) {
                String cleanUrl = args.replaceAll("[\\[\\]\"]", "").trim();
                Thread.ofPlatform().start(() -> {
                    try {
                        String os = System.getProperty("os.name").toLowerCase();
                        if (os.contains("win")) {
                            new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", cleanUrl).start();
                        } else if (os.contains("mac")) {
                            new ProcessBuilder("open", cleanUrl).start();
                        } else {
                            new ProcessBuilder("xdg-open", cleanUrl).start();
                        }
                    } catch (IOException e) {
                        System.err.println("[openUrl] Error: " + e.getMessage());
                    }
                });
            }
            return null;
        });
    }

    @Deprecated
    public void setUrl(String url) {
        this.url = url;
    }

    public void loadUrl(String url) {
        this.url = url;
        if(webview != null) {
            webview.navigate(buildUrl());
        }
    }

    public void close() {
        webview.close();
    }

    public void reload() {
        webview.navigate(buildUrl());
    }

    public void restart() {
        restart = true;
        windows.remove(this.id);

        WebviewWindow window = new WebviewWindow(this.id);
        window.loadUrl(this.url);
        window.setSize(this.width, this.height);
        window.launchWindow();

        close();
    }

    public String getUrl() {
        return url;
    }

    public void setSize(Dimension dimension) {
        setSize(dimension.width, dimension.height);
    }

    public void setSize(int width, int height) {
        this.width = width;
        this.height = height;
        if(webview != null) {
            webview.setSize(width,height);
        }
    }

    public void setWidth(int width) {
        setSize(width,this.height);
    }

    public void setHeight(int height) {
        setSize(width,height);
    }

    public Dimension getSize() {
        return new Dimension(width, height);
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public void maximize() {
        webview.maximizeWindow();
    }

    public void unmaximize() {
        webview.unmaximizeWindow();
    }

    public boolean isMaximized() {
        return webview.isMaximized();
    }

    public void toggleMaximize() {
        if(isMaximized()) {
            unmaximize();
        } else {
            maximize();
        }
    }

    public void minimize() {
        webview.minimizeWindow();
    }

    public void unminimize() {
        minimize();
        webview.showWindow();
        webview.unminimizeWindow();
    }

    public boolean isMinimized() {
        return webview.isMinimized();
    }

    public void toggleMinimize() {
        if(isMinimized()) {
            unminimize();
        } else {
            minimize();
        }
    }

    public void hide() {
        webview.hideWindow();
    }

    public void show() {
        unminimize();
    }

    public boolean isHidden() {
        return webview.isHidden();
    }

    public boolean toggleHidden() {
        if(isHidden()) {
            show();
        } else {
            hide();
        }
        return isHidden();
    }

    public boolean isSecondary() {
        return secondary;
    }

    public boolean isBorderless() {
        return isBorderless;
    }

    public Webview getWebview() {
        return webview;
    }
}